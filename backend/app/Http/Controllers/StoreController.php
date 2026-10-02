<?php

namespace App\Http\Controllers;

use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StoreController extends Controller
{
    private function getCategoryFallbackImages($categoryText)
    {
        $cat = strtolower($categoryText);
        if (str_contains($cat, 'watch')) return ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1542496658-e326789548ce?auto=format&fit=crop&q=80'];
        if (str_contains($cat, 'fashion') || str_contains($cat, 'boutique') || str_contains($cat, 'clothing') || str_contains($cat, 'apparel')) return ['https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80'];
        if (str_contains($cat, 'perfume') || str_contains($cat, 'fragrance')) return ['https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1615160256429-07f0f62d1c25?auto=format&fit=crop&q=80'];
        if (str_contains($cat, 'beauty') || str_contains($cat, 'cosmetic')) return ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&q=80'];
        if (str_contains($cat, 'jewelry') || str_contains($cat, 'jewellery')) return ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80'];
        if (str_contains($cat, 'electronic') || str_contains($cat, 'tech')) return ['https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80'];
        if (str_contains($cat, 'grocery') || str_contains($cat, 'food')) return ['https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80'];
        if (str_contains($cat, 'furniture') || str_contains($cat, 'home')) return ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80'];
        if (str_contains($cat, 'restaurant')) return ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80'];
        
        return ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80'];
    }
    public function index(Request $request)
    {
        $query = Store::with(['user:id,name', 'aiConfigurations'])
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
            'name'       => 'nullable|string|max:255',
            'owner_name' => 'nullable|string|max:255',
            'subdomain'  => 'nullable|string|max:255',
            'logo'       => 'nullable|string',
            'currency'   => 'nullable|string|max:10',
            'description'=> 'nullable|string',
            'status'     => 'nullable|string',
            'user_id'    => 'nullable|integer',
            'slug'       => 'nullable|string|max:255',
            'category'   => 'nullable|string|max:255',
            'ai_prompt'  => 'nullable|string',
        ]);

        $prompt = $validated['ai_prompt'] ?? null;
        $name = $validated['name'] ?? null;
        $category = $validated['category'] ?? null;
        $description = $validated['description'] ?? null;
        
        $aiData = null;
        
        if ($prompt && env('GEMINI_API_KEY')) {
            try {
                $response = \Illuminate\Support\Facades\Http::post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . env('GEMINI_API_KEY'), [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => "You are an expert AI store builder. A user provided this prompt to create a store:
Prompt: {$prompt}
Current explicitly chosen Name: " . ($name ?: 'None') . "
CRITICAL RULE: The User Prompt is the ABSOLUTE SOURCE OF TRUTH. You must exactly follow the customer's instructions for colors, style, and imagery. Do not override their choices with generic defaults.

Extract and generate a complete store configuration. If Name or Category are explicitly provided above, respect them. Otherwise, invent suitable ones based on the prompt.


COLOR PALETTE INSTRUCTIONS:
Carefully analyze the prompt for ANY color preferences (e.g., \"blue and white\", \"dark purple\", \"earthy brown\").
Generate a complete, cohesive 11-color palette based on the user's requested colors.
- If they request a light/bright style, use a light `background` and dark `text`.
- If they request a dark style, use a dark `background` and light `text`.
- If they mention only 1 or 2 colors, intelligently generate complementary shades for the remaining UI elements.
- DO NOT default to a black background unless they ask for a dark theme.
- Ensure proper contrast (e.g., buttonText should be readable on buttonBackground).
- If no colors are mentioned, automatically choose a professional palette suitable for the business type.

Output ONLY a JSON object (no markdown) with this structure:
{
  \"name\": \"Store Name\",
  \"category\": \"Category string (e.g. Watch, Fashion, Perfume, etc)\",
  \"description\": \"Detailed store description covering target audience and products\",
  \"themeConfig\": {
    \"colors\": {
      \"primary\": \"#hex\",
      \"secondary\": \"#hex\",
      \"accent\": \"#hex\",
      \"background\": \"#hex\",
      \"surface\": \"#hex\",
      \"text\": \"#hex\",
      \"mutedText\": \"#hex\",
      \"buttonBackground\": \"#hex\",
      \"buttonText\": \"#hex\",
      \"border\": \"#hex\",
      \"hover\": \"#hex\"
    },
    \"typography\": {\"headingFont\": \"font-family\", \"bodyFont\": \"font-family\"},
    \"style\": {
      \"borderRadius\": \"px\", 
      \"cardStyle\": \"css string\"
    },
    \"sections\": [
      {\"type\": \"hero\", \"title\": \"Dynamic Title\", \"subtitle\": \"Dynamic subtitle\", \"cta\": \"Shop Now\"},
      {\"type\": \"featured_products\", \"title\": \"Featured\"}
    ]
  }
}"]
                            ]
                        ]
                    ]
                ]);

                if ($response->successful()) {
                    $jsonText = $response->json()['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    $jsonText = trim(preg_replace('/```json|```/i', '', $jsonText));
                    $aiData = json_decode($jsonText, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        if (!isset($aiData['themeConfig']) || !is_array($aiData['themeConfig'])) {
                            $aiData['themeConfig'] = [];
                        }
                        if (!isset($aiData['themeConfig']['style']) || !is_array($aiData['themeConfig']['style'])) {
                            $aiData['themeConfig']['style'] = [];
                        }
                        $heroImages = [];
                        
                        try {
                            Log::info('Customer prompt received: ' . $prompt);
                            Log::info('Gemini image generation started');
                            
                            $imagePromptStr = "Create a professional e-commerce hero image. High-quality product photography. Wide landscape composition suitable for a website hero. Main products clearly visible. Appropriate background, colors, and visual style based on the customer prompt: '" . $prompt . "'. No website UI, no navigation bar, no buttons, no HTML, no text, no watermarks.";
                            
                            $imageResponse = Http::withHeaders([
                                'x-goog-api-key' => env('GEMINI_API_KEY')
                            ])->post("https://generativelanguage.googleapis.com/v1beta/interactions", [
                                'model' => 'gemini-3.1-flash-image',
                                'input' => [
                                    [
                                        'type' => 'text',
                                        'text' => $imagePromptStr
                                    ]
                                ],
                                'response_format' => [
                                    'type' => 'image',
                                    'mime_type' => 'image/jpeg',
                                    'aspect_ratio' => '16:9',
                                    'image_size' => '1K'
                                ]
                            ]);
                            
                            Log::info('Gemini image generation HTTP status: ' . $imageResponse->status());
                            Log::info('Gemini image generation response received');
                            
                            if ($imageResponse->successful()) {
                                $imgResult = $imageResponse->json();
                                
                                $base64Data = null;
                                if (isset($imgResult['output_image']['data'])) {
                                    $base64Data = $imgResult['output_image']['data'];
                                } elseif (isset($imgResult['interaction']['output_image']['data'])) {
                                    $base64Data = $imgResult['interaction']['output_image']['data'];
                                }

                                if ($base64Data) {
                                    Log::info('Gemini output_image detected');
                                    Log::info('Gemini image Base64 decoded');
                                    $imageData = base64_decode($base64Data);
                                    
                                    $filename = 'ai-hero-' . uniqid() . '.jpg';
                                    \Illuminate\Support\Facades\Storage::disk('public')->put('ai-heroes/' . $filename, $imageData);
                                    Log::info('Image saved successfully');
                                    
                                    $publicUrl = '/storage/ai-heroes/' . $filename;
                                    Log::info('Hero image URL generated: ' . $publicUrl);
                                    
                                    $heroImages[] = $publicUrl;
                                } else {
                                    // Hide sensitive data
                                    if (isset($imgResult['api_key'])) unset($imgResult['api_key']);
                                    Log::error('output_image missing in Gemini response', ['response' => $imgResult]);
                                }
                            } else {
                                Log::error('Gemini image API returned error: ' . $imageResponse->body());
                            }
                        } catch (\Throwable $e) {
                            Log::error('Gemini hero image generation failed', [
                                'message' => $e->getMessage()
                            ]);
                        }
                        
                        if (count($heroImages) === 0) {
                            $heroImages = [
                                "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80"
                            ];
                        }
                        
                        $aiData['themeConfig']['style']['heroImages'] = $heroImages;
                        $name = $name ?: ($aiData['name'] ?? 'AI Store');
                        $category = $category ?: ($aiData['category'] ?? 'General');
                        $description = $description ?: ($aiData['description'] ?? '');
                        
                        // Validate and fallback heroImages
                        if (!isset($aiData['themeConfig']['style']['heroImages']) || count($aiData['themeConfig']['style']['heroImages']) < 2) {
                            $existing = $aiData['themeConfig']['style']['heroImages'] ?? [];
                            $fallbackImages = $this->getCategoryFallbackImages($category . ' ' . $description);
                            
                            if (is_array($existing) && count($existing) == 1) {
                                $aiData['themeConfig']['style']['heroImages'] = [$existing[0], $fallbackImages[1]];
                            } else {
                                $aiData['themeConfig']['style']['heroImages'] = $fallbackImages;
                            }
                        }
                    }
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Gemini failed in StoreController: " . $e->getMessage());
            }
        }

        $name = $name ?: 'New Store';
        $userId = $request->user()?->id ?? $validated['user_id'] ?? 1;

        $subdomain = $validated['subdomain'] ?? Str::slug($name);
        $slug = Str::slug($validated['slug'] ?? $name);
        $originalSlug = $slug;
        $count = 1;
        while (Store::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count++;
        }
        if (empty($subdomain)) $subdomain = $slug;

        $store = Store::create([
            'user_id'    => $userId,
            'name'       => $name,
            'owner_name' => $validated['owner_name'] ?? null,
            'slug'       => $slug,
            'subdomain'  => $subdomain,
            'logo'       => $validated['logo'] ?? 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=300&q=80',
            'currency'   => $validated['currency'] ?? 'USD',
            'description'=> $description ?? '',
            'status'     => $validated['status'] ?? 'Active',
            'category'   => $category ?? 'General Merchant Store',
        ]);

        // Auto-generate AI components if data exists
        if ($aiData) {
            // 1. Theme configuration
            if (isset($aiData['themeConfig'])) {
                \App\Models\AiStoreConfiguration::create([
                    'store_id' => $store->id,
                    'configuration' => json_encode($aiData['themeConfig']),
                    'status' => 'draft',
                    'version' => 1
                ]);
            }
        }

        return response()->json($store, 201);
    }

    public function show($idOrSlug)
    {
        $store = Store::with([
            'categories:id,store_id,name,slug',
            'products:id,store_id,category_id,name,slug,price,compare_price,image,description,images,size,color,status,stock_quantity',
            'products.category:id,name',
            'aiConfigurations'
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
