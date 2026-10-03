<?php

namespace App\Services;

use Google\Client as GoogleClient;
use Google\Service\Gmail;
use Google\Service\Gmail\Message;

class GmailService
{
    private GoogleClient $client;

    public function __construct()
    {
        $this->client = new GoogleClient();

        $this->client->setClientId(
            config('services.gmail.client_id')
        );

        $this->client->setClientSecret(
            config('services.gmail.client_secret')
        );

        $this->client->setRedirectUri(
            config('services.gmail.redirect_uri')
        );

        $this->client->setAccessType('offline');
        $this->client->setPrompt('consent');
    }

    public function getAuthorizationUrl(): string
    {
        $this->client->setScopes([
            Gmail::GMAIL_SEND,
        ]);

        return $this->client->createAuthUrl();
    }

    public function exchangeAuthorizationCode(string $code): array
    {
        $this->client->setScopes([
            Gmail::GMAIL_SEND,
        ]);

        $token = $this->client->fetchAccessTokenWithAuthCode($code);

        if (isset($token['error'])) {
            throw new \RuntimeException(
                $token['error_description'] ?? $token['error']
            );
        }

        return $token;
    }

    public function send(
        string $to,
        string $subject,
        string $htmlBody
    ): array {
        $refreshToken = config('services.gmail.refresh_token');

        if (!$refreshToken) {
            throw new \RuntimeException(
                'Gmail refresh token is not configured.'
            );
        }

        $this->client->setScopes([
            Gmail::GMAIL_SEND,
        ]);

        /*
         * Exchange the existing refresh token
         * for a fresh OAuth access token.
         */
        $token = $this->client->fetchAccessTokenWithRefreshToken(
            $refreshToken
        );

        if (isset($token['error'])) {
            throw new \RuntimeException(
                $token['error_description'] ?? $token['error']
            );
        }

        if (empty($token['access_token'])) {
            throw new \RuntimeException(
                'Gmail access token was not returned.'
            );
        }

        $this->client->setAccessToken($token);

        $rawMessage =
            "From: Toastkart <" .
            config('services.gmail.sender_email') .
            ">\r\n" .
            "To: {$to}\r\n" .
            "Subject: {$subject}\r\n" .
            "MIME-Version: 1.0\r\n" .
            "Content-Type: text/html; charset=UTF-8\r\n" .
            "\r\n" .
            $htmlBody;

        $encodedMessage = rtrim(
            strtr(base64_encode($rawMessage), '+/', '-_'),
            '='
        );

        $message = new Message();
        $message->setRaw($encodedMessage);

        $gmail = new Gmail($this->client);

        $sentMessage = $gmail
            ->users_messages
            ->send('me', $message);

        return [
            'id' => $sentMessage->getId(),
            'thread_id' => $sentMessage->getThreadId(),
        ];
    }
}
