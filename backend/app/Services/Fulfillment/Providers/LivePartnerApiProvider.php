<?php

namespace App\Services\Fulfillment\Providers;

use App\Models\MeeshoOrder;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LivePartnerApiProvider implements MeeshoSupplierProviderInterface
{
    protected ?string $apiUrl;
    protected ?string $clientId;
    protected ?string $clientSecret;
    protected int $timeout;

    public function __construct()
    {
        $this->apiUrl = config('services.meesho.partner_api_url');
        $this->clientId = config('services.meesho.partner_client_id');
        $this->clientSecret = config('services.meesho.partner_client_secret');
        $this->timeout = (int) config('services.meesho.timeout', 15);
    }

    public function getProviderName(): string
    {
        return 'partner_api';
    }

    public function supportsAutomatedOrdering(): bool
    {
        return !empty($this->apiUrl) && !empty($this->clientId);
    }

    public function supportsTrackingPolling(): bool
    {
        return !empty($this->apiUrl) && !empty($this->clientId);
    }

    public function createSupplierOrder(MeeshoOrder $order, array $customerData, string $idempotencyKey): array
    {
        if (!$this->supportsAutomatedOrdering()) {
            return [
                'ok' => false,
                'supplier_order_id' => null,
                'supplier_status' => 'Pending Fulfillment',
                'error_code' => 'CREDENTIALS_NOT_CONFIGURED',
                'message' => 'Meesho Enterprise Partner API credentials (MEESHO_PARTNER_API_URL / MEESHO_PARTNER_CLIENT_ID) are not configured in backend/.env.',
                'tracking' => null,
            ];
        }

        $payload = [
            'idempotency_key' => $idempotencyKey,
            'source_product_id' => $order->meeshoProduct?->meesho_product_id,
            'variant' => $order->variant_info,
            'quantity' => $order->quantity ?: 1,
            'shipping_destination' => [
                'name' => $customerData['customer_name'] ?? $order->customer_name,
                'email' => $customerData['customer_email'] ?? $order->customer_email,
                'phone' => $customerData['customer_phone'] ?? $order->customer_phone,
                'address' => $customerData['customer_address'] ?? $order->customer_address,
            ],
            'max_acceptable_cost' => (float)$order->source_purchase_cost,
        ];

        try {
            $response = Http::acceptJson()
                ->asJson()
                ->timeout($this->timeout)
                ->withHeaders([
                    'X-Client-Id' => $this->clientId,
                    'X-Client-Secret' => $this->clientSecret,
                    'Idempotency-Key' => $idempotencyKey,
                ])
                ->post(rtrim($this->apiUrl, '/') . '/v2/dropship/orders', $payload);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'ok' => true,
                    'supplier_order_id' => $data['supplier_order_id'] ?? $data['order_id'] ?? null,
                    'supplier_status' => 'Supplier Confirmed',
                    'message' => 'Supplier order placed successfully via Partner API.',
                    'tracking' => $data['tracking'] ?? null,
                    'error_code' => null,
                ];
            }

            $status = $response->status();
            $body = $response->json();
            $errCode = $body['error']['code'] ?? 'UPSTREAM_ERROR';
            $errMsg = $body['error']['message'] ?? $response->body();

            return [
                'ok' => false,
                'supplier_order_id' => null,
                'supplier_status' => ($status === 429) ? 'Pending Fulfillment' : 'Failed',
                'error_code' => $errCode,
                'message' => "Supplier Partner API rejected order placement (HTTP {$status}): {$errMsg}",
                'tracking' => null,
            ];
        } catch (ConnectionException $e) {
            Log::warning("Meesho Partner API connection timeout for order {$order->id}: " . $e->getMessage());
            return [
                'ok' => false,
                'supplier_order_id' => null,
                'supplier_status' => 'Submission Pending Verification',
                'error_code' => 'UPSTREAM_TIMEOUT',
                'message' => 'Partner API connection timed out. Do not retry without verifying if supplier received the order.',
                'tracking' => null,
            ];
        } catch (\Throwable $e) {
            Log::error("Meesho Partner API unexpected error for order {$order->id}: " . $e->getMessage());
            return [
                'ok' => false,
                'supplier_order_id' => null,
                'supplier_status' => 'Failed',
                'error_code' => 'CLIENT_EXCEPTION',
                'message' => 'Unexpected error communicating with Partner API: ' . $e->getMessage(),
                'tracking' => null,
            ];
        }
    }

    public function getTrackingStatus(MeeshoOrder $order): array
    {
        if (!$this->supportsTrackingPolling() || empty($order->meesho_order_id)) {
            return [
                'ok' => false,
                'message' => 'Live tracking polling not configured or missing supplier order reference.',
            ];
        }

        try {
            $response = Http::acceptJson()
                ->timeout($this->timeout)
                ->withHeaders([
                    'X-Client-Id' => $this->clientId,
                    'X-Client-Secret' => $this->clientSecret,
                ])
                ->get(rtrim($this->apiUrl, '/') . '/v2/dropship/orders/' . urlencode($order->meesho_order_id) . '/tracking');

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'ok' => true,
                    'shipment_status' => $data['shipment_status'] ?? $order->shipment_status,
                    'courier_partner' => $data['courier_partner'] ?? $order->courier_partner,
                    'awb_number' => $data['awb_number'] ?? $order->awb_number,
                    'tracking_url' => $data['tracking_url'] ?? $order->tracking_url,
                    'delivered_at' => $data['delivered_at'] ?? null,
                    'message' => 'Live tracking fetched successfully.',
                ];
            }

            return [
                'ok' => false,
                'message' => 'Failed to fetch live tracking from Partner API: ' . $response->status(),
            ];
        } catch (\Throwable $e) {
            return [
                'ok' => false,
                'message' => 'Connection error checking tracking: ' . $e->getMessage(),
            ];
        }
    }

    public function cancelSupplierOrder(MeeshoOrder $order, string $reason): array
    {
        if (!$this->supportsAutomatedOrdering() || empty($order->meesho_order_id)) {
            return [
                'ok' => false,
                'message' => 'Partner API not configured or no supplier reference present.',
            ];
        }

        try {
            $response = Http::acceptJson()
                ->asJson()
                ->timeout($this->timeout)
                ->withHeaders([
                    'X-Client-Id' => $this->clientId,
                    'X-Client-Secret' => $this->clientSecret,
                ])
                ->post(rtrim($this->apiUrl, '/') . '/v2/dropship/orders/' . urlencode($order->meesho_order_id) . '/cancel', [
                    'reason' => $reason,
                ]);

            if ($response->successful()) {
                return ['ok' => true, 'message' => 'Partner order cancellation confirmed.'];
            }

            return ['ok' => false, 'message' => 'Partner API rejected cancellation: ' . $response->body()];
        } catch (\Throwable $e) {
            return ['ok' => false, 'message' => 'Error requesting cancellation: ' . $e->getMessage()];
        }
    }
}
