<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\ProductionController;
use App\Http\Controllers\InstallmentController;
use App\Http\Controllers\CustomerController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Installments
    Route::get('/installments', [InstallmentController::class, 'index']);
    Route::get('/installments/due-soon', [InstallmentController::class, 'dueSoon']);
    Route::post('/installments/{id}/pay', [InstallmentController::class, 'markAsPaid']);

    // Customers
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/customers/{id}', [CustomerController::class, 'show']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);

    // Production & Recipes
    Route::get('/recipes', [ProductionController::class, 'indexRecipes']);
    Route::post('/recipes', [ProductionController::class, 'storeRecipe']);
    Route::put('/recipes/{id}', [ProductionController::class, 'updateRecipe']);
    Route::delete('/recipes/{id}', [ProductionController::class, 'destroyRecipe']);
    Route::get('/production-runs', [ProductionController::class, 'indexRuns']);
    Route::post('/production-runs', [ProductionController::class, 'executeRun']);

    // Sales
    Route::get('/sales', [SaleController::class, 'index']);
    Route::post('/sales', [SaleController::class, 'store']);
    Route::get('/sales/form-data', [SaleController::class, 'formData']);
    Route::get('/sales/{id}', [SaleController::class, 'show']);

    // Reports
    Route::get('/reports/sales', [\App\Http\Controllers\ReportController::class, 'sales']);
    Route::get('/reports/inventory', [\App\Http\Controllers\ReportController::class, 'inventory']);
    Route::get('/reports/restock', [\App\Http\Controllers\ReportController::class, 'purchases']);

    // Suppliers (CRUD)
    Route::get('/suppliers', [InventoryController::class, 'indexSuppliers']);
    Route::post('/suppliers', [InventoryController::class, 'storeSupplier']);
    Route::put('/suppliers/{id}', [InventoryController::class, 'updateSupplier']);
    Route::delete('/suppliers/{id}', [InventoryController::class, 'destroySupplier']);

    // Restocking
    Route::post('/inventory/restock', [InventoryController::class, 'restock']);
});

// Inventory Routes (Protected)
Route::middleware('auth:sanctum')->prefix('inventory')->group(function () {
    Route::get('/raw-materials', [InventoryController::class, 'indexRawMaterials']);
    Route::post('/raw-materials', [InventoryController::class, 'storeRawMaterial']);
    Route::put('/raw-materials/{id}', [InventoryController::class, 'updateRawMaterial']);
    Route::delete('/raw-materials/{id}', [InventoryController::class, 'destroyRawMaterial']);

    Route::get('/products', [InventoryController::class, 'indexProducts']);
    Route::post('/products', [InventoryController::class, 'storeProduct']);
    Route::put('/products/{id}', [InventoryController::class, 'updateProduct']);
    Route::delete('/products/{id}', [InventoryController::class, 'destroyProduct']);
});
