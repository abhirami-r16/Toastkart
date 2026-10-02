<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Store;
use App\Models\AiStoreConfiguration;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AIBuilderController extends Controller
{
    /**
     * Generate an AI-powered store configuration.
     *
     * Gemini:
     * - Generates website design/configuration.
     *
     * Cloudflare FLUX:
     * - Generates the hero/banner image.
     *
     * Toastkart database:
     * - Supplies the real products and categories.
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'store_id' => 'required|exists:stores,id',
            'prompt' => 'required|string'
        ]);

        $store = Store::findOrFail(
            $validated['store_id']
        );

        $prompt = trim(
            $validated['prompt']
        );

        $detectedCategory = $this->detectBusinessCategory($prompt);

        // Fallback store name extraction in case the AI rate limits
        if (preg_match('/(?:named|called|brand is|name is|store name|name)\s+([A-Za-z0-9\s]+)/i', $prompt, $matches)) {
            $extracted = trim($matches[1]);
            $extracted = preg_replace('/(with|and|,|\.|for|that).*/i', '', $extracted);
            if (!empty(trim($extracted)) && strlen($extracted) < 50) {
                $store->name = trim($extracted);
            }
        } elseif (str_word_count($prompt) <= 4) {
            // If they just typed a very short prompt like "Abhi Jewels"
            $store->name = ucwords(trim($prompt));
        } elseif ($store->name === 'New Store' || empty($store->name)) {
            // Generate a fallback name based on the category so it's never just "New Store"
            $cat = $store->category ?? 'Premium';
            $store->name = ucwords($cat . ' Store');
        }

        $currentCategory = strtolower(trim((string) $store->category));

        if (
            empty($currentCategory) ||
            $currentCategory === 'general retail' ||
            $currentCategory === 'general merchant store'
        ) {
            if ($detectedCategory !== 'General Retail') {
                $store->category = $detectedCategory;
            }
        }

        $store->save();


        $apiKey = env(
            'GEMINI_API_KEY'
        );

        /*
        |--------------------------------------------------------------------------
        | Default configuration
        |--------------------------------------------------------------------------
        */

        $defaultConfig =
            $this->getDefaultConfig(
                $store,
                $prompt
            );

        /*
        |--------------------------------------------------------------------------
        | Existing AI configuration
        |--------------------------------------------------------------------------
        */

        $existingConfigRecord =
            AiStoreConfiguration::where(
                'store_id',
                $store->id
            )
                ->orderBy(
                    'version',
                    'desc'
                )
                ->first();

        $existingConfigArray = null;

        if ($existingConfigRecord) {

            $storedConfiguration =
                $existingConfigRecord->getAttribute(
                    'configuration'
                );

            if (!$storedConfiguration) {

                $storedConfiguration =
                    $existingConfigRecord->getAttribute(
                        'config_json'
                    );
            }

            if (is_array($storedConfiguration)) {

                $existingConfigArray =
                    $storedConfiguration;

            } elseif (
                is_string($storedConfiguration) &&
                $storedConfiguration !== ''
            ) {

                $decodedConfiguration =
                    json_decode(
                        $storedConfiguration,
                        true
                    );

                if (
                    json_last_error() === JSON_ERROR_NONE &&
                    is_array($decodedConfiguration)
                ) {

                    $existingConfigArray =
                        $decodedConfiguration;
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Do not send previously generated hero images to Gemini
        |--------------------------------------------------------------------------
        */

        if (
            is_array($existingConfigArray) &&
            isset(
                $existingConfigArray['style']['heroImages']
            )
        ) {

            unset(
                $existingConfigArray['style']['heroImages']
            );
        }

        $existingConfigJson =
            $existingConfigArray
                ? json_encode(
                    $existingConfigArray,
                    JSON_UNESCAPED_SLASHES
                )
                : 'None';

        /*
        |--------------------------------------------------------------------------
        | Start with local fallback configuration
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        | Even if Gemini is unavailable, this configuration will be used
        | and Cloudflare FLUX will still generate the hero image.
        |
        */

        $config =
            $defaultConfig;

        /*
        |--------------------------------------------------------------------------
        | Gemini Website Configuration
        |--------------------------------------------------------------------------
        */

        if ($apiKey) {

            try {

                $geminiModel =
                    env(
                        'GEMINI_MODEL',
                        'gemini-3.8-flash'
                    );

                Log::info(
                    'AI Builder Gemini request started',
                    [
                        'store_id' =>
                            $store->id,

                        'model' =>
                            $geminiModel
                    ]
                );

                $geminiPrompt = <<<PROMPT
You are an expert AI web designer for Toastkart, a multi-vendor ecommerce platform.

Create a website design configuration based on the store details and the customer's request.

Store Name:
{$store->name}

Store Category:
{$store->category}

User Prompt:
{$prompt}

Existing Configuration:
{$existingConfigJson}

IMPORTANT BUSINESS RULES:

1. The User Prompt is the source of truth.

2. Follow explicit customer instructions for:
- colors
- visual style
- theme
- typography
- background
- hero style
- overall appearance

3. If the customer asks to modify an existing website:
- modify only the requested design properties
- preserve all unrelated configuration
- do not replace the existing structure unnecessarily

4. If the customer asks to create a new website:
- generate a fresh design configuration
- choose an appropriate existing Toastkart theme

5. DO NOT generate sample, demo, placeholder, or fake products or collections.
6. Use the Owner Dashboard database as the single source of truth for:
   - Product collections/categories
   - Product names
   - Product descriptions
   - Product prices
   - Product images
   - Product availability
   - Product inventory
   - Product IDs
   - Category IDs
7. Display the actual Owner Dashboard collections/categories on the storefront.
8. Display the actual Owner Dashboard products in the corresponding collections/categories.
9. If the Owner Dashboard contains 5 products, the website should use those 5 products. If it contains 20 products, the website should use those 20 products.
10. Do not invent additional products or categories.
11. Do not modify existing products or categories while generating the AI website.
12. The AI Builder should only generate the website's visual configuration, including:
   - Theme
   - Colors
   - Typography
   - Layout
   - Section arrangement
   - Hero design
   - Hero title and subtitle
   - CTA styling
   - Card styling
   - Visual appearance
13. The generated hero/banner image may be created by AI, but it must not contain product names, store names, logos, text, or website UI.
14. The storefront must continue fetching products and collections from the existing Owner Dashboard APIs/database using the correct store ID.
15. Do not create a new Toastkart theme.

AVAILABLE TOASTKART THEMES:

theme-eflyer
theme-hexashop
theme-jewelry
theme-beauty
theme-home
theme-electronics
theme-footwear
theme-grocery
theme-gift
theme-perfume

The selected theme MUST be stored inside:

style.theme

COLOR RULES:

Analyze the customer prompt carefully.

Examples:

blue and white
dark purple
earthy brown
ivory and gold
pastel pink
black and gold
green and white

Generate a cohesive 11-color palette.

The palette must contain:

primary
secondary
accent
background
surface
text
mutedText
buttonBackground
buttonText
border
hover

If the customer requests a light design:
- use a light background
- use readable dark text

If the customer requests a dark design:
- use a dark background
- use readable light text

Do NOT automatically use a black background.

Only use a dark background when the customer requests a dark/black design or the design clearly requires it.

Ensure buttonText has sufficient contrast against buttonBackground.

TYPOGRAPHY:

Choose professional fonts appropriate for the business and requested style.

Luxury:
- elegant serif heading
- clean sans-serif body

Modern:
- modern sans-serif

Minimal:
- clean sans-serif

Fashion:
- stylish editorial typography

Jewelry:
- elegant premium typography

Perfume:
- sophisticated luxury typography

HERO:

Create a suitable hero title and subtitle based on:
- store category
- customer prompt
- business style

Do not generate actual product data.

The hero image will be generated separately by Cloudflare FLUX.

OUTPUT:

Return ONLY a valid raw JSON object.

Do NOT return:
- markdown
- explanations
- HTML
- code fences
- ```json

The JSON must follow this structure:

{
  "storeName": "The store name requested by the user. If none is requested, generate a highly professional and relevant store name.",
  "colors": {
    "primary": "#hexcode",
    "secondary": "#hexcode",
    "accent": "#hexcode",
    "background": "#hexcode",
    "surface": "#hexcode",
    "text": "#hexcode",
    "mutedText": "#hexcode",
    "buttonBackground": "#hexcode",
    "buttonText": "#hexcode",
    "border": "#hexcode",
    "hover": "#hexcode"
  },
  "typography": {
    "headingFont": "font-family string",
    "bodyFont": "font-family string"
  },
  "style": {
    "theme": "theme-jewelry",
    "borderRadius": "12px",
    "cardStyle": "css box-shadow or border string"
  },
  "sections": [
    {
      "type": "hero",
      "title": "Dynamic category-based heading",
      "subtitle": "Dynamic category-based subtitle",
      "cta": "Shop Now"
    },
    {
      "type": "featured_products",
      "title": "Featured Products"
    }
  ]
}
PROMPT;

                /*
                |--------------------------------------------------------------------------
                | Gemini API request
                |--------------------------------------------------------------------------
                */

                $geminiUrl =
                    'https://generativelanguage.googleapis.com/v1beta/models/'
                    . $geminiModel
                    . ':generateContent';

                $maxAttempts = 3;

                $response = null;

                for (
                    $attempt = 1;
                    $attempt <= $maxAttempts;
                    $attempt++
                ) {

                    Log::info(
                        'Gemini AI Builder request attempt',
                        [
                            'store_id' =>
                                $store->id,

                            'model' =>
                                $geminiModel,

                            'attempt' =>
                                $attempt
                        ]
                    );

                    $response =
                        Http::timeout(120)
                            ->connectTimeout(20)
                            ->withHeaders([
                                'x-goog-api-key' =>
                                    $apiKey,

                                'Content-Type' =>
                                    'application/json'
                            ])
                            ->acceptJson()
                            ->post(
                                $geminiUrl,
                                [
                                    'contents' => [
                                        [
                                            'parts' => [
                                                [
                                                    'text' =>
                                                        $geminiPrompt
                                                ]
                                            ]
                                        ]
                                    ],

                                    'generationConfig' => [
                                        'temperature' =>
                                            0.7
                                    ]
                                ]
                            );

                    Log::info(
                        'Gemini AI Builder HTTP status',
                        [
                            'status' =>
                                $response->status(),

                            'model' =>
                                $geminiModel,

                            'attempt' =>
                                $attempt
                        ]
                    );

                    if (
                        $response->successful()
                    ) {

                        break;
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Retry temporary Gemini errors
                    |--------------------------------------------------------------------------
                    */

                    if (
                        in_array(
                            $response->status(),
                            [
                                429,
                                500,
                                502,
                                503,
                                504
                            ],
                            true
                        )
                    ) {

                        if (
                            $attempt < $maxAttempts
                        ) {

                            $delaySeconds =
                                $attempt * 3;

                            Log::warning(
                                'Gemini temporary error, retrying',
                                [
                                    'status' =>
                                        $response->status(),

                                    'attempt' =>
                                        $attempt,

                                    'retry_after_seconds' =>
                                        $delaySeconds
                                ]
                            );

                            sleep(
                                $delaySeconds
                            );

                            continue;
                        }
                    }

                    break;
                }

                /*
                |--------------------------------------------------------------------------
                | Process Gemini response
                |--------------------------------------------------------------------------
                */

                if (
                    $response &&
                    $response->successful()
                ) {

                    $result =
                        $response->json();

                    $jsonText =
                        data_get(
                            $result,
                            'candidates.0.content.parts.0.text'
                        );

                    if ($jsonText) {

                        /*
                        |--------------------------------------------------------------------------
                        | Remove markdown code fences
                        |--------------------------------------------------------------------------
                        */

                        $jsonText =
                            preg_replace(
                                '/```json|```/i',
                                '',
                                $jsonText
                            );

                        $jsonText =
                            trim(
                                $jsonText
                            );

                        /*
                        |--------------------------------------------------------------------------
                        | Parse JSON
                        |--------------------------------------------------------------------------
                        */

                        $parsed =
                            json_decode(
                                $jsonText,
                                true
                            );

                        if (
                            json_last_error() === JSON_ERROR_NONE &&
                            is_array($parsed) &&
                            isset($parsed['colors']) &&
                            is_array($parsed['colors'])
                        ) {

                            $config =
                                $parsed;

                            if (isset($parsed['storeName']) && is_string($parsed['storeName']) && !empty(trim($parsed['storeName']))) {
                                $store->name = trim($parsed['storeName']);
                                $store->save();
                            }

                            Log::info(
                                'Gemini AI Builder configuration generated successfully',
                                [
                                    'store_id' =>
                                        $store->id
                                ]
                            );

                        } else {

                            Log::error(
                                'Failed to parse Gemini JSON',
                                [
                                    'store_id' =>
                                        $store->id,

                                    'error' =>
                                        json_last_error_msg(),

                                    'response' =>
                                        $jsonText
                                ]
                            );

                            /*
                            |--------------------------------------------------------------------------
                            | IMPORTANT:
                            | Keep local fallback configuration.
                            |--------------------------------------------------------------------------
                            */

                            $config =
                                $defaultConfig;
                        }

                    } else {

                        Log::error(
                            'Gemini response did not contain text',
                            [
                                'store_id' =>
                                    $store->id,

                                'response' =>
                                    $result
                            ]
                        );

                        $config =
                            $defaultConfig;
                    }

                } else {

                    Log::error(
                        'Gemini API error - using local fallback configuration',
                        [
                            'store_id' =>
                                $store->id,

                            'status' =>
                                $response
                                    ? $response->status()
                                    : null,

                            'body' =>
                                $response
                                    ? $response->body()
                                    : null
                        ]
                    );

                    /*
                    |--------------------------------------------------------------------------
                    | IMPORTANT:
                    | Gemini failure does NOT stop the AI Builder.
                    |--------------------------------------------------------------------------
                    */

                    $config =
                        $defaultConfig;
                }

            } catch (\Throwable $e) {

                Log::error(
                    'Gemini API exception - using local fallback configuration',
                    [
                        'store_id' =>
                            $store->id,

                        'message' =>
                            $e->getMessage()
                    ]
                );

                $config =
                    $defaultConfig;
            }

        } else {

            Log::warning(
                'GEMINI_API_KEY is missing - using local fallback configuration',
                [
                    'store_id' =>
                        $store->id
                ]
            );

            $config =
                $defaultConfig;
        }

        /*
        |--------------------------------------------------------------------------
        | Ensure style exists
        |--------------------------------------------------------------------------
        */

        if (
            !isset($config['style']) ||
            !is_array($config['style'])
        ) {

            $config['style'] = [];
        }

        /*
        |--------------------------------------------------------------------------
        | Validate selected Toastkart theme
        |--------------------------------------------------------------------------
        */

        $allowedThemes = [
            'theme-eflyer',
            'theme-hexashop',
            'theme-jewelry',
            'theme-beauty',
            'theme-home',
            'theme-electronics',
            'theme-footwear',
            'theme-grocery',
            'theme-gift',
            'theme-perfume'
        ];

        $selectedTheme =
            $config['style']['theme']
            ?? null;

        if (
            !in_array(
                $selectedTheme,
                $allowedThemes,
                true
            )
        ) {

            $categoryText =
                strtolower(
                    ($store->category ?? '')
                    . ' '
                    . ($store->description ?? '')
                    . ' '
                    . $prompt
                );

            if (
                str_contains(
                    $categoryText,
                    'jewel'
                )
            ) {

                $selectedTheme =
                    'theme-jewelry';

            } elseif (
                str_contains(
                    $categoryText,
                    'beauty'
                ) ||
                str_contains(
                    $categoryText,
                    'cosmetic'
                )
            ) {

                $selectedTheme =
                    'theme-beauty';

            } elseif (
                str_contains(
                    $categoryText,
                    'perfume'
                ) ||
                str_contains(
                    $categoryText,
                    'fragrance'
                )
            ) {

                $selectedTheme =
                    'theme-perfume';

            } elseif (
                str_contains(
                    $categoryText,
                    'fashion'
                ) ||
                str_contains(
                    $categoryText,
                    'clothing'
                ) ||
                str_contains(
                    $categoryText,
                    'apparel'
                ) ||
                str_contains(
                    $categoryText,
                    'boutique'
                )
            ) {

                $selectedTheme =
                    'theme-hexashop';

            } elseif (
                str_contains(
                    $categoryText,
                    'grocery'
                ) ||
                str_contains(
                    $categoryText,
                    'fruit'
                )
            ) {

                $selectedTheme =
                    'theme-grocery';

            } elseif (
                str_contains(
                    $categoryText,
                    'electronic'
                ) ||
                str_contains(
                    $categoryText,
                    'tech'
                )
            ) {

                $selectedTheme =
                    'theme-electronics';

            } elseif (
                str_contains(
                    $categoryText,
                    'furniture'
                ) ||
                str_contains(
                    $categoryText,
                    'home'
                )
            ) {

                $selectedTheme =
                    'theme-home';

            } else {

                $selectedTheme =
                    'theme-eflyer';
            }
        }

        $config['style']['theme'] =
            $selectedTheme;

        /*
        |--------------------------------------------------------------------------
        | Cloudflare FLUX Hero Image
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | This block is OUTSIDE the Gemini success condition.
        |
        | Therefore Cloudflare will run when:
        |
        | 1. Gemini succeeds
        | 2. Gemini returns 503
        | 3. Gemini returns 429
        | 4. Gemini returns another temporary error
        | 5. Gemini JSON cannot be parsed
        | 6. Gemini API key is missing
        |
        |--------------------------------------------------------------------------
        */

        $heroImages = [];

        try {

            Log::info(
                'Cloudflare AI image generation started',
                [
                    'store_id' =>
                        $store->id,

                    'category' =>
                        $store->category,

                    'theme' =>
                        $config['style']['theme']
                ]
            );

            /*
            |--------------------------------------------------------------------------
            | Build short Cloudflare FLUX image prompt
            |--------------------------------------------------------------------------
            */

            $theme =
                $config['style']['theme']
                ?? 'theme-eflyer';

            $primaryColor =
                $config['colors']['primary']
                ?? '';

            $backgroundColor =
                $config['colors']['background']
                ?? '';

            $styleDescription =
                $config['style']['cardStyle']
                ?? '';

            $businessCategory =
                trim(
                    (string) ($store->category ?? 'General Retail')
                );

            /*
             * Limit the customer's prompt so the Cloudflare
             * FLUX request can never exceed the API limit.
             */
            $imageRequirements =
                trim(
                    preg_replace(
                        '/\s+/',
                        ' ',
                        $prompt
                    )
                );

            $imageRequirements =
                mb_substr(
                    $imageRequirements,
                    0,
                    700
                );

            if ($store && $store->name) {
                // Completely strip the store name from the image prompt
                // so FLUX is not tempted to draw the text into the image pixels.
                $imageRequirements = str_ireplace(
                    $store->name,
                    '',
                    $imageRequirements
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Business-specific visual direction
            |--------------------------------------------------------------------------
            */

            $categoryLower =
                strtolower(
                    $businessCategory
                );

            $visualDirection =
                'professional ecommerce products relevant to the business category';

            if (
                str_contains($categoryLower, 'jewel') ||
                str_contains($categoryLower, 'jewellery')
            ) {

                $visualDirection =
                    'luxury gold jewelry, necklaces, rings, bracelets, earrings and diamonds';

            } elseif (
                str_contains($categoryLower, 'watch')
            ) {

                $visualDirection =
                    'premium wrist watches, luxury watch details and elegant accessories';

            } elseif (
                str_contains($categoryLower, 'fashion') ||
                str_contains($categoryLower, 'boutique') ||
                str_contains($categoryLower, 'apparel')
            ) {

                $visualDirection =
                    'modern fashion clothing, elegant outfits, premium accessories and fashion styling';

            } elseif (
                str_contains($categoryLower, 'perfume') ||
                str_contains($categoryLower, 'fragrance')
            ) {

                $visualDirection =
                    'luxury perfume bottles, fragrance products, flowers and sophisticated beauty styling';

            } elseif (
                str_contains($categoryLower, 'beauty') ||
                str_contains($categoryLower, 'cosmetic')
            ) {

                $visualDirection =
                    'premium skincare, cosmetics, beauty products and elegant cosmetic arrangements';

            } elseif (
                str_contains($categoryLower, 'grocery') ||
                str_contains($categoryLower, 'fruit')
            ) {

                $visualDirection =
                    'fresh fruits, vegetables, groceries and natural food products';

            } elseif (
                str_contains($categoryLower, 'electronic') ||
                str_contains($categoryLower, 'technology') ||
                str_contains($categoryLower, 'tech')
            ) {

                $visualDirection =
                    'modern electronics, smartphones, laptops, gadgets and technology products';

            } elseif (
                str_contains($categoryLower, 'furniture') ||
                str_contains($categoryLower, 'home')
            ) {

                $visualDirection =
                    'modern furniture, elegant home interiors, sofas, tables and decorative products';

            } elseif (
                str_contains($categoryLower, 'bakery') ||
                str_contains($categoryLower, 'cake')
            ) {

                $visualDirection =
                    'fresh bakery products, cakes, pastries, bread and elegant food presentation';

            } elseif (
                str_contains($categoryLower, 'restaurant') ||
                str_contains($categoryLower, 'food')
            ) {

                $visualDirection =
                    'appetizing restaurant food, plated dishes, fresh ingredients and premium dining atmosphere';

            } elseif (
                str_contains($categoryLower, 'handmade') ||
                str_contains($categoryLower, 'craft')
            ) {

                $visualDirection =
                    'beautiful handmade crafts, artisan products and natural materials';
            }

            /*
            |--------------------------------------------------------------------------
            | Final FLUX prompt
            |--------------------------------------------------------------------------
            |
            | Keep this prompt comfortably below Cloudflare's 2048-character limit.
            |
            */

           $imagePromptStr =
    "Create a premium ecommerce hero banner based primarily on the customer's request. "
    . "Customer request: "
    . $imageRequirements . ". "

    . "Business category: "
    . $businessCategory . ". "

    . "Toastkart theme: "
    . $theme . ". "

    . "Primary color: "
    . $primaryColor . ". "

    . "Background color: "
    . $backgroundColor . ". "

    . "Visual style: "
    . $styleDescription . ". "

    . "The customer's requested products, atmosphere, colors, "
    . "style and visual preferences must strongly influence the image. "

    . "Use professional commercial photography, realistic "
    . "high-quality products, premium lighting, modern composition, "
    . "elegant styling and a wide landscape composition. "

    . "IMPORTANT: The image must contain absolutely no text. "
    . "Do not generate words, letters, numbers, typography, "
    . "captions, slogans, labels, signs, logos, brand names, "
    . "store names, product names, watermarks, badges, buttons, "
    . "menus, navigation bars, website UI or readable characters. "

    . "Do not create a website screenshot. "
    . "Do not create a text-based banner. "
    . "Create only the visual hero artwork.";


            /*
            |--------------------------------------------------------------------------
            | Cloudflare credentials
            |--------------------------------------------------------------------------
            */

            $accountId =
                config(
                    'services.cloudflare.account_id'
                );

            $cloudflareToken =
                config(
                    'services.cloudflare.api_token'
                );

            $model =
                config(
                    'services.cloudflare.image_model',
                    '@cf/black-forest-labs/flux-1-schnell'
                );

            if (
                !$accountId ||
                !$cloudflareToken
            ) {

                Log::warning(
                    'Cloudflare credentials are missing.',
                    [
                        'store_id' =>
                            $store->id
                    ]
                );

            } else {

                /*
                |--------------------------------------------------------------------------
                | Cloudflare FLUX endpoint
                |--------------------------------------------------------------------------
                */

                $cloudflareUrl =
                    sprintf(
                        'https://api.cloudflare.com/client/v4/accounts/%s/ai/run/%s',
                        $accountId,
                        $model
                    );

                Log::info(
                    'Calling Cloudflare FLUX',
                    [
                        'store_id' =>
                            $store->id,

                        'model' =>
                            $model
                    ]
                );

                $imageResponse =
                    Http::timeout(120)
                        ->connectTimeout(20)
                        ->withToken(
                            $cloudflareToken
                        )
                        ->acceptJson()
                        ->post(
                            $cloudflareUrl,
                            [
                                'prompt' =>
                                    $imagePromptStr,

                                'steps' =>
                                    4
                            ]
                        );

                Log::info(
                    'Cloudflare image generation HTTP status',
                    [
                        'store_id' =>
                            $store->id,

                        'status' =>
                            $imageResponse->status()
                    ]
                );

                /*
                |--------------------------------------------------------------------------
                | Cloudflare success
                |--------------------------------------------------------------------------
                */

                if (
                    $imageResponse->successful()
                ) {

                    $imgResult =
                        $imageResponse->json();

                    $base64Data =
                        data_get(
                            $imgResult,
                            'result.image'
                        );

                    if ($base64Data) {

                        /*
                        |--------------------------------------------------------------------------
                        | Remove data URI prefix if present
                        |--------------------------------------------------------------------------
                        */

                        if (
                            str_contains(
                                $base64Data,
                                ','
                            )
                        ) {

                            $base64Data =
                                explode(
                                    ',',
                                    $base64Data,
                                    2
                                )[1];
                        }

                        /*
                        |--------------------------------------------------------------------------
                        | Decode Base64
                        |--------------------------------------------------------------------------
                        */

                        $imageData =
                            base64_decode(
                                $base64Data,
                                true
                            );

                        if (
                            $imageData !== false
                        ) {

                            /*
                            |--------------------------------------------------------------------------
                            | Save generated image
                            |--------------------------------------------------------------------------
                            */

                            $filename =
                                'ai-hero-'
                                . uniqid()
                                . '.jpg';

                            $storagePath =
                                'ai-heroes/'
                                . $filename;

                            $saved =
                                Storage::disk(
                                    'public'
                                )->put(
                                    $storagePath,
                                    $imageData
                                );

                            if ($saved) {

                                Log::info(
                                    'Cloudflare AI image saved successfully',
                                    [
                                        'store_id' =>
                                            $store->id,

                                        'path' =>
                                            $storagePath
                                    ]
                                );

                                $publicUrl =
                                    '/storage/'
                                    . $storagePath;

                                $heroImages[] =
                                    $publicUrl;

                                Log::info(
                                    'AI hero image URL generated',
                                    [
                                        'store_id' =>
                                            $store->id,

                                        'url' =>
                                            $publicUrl
                                    ]
                                );

                            } else {

                                Log::error(
                                    'Cloudflare image could not be saved',
                                    [
                                        'store_id' =>
                                            $store->id
                                    ]
                                );
                            }

                        } else {

                            Log::error(
                                'Cloudflare image Base64 decoding failed',
                                [
                                    'store_id' =>
                                        $store->id
                                ]
                            );
                        }

                    } else {

                        Log::error(
                            'Image data missing in Cloudflare response',
                            [
                                'store_id' =>
                                    $store->id,

                                'response' =>
                                    $imgResult
                            ]
                        );
                    }

                } else {

                    Log::error(
                        'Cloudflare image API returned error',
                        [
                            'store_id' =>
                                $store->id,

                            'status' =>
                                $imageResponse->status(),

                            'body' =>
                                $imageResponse->body()
                        ]
                    );
                }
            }

        } catch (\Throwable $e) {

            Log::error(
                'Cloudflare hero image generation failed',
                [
                    'store_id' =>
                        $store->id,

                    'message' =>
                        $e->getMessage()
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Hero fallback
        |--------------------------------------------------------------------------
        |
        | Only use the static fallback if Cloudflare failed.
        |--------------------------------------------------------------------------
        */

        if (
            count($heroImages) === 0
        ) {

            $fallbacks =
                $defaultConfig['style']['heroImages']
                ?? [
                    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80'
                ];

            $heroImages = [
                $fallbacks[0]
                ??
                'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80'
            ];

            Log::warning(
                'Using fallback hero image',
                [
                    'store_id' =>
                        $store->id
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Store generated hero image
        |--------------------------------------------------------------------------
        */

        $config['style']['heroImages'] =
            $heroImages;

        /*
        |--------------------------------------------------------------------------
        | Save AI configuration
        |--------------------------------------------------------------------------
        */

        $latestVersion =
            AiStoreConfiguration::where(
                'store_id',
                $store->id
            )->max('version') ?? 0;

        AiStoreConfiguration::create([
            'store_id' =>
                $store->id,

            'configuration' =>
                json_encode(
                    $config,
                    JSON_UNESCAPED_SLASHES
                ),

            'status' =>
                'draft',

            'version' =>
                $latestVersion + 1
        ]);

        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'success' =>
                true,

            'config' =>
                $config
        ]);
    }

    private function detectBusinessCategory(string $prompt): string
    {
        $text = strtolower(trim($prompt));

        // Footwear — check before fashion
        if (
            str_contains($text, 'footwear') ||
            str_contains($text, 'shoe') ||
            str_contains($text, 'shoes') ||
            str_contains($text, 'sneaker') ||
            str_contains($text, 'sneakers') ||
            str_contains($text, 'sandal') ||
            str_contains($text, 'sandals') ||
            str_contains($text, 'boot') ||
            str_contains($text, 'boots') ||
            str_contains($text, 'heels') ||
            str_contains($text, 'loafer') ||
            str_contains($text, 'loafers') ||
            str_contains($text, 'slipper') ||
            str_contains($text, 'slippers')
        ) {
            return 'Footwear';
        }

        if (
            str_contains($text, 'fashion') ||
            str_contains($text, 'clothing') ||
            str_contains($text, 'apparel') ||
            str_contains($text, 'boutique') ||
            str_contains($text, 'dress') ||
            str_contains($text, 'dresses')
        ) {
            return 'Fashion & Apparel';
        }

        if (
            str_contains($text, 'jewelry') ||
            str_contains($text, 'jewellery') ||
            str_contains($text, 'necklace') ||
            str_contains($text, 'ring') ||
            str_contains($text, 'bracelet')
        ) {
            return 'Jewellery';
        }

        if (
            str_contains($text, 'perfume') ||
            str_contains($text, 'perfumes') ||
            str_contains($text, 'fragrance')
        ) {
            return 'Perfume';
        }

        if (
            str_contains($text, 'beauty') ||
            str_contains($text, 'cosmetic') ||
            str_contains($text, 'cosmetics') ||
            str_contains($text, 'skincare') ||
            str_contains($text, 'makeup')
        ) {
            return 'Beauty & Cosmetics';
        }

        if (
            str_contains($text, 'electronic') ||
            str_contains($text, 'electronics') ||
            str_contains($text, 'technology') ||
            str_contains($text, 'tech') ||
            str_contains($text, 'gadget') ||
            str_contains($text, 'gadgets')
        ) {
            return 'Electronics';
        }

        if (
            str_contains($text, 'grocery') ||
            str_contains($text, 'groceries') ||
            str_contains($text, 'fruit') ||
            str_contains($text, 'fruits') ||
            str_contains($text, 'vegetable') ||
            str_contains($text, 'vegetables')
        ) {
            return 'Grocery';
        }

        if (
            str_contains($text, 'furniture') ||
            str_contains($text, 'home decor') ||
            str_contains($text, 'home decoration')
        ) {
            return 'Furniture & Home';
        }

        if (
            str_contains($text, 'restaurant') ||
            str_contains($text, 'food') ||
            str_contains($text, 'cafe') ||
            str_contains($text, 'café')
        ) {
            return 'Restaurant';
        }

        if (
            str_contains($text, 'bakery') ||
            str_contains($text, 'cake') ||
            str_contains($text, 'cakes') ||
            str_contains($text, 'pastry') ||
            str_contains($text, 'pastries')
        ) {
            return 'Bakery';
        }

        if (
            str_contains($text, 'handmade') ||
            str_contains($text, 'craft') ||
            str_contains($text, 'crafts')
        ) {
            return 'Handmade';
        }

        if (
            str_contains($text, 'watch') ||
            str_contains($text, 'watches')
        ) {
            return 'Watches';
        }

        return 'General Retail';
    }

    /*
    |--------------------------------------------------------------------------
    | Extract Store Profile
    |--------------------------------------------------------------------------
    */

    public function extractStoreProfile(Request $request)
    {
        $validated = $request->validate([
            'prompt' =>
                'required|string'
        ]);

        $prompt =
            trim(
                $validated['prompt']
            );

        $apiKey =
            env('GEMINI_API_KEY');

        $defaultProfile = [
            'name' =>
                'AI Generated Store',

            'category' =>
                'General Retail'
        ];

        if ($apiKey) {

            try {

                $geminiModel =
                    env(
                        'GEMINI_MODEL',
                        'gemini-3.8-flash'
                    );

                $profilePrompt = <<<PROMPT
Extract the intended store name and category from the following user prompt.

User Prompt:
{$prompt}

Return ONLY a valid raw JSON object.

Do not return:
- markdown
- explanations
- code fences
- ```json

Structure:

{
  "name": "Store Name",
  "category": "Category"
}

Use categories such as:

Watches
Fashion & Apparel
Jewellery
Beauty & Cosmetics
Footwear
Electronics
General Retail
Perfume
Grocery
Furniture
Restaurant
Bakery
Handmade
Fruits

Capitalize the store name appropriately.

If the user does not provide a store name,
generate a suitable professional store name.

PROMPT;

                $geminiUrl =
                    'https://generativelanguage.googleapis.com/v1beta/models/'
                    . $geminiModel
                    . ':generateContent';

                $response =
                    Http::timeout(120)
                        ->connectTimeout(20)
                        ->withHeaders([
                            'x-goog-api-key' =>
                                $apiKey,

                            'Content-Type' =>
                                'application/json'
                        ])
                        ->acceptJson()
                        ->post(
                            $geminiUrl,
                            [
                                'contents' => [
                                    [
                                        'parts' => [
                                            [
                                                'text' =>
                                                    $profilePrompt
                                            ]
                                        ]
                                    ]
                                ],

                                'generationConfig' => [
                                    'temperature' =>
                                        0.4
                                ]
                            ]
                        );

                if (
                    $response->successful()
                ) {

                    $result =
                        $response->json();

                    $jsonText =
                        data_get(
                            $result,
                            'candidates.0.content.parts.0.text'
                        );

                    if ($jsonText) {

                        $jsonText =
                            preg_replace(
                                '/```json|```/i',
                                '',
                                $jsonText
                            );

                        $jsonText =
                            trim(
                                $jsonText
                            );

                        $parsed =
                            json_decode(
                                $jsonText,
                                true
                            );

                        if (
                            json_last_error() === JSON_ERROR_NONE &&
                            isset($parsed['name']) &&
                            isset($parsed['category'])
                        ) {

                            $defaultProfile =
                                $parsed;
                        }
                    }

                } else {

                    Log::error(
                        'Gemini store profile API error',
                        [
                            'status' =>
                                $response->status(),

                            'body' =>
                                $response->body()
                        ]
                    );
                }

            } catch (\Throwable $e) {

                Log::error(
                    'Gemini store profile exception',
                    [
                        'message' =>
                            $e->getMessage()
                    ]
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Local fallback extraction
        |--------------------------------------------------------------------------
        |
        | If Gemini is unavailable, try to identify the category/name from
        | common phrases in the user's prompt.
        |--------------------------------------------------------------------------
        */

        if (
            $defaultProfile['name'] ===
            'AI Generated Store'
        ) {

            $lowerPrompt =
                strtolower(
                    $prompt
                );

            $category =
                'General Retail';

            if (
                str_contains(
                    $lowerPrompt,
                    'jewel'
                )
            ) {

                $category =
                    'Jewellery';

            } elseif (
                str_contains(
                    $lowerPrompt,
                    'watch'
                )
            ) {

                $category =
                    'Watches';

            } elseif (
                str_contains(
                    $lowerPrompt,
                    'perfume'
                ) ||
                str_contains(
                    $lowerPrompt,
                    'fragrance'
                )
            ) {

                $category =
                    'Perfume';

            } elseif (
                str_contains(
                    $lowerPrompt,
                    'fashion'
                ) ||
                str_contains(
                    $lowerPrompt,
                    'clothing'
                ) ||
                str_contains(
                    $lowerPrompt,
                    'boutique'
                )
            ) {

                $category =
                    'Fashion & Apparel';

            } elseif (
                str_contains(
                    $lowerPrompt,
                    'beauty'
                ) ||
                str_contains(
                    $lowerPrompt,
                    'cosmetic'
                )
            ) {

                $category =
                    'Beauty & Cosmetics';

            } elseif (
                str_contains(
                    $lowerPrompt,
                    'electronic'
                ) ||
                str_contains(
                    $lowerPrompt,
                    'technology'
                )
            ) {

                $category =
                    'Electronics';

            } elseif (
                str_contains(
                    $lowerPrompt,
                    'grocery'
                ) ||
                str_contains(
                    $lowerPrompt,
                    'fruit'
                )
            ) {

                $category =
                    'Grocery';

            } elseif (
                str_contains(
                    $lowerPrompt,
                    'furniture'
                )
            ) {

                $category =
                    'Furniture';

            } elseif (
                str_contains(
                    $lowerPrompt,
                    'restaurant'
                ) ||
                str_contains(
                    $lowerPrompt,
                    'cafe'
                )
            ) {

                $category =
                    'Restaurant';

            } elseif (
                str_contains(
                    $lowerPrompt,
                    'bakery'
                )
            ) {

                $category =
                    'Bakery';

            } elseif (
                str_contains(
                    $lowerPrompt,
                    'handmade'
                ) ||
                str_contains(
                    $lowerPrompt,
                    'craft'
                )
            ) {

                $category =
                    'Handmade';
            }

            /*
            |--------------------------------------------------------------------------
            | Try simple "named X" patterns
            |--------------------------------------------------------------------------
            */

            $namePatterns = [
                '/named\s+["\']?([^,"\']+?)["\']?(?:\s+with|\s+for|\s+selling|$)/i',
                '/called\s+["\']?([^,"\']+?)["\']?(?:\s+with|\s+for|\s+selling|$)/i',
                '/name[d]?\s*[:\-]\s*["\']?([^,"\']+)["\']?/i'
            ];

            $detectedName = null;

            foreach (
                $namePatterns as $pattern
            ) {

                if (
                    preg_match(
                        $pattern,
                        $prompt,
                        $matches
                    )
                ) {

                    $detectedName =
                        trim(
                            $matches[1]
                        );

                    break;
                }
            }

            if (
                $detectedName
            ) {

                $defaultProfile = [
                    'name' =>
                        $detectedName,

                    'category' =>
                        $category
                ];
            }
        }

        return response()->json([
            'success' =>
                true,

            'profile' =>
                $defaultProfile
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Default Configuration
    |--------------------------------------------------------------------------
    */

    private function getDefaultConfig(
        $store,
        $prompt
    ) {

        $prompt =
            strtolower(
                $prompt
            );

        $isLuxury =
            str_contains(
                $prompt,
                'luxury'
            ) ||
            str_contains(
                $prompt,
                'premium'
            ) ||
            str_contains(
                $prompt,
                'elegant'
            );

        $isMinimal =
            str_contains(
                $prompt,
                'minimal'
            ) ||
            str_contains(
                $prompt,
                'clean'
            ) ||
            str_contains(
                $prompt,
                'simple'
            );

        $colors = [
            'primary' =>
                '#FF416C',

            'secondary' =>
                '#FF4B2B',

            'accent' =>
                '#FFD700',

            'background' =>
                '#f8f9fa',

            'surface' =>
                '#ffffff',

            'text' =>
                '#1a1a1a',

            'mutedText' =>
                '#6c757d',

            'buttonBackground' =>
                '#FF416C',

            'buttonText' =>
                '#ffffff',

            'border' =>
                '#e9ecef',

            'hover' =>
                '#e63a61'
        ];

        $isDark =
            str_contains(
                $prompt,
                'dark'
            ) ||
            str_contains(
                $prompt,
                'black'
            );

        $isPastel =
            str_contains(
                $prompt,
                'pastel'
            ) ||
            str_contains(
                $prompt,
                'soft'
            );

        $isNeon =
            str_contains(
                $prompt,
                'neon'
            ) ||
            str_contains(
                $prompt,
                'cyber'
            ) ||
            str_contains(
                $prompt,
                'vibrant'
            );

        $isVintage =
            str_contains(
                $prompt,
                'vintage'
            ) ||
            str_contains(
                $prompt,
                'retro'
            ) ||
            str_contains(
                $prompt,
                'classic'
            );

        /*
        |--------------------------------------------------------------------------
        | Color detection
        |--------------------------------------------------------------------------
        */

        if (
            str_contains(
                $prompt,
                'blue'
            )
        ) {

            $colors['primary'] =
                '#0ea5e9';

            $colors['secondary'] =
                '#0284c7';

            $colors['accent'] =
                '#f59e0b';

        } elseif (
            str_contains(
                $prompt,
                'green'
            ) ||
            str_contains(
                $prompt,
                'eco'
            ) ||
            str_contains(
                $prompt,
                'nature'
            )
        ) {

            $colors['primary'] =
                '#10b981';

            $colors['secondary'] =
                '#059669';

            $colors['accent'] =
                '#fcd34d';

        } elseif (
            str_contains(
                $prompt,
                'purple'
            ) ||
            str_contains(
                $prompt,
                'violet'
            )
        ) {

            $colors['primary'] =
                '#8b5cf6';

            $colors['secondary'] =
                '#6d28d9';

            $colors['accent'] =
                '#f472b6';

        } elseif (
            str_contains(
                $prompt,
                'pink'
            ) ||
            str_contains(
                $prompt,
                'rose'
            )
        ) {

            $colors['primary'] =
                '#ec4899';

            $colors['secondary'] =
                '#be185d';

            $colors['accent'] =
                '#fde047';

        } elseif (
            str_contains(
                $prompt,
                'red'
            )
        ) {

            $colors['primary'] =
                '#ef4444';

            $colors['secondary'] =
                '#b91c1c';

            $colors['accent'] =
                '#fbbf24';

        } elseif (
            str_contains(
                $prompt,
                'yellow'
            ) ||
            str_contains(
                $prompt,
                'gold'
            )
        ) {

            $colors['primary'] =
                '#eab308';

            $colors['secondary'] =
                '#ca8a04';

            $colors['accent'] =
                '#14b8a6';

        } elseif (
            str_contains(
                $prompt,
                'orange'
            )
        ) {

            $colors['primary'] =
                '#f97316';

            $colors['secondary'] =
                '#c2410c';

            $colors['accent'] =
                '#3b82f6';
        }

        /*
        |--------------------------------------------------------------------------
        | Style overrides
        |--------------------------------------------------------------------------
        */

        if ($isLuxury) {

            $colors['primary'] =
                '#2b5876';

            $colors['secondary'] =
                '#4e4376';

            $colors['accent'] =
                '#d4af37';

            $colors['buttonBackground'] =
                '#d4af37';

            $colors['buttonText'] =
                '#ffffff';

        } elseif ($isMinimal) {

            $colors['primary'] =
                '#1c2226';

            $colors['secondary'] =
                '#f1f2f4';

            $colors['accent'] =
                '#FF5722';

            $colors['background'] =
                '#ffffff';

            $colors['surface'] =
                '#f8f9fa';

            $colors['buttonBackground'] =
                '#1c2226';

            $colors['buttonText'] =
                '#ffffff';

        } elseif ($isPastel) {

            $colors['primary'] =
                '#fecaca';

            $colors['secondary'] =
                '#bfdbfe';

            $colors['background'] =
                '#fdfbfb';

            $colors['surface'] =
                '#ffffff';

            $colors['buttonBackground'] =
                '#fecaca';

            $colors['buttonText'] =
                '#1a1a1a';

        } elseif ($isVintage) {

            $colors['primary'] =
                '#8B4513';

            $colors['secondary'] =
                '#D2B48C';

            $colors['background'] =
                '#FDF5E6';

            $colors['surface'] =
                '#ffffff';

            $colors['buttonBackground'] =
                '#8B4513';

            $colors['buttonText'] =
                '#ffffff';
        }

        /*
        |--------------------------------------------------------------------------
        | Dark theme
        |--------------------------------------------------------------------------
        */

        if ($isDark) {

            $colors['background'] =
                '#121212';

            $colors['surface'] =
                '#1e1e1e';

            $colors['text'] =
                '#f3f4f6';

            $colors['mutedText'] =
                '#9ca3af';

            $colors['border'] =
                '#374151';

            $colors['buttonText'] =
                '#ffffff';

            if ($isNeon) {

                $colors['primary'] =
                    '#00ff00';

                $colors['secondary'] =
                    '#ff00ff';

                $colors['buttonBackground'] =
                    '#00ff00';

                $colors['buttonText'] =
                    '#000000';
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Category text
        |--------------------------------------------------------------------------
        */

        $categoryText =
            strtolower(
                ($store->category ?? '')
                . ' '
                . ($store->description ?? '')
                . ' '
                . $prompt
            );

        /*
        |--------------------------------------------------------------------------
        | Default hero
        |--------------------------------------------------------------------------
        */

        $heroImages = [
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80'
        ];

        $heroTitle =
            'Welcome to ' .
            $store->name;

        $heroSubtitle =
            'Discover our amazing collection curated just for you.';

        /*
        |--------------------------------------------------------------------------
        | Watches
        |--------------------------------------------------------------------------
        */

        if (
            str_contains(
                strtolower(
                    $store->category ?? ''
                ),
                'watch'
            )
        ) {

            $heroImages = [
                'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80'
            ];

            $heroTitle =
                'Time Crafted for Your Style';

        /*
        |--------------------------------------------------------------------------
        | Fashion
        |--------------------------------------------------------------------------
        */

        } elseif (
            str_contains(
                strtolower(
                    $store->category ?? ''
                ),
                'fashion'
            ) ||
            str_contains(
                $categoryText,
                'clothing'
            ) ||
            str_contains(
                $categoryText,
                'apparel'
            )
        ) {

            $heroImages = [
                'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80'
            ];

            $heroTitle =
                'Define Your Style';

        /*
        |--------------------------------------------------------------------------
        | Boutique
        |--------------------------------------------------------------------------
        */

        } elseif (
            str_contains(
                strtolower(
                    $store->category ?? ''
                ),
                'boutique'
            )
        ) {

            $heroImages = [
                'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80'
            ];

            $heroTitle =
                'Elegance Made for You';

        /*
        |--------------------------------------------------------------------------
        | Perfume
        |--------------------------------------------------------------------------
        */

        } elseif (
            str_contains(
                strtolower(
                    $store->category ?? ''
                ),
                'perfume'
            ) ||
            str_contains(
                $categoryText,
                'fragrance'
            )
        ) {

            $heroImages = [
                'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80'
            ];

            $heroTitle =
                'A Fragrance That Defines You';

        /*
        |--------------------------------------------------------------------------
        | Beauty
        |--------------------------------------------------------------------------
        */

        } elseif (
            str_contains(
                strtolower(
                    $store->category ?? ''
                ),
                'beauty'
            ) ||
            str_contains(
                $categoryText,
                'cosmetics'
            )
        ) {

            $heroImages = [
                'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80'
            ];

            $heroTitle =
                'Discover True Beauty';

        /*
        |--------------------------------------------------------------------------
        | Jewelry
        |--------------------------------------------------------------------------
        */

        } elseif (
            str_contains(
                strtolower(
                    $store->category ?? ''
                ),
                'jewelry'
            ) ||
            str_contains(
                $categoryText,
                'jewellery'
            ) ||
            str_contains(
                $categoryText,
                'ring'
            )
        ) {

            $heroImages = [
                'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80'
            ];

            $heroTitle =
                'Elegance in Every Detail';

        /*
        |--------------------------------------------------------------------------
        | Electronics
        |--------------------------------------------------------------------------
        */

        } elseif (
            str_contains(
                strtolower(
                    $store->category ?? ''
                ),
                'electronic'
            ) ||
            str_contains(
                $categoryText,
                'tech'
            )
        ) {

            $heroImages = [
                'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80'
            ];

            $heroTitle =
                'The Future is Here';

        /*
        |--------------------------------------------------------------------------
        | Grocery / Fruits
        |--------------------------------------------------------------------------
        */

        } elseif (
            str_contains(
                strtolower(
                    $store->category ?? ''
                ),
                'grocery'
            ) ||
            str_contains(
                $categoryText,
                'food'
            ) ||
            str_contains(
                $categoryText,
                'fruit'
            )
        ) {

            $heroImages = [
                'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80'
            ];

            $heroTitle =
                'Fresh Quality Groceries';

        /*
        |--------------------------------------------------------------------------
        | Furniture / Home
        |--------------------------------------------------------------------------
        */

        } elseif (
            str_contains(
                strtolower(
                    $store->category ?? ''
                ),
                'furniture'
            ) ||
            str_contains(
                strtolower(
                    $store->category ?? ''
                ),
                'home'
            )
        ) {

            $heroImages = [
                'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80'
            ];

            $heroTitle =
                'Elevate Your Living Space';

        /*
        |--------------------------------------------------------------------------
        | Restaurant
        |--------------------------------------------------------------------------
        */

        } elseif (
            str_contains(
                strtolower(
                    $store->category ?? ''
                ),
                'restaurant'
            ) ||
            str_contains(
                $categoryText,
                'cafe'
            )
        ) {

            $heroImages = [
                'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80'
            ];

            $heroTitle =
                'Taste the Perfection';

        /*
        |--------------------------------------------------------------------------
        | Bakery
        |--------------------------------------------------------------------------
        */

        } elseif (
            str_contains(
                $categoryText,
                'bakery'
            ) ||
            str_contains(
                $categoryText,
                'cake'
            )
        ) {

            $heroImages = [
                'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80'
            ];

            $heroTitle =
                'Freshly Baked With Love';

        /*
        |--------------------------------------------------------------------------
        | Handmade
        |--------------------------------------------------------------------------
        */

        } elseif (
            str_contains(
                $categoryText,
                'handmade'
            ) ||
            str_contains(
                $categoryText,
                'craft'
            )
        ) {

            $heroImages = [
                'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&q=80'
            ];

            $heroTitle =
                'Made With Creativity';
        }

        /*
        |--------------------------------------------------------------------------
        | Return default configuration
        |--------------------------------------------------------------------------
        */

        return [
            'colors' =>
                $colors,

            'typography' => [

                'headingFont' =>
                    $isLuxury
                        ? 'Playfair Display, serif'
                        : 'Inter, sans-serif',

                'bodyFont' =>
                    'Inter, sans-serif'
            ],

            'style' => [

                'theme' =>
                    'theme-eflyer',

                'borderRadius' =>
                    $isMinimal
                        ? '0px'
                        : '12px',

                'cardStyle' =>
                    $isLuxury
                        ? 'border: 1px solid #d4af37;'
                        : 'box-shadow: 0 4px 12px rgba(0,0,0,0.05);',

                'heroImages' =>
                    $heroImages
            ],

            'sections' => [

                [
                    'type' =>
                        'hero',

                    'title' =>
                        $heroTitle,

                    'subtitle' =>
                        $heroSubtitle,

                    'cta' =>
                        'Shop Now'
                ],

                [
                    'type' =>
                        'featured_products',

                    'title' =>
                        'Featured Products'
                ]
            ]
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Delete AI Configuration
    |--------------------------------------------------------------------------
    */

    public function destroy($id)
    {
        $config =
            AiStoreConfiguration::findOrFail(
                $id
            );

        $config->delete();

        return response()->json([
            'success' =>
                true,

            'message' =>
                'Configuration deleted successfully'
        ]);
    }
}
