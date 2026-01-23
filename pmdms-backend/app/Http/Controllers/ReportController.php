<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\RawMaterial;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function sales(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->subDays(30)->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->toDateString());

        // 1. Total Revenue in Range
        $totalRevenue = Sale::whereBetween('date', [$startDate, $endDate])->sum('total_amount');

        // 2. Sales Volume (Count)
        $totalSalesCount = Sale::whereBetween('date', [$startDate, $endDate])->count();

        // 3. Daily Breakdown
        $dailySales = Sale::whereBetween('date', [$startDate, $endDate])
            ->selectRaw('date, SUM(total_amount) as daily_total, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // 4. Top Selling Products
        $topProducts = SaleItem::with('product')
            ->whereHas('sale', function ($q) use ($startDate, $endDate) {
                $q->whereBetween('date', [$startDate, $endDate]);
            })
            ->selectRaw('product_id, SUM(qty) as total_qty, SUM(subtotal) as total_revenue')
            ->groupBy('product_id')
            ->orderByDesc('total_revenue')
            ->take(5)
            ->get();

        return response()->json([
            'summary' => [
                'total_revenue' => $totalRevenue,
                'total_sales' => $totalSalesCount,
            ],
            'daily' => $dailySales,
            'top_products' => $topProducts
        ]);
    }

    public function inventory()
    {
        // 1. Raw Materials Valuation
        $rawMaterialValue = RawMaterial::select(DB::raw('SUM(current_stock * cost_price) as total_value'))->value('total_value') ?? 0;

        // 2. Finished Goods Valuation
        // Assuming selling_price is a proxy for value, or we could add a cost_price to products later. 
        // For now, let's use selling_price * 0.7 as estimated cost if cost isn't explicit, 
        // BUT strict accounting prefers Cost. Since Product doesn't have cost_price column in migration (checked earlier),
        // we will use Selling Price as "Potential Revenue Value" or just skip it. 
        // Let's stick to "Potential Sales Value" for products.
        $productValue = Product::select(DB::raw('SUM(current_stock * selling_price) as total_value'))->value('total_value') ?? 0;

        // 3. Low Stock Alerts
        $lowRaw = RawMaterial::whereColumn('current_stock', '<=', 'reorder_level')->get();
        $lowProducts = Product::whereColumn('current_stock', '<=', 'min_stock_level')->get();

        return response()->json([
            'valuation' => [
                'raw_materials' => $rawMaterialValue,
                'products_potential' => $productValue,
                'total_asset_value' => $rawMaterialValue + $productValue
            ],
            'low_stock' => [
                'raw_materials' => $lowRaw,
                'products' => $lowProducts
            ]
        ]);
    }

    public function purchases(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->subDays(30)->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->toDateString());

        $purchases = \App\Models\Purchase::with(['supplier', 'items.rawMaterial', 'creator'])
            ->whereBetween('date', [$startDate, $endDate])
            ->orderByDesc('date')
            ->get();

        return response()->json($purchases);
    }

    public function financials(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        // 1. Total Revenue
        $revenue = Sale::whereBetween('date', [$startDate, $endDate])->sum('total_amount');

        // 2. Cost of Goods Sold (COGS)
        $saleItems = SaleItem::with('product')->whereHas('sale', function ($q) use ($startDate, $endDate) {
            $q->whereBetween('date', [$startDate, $endDate]);
        })->get();

        $cogs = 0;
        $cogsBreakdown = [];

        foreach ($saleItems as $item) {
            $recipe = \App\Models\Recipe::where('product_id', $item->product_id)
                ->where('is_active', true)
                ->with('items.rawMaterial')
                ->first();

            if ($recipe) {
                $recipeCost = 0;
                $ingredients = [];
                foreach ($recipe->items as $ri) {
                    if ($ri->rawMaterial) {
                        $lineCost = ($ri->quantity_required * $ri->rawMaterial->cost_price);
                        $recipeCost += $lineCost;
                        $ingredients[] = [
                            'material' => $ri->rawMaterial->name,
                            'qty' => $ri->quantity_required,
                            'unit' => $ri->rawMaterial->unit,
                            'cost_price' => $ri->rawMaterial->cost_price,
                            'total' => round($lineCost, 2)
                        ];
                    }
                }

                $baseQty = (float) ($recipe->base_quantity ?? 1);
                $unitCost = $baseQty > 0 ? ($recipeCost / $baseQty) : 0;
                $itemTotalCogs = ($item->qty * $unitCost);
                $cogs += $itemTotalCogs;

                if (!isset($cogsBreakdown[$item->product_id])) {
                    $cogsBreakdown[$item->product_id] = [
                        'product_name' => $item->product->name,
                        'total_qty' => 0,
                        'unit_cost' => round($unitCost, 2),
                        'total_cogs' => 0,
                        'recipe_details' => [
                            'base_quantity' => $baseQty,
                            'raw_materials' => $ingredients
                        ]
                    ];
                }
                $cogsBreakdown[$item->product_id]['total_qty'] += $item->qty;
                $cogsBreakdown[$item->product_id]['total_cogs'] = round($cogsBreakdown[$item->product_id]['total_cogs'] + $itemTotalCogs, 2);
            }
        }

        // 3. Gross Profit
        $grossProfit = $revenue - $cogs;

        // 4. Expenses
        $expenses = \App\Models\Expense::whereBetween('date', [$startDate, $endDate])
            ->orderBy('date', 'desc')
            ->get();
        $totalExpenses = $expenses->sum('amount');

        // 5. Net Profit
        $netProfit = $grossProfit - $totalExpenses;

        // 6. Monthly History (Last 6 Months)
        $monthlyHistory = [];
        for ($i = 5; $i >= 0; $i--) {
            $mStart = Carbon::now()->subMonths($i)->startOfMonth();
            $mEnd = Carbon::now()->subMonths($i)->endOfMonth();

            $mRev = Sale::whereBetween('date', [$mStart, $mEnd])->sum('total_amount');
            $mExp = \App\Models\Expense::whereBetween('date', [$mStart, $mEnd])->sum('amount');

            $monthlyHistory[] = [
                'month' => $mStart->format('M Y'),
                'revenue' => round($mRev, 2),
                'expenses' => round($mExp, 2),
                'net_profit' => round($mRev - $mExp, 2) // Simplified (Rev - Exp) for history trend
            ];
        }

        // 7. Daily Activities (Merged Sales and Expenses)
        $activitiesSales = Sale::whereBetween('date', [$startDate, $endDate])
            ->with('customer')
            ->get()
            ->map(fn($s) => [
                'type' => 'Sale',
                'date' => $s->date,
                'description' => 'Invoice #' . $s->invoice_no . ($s->customer ? ' - ' . $s->customer->name : ''),
                'amount' => $s->total_amount,
                'is_income' => true
            ]);

        $activitiesExpenses = \App\Models\Expense::whereBetween('date', [$startDate, $endDate])
            ->get()
            ->map(fn($e) => [
                'type' => 'Expense',
                'date' => $e->date,
                'description' => '[' . $e->category . '] ' . $e->description,
                'amount' => $e->amount,
                'is_income' => false
            ]);

        $dailyActivities = $activitiesSales->concat($activitiesExpenses)->sortByDesc('date')->values();

        return response()->json([
            'range' => ['start' => $startDate, 'end' => $endDate],
            'revenue' => round($revenue, 2),
            'cogs' => round($cogs, 2),
            'cogs_breakdown' => array_values($cogsBreakdown),
            'gross_profit' => round($grossProfit, 2),
            'expenses_total' => round($totalExpenses, 2),
            'expenses_list' => $expenses,
            'net_profit' => round($netProfit, 2),
            'monthly_history' => $monthlyHistory,
            'daily_activities' => $dailyActivities
        ]);
    }
}
