<?php

namespace App\Http\Controllers;

use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StoreController extends Controller
{
    public function index(Request $request)
    {
        $query = Store::with(['user:id,name'])
            ->withCount(['products', 'categories', 'orders']);

        // Filter by user_id if provided
        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        $stores = $query->orderBy('id', 'desc')->get();

        $storesWithOwnerName = $stores->map(function ($store) {
            return array_merge($store->toArray(), [
                'owner_name' => optional($store->user)->name,
            ]);
        });

        return response()->json($storesWithOwnerName);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'owner_name' => 'nullable|string|max:255',
            'subdomain'  => 'nullable|string|max:255',
            'logo'       => 'nullable|string',
            'currency'   => 'nullable|string|max:10',
            'description'=> 'nullable|string',
            'status'     => 'nullable|string',
            'user_id'    => 'nullable|integer',
            'slug'       => 'nullable|string|max:255',
            'category'   => 'nullable|string|max:255',
        ]);

        // Resolve user_id: prefer authenticated user, then request user_id, then 1
        $userId = $request->user()?->id ?? $validated['user_id'] ?? 1;

        // Generate unique slug/subdomain
        $subdomain = $validated['subdomain'] ?? Str::slug($validated['name']);
        $slug = Str::slug($validated['slug'] ?? $validated['name']);
        $originalSlug = $slug;
        $count = 1;
        while (Store::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count++;
        }
        if (empty($subdomain)) {
            $subdomain = $slug;
        }

        $store = Store::create([
            'user_id'    => $userId,
            'name'       => $validated['name'],
            'owner_name' => $validated['owner_name'] ?? null,
            'slug'       => $slug,
            'subdomain'  => $subdomain,
            'logo'       => $validated['logo'] ?? 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=300&q=80',
            'currency'   => $validated['currency'] ?? 'USD',
            'description'=> $validated['description'] ?? '',
            'status'     => $validated['status'] ?? 'Active',
            'category'   => $validated['category'] ?? 'General Merchant Store',
        ]);

        return response()->json($store, 201);
    }

    public function show($idOrSlug)
    {
        $store = Store::with([
            'categories:id,store_id,name,slug',
            'products:id,store_id,category_id,name,slug,price,compare_price,image,rating,color,status,stock_quantity',
            'products.category:id,name'
        ])
            ->where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->orWhere('subdomain', $idOrSlug)
            ->firstOrFail();

        return response()->json($store);
    }

    public function update(Request $request, $id)
    {
        $store = Store::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'owner_name' => 'nullable|string|max:255',
            'subdomain' => 'nullable|string|max:255',
            'logo' => 'nullable|string',
            'currency' => 'nullable|string|max:10',
            'description' => 'nullable|string',
            'status' => 'nullable|string',
            'category' => 'nullable|string|max:255',
        ]);

        if (isset($validated['name']) && $validated['name'] !== $store->name) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $store->update($validated);

        return response()->json($store);
    }

    public function destroy($id)
    {
        $store = Store::findOrFail($id);
        $store->delete();

        return response()->json(['message' => 'Store deleted successfully']);
    }
}
