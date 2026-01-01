<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Sale;
use App\Models\RawMaterial;
use App\Models\ProductionRun;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats()
    {
        // 1. Sales Stats
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();

        $todaySales = Sale::whereDate('date', $today)->sum('total_amount');
        $yesterdaySales = Sale::whereDate('date', $yesterday)->sum('total_amount');

        // Calculate % change
        $salesChange = 0;
        if ($yesterdaySales > 0) {
            $salesChange = (($todaySales - $yesterdaySales) / $yesterdaySales) * 100;
        } elseif ($todaySales > 0) {
            $salesChange = 100; // 0 to something is 100% increase (logic)
        }

        // 2. Production
        $productionRuns = ProductionRun::whereDate('date', $today)->count();
        $pendingRuns = ProductionRun::where('status', 'pending')->count();

        // 3. Low Stock
        $lowStockMaterials = RawMaterial::whereColumn('current_stock', '<', 'reorder_level')->count();

        // 4. Credits & Installments
        $overdueInstallments = \App\Models\Installment::where('status', 'pending')
            ->where('due_date', '<', $today)
            ->count();
        $upcomingInstallments = \App\Models\Installment::where('status', 'pending')
            ->whereBetween('due_date', [$today, $today->copy()->addDays(7)])
            ->count();

        // 4. Chart Data (Last 7 Days)
        $chartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $total = Sale::whereDate('date', $date->format('Y-m-d'))->sum('total_amount');

            $chartData[] = [
                'name' => $date->format('M d'),
                'sales' => (float) $total
            ];
        }

        //5. Total Orders
        $totalOrders = Sale::count();

        return response()->json([
            'sales' => [
                'today' => $todaySales,
                'yesterday' => $yesterdaySales,
                'change' => round($salesChange, 1),
                'total_orders' => $totalOrders
            ],
            'production' => [
                'today' => $productionRuns,
                'pending' => $pendingRuns
            ],
            'inventory' => [
                'low_stock' => $lowStockMaterials
            ],
            'credits' => [
                'overdue' => $overdueInstallments,
                'upcoming' => $upcomingInstallments
            ],
            'chart' => $chartData
        ]);
    }
}
