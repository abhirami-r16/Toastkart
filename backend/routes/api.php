<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\GmailOAuthController;

// Public Health Check
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'app' => 'ToastKart API']);
});
Route::get('/google-mail/connect', [
    GmailOAuthController::class,
    'connect'
]);

Route::get('/google-mail/callback', [
    GmailOAuthController::class,
    'callback'
]);
// Authentication Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/auth/google', [AuthController::class, 'googleLogin']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
Route::post('/update-password', [AuthController::class, 'updatePassword']);
// Dashboard
Route::get('/dashboard', [DashboardController::class, 'index']);

// Users (Admin)
Route::get('/users', [UserController::class, 'index']);
Route::get('/users/{id}', [UserController::class, 'show']);

// Stores
Route::get('/stores', [StoreController::class, 'index']);
Route::post('/stores', [StoreController::class, 'store']);
Route::get('/stores/{id}', [StoreController::class, 'show']);
Route::put('/stores/{id}', [StoreController::class, 'update']);
Route::delete('/stores/{id}', [StoreController::class, 'destroy']);

// AI Builder
Route::post('/ai-builder/generate', [\App\Http\Controllers\AIBuilderController::class, 'generate']);
Route::post('/ai-builder/extract-profile', [\App\Http\Controllers\AIBuilderController::class, 'extractStoreProfile']);
Route::delete('/ai-builder/{id}', [\App\Http\Controllers\AIBuilderController::class, 'destroy']);

// Categories
Route::get('/categories', [CategoryController::class, 'index']);
Route::post('/categories', [CategoryController::class, 'store']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);
Route::put('/categories/{id}', [CategoryController::class, 'update']);
Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

// Products
Route::get('/products', [ProductController::class, 'index']);
Route::post('/products', [ProductController::class, 'store']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::put('/products/{id}', [ProductController::class, 'update']);
Route::delete('/products/{id}', [ProductController::class, 'destroy']);

// Inventory
Route::get('/inventory', [InventoryController::class, 'index']);
Route::put('/inventory/{id}/stock', [InventoryController::class, 'updateStock']);

// Customers
Route::get('/customers', [CustomerController::class, 'index']);
Route::post('/customers', [CustomerController::class, 'store']);
Route::get('/customers/{id}', [CustomerController::class, 'show']);
Route::put('/customers/{id}', [CustomerController::class, 'update']);
Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);

// Cart
Route::get('/cart', [CartController::class, 'index']);
Route::post('/cart/items', [CartController::class, 'addItem']);
Route::put('/cart/items/{id}', [CartController::class, 'updateItem']);
Route::delete('/cart/items/{id}', [CartController::class, 'removeItem']);
Route::delete('/cart', [CartController::class, 'clearCart']);

// Orders
Route::get('/orders', [OrderController::class, 'index']);
Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/{id}', [OrderController::class, 'show']);
Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']);

// Subscriptions
Route::get('/subscriptions', [\App\Http\Controllers\SubscriptionController::class, 'index']);
Route::post('/subscriptions/order', [\App\Http\Controllers\SubscriptionController::class, 'createOrder'])->middleware('auth:sanctum');
Route::post('/subscriptions/verify', [\App\Http\Controllers\SubscriptionController::class, 'verifyPayment'])->middleware('auth:sanctum');

// AutoPay
Route::post('/subscriptions/autopay/create', [\App\Http\Controllers\SubscriptionController::class, 'createAutoPay'])->middleware('auth:sanctum');
Route::post('/subscriptions/autopay/verify', [\App\Http\Controllers\SubscriptionController::class, 'verifyAutoPay'])->middleware('auth:sanctum');
Route::post('/subscriptions/autopay/cancel', [\App\Http\Controllers\SubscriptionController::class, 'cancelAutoPay'])->middleware('auth:sanctum');

// Webhook
Route::post('/webhooks/razorpay', [\App\Http\Controllers\RazorpayWebhookController::class, 'handleWebhook']);


// Meesho Dropshipping & Reselling Routes (Authenticated Store Owner Only)
Route::prefix('meesho')->middleware('auth:sanctum')->group(function () {
    Route::get('/status', [\App\Http\Controllers\MeeshoController::class, 'getStatus']);
    Route::post('/reefapi/test', [\App\Http\Controllers\MeeshoController::class, 'testReefApiConnection']);
    Route::post('/apify/test', [\App\Http\Controllers\MeeshoController::class, 'testApifyConnection']);
    Route::post('/connect', [\App\Http\Controllers\MeeshoController::class, 'connect']);
    Route::post('/disconnect', [\App\Http\Controllers\MeeshoController::class, 'disconnect']);
    Route::get('/catalog', [\App\Http\Controllers\MeeshoController::class, 'getCatalog']);
    Route::get('/provider-categories', [\App\Http\Controllers\MeeshoController::class, 'getProviderCategories']);
    Route::get('/search', [\App\Http\Controllers\MeeshoController::class, 'searchCatalog']);
    Route::get('/product/{id}', [\App\Http\Controllers\MeeshoController::class, 'getProductDetail']);
    Route::get('/categories', [\App\Http\Controllers\MeeshoController::class, 'getStoreCategories']);
    Route::post('/import', [\App\Http\Controllers\MeeshoController::class, 'importProduct']);
    Route::get('/products', [\App\Http\Controllers\MeeshoController::class, 'getResellingProducts']);
    Route::put('/products/{id}/price', [\App\Http\Controllers\MeeshoController::class, 'updatePrice']);
    Route::post('/products/{id}/sync', [\App\Http\Controllers\MeeshoController::class, 'syncProduct']);
    Route::post('/sync-all', [\App\Http\Controllers\MeeshoController::class, 'syncAllProducts']);
    Route::get('/orders', [\App\Http\Controllers\MeeshoController::class, 'getOrders']);
    Route::post('/orders/create-from-toastkart', [\App\Http\Controllers\MeeshoController::class, 'mapOrder']);
    Route::post('/orders/{id}/process', [\App\Http\Controllers\MeeshoController::class, 'processSupplierOrder']);
    Route::put('/orders/{id}/tracking', [\App\Http\Controllers\MeeshoController::class, 'updateTracking']);
    Route::post('/orders/{id}/return', [\App\Http\Controllers\MeeshoController::class, 'handleReturn']);
    Route::get('/logs', [\App\Http\Controllers\MeeshoController::class, 'getLogs']);
});
