<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index()
    {
        return response()->json(Customer::withCount('sales')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:retail,wholesale',
            'phone' => 'nullable|string|max:20',
            'credit_limit' => 'nullable|numeric|min:0',
        ]);

        $customer = Customer::create($validated);
        return response()->json($customer, 201);
    }

    public function show($id)
    {
        $customer = Customer::with(['sales.items.product', 'sales.installments'])->findOrFail($id);
        return response()->json($customer);
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:retail,wholesale',
            'phone' => 'nullable|string|max:20',
            'credit_limit' => 'nullable|numeric|min:0',
        ]);

        $customer->update($validated);
        return response()->json($customer);
    }

    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);
        if ($customer->sales()->count() > 0) {
            return response()->json(['message' => 'Cannot delete customer with sales history'], 422);
        }
        $customer->delete();
        return response()->json(null, 204);
    }
}
