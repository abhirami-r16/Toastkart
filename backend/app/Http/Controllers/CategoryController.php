<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::withCount('products');

        if ($request->has('store_id') && $request->store_id) {
            $query->where('store_id', $request->store_id);
        }

        if ($request->has('owner_id') && $request->owner_id) {
            $query->whereHas('store', function ($q) use ($request) {
                $q->where('user_id', $request->owner_id);
            });
        }

        $categories = $query->orderBy('name', 'asc')->get();

        return response()->json($categories);
    }

    public function store(Request $request)
    {
        \Log::info('Category creation request payload', $request->all());

        $validated = $request->validate([
            'store_id'        => 'nullable|integer',
            'store_subdomain' => 'nullable|string|max:255',
            'store_name'      => 'nullable|string|max:255',
            'name'            => 'required|string|max:255',
            'description'     => 'nullable|string',
            'featured'        => 'nullable|boolean',
            'dropdown_items'  => 'nullable',
        ]);

        $dropdownItems = $request->input('dropdown_items');
        if (is_string($dropdownItems)) {
            $decoded = json_decode($dropdownItems, true);
            if (is_array($decoded)) {
                $dropdownItems = $decoded;
            } else {
                $dropdownItems = array_values(array_filter(array_map('trim', explode(',', $dropdownItems))));
            }
        }

        // Resolve store_id using a 3-tier priority:
        // 1. Direct store_id match
        // 2. Subdomain match
        // 3. Name match
        $storeId = null;

        if (!empty($validated['store_id'])) {
            if (\App\Models\Store::where('id', $validated['store_id'])->exists()) {
                $storeId = (int) $validated['store_id'];
            }
        }

        if (!$storeId && !empty($validated['store_subdomain'])) {
            $sub = trim($validated['store_subdomain']);
            $store = \App\Models\Store::where('subdomain', $sub)
                ->orWhere('slug', $sub)
                ->first();
            if ($store) {
                $storeId = $store->id;
            }
        }

        if (!$storeId && !empty($validated['store_name'])) {
            $name = trim($validated['store_name']);
            $store = \App\Models\Store::whereRaw('LOWER(name) = ?', [strtolower($name)])
                ->orWhere('name', 'LIKE', '%' . $name . '%')
                ->first();
            if ($store) {
                $storeId = $store->id;
            }
        }

        // If STILL no store found, try finding ANY store owned by this user (fallback for orphans)
        if (!$storeId) {
            $user_id = $request->input('user_id'); // Try pulling from request directly
            if ($user_id) {
                $store = \App\Models\Store::where('user_id', $user_id)->first();
                if ($store) {
                    $storeId = $store->id;
                }
            }
        }

        // Ensure slug uniqueness within the store
        $slug = Str::slug($validated['name']);
        $originalSlug = $slug;
        $count = 1;
        while (Category::where('slug', $slug)->where('store_id', $storeId)->exists()) {
            $slug = $originalSlug . '-' . $count++;
        }

        $category = Category::create([
            'store_id'       => $storeId,
            'name'           => $validated['name'],
            'slug'           => $slug,
            'description'    => $validated['description'] ?? '',
            'dropdown_items' => $dropdownItems,
            'featured'       => $validated['featured'] ?? false,
        ]);

        $category->loadCount('products');

        return response()->json($category, 201);
    }

    public function show($id)
    {
        $category = Category::with('products')->withCount('products')->findOrFail($id);
        return response()->json($category);
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'store_id'        => 'nullable|integer',
            'store_subdomain' => 'nullable|string|max:255',
            'store_name'      => 'nullable|string|max:255',
            'name'            => 'sometimes|required|string|max:255',
            'description'     => 'nullable|string',
            'featured'        => 'nullable|boolean',
            'dropdown_items'  => 'nullable',
        ]);

        if ($request->has('dropdown_items')) {
            $dropdownItems = $request->input('dropdown_items');
            if (is_string($dropdownItems)) {
                $decoded = json_decode($dropdownItems, true);
                if (is_array($decoded)) {
                    $dropdownItems = $decoded;
                } else {
                    $dropdownItems = array_values(array_filter(array_map('trim', explode(',', $dropdownItems))));
                }
            }
            $validated['dropdown_items'] = $dropdownItems;
        }

        // Resolve store_id with 3-tier fallback (only update if a value was explicitly sent)
        if (array_key_exists('store_id', $validated) || !empty($validated['store_subdomain']) || !empty($validated['store_name'])) {
            $resolvedStoreId = $category->store_id; // default: keep existing

            if (!empty($validated['store_id'])) {
                if (\App\Models\Store::where('id', $validated['store_id'])->exists()) {
                    $resolvedStoreId = (int) $validated['store_id'];
                }
            }

            if ($resolvedStoreId === $category->store_id && !empty($validated['store_subdomain'])) {
                $store = \App\Models\Store::where('subdomain', $validated['store_subdomain'])
                    ->orWhere('slug', $validated['store_subdomain'])
                    ->first();
                if ($store) $resolvedStoreId = $store->id;
            }

            if ($resolvedStoreId === $category->store_id && !empty($validated['store_name'])) {
                $store = \App\Models\Store::whereRaw('LOWER(name) = ?', [strtolower($validated['store_name'])])->first();
                if ($store) $resolvedStoreId = $store->id;
            }

            $validated['store_id'] = $resolvedStoreId;
        }

        // Remove non-model fields before update
        unset($validated['store_subdomain'], $validated['store_name']);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category->update($validated);
        $category->loadCount('products');

        return response()->json($category);
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }
}
