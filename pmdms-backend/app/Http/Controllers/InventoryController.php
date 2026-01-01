<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\RawMaterial;
use App\Models\Product;

class InventoryController extends Controller
{
    /**
     * Get all raw materials
     */
    public function indexRawMaterials()
    {
        return response()->json(RawMaterial::all());
    }

    /**
     * Get all products
     */
    public function indexProducts()
    {
        return response()->json(Product::all());
    }

    // --- Raw Material CRUD ---

    public function storeRawMaterial(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|unique:raw_materials,sku',
            'unit' => 'required|string|max:10',
            'cost_price' => 'required|numeric|min:0',
            'current_stock' => 'required|numeric|min:0',
            'reorder_level' => 'required|numeric|min:0',
        ]);

        $material = RawMaterial::create($validated);
        return response()->json($material, 201);
    }

    public function updateRawMaterial(Request $request, $id)
    {
        $material = RawMaterial::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'sku' => 'sometimes|required|string|unique:raw_materials,sku,' . $material->id,
            'unit' => 'sometimes|required|string|max:10',
            'cost_price' => 'sometimes|required|numeric|min:0',
            'current_stock' => 'sometimes|required|numeric|min:0',
            'reorder_level' => 'sometimes|required|numeric|min:0',
        ]);

        $material->update($validated);
        return response()->json($material);
    }

    public function destroyRawMaterial($id)
    {
        $material = RawMaterial::findOrFail($id);
        $material->delete();
        return response()->json(null, 204);
    }

    // --- Supplier CRUD ---
    public function indexSuppliers()
    {
        return response()->json(\App\Models\Supplier::all());
    }

    public function storeSupplier(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);
        return response()->json(\App\Models\Supplier::create($validated), 201);
    }

    public function updateSupplier(Request $request, $id)
    {
        $supplier = \App\Models\Supplier::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);
        $supplier->update($validated);
        return response()->json($supplier);
    }

    public function destroySupplier($id)
    {
        \App\Models\Supplier::findOrFail($id)->delete();
        return response()->json(null, 204);
    }

    // --- Product CRUD ---
    public function storeProduct(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|unique:products,sku',
            'selling_price' => 'required|numeric|min:0',
            'current_stock' => 'required|numeric|min:0',
            'min_stock_level' => 'required|numeric|min:0',
        ]);
        return response()->json(Product::create($validated), 201);
    }

    public function updateProduct(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|unique:products,sku,' . $product->id,
            'selling_price' => 'required|numeric|min:0',
            'current_stock' => 'required|numeric|min:0',
            'min_stock_level' => 'required|numeric|min:0',
        ]);
        $product->update($validated);
        return response()->json($product);
    }

    public function destroyProduct($id)
    {
        Product::findOrFail($id)->delete();
        return response()->json(null, 204);
    }

    // --- Restocking ---
    public function restock(Request $request)
    {
        $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.raw_material_id' => 'required|exists:raw_materials,id',
            'items.*.qty' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
            $totalAmount = collect($request->items)->sum(function ($item) {
                return $item['qty'] * $item['unit_price'];
            });

            $purchase = \App\Models\Purchase::create([
                'supplier_id' => $request->supplier_id,
                'invoice_no' => $request->invoice_no,
                'date' => $request->date,
                'total_amount' => $totalAmount,
                'created_by' => auth()->id(),
            ]);

            foreach ($request->items as $item) {
                $purchase->items()->create([
                    'raw_material_id' => $item['raw_material_id'],
                    'qty' => $item['qty'],
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $item['qty'] * $item['unit_price'],
                ]);

                $material = RawMaterial::find($item['raw_material_id']);
                $material->increment('current_stock', $item['qty']);
                $material->update(['cost_price' => $item['unit_price']]);
            }

            return response()->json($purchase->load('items.rawMaterial'));
        });
    }
}
