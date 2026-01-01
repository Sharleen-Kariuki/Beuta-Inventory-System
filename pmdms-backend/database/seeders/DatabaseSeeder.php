<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\RawMaterial;
use App\Models\Product;
use App\Models\Recipe;
use App\Models\RecipeItem;
use App\Models\Supplier;
use App\Models\Customer;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Model::unguard();

        // 1. Users
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@pmdms.local',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        $staff = User::create([
            'name' => 'John Staff',
            'email' => 'staff@pmdms.local',
            'password' => Hash::make('password'),
            'role' => 'staff',
            'is_active' => true,
        ]);

        // 2. Suppliers
        $chemSupplier = Supplier::create([
            'name' => 'Global Chemicals Ltd',
            'contact_person' => 'Sarah Smith',
            'phone' => '555-0123',
        ]);

        $packSupplier = Supplier::create([
            'name' => 'Metro Packaging Co',
            'contact_person' => 'Mike Jones',
            'phone' => '555-0987',
        ]);

        // 3. Raw Materials
        $tio2 = RawMaterial::create([
            'name' => 'Titanium Dioxide',
            'sku' => 'RM-PIG-001',
            'unit' => 'kg',
            'cost_price' => 4.50,
            'current_stock' => 500.00, // Initial stock
            'reorder_level' => 100.00,
        ]);

        $binder = RawMaterial::create([
            'name' => 'Acrylic Emulsion',
            'sku' => 'RM-BND-002',
            'unit' => 'kg',
            'cost_price' => 2.20,
            'current_stock' => 1000.00,
            'reorder_level' => 200.00,
        ]);

        $solvent = RawMaterial::create([
            'name' => 'Industrial Water',
            'sku' => 'RM-SOL-003',
            'unit' => 'liter',
            'cost_price' => 0.10,
            'current_stock' => 5000.00,
            'reorder_level' => 500.00,
        ]);

        $bucket20L = RawMaterial::create([
            'name' => 'Empty Bucket 20L',
            'sku' => 'RM-PCK-001',
            'unit' => 'pcs',
            'cost_price' => 1.50,
            'current_stock' => 200.00,
            'reorder_level' => 50.00,
        ]);

        // 4. Products (Finished Goods)
        $superWhite = Product::create([
            'name' => 'Super Coat White - 20L',
            'sku' => 'FG-WHT-20L',
            'selling_price' => 45.00,
            'current_stock' => 50.00,
            'min_stock_level' => 10.00,
        ]);

        $ecoBlue = Product::create([
            'name' => 'Eco Sky Blue - 20L',
            'sku' => 'FG-BLU-20L',
            'selling_price' => 42.00,
            'current_stock' => 20.00,
            'min_stock_level' => 5.00,
        ]);

        // 5. Recipes
        // Recipe for Super White 20L
        $recipeWhite = Recipe::create([
            'product_id' => $superWhite->id,
            'notes' => 'Standard white gloss recipe',
            'is_active' => true,
        ]);

        RecipeItem::create([
            'recipe_id' => $recipeWhite->id,
            'raw_material_id' => $tio2->id,
            'quantity_required' => 5.0, // 5kg pigment
        ]);
        RecipeItem::create([
            'recipe_id' => $recipeWhite->id,
            'raw_material_id' => $binder->id,
            'quantity_required' => 10.0, // 10kg binder
        ]);
        RecipeItem::create([
            'recipe_id' => $recipeWhite->id,
            'raw_material_id' => $solvent->id,
            'quantity_required' => 4.0, // 4L water (approx)
        ]);
        RecipeItem::create([
            'recipe_id' => $recipeWhite->id,
            'raw_material_id' => $bucket20L->id,
            'quantity_required' => 1.0, // 1 bucket
        ]);

        // 6. Customers
        Customer::create([
            'name' => 'City Hardware Center',
            'type' => 'wholesale',
            'phone' => '123-456-7890',
            'credit_limit' => 5000.00,
        ]);

        Customer::create([
            'name' => 'Walk-in Retail',
            'type' => 'retail',
            'credit_limit' => 0.00,
        ]);

        Model::reguard();
    }
}
