<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SalesSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure we have customers and products
        $customer = \App\Models\Customer::first();
        $user = \App\Models\User::first();
        $products = \App\Models\Product::all();

        if ($products->isEmpty())
            return;

        // 1. Create Sales for LAST 7 DAYS
        for ($i = 6; $i >= 0; $i--) {
            $date = \Carbon\Carbon::now()->subDays($i);

            // Random number of sales per day (0 to 5)
            $salesCount = rand(1, 4);

            for ($j = 0; $j < $salesCount; $j++) {
                $sale = \App\Models\Sale::create([
                    'customer_id' => $customer->id ?? 1,
                    'invoice_no' => 'INV-' . $date->format('Ymd') . '-' . rand(1000, 9999),
                    'date' => $date->format('Y-m-d'),
                    'total_amount' => 0, // Will calc below
                    'payment_method' => 'cash',
                    'created_by' => $user->id ?? 1,
                ]);

                $total = 0;
                // Add random items
                $prod = $products->random();
                $qty = rand(1, 10);
                $subtotal = $prod->selling_price * $qty;

                \App\Models\SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $prod->id,
                    'qty' => $qty,
                    'unit_price' => $prod->selling_price,
                    'subtotal' => $subtotal,
                ]);
                $total += $subtotal;

                $sale->update(['total_amount' => $total]);
            }
        }
    }
}
