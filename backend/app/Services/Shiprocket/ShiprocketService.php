<?php

namespace App\Services\Shiprocket;

use App\Models\Order;
use App\Models\ShiprocketShipment;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShiprocketService
{
    protected string $baseUrl;
    protected ?string $email;
    protected ?string $password;
    protected ?string $staticToken;
    protected string $pickupLocation;
    protected string $pickupPincode;
    protected ?string $channelId;
    protected bool $sandboxMode;
    protected int $timeout;

    public function __construct()
    {
        $config = config('services.shiprocket', []);
        $this->baseUrl = rtrim($config['base_url'] ?? 'https://apiv2.shiprocket.in/v1/external', '/');
        $this->email = $config['email'] ?? null;
        $this->password = $config['password'] ?? null;
        $this->staticToken = $config['api_token'] ?? null;
        $this->pickupLocation = $config['pickup_location'] ?? 'Primary';
        $this->pickupPincode = $config['pickup_pincode'] ?? '683549';
        $this->channelId = $config['channel_id'] ?? null;
        $this->sandboxMode = (bool)($config['sandbox_mode'] ?? false);
        $this->timeout = (int)($config['timeout'] ?? 15);
    }

    /**
     * Check if API credentials are configured
     */
    public function isConfigured(): bool
    {
        if (!empty($this->staticToken)) {
            return true;
        }
        return !empty($this->email) && !empty($this->password);
    }

    /**
     * Check if currently running in simulation / sandbox mode
     */
    public function isSandbox(): bool
    {
        return $this->sandboxMode || !$this->isConfigured();
    }

    /**
     * Get or authenticate Bearer token
     */
    public function getToken(bool $forceRefresh = false): string
    {
        if ($this->isSandbox() && !$this->isConfigured()) {
            return 'sandbox_sim_token_amiora_86';
        }

        if (!empty($this->staticToken)) {
            return $this->staticToken;
        }

        $cacheKey = 'shiprocket_token_store_86';
        if ($forceRefresh) {
            Cache::forget($cacheKey);
        }

        return Cache::remember($cacheKey, 86400 * 9, function () {
            $response = Http::timeout($this->timeout)
                ->post("{$this->baseUrl}/auth/login", [
                    'email' => $this->email,
                    'password' => $this->password,
                ]);

            if (!$response->successful()) {
                Log::error('Shiprocket authentication failed', [
                    'status' => $response->status(),
                    'body' => $response->json(),
                ]);
                throw new \RuntimeException('Failed to authenticate with Shiprocket API: ' . ($response->json('message') ?? 'Invalid credentials'));
            }

            $token = $response->json('token');
            if (empty($token)) {
                throw new \RuntimeException('Shiprocket authentication succeeded but no token returned');
            }

            return $token;
        });
    }

    /**
     * Perform authorized HTTP request to Shiprocket API
     */
    protected function request(string $method, string $endpoint, array $data = [], bool $isRetry = false)
    {
        $token = $this->getToken();
        $url = "{$this->baseUrl}/" . ltrim($endpoint, '/');

        $client = Http::withToken($token)
            ->timeout($this->timeout)
            ->acceptJson();

        $response = match (strtoupper($method)) {
            'GET' => $client->get($url, $data),
            'POST' => $client->post($url, $data),
            'PUT' => $client->put($url, $data),
            'DELETE' => $client->delete($url, $data),
            default => throw new \InvalidArgumentException("Unsupported HTTP method {$method}"),
        };

        // If 401 Unauthorized, refresh token once and retry
        if ($response->status() === 401 && !$isRetry) {
            Cache::forget('shiprocket_token_store_86');
            return $this->request($method, $endpoint, $data, true);
        }

        return $response;
    }

    /**
     * Synchronize an eligible AMIORA Order (Store ID: 86) to Shiprocket
     */
    public function syncOrder(Order $order, array $dimensions = []): ShiprocketShipment
    {
        // Enforce strict store isolation
        if ((int)$order->store_id !== 86) {
            throw new \InvalidArgumentException("Order #{$order->id} does not belong to AMIORA (Store ID: 86). Shiprocket operations are strictly restricted to AMIORA.");
        }

        $order->loadMissing(['items.product', 'customer', 'shiprocketShipment']);

        // Check if already synced
        $existingShipment = $order->shiprocketShipment;
        if ($existingShipment && !empty($existingShipment->shiprocket_order_id)) {
            return $existingShipment;
        }

        // Parse customer details
        $customerName = trim($order->customer_name ?: ($order->customer?->name ?: 'Valued Customer'));
        $nameParts = explode(' ', $customerName, 2);
        $firstName = $nameParts[0];
        $lastName = $nameParts[1] ?? 'Customer';

        // Parse customer phone (ensure 10 digits)
        $rawPhone = $order->customer_phone ?: ($order->customer?->phone ?: '8289988076');
        $phoneDigits = preg_replace('/[^0-9]/', '', (string)$rawPhone);
        if (strlen($phoneDigits) > 10 && str_starts_with($phoneDigits, '91')) {
            $phoneDigits = substr($phoneDigits, 2);
        }
        $phone = substr($phoneDigits, -10) ?: '8289988076';

        $email = $order->customer_email ?: ($order->customer?->email ?: 'orders@amiora.in');

        // Parse address
        $rawAddress = $order->shipping_address ?: ($order->customer?->address ?: '14/97 Cherukunnam, Asamannoor P.O., Perumbavoor, Kerala 683549');
        $parsedAddress = $this->parseIndianAddress($rawAddress);

        // Package dimensions & weight
        $weight = (float)($dimensions['package_weight'] ?? 0.50);
        $length = (float)($dimensions['package_length'] ?? 10.00);
        $breadth = (float)($dimensions['package_breadth'] ?? 10.00);
        $height = (float)($dimensions['package_height'] ?? 10.00);

        // Prepare order items
        $orderItems = [];
        foreach ($order->items as $item) {
            $qty = max(1, (int)$item->quantity);
            $price = (float)$item->price;
            $sku = $item->product?->sku ?: ('AMIORA-' . ($item->product_id ?: 'GEN'));
            $orderItems[] = [
                'name' => $item->product_name ?: ($item->product?->name ?: 'AMIORA Coconut Product'),
                'sku' => $sku,
                'units' => $qty,
                'selling_price' => $price,
                'discount' => 0,
                'tax' => 0,
            ];
        }

        if (empty($orderItems)) {
            $orderItems[] = [
                'name' => 'AMIORA Coconut Product Package',
                'sku' => 'AMIORA-PKG',
                'units' => 1,
                'selling_price' => (float)$order->total_amount,
                'discount' => 0,
                'tax' => 0,
            ];
        }

        $paymentMethod = (strtoupper($order->payment_status) === 'COD' || strtolower($order->payment_method ?? '') === 'cod') ? 'COD' : 'Prepaid';

        $payload = [
            'order_id' => $order->order_number ?: ('#ORD-' . $order->id),
            'order_date' => date('Y-m-d H:i', strtotime($order->created_at ?: now())),
            'pickup_location' => $this->pickupLocation,
            'comment' => 'AMIORA LA EMVITHA Kerala Coconut Treasures',
            'billing_customer_name' => $firstName,
            'billing_last_name' => $lastName,
            'billing_address' => $parsedAddress['address'],
            'billing_city' => $parsedAddress['city'],
            'billing_pincode' => $parsedAddress['pincode'],
            'billing_state' => $parsedAddress['state'],
            'billing_country' => 'India',
            'billing_email' => $email,
            'billing_phone' => $phone,
            'shipping_is_billing' => true,
            'order_items' => $orderItems,
            'payment_method' => $paymentMethod,
            'sub_total' => (float)$order->total_amount,
            'length' => $length,
            'breadth' => $breadth,
            'height' => $height,
            'weight' => $weight,
        ];

        if (!empty($this->channelId)) {
            $payload['channel_id'] = $this->channelId;
        }

        // In Sandbox / Simulation mode
        if ($this->isSandbox()) {
            $simOrderId = 'SR86-' . time() . '-' . rand(100, 999);
            $simShipmentId = 'SHP86-' . (time() + 10) . '-' . rand(10, 99);

            $shipment = ShiprocketShipment::updateOrCreate(
                ['order_id' => $order->id, 'store_id' => 86],
                [
                    'shiprocket_order_id' => $simOrderId,
                    'shipment_id' => $simShipmentId,
                    'pickup_location' => $this->pickupLocation,
                    'sync_status' => 'synced',
                    'shipment_status' => 'Order Created in Shiprocket',
                    'package_weight' => $weight,
                    'package_length' => $length,
                    'package_breadth' => $breadth,
                    'package_height' => $height,
                    'response_payload' => [
                        'mode' => 'sandbox_simulation',
                        'order_id' => $simOrderId,
                        'shipment_id' => $simShipmentId,
                        'message' => 'Simulated Shiprocket order created successfully for testing.',
                    ],
                    'error_message' => null,
                    'last_synced_at' => now(),
                ]
            );

            return $shipment;
        }

        // Live API Execution
        try {
            $res = $this->request('POST', '/orders/create/adhoc', $payload);
            $body = $res->json();

            if (!$res->successful() || empty($body['order_id'])) {
                $err = $body['message'] ?? ($body['errors'] ? json_encode($body['errors']) : 'Failed to create order on Shiprocket');
                Log::error('Shiprocket order creation failed', ['payload' => $payload, 'response' => $body]);

                ShiprocketShipment::updateOrCreate(
                    ['order_id' => $order->id, 'store_id' => 86],
                    [
                        'sync_status' => 'failed',
                        'error_message' => $err,
                        'response_payload' => $body,
                        'last_synced_at' => now(),
                    ]
                );

                throw new \RuntimeException($err);
            }

            $shipment = ShiprocketShipment::updateOrCreate(
                ['order_id' => $order->id, 'store_id' => 86],
                [
                    'shiprocket_order_id' => (string)$body['order_id'],
                    'shipment_id' => (string)($body['shipment_id'] ?? ''),
                    'pickup_location' => $this->pickupLocation,
                    'sync_status' => 'synced',
                    'shipment_status' => $body['status'] ?? 'Order Created',
                    'package_weight' => $weight,
                    'package_length' => $length,
                    'package_breadth' => $breadth,
                    'package_height' => $height,
                    'response_payload' => $body,
                    'error_message' => null,
                    'last_synced_at' => now(),
                ]
            );

            return $shipment;
        } catch (\Exception $e) {
            Log::error('Shiprocket sync exception: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Check Courier Serviceability & Rates for a destination pincode
     */
    public function checkServiceability(string $deliveryPincode, float $weight = 0.5, bool $isCod = false): array
    {
        $pickupPincode = $this->pickupPincode;
        $deliveryPincode = trim($deliveryPincode);
        $codFlag = $isCod ? 1 : 0;

        if ($this->isSandbox()) {
            return $this->getSimulatedCouriers($deliveryPincode, $weight, $isCod);
        }

        try {
            $params = [
                'pickup_postcode' => $pickupPincode,
                'delivery_postcode' => $deliveryPincode,
                'weight' => $weight,
                'cod' => $codFlag,
            ];

            $res = $this->request('GET', '/courier/serviceability/', $params);
            $body = $res->json();

            if ($res->successful() && !empty($body['data']['available_courier_companies'])) {
                $couriers = [];
                foreach ($body['data']['available_courier_companies'] as $c) {
                    $couriers[] = [
                        'courier_company_id' => $c['courier_company_id'],
                        'courier_name' => $c['courier_name'],
                        'rate' => (float)($c['rate'] ?? 0),
                        'etd' => $c['etd'] ?? '3-5 Days',
                        'estimated_delivery_days' => $c['estimated_delivery_days'] ?? 4,
                        'rating' => (float)($c['rating'] ?? 4.5),
                        'is_cod' => (bool)($c['cod'] ?? false),
                    ];
                }
                return $couriers;
            }

            return $this->getSimulatedCouriers($deliveryPincode, $weight, $isCod);
        } catch (\Exception $e) {
            Log::warning('Shiprocket serviceability live check failed, falling back to simulated data: ' . $e->getMessage());
            return $this->getSimulatedCouriers($deliveryPincode, $weight, $isCod);
        }
    }

    /**
     * Assign courier partner and generate AWB
     */
    public function generateAwb(ShiprocketShipment $shipment, ?int $courierCompanyId = null): ShiprocketShipment
    {
        if ((int)$shipment->store_id !== 86) {
            throw new \InvalidArgumentException("Shipment does not belong to AMIORA Store ID 86.");
        }

        if (empty($shipment->shipment_id)) {
            throw new \RuntimeException("Shipment ID is missing. Please sync order with Shiprocket first.");
        }

        if ($this->isSandbox()) {
            $simAwb = 'SR86' . rand(10000000, 99999999) . 'IN';
            $couriers = ['Blue Dart Express', 'Delhivery Surface', 'DTDC Premium Air', 'Xpressbees Direct'];
            $courierName = $couriers[array_rand($couriers)];

            $shipment->update([
                'awb_code' => $simAwb,
                'courier_company_id' => $courierCompanyId ?: 10,
                'courier_name' => $courierName,
                'sync_status' => 'awb_generated',
                'shipment_status' => 'AWB Assigned',
                'tracking_url' => "https://shiprocket.co/tracking/{$simAwb}",
                'etd' => date('d M Y', strtotime('+4 days')),
                'label_url' => "https://shiprocket.co/sample-label-preview-{$simAwb}.pdf",
                'manifest_url' => "https://shiprocket.co/sample-manifest-preview-{$simAwb}.pdf",
            ]);

            // Synchronize Toastkart order status to Shipped
            if ($shipment->order) {
                $shipment->order->update(['status' => 'Shipped']);
            }

            return $shipment;
        }

        $payload = [
            'shipment_id' => $shipment->shipment_id,
        ];
        if (!empty($courierCompanyId)) {
            $payload['courier_id'] = $courierCompanyId;
        }

        $res = $this->request('POST', '/courier/assign/awb', $payload);
        $body = $res->json();

        if (!$res->successful() || empty($body['response']['data']['awb_code'])) {
            $err = $body['message'] ?? 'Failed to generate AWB on Shiprocket';
            $shipment->update(['error_message' => $err]);
            throw new \RuntimeException($err);
        }

        $data = $body['response']['data'];
        $awbCode = $data['awb_code'];
        $courierName = $data['courier_name'] ?? 'Shiprocket Courier Partner';
        $trackingUrl = "https://shiprocket.co/tracking/{$awbCode}";

        $shipment->update([
            'awb_code' => $awbCode,
            'courier_company_id' => $data['courier_company_id'] ?? $courierCompanyId,
            'courier_name' => $courierName,
            'sync_status' => 'awb_generated',
            'shipment_status' => 'AWB Assigned',
            'tracking_url' => $trackingUrl,
            'error_message' => null,
        ]);

        if ($shipment->order) {
            $shipment->order->update(['status' => 'Shipped']);
        }

        return $shipment;
    }

    /**
     * Generate / Retrieve Shipping Label URL (PDF)
     */
    public function generateLabel(ShiprocketShipment $shipment): string
    {
        if ((int)$shipment->store_id !== 86) {
            throw new \InvalidArgumentException("Shipment does not belong to AMIORA Store ID 86.");
        }

        if ($this->isSandbox()) {
            $labelUrl = $shipment->label_url ?: "https://shiprocket.co/tracking/label-sample-{$shipment->awb_code}.pdf";
            $shipment->update(['label_url' => $labelUrl]);
            return $labelUrl;
        }

        $res = $this->request('POST', '/courier/generate/label', [
            'shipment_id' => [$shipment->shipment_id],
        ]);
        $body = $res->json();

        $labelUrl = $body['label_url'] ?? null;
        if (!empty($labelUrl)) {
            $shipment->update(['label_url' => $labelUrl]);
            return $labelUrl;
        }

        throw new \RuntimeException($body['message'] ?? 'Failed to generate shipping label from Shiprocket');
    }

    /**
     * Generate / Retrieve Manifest URL (PDF)
     */
    public function generateManifest(ShiprocketShipment $shipment): string
    {
        if ((int)$shipment->store_id !== 86) {
            throw new \InvalidArgumentException("Shipment does not belong to AMIORA Store ID 86.");
        }

        if ($this->isSandbox()) {
            $manifestUrl = $shipment->manifest_url ?: "https://shiprocket.co/tracking/manifest-sample-{$shipment->shipment_id}.pdf";
            $shipment->update(['manifest_url' => $manifestUrl]);
            return $manifestUrl;
        }

        $res = $this->request('POST', '/manifests/generate', [
            'shipment_id' => [$shipment->shipment_id],
        ]);
        $body = $res->json();

        $manifestUrl = $body['manifest_url'] ?? null;
        if (!empty($manifestUrl)) {
            $shipment->update(['manifest_url' => $manifestUrl]);
            return $manifestUrl;
        }

        throw new \RuntimeException($body['message'] ?? 'Failed to generate manifest from Shiprocket');
    }

    /**
     * Track shipment in real time using AWB code
     */
    public function trackShipment(ShiprocketShipment $shipment): array
    {
        if ((int)$shipment->store_id !== 86) {
            throw new \InvalidArgumentException("Shipment does not belong to AMIORA Store ID 86.");
        }

        $awb = $shipment->awb_code;
        if (empty($awb)) {
            return [
                'current_status' => 'Unassigned',
                'courier_name' => null,
                'awb' => null,
                'tracking_url' => null,
                'activities' => [],
            ];
        }

        if ($this->isSandbox()) {
            $history = [
                ['date' => date('d M Y, h:i A', strtotime('-3 hours')), 'activity' => 'Shipment package verified at AMIORA fulfillment center, Kerala', 'location' => 'Perumbavoor, Kerala'],
                ['date' => date('d M Y, h:i A', strtotime('-2 hours')), 'activity' => 'AWB registered with courier partner', 'location' => 'Kochi Hub, Kerala'],
                ['date' => date('d M Y, h:i A', strtotime('-30 minutes')), 'activity' => 'Package manifest generated and queued for pickup', 'location' => 'Kochi Hub, Kerala'],
            ];

            $shipment->update([
                'tracking_history' => $history,
                'shipment_status' => 'In Transit',
            ]);

            return [
                'current_status' => 'In Transit',
                'courier_name' => $shipment->courier_name ?: 'Delhivery Surface',
                'awb' => $awb,
                'tracking_url' => $shipment->tracking_url ?: "https://shiprocket.co/tracking/{$awb}",
                'etd' => $shipment->etd ?: date('d M Y', strtotime('+4 days')),
                'activities' => $history,
            ];
        }

        $res = $this->request('GET', "/courier/track/awb/{$awb}");
        $body = $res->json();

        $trackData = $body['tracking_data'] ?? [];
        $currentStatus = $trackData['shipment_track'][0]['current_status'] ?? ($shipment->shipment_status ?: 'In Transit');
        $activities = $trackData['shipment_track_activities'] ?? [];

        $formattedActivities = [];
        foreach ($activities as $act) {
            $formattedActivities[] = [
                'date' => $act['date'] ?? '',
                'activity' => $act['activity'] ?? '',
                'location' => $act['location'] ?? '',
            ];
        }

        $etd = $trackData['shipment_track'][0]['edd'] ?? $shipment->etd;

        $shipment->update([
            'shipment_status' => $currentStatus,
            'tracking_history' => $formattedActivities,
            'etd' => $etd,
        ]);

        return [
            'current_status' => $currentStatus,
            'courier_name' => $shipment->courier_name,
            'awb' => $awb,
            'tracking_url' => $shipment->tracking_url,
            'etd' => $etd,
            'activities' => $formattedActivities,
        ];
    }

    /**
     * Cancel an active Shiprocket order / shipment
     */
    public function cancelShipment(ShiprocketShipment $shipment): bool
    {
        if ((int)$shipment->store_id !== 86) {
            throw new \InvalidArgumentException("Shipment does not belong to AMIORA Store ID 86.");
        }

        if (empty($shipment->shiprocket_order_id)) {
            return false;
        }

        if ($this->isSandbox()) {
            $shipment->update([
                'sync_status' => 'cancelled',
                'shipment_status' => 'Cancelled',
            ]);
            return true;
        }

        $res = $this->request('POST', '/orders/cancel', [
            'ids' => [$shipment->shiprocket_order_id],
        ]);

        if ($res->successful()) {
            $shipment->update([
                'sync_status' => 'cancelled',
                'shipment_status' => 'Cancelled',
            ]);
            return true;
        }

        throw new \RuntimeException($res->json('message') ?? 'Failed to cancel shipment on Shiprocket');
    }

    /**
     * Parse Indian address into street, city, state, and 6-digit pincode
     */
    protected function parseIndianAddress(string $address): array
    {
        $pincode = '683549';
        if (preg_match('/\b([1-9][0-9]{5})\b/', $address, $matches)) {
            $pincode = $matches[1];
        }

        $state = 'Kerala';
        $states = [
            'Kerala', 'Tamil Nadu', 'Karnataka', 'Maharashtra', 'Delhi',
            'Andhra Pradesh', 'Telangana', 'Gujarat', 'West Bengal', 'Rajasthan',
            'Uttar Pradesh', 'Madhya Pradesh', 'Goa', 'Punjab', 'Haryana',
        ];
        foreach ($states as $st) {
            if (stripos($address, $st) !== false) {
                $state = $st;
                break;
            }
        }

        // Clean city extraction
        $city = 'Perumbavoor';
        $parts = array_map('trim', explode(',', $address));
        if (count($parts) >= 2) {
            $possibleCity = preg_replace('/[^a-zA-Z\s]/', '', $parts[count($parts) - 2]);
            if (!empty(trim($possibleCity))) {
                $city = trim($possibleCity);
            }
        }

        return [
            'address' => substr(trim($address), 0, 190) ?: '14/97 Cherukunnam, Asamannoor P.O., Kerala',
            'city' => substr($city, 0, 45),
            'state' => substr($state, 0, 45),
            'pincode' => $pincode,
        ];
    }

    /**
     * Generate realistic simulated courier serviceability results for testing
     */
    protected function getSimulatedCouriers(string $deliveryPincode, float $weight, bool $isCod): array
    {
        return [
            [
                'courier_company_id' => 10,
                'courier_name' => 'Delhivery Surface Direct',
                'rate' => round(42.00 + ($weight * 22.00), 2),
                'etd' => '3-4 Business Days',
                'estimated_delivery_days' => 3,
                'rating' => 4.7,
                'is_cod' => true,
            ],
            [
                'courier_company_id' => 12,
                'courier_name' => 'Blue Dart Air Express',
                'rate' => round(78.00 + ($weight * 38.00), 2),
                'etd' => '2-3 Business Days',
                'estimated_delivery_days' => 2,
                'rating' => 4.9,
                'is_cod' => true,
            ],
            [
                'courier_company_id' => 15,
                'courier_name' => 'DTDC Premium Surface',
                'rate' => round(48.00 + ($weight * 26.00), 2),
                'etd' => '4-5 Business Days',
                'estimated_delivery_days' => 4,
                'rating' => 4.5,
                'is_cod' => true,
            ],
            [
                'courier_company_id' => 18,
                'courier_name' => 'Xpressbees Standard',
                'rate' => round(39.00 + ($weight * 20.00), 2),
                'etd' => '3-5 Business Days',
                'estimated_delivery_days' => 4,
                'rating' => 4.4,
                'is_cod' => true,
            ],
            [
                'courier_company_id' => 22,
                'courier_name' => 'Shadowfax Express',
                'rate' => round(45.00 + ($weight * 24.00), 2),
                'etd' => '4-6 Business Days',
                'estimated_delivery_days' => 5,
                'rating' => 4.2,
                'is_cod' => false,
            ],
        ];
    }
}
