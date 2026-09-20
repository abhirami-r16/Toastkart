<?php

use App\Models\Product;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

$products = Product::all();

foreach ($products as $product) {
    $updated = false;

    // Process primary image
    if (Str::startsWith($product->image, 'data:image')) {
        $imageParts = explode(';base64,', $product->image);
        if (count($imageParts) === 2) {
            $imageTypeAux = explode('image/', $imageParts[0]);
            $imageType = $imageTypeAux[1] ?? 'png';
            $imageBase64 = base64_decode($imageParts[1]);
            $imageName = 'product_' . $product->id . '_' . Str::random(10) . '.' . $imageType;
            
            Storage::disk('public')->put('products/' . $imageName, $imageBase64);
            $product->image = '/storage/products/' . $imageName;
            $updated = true;
        }
    }

    // Process gallery images
    $images = $product->images;
    if (is_string($images)) {
        try {
            $images = json_decode($images, true) ?: [];
        } catch (\Exception $e) {
            $images = [];
        }
    }

    if (is_array($images) && count($images) > 0) {
        $newImages = [];
        foreach ($images as $img) {
            $url = is_string($img) ? $img : ($img['url'] ?? '');
            $color = is_array($img) ? ($img['color'] ?? '') : '';

            if (Str::startsWith($url, 'data:image')) {
                $imageParts = explode(';base64,', $url);
                if (count($imageParts) === 2) {
                    $imageTypeAux = explode('image/', $imageParts[0]);
                    $imageType = $imageTypeAux[1] ?? 'png';
                    $imageBase64 = base64_decode($imageParts[1]);
                    $imageName = 'gallery_' . $product->id . '_' . Str::random(10) . '.' . $imageType;
                    
                    Storage::disk('public')->put('products/' . $imageName, $imageBase64);
                    $url = '/storage/products/' . $imageName;
                    $updated = true;
                }
            }

            if (is_array($img)) {
                $newImages[] = ['url' => $url, 'color' => $color];
            } else {
                $newImages[] = $url;
            }
        }
        
        if ($updated) {
            $product->images = $newImages;
        }
    }

    if ($updated) {
        $product->save();
        echo "Updated product ID: {$product->id}\n";
    }
}
echo "Migration complete.\n";
