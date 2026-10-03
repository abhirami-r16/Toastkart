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

        $store = Store::findOrFail($validated['store_id']);
        $prompt = trim($validated['prompt']);

        $apiKey = env('GEMINI_API_KEY');

        /*
        |--------------------------------------------------------------------------
        | Default configuration
        |--------------------------------------------------------------------------
        */

        $defaultConfig = $this->getDefaultConfig(
            $store,
            $prompt
        );

        /*
        |--------------------------------------------------------------------------
        | Existing AI configuration
        |--------------------------------------------------------------------------
        */

        $existingConfigRecord = AiStoreConfiguration::where(
            'store_id',
            $store->id
        )
            ->orderBy('version', 'desc')
            ->first();

        $existingConfigArray = null;

        if ($existingConfigRecord) {

            /*
             * Some versions of the model/database use "configuration"
             * while older code may refer to "config_json".
             */
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
        | Do not send previously generated hero images back to Gemini
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
        | Gemini Website Configuration
        |--------------------------------------------------------------------------
        */

        $config = $defaultConfig;

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

5. NEVER generate fake products.

6. NEVER generate fake categories.

7. NEVER create product names, prices, product images, categories, or inventory.

8. Products and categories come from the actual Toastkart database.

9. AI controls only:
- visual design
- colors
- typography
- layout configuration
- section titles
- hero title
- hero subtitle
- CTA text
- visual style
- hero/banner image prompt requirements

10. Do not create a new Toastkart theme.

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

                for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
                    Log::info(
                        'Gemini AI Builder request attempt',
                        [
                            'store_id' => $store->id,
                            'model' => $geminiModel,
                            'attempt' => $attempt
                        ]
                    );

                    $response = Http::timeout(120)
                        ->connectTimeout(20)
                        ->withHeaders([
                            'x-goog-api-key' => $apiKey,
                            'Content-Type' => 'application/json'
                        ])
                        ->acceptJson()
                        ->post(
                            $geminiUrl,
                            [
                                'contents' => [
                                    [
                                        'parts' => [
                                            [
                                                'text' => $geminiPrompt
                                            ]
                                        ]
                                    ]
                                ],
                                'generationConfig' => [
                                    'temperature' => 0.7
                                ]
                            ]
                        );

                    Log::info(
                        'Gemini AI Builder HTTP status',
                        [
                            'status' => $response->status(),
                            'model' => $geminiModel,
                            'attempt' => $attempt
                        ]
                    );

                    if ($response->successful()) {
                        break;
                    }

                    if (in_array($response->status(), [429, 500, 502, 503, 504], true)) {
                        if ($attempt < $maxAttempts) {
                            $delaySeconds = $attempt * 3;

                            Log::warning(
                                'Gemini temporary error, retrying',
                                [
                                    'status' => $response->status(),
                                    'attempt' => $attempt,
                                    'retry_after_seconds' => $delaySeconds
                                ]
                            );

                            sleep($delaySeconds);
                            continue;
                        }
                    }

                    break;
                }

                /*
                |--------------------------------------------------------------------------
                | Gemini success
                |--------------------------------------------------------------------------
                */

                if ($response->successful()) {

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
                            trim($jsonText);

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
                            isset($parsed['colors'])
                        ) {

                            $config =
                                $parsed;

                            if (
                                !isset($config['style']) ||
                                !is_array(
                                    $config['style']
                                )
                            ) {
                                $config['style'] = [];
                            }

                            /*
                            |--------------------------------------------------------------------------
                            | Validate theme
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

                                /*
                                * Pick a safe theme based on
                                * the store category.
                                */
                                $categoryText =
                                    strtolower(
                                        ($store->category ?? '')
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
                                    )
                                ) {
                                    $selectedTheme =
                                        'theme-hexashop';

                                } elseif (
                                    str_contains(
                                        $categoryText,
                                        'grocery'
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
                            */

                            $heroImages = [];

                            try {

                                Log::info(
                                    'Cloudflare AI image generation started',
                                    [
                                        'store_id' =>
                                            $store->id
                                    ]
                                );

                                /*
                                |--------------------------------------------------------------------------
                                | Build image prompt
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

                                $imagePromptStr =
                                    "Create a professional ecommerce website hero banner "
                                    . "for a {$store->category} business. "
                                    . "Business name: {$store->name}. "
                                    . "Customer requirements: {$prompt}. "
                                    . "Toastkart theme: {$theme}. "
                                    . "Primary design color: {$primaryColor}. "
                                    . "Background color: {$backgroundColor}. "
                                    . "Visual style: {$styleDescription}. "
                                    . "Create a premium commercial advertising photograph. "
                                    . "Show realistic products and visual elements relevant "
                                    . "to the business category. "
                                    . "Use a wide landscape composition suitable for a "
                                    . "website hero section. "
                                    . "Keep the composition clean and modern. "
                                    . "Leave suitable negative space for website text overlay. "
                                    . "Use professional lighting and high-quality product "
                                    . "photography. "
                                    . "Do not create website UI. "
                                    . "Do not create navigation bars. "
                                    . "Do not create buttons. "
                                    . "Do not create HTML. "
                                    . "Do not include text. "
                                    . "Do not include logos. "
                                    . "Do not include brand names. "
                                    . "Do not include watermarks.";

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
                                        'Cloudflare credentials are missing.'
                                    );

                                } else {

                                    $cloudflareUrl =
                                        sprintf(
                                            'https://api.cloudflare.com/client/v4/accounts/%s/ai/run/%s',
                                            $accountId,
                                            $model
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
                                            'status' =>
                                                $imageResponse->status()
                                        ]
                                    );

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
                                            | Remove possible data URI prefix
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
                                            | Decode image
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
                                                | Save image
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
                                                            'url' =>
                                                                $publicUrl
                                                        ]
                                                    );

                                                } else {

                                                    Log::error(
                                                        'Cloudflare image could not be saved'
                                                    );
                                                }

                                            } else {

                                                Log::error(
                                                    'Cloudflare image Base64 decoding failed'
                                                );
                                            }

                                        } else {

                                            Log::error(
                                                'Image data missing in Cloudflare response',
                                                [
                                                    'response' =>
                                                        $imgResult
                                                ]
                                            );
                                        }

                                    } else {

                                        Log::error(
                                            'Cloudflare image API returned error',
                                            [
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
                                        'message' =>
                                            $e->getMessage()
                                    ]
                                );
                            }

                            /*
                            |--------------------------------------------------------------------------
                            | Hero fallback
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
                                    'Using fallback hero image'
                                );
                            }

                            $config['style']['heroImages'] =
                                $heroImages;

                        } else {

                            $config =
                                $defaultConfig;

                            Log::error(
                                'Failed to parse Gemini JSON',
                                [
                                    'error' =>
                                        json_last_error_msg(),

                                    'response' =>
                                        $jsonText
                                ]
                            );
                        }

                    } else {

                        $config =
                            $defaultConfig;

                        Log::error(
                            'Gemini response did not contain text',
                            [
                                'response' =>
                                    $result
                            ]
                        );
                    }

                } else {

                    $config =
                        $defaultConfig;

                    Log::error(
                        'Gemini API error',
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
                    'Gemini API exception',
                    [
                        'message' =>
                            $e->getMessage()
                    ]
                );

                $config =
                    $defaultConfig;
            }

        } else {

            Log::warning(
                'GEMINI_API_KEY is missing'
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
        | Ensure hero image exists
        |--------------------------------------------------------------------------
        */

        if (
            !isset(
                $config['style']['heroImages']
            )
        ) {

            $config['style']['heroImages'] =
                $defaultConfig['style']['heroImages'];
        }

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
            'success' => true,

            'config' =>
                $config
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Extract Store Profile
    |--------------------------------------------------------------------------
    */

    public function extractStoreProfile(Request $request)
    {
        $validated = $request->validate([
            'prompt' => 'required|string'
        ]);

        $prompt =
            trim($validated['prompt']);

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
Handmade

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
                            trim($jsonText);

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
            strtolower($prompt);

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
            'Welcome to ' . $store->name;

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
        | Grocery
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
            )
        ) {

            $heroImages = [
                'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80'
            ];

            $heroTitle =
                'Taste the Perfection';
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

