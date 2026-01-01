<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SaleController extends Controller
{
    public function index()
    {
        // Fetch all sales, eager load relationships
        $sales = Sale::with(['customer', 'user', 'items.product', 'installments'])
            ->latest('date')
            ->latest('created_at')
            ->get();

        // Group by Date (Y-m-d)
        $grouped = $sales->groupBy(function ($sale) {
            return \Carbon\Carbon::parse($sale->date)->format('Y-m-d');
        });

        return response()->json($grouped);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'payment_method' => 'required|string',
            'payment_status' => 'required|string|in:paid,credit,partial',
            'due_date' => 'nullable|date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty' => 'required|numeric|min:1',
            'installments' => 'nullable|array',
            'installments.*.amount' => 'required|numeric|min:0',
            'installments.*.due_date' => 'required|date',
        ]);

        try {
            DB::beginTransaction();

            $totalAmount = 0;
            $saleItems = [];

            // 1. Calculate totals and checking stock
            foreach ($validated['items'] as $item) {
                $product = Product::lockForUpdate()->find($item['product_id']);

                if ($product->current_stock < $item['qty']) {
                    throw new \Exception("Insufficient stock for {$product->name}. Requested: {$item['qty']}, Available: {$product->current_stock}");
                }

                $subtotal = $product->selling_price * $item['qty'];
                $totalAmount += $subtotal;

                $saleItems[] = [
                    'product_id' => $product->id,
                    'qty' => $item['qty'],
                    'unit_price' => $product->selling_price,
                    'subtotal' => $subtotal,
                    'product_instance' => $product // Keep ref to update stock later
                ];
            }

            // 2. Create Sale
            $sale = Sale::create([
                'invoice_no' => 'INV-' . strtoupper(Str::random(8)),
                'customer_id' => $validated['customer_id'],
                'date' => now(), // Default to now
                'payment_method' => $validated['payment_method'],
                'payment_status' => $validated['payment_status'],
                'due_date' => $validated['due_date'] ?? null,
                'total_amount' => $totalAmount,
                'balance_due' => in_array($validated['payment_status'], ['credit', 'partial']) ? $totalAmount : 0,
                'created_by' => $request->user()->id,
            ]);

            // 3. Create Installments if any
            if (!empty($validated['installments'])) {
                foreach ($validated['installments'] as $inst) {
                    $sale->installments()->create([
                        'amount' => $inst['amount'],
                        'due_date' => $inst['due_date'],
                        'status' => 'pending',
                    ]);
                }
            } elseif ($validated['payment_status'] === 'credit' && isset($validated['due_date'])) {
                // Single installment if credit and due_date provided but no installments array
                $sale->installments()->create([
                    'amount' => $totalAmount,
                    'due_date' => $validated['due_date'],
                    'status' => 'pending',
                ]);
            }

            // 3. Create Items and Deduct Stock
            foreach ($saleItems as $itemData) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $itemData['product_id'],
                    'qty' => $itemData['qty'],
                    'unit_price' => $itemData['unit_price'],
                    'subtotal' => $itemData['subtotal'],
                ]);

                // Deduct Stock
                $itemData['product_instance']->decrement('current_stock', $itemData['qty']);
            }

            DB::commit();

            return response()->json($sale->load('items'), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function show($id)
    {
        $sale = Sale::with(['customer', 'items.product', 'user'])->findOrFail($id);
        return response()->json($sale);
    }

    public function formData()
    {
        return response()->json([
            'customers' => \App\Models\Customer::all(),
            'products' => \App\Models\Product::where('current_stock', '>', 0)->get()
        ]);
    }
}
