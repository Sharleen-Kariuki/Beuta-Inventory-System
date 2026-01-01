<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Recipe;
use App\Models\RecipeItem;
use App\Models\Product;
use App\Models\ProductionRun;
use App\Models\RawMaterial;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductionController extends Controller
{
    // --- Recipe Management ---

    public function indexRecipes()
    {
        return response()->json(
            Recipe::with(['product', 'items.raw_material'])->get()
        );
    }

    public function storeRecipe(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id|unique:recipes,product_id', // One recipe per product for simplicity v1
            'items' => 'required|array|min:1',
            'items.*.raw_material_id' => 'required|exists:raw_materials,id',
            'items.*.quantity_required' => 'required|numeric|min:0.001',
        ]);

        try {
            DB::beginTransaction();

            $recipe = Recipe::create([
                'product_id' => $validated['product_id'],
                'notes' => $request->notes,
                'is_active' => true
            ]);

            foreach ($validated['items'] as $item) {
                RecipeItem::create([
                    'recipe_id' => $recipe->id,
                    'raw_material_id' => $item['raw_material_id'],
                    'quantity_required' => $item['quantity_required']
                ]);
            }

            DB::commit();
            return response()->json($recipe->load('items'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function updateRecipe(Request $request, $id)
    {
        $recipe = Recipe::findOrFail($id);

        $validated = $request->validate([
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.raw_material_id' => 'required|exists:raw_materials,id',
            'items.*.quantity_required' => 'required|numeric|min:0.001',
        ]);

        try {
            DB::beginTransaction();

            $recipe->update([
                'notes' => $request->notes,
            ]);

            // Replace items for simplicity
            $recipe->items()->delete();

            foreach ($validated['items'] as $item) {
                RecipeItem::create([
                    'recipe_id' => $recipe->id,
                    'raw_material_id' => $item['raw_material_id'],
                    'quantity_required' => $item['quantity_required']
                ]);
            }

            DB::commit();
            return response()->json($recipe->load('items'), 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function destroyRecipe($id)
    {
        $recipe = Recipe::findOrFail($id);
        $recipe->delete();
        return response()->json(['message' => 'Recipe deleted successfully']);
    }

    // --- Production Execution ---

    public function executeRun(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'qty_to_produce' => 'required|numeric|min:1',
            'batch_code' => 'sometimes|string'
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $recipe = Recipe::where('product_id', $product->id)->where('is_active', true)->first();

        if (!$recipe) {
            return response()->json(['message' => 'No active recipe found for this product.'], 404);
        }

        try {
            DB::beginTransaction();

            $qty = $validated['qty_to_produce'];

            // 1. Check Stock & Deduct
            foreach ($recipe->items as $item) {
                $requiredTotal = $item->quantity_required * $qty;
                $material = RawMaterial::lockForUpdate()->find($item->raw_material_id);

                if ($material->current_stock < $requiredTotal) {
                    throw new \Exception("Insufficient stock: {$material->name}. Need {$requiredTotal}{$material->unit}, Have {$material->current_stock}{$material->unit}");
                }

                $material->decrement('current_stock', $requiredTotal);
            }

            // 2. Add Finished Goods Stock
            $product->increment('current_stock', $qty);

            // 3. Log Production Run
            $run = ProductionRun::create([
                'product_id' => $product->id,
                'batch_code' => $validated['batch_code'] ?? 'BATCH-' . Str::random(6),
                'date' => now(),
                'qty_produced' => $qty,
                'status' => 'completed',
                'created_by' => $request->user()->id
            ]);

            DB::commit();

            return response()->json(['message' => 'Production successful', 'run' => $run], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function indexRuns()
    {
        return response()->json(
            ProductionRun::with(['product', 'user'])->latest()->paginate(20)
        );
    }
}
