<?php

namespace App\Http\Controllers;

use App\Models\Installment;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InstallmentController extends Controller
{
    public function index()
    {
        $installments = Installment::with(['sale.customer', 'sale.items.product'])
            ->orderBy('due_date', 'asc')
            ->get();

        return response()->json($installments);
    }

    public function markAsPaid(Request $request, $id)
    {
        $installment = Installment::findOrFail($id);

        if ($installment->status === 'paid') {
            return response()->json(['message' => 'Installment already paid'], 400);
        }

        try {
            DB::beginTransaction();

            $installment->update([
                'status' => 'paid',
                'paid_at' => now(),
                'notes' => $request->notes,
            ]);

            // Update sale balance
            $sale = $installment->sale;
            $sale->decrement('balance_due', $installment->amount);
            $sale->refresh(); // Refresh to get updated balance_due

            // If balance is 0, mark sale as paid
            if ($sale->balance_due <= 0) {
                $sale->update(['payment_status' => 'paid', 'balance_due' => 0]);
            } else {
                $sale->update(['payment_status' => 'partial']);
            }

            DB::commit();

            return response()->json($installment->load('sale'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function dueSoon()
    {
        $days = 7; // Look ahead 7 days
        $installments = Installment::with(['sale.customer'])
            ->where('status', 'pending')
            ->where('due_date', '<=', now()->addDays($days))
            ->orderBy('due_date', 'asc')
            ->get();

        return response()->json($installments);
    }
}
