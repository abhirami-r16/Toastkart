<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'store']);

        if ($request->has('store_id') && $request->store_id) {
            $query->where('store_id', $request->store_id);
        }

        if ($request->has('owner_id') && $request->owner_id) {
            $query->whereHas('store', function ($q) use ($request) {
                $q->where('user_id', $request->owner_id);
            });
        }

        if ($request->has('category_id') && $request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $products = $query->orderBy('id', 'desc')->get();

        return response()->json($products);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'store_id'        => 'nullable|integer',
            'category_id'     => 'nullable|integer',
            'name'            => 'required|string|max:255',
            'price'           => 'required|numeric|min:0',
            'compare_price'   => 'nullable|numeric|min:0',
            'stock_quantity'  => 'required|integer|min:0',
            'sku'             => 'nullable|string|max:100',
            'description'     => 'nullable|string',
            'image'           => 'nullable|string',
            'is_active'       => 'nullable|boolean',
            'store_name'      => 'nullable|string|max:255',
            'store_slug'      => 'nullable|string|max:255',
            'store_subdomain' => 'nullable|string|max:255',
            'user_id'         => 'nullable|integer',
            'owner_id'        => 'nullable|integer',
            'owner_name'      => 'nullable|string|max:255',
            'owner_email'     => 'nullable|string|max:255',
            'color'           => 'nullable|string|max:255',
            'size'            => 'nullable|string|max:255',
            'images'          => 'nullable|array',
        ]);

        // Verify store_id actually exists — fall back to null if not found
        $storeId = null;
        if (!empty($validated['store_id'])) {
            $storeExists = \App\Models\Store::where('id', $validated['store_id'])->exists();
            $storeId = $storeExists ? $validated['store_id'] : null;
        }

        // Verify category_id actually exists — fall back to null if not found
        $categoryId = null;
        if (!empty($validated['category_id'])) {
            $categoryExists = \App\Models\Category::where('id', $validated['category_id'])->exists();
            $categoryId = $categoryExists ? $validated['category_id'] : null;
        }

        $sku = $validated['sku'] ?? 'SKU-' . strtoupper(Str::random(6));
        $stock = (int)$validated['stock_quantity'];
        $status = $stock <= 0 ? 'Out of Stock' : ($stock <= 5 ? 'Low Stock' : 'In Stock');

        $product = Product::create([
            'store_id'       => $storeId,
            'category_id'    => $categoryId,
            'name'           => $validated['name'],
            'slug'           => Str::slug($validated['name']) . '-' . Str::random(4),
            'sku'            => $sku,
            'price'          => $validated['price'],
            'compare_price'  => $validated['compare_price'] ?? null,
            'stock_quantity' => $stock,
            'description'    => $validated['description'] ?? '',
            'image'          => $validated['image'] ?? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
            'status'         => $status,
            'is_active'      => $validated['is_active'] ?? true,
            'color'          => $validated['color'] ?? null,
            'size'           => $validated['size'] ?? null,
            'images'         => $validated['images'] ?? [],
        ]);

        return response()->json($product->load(['category', 'store']), 201);
    }

    public function show($idOrSlug)
    {
        $product = Product::with(['category', 'store'])
            ->where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->orWhere('sku', $idOrSlug)
            ->firstOrFail();

        return response()->json($product);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'category_id' => 'nullable|exists:categories,id',
            'name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'stock_quantity' => 'sometimes|required|integer|min:0',
            'sku' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'color' => 'nullable|string|max:255',
            'size' => 'nullable|string|max:255',
            'images' => 'nullable|array',
        ]);

        if (isset($validated['name']) && $validated['name'] !== $product->name) {
            $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(4);
        }

        if (isset($validated['stock_quantity'])) {
            $stock = (int)$validated['stock_quantity'];
            $validated['status'] = $stock <= 0 ? 'Out of Stock' : ($stock <= 5 ? 'Low Stock' : 'In Stock');
        }

        $product->update($validated);

        return response()->json($product->load(['category', 'store']));
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json(['message' => 'Product deleted successfully']);
    }
}
