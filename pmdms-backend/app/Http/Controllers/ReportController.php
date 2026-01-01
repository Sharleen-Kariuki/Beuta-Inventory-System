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
}
