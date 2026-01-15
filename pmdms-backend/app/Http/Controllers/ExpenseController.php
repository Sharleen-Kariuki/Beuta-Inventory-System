<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Expense;

class ExpenseController extends Controller
{
    public function index()
    {
        return response()->json(Expense::with('creator:id,name')->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        $validated['created_by'] = auth()->id();

        $expense = Expense::create($validated);

        return response()->json($expense->load('creator:id,name'), 201);
    }

    public function update(Request $request, $id)
    {
        $expense = Expense::findOrFail($id);

        $validated = $request->validate([
            'category' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        $expense->update($validated);

        return response()->json($expense->load('creator:id,name'));
    }

    public function destroy($id)
    {
        Expense::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
