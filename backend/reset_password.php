<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$usage = <<<EOF
ToastKart — Password Reset Utility
Usage:
  php reset_password.php <EMAIL> [NEW_PASSWORD]
  php reset_password.php --list
  php reset_password.php --help

Examples:
  php reset_password.php admin@example.com
  php reset_password.php admin@example.com NewPass123!
  php reset_password.php --list

If NEW_PASSWORD is omitted, a random 12-char password will be generated.
EOF;

if ($argc < 2) {
    echo $usage . PHP_EOL;
    exit(1);
}

$arg = $argv[1];

if ($arg === '--help' || $arg === '-h') {
    echo $usage . PHP_EOL;
    exit(0);
}

if ($arg === '--list') {
    echo "=== Registered Users ===\n";
    $users = User::all(['id', 'name', 'email', 'role', 'created_at']);
    if ($users->isEmpty()) {
        echo "  (no users found)\n";
        exit(0);
    }
    foreach ($users as $u) {
        echo sprintf(
            "  ID=%-4s  role=%-12s  email=%-30s  name=%s\n",
            $u->id, $u->role, $u->email, $u->name
        );
    }
    exit(0);
}

$email = $arg;
$newPassword = $argv[2] ?? null;

$user = User::where('email', $email)->first();
if (!$user) {
    echo "❌ ERROR: No user found with email: {$email}\n";
    echo "Tip: list all users with:  php reset_password.php --list\n";
    exit(2);
}

if ($newPassword === null) {
    $newPassword = substr(
        str_shuffle('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'),
        0, 12
    );
    echo "ℹ️  No password provided — auto-generating one.\n";
}

$hashed = Hash::make($newPassword);
$user->password = $hashed;
$user->save();

echo "\n✅ Password updated successfully!\n";
echo "----------------------------------\n";
echo "  ID:       {$user->id}\n";
echo "  Name:     {$user->name}\n";
echo "  Email:    {$user->email}\n";
echo "  Role:     {$user->role}\n";
echo "  Password: {$newPassword}\n";
echo "----------------------------------\n";
echo "\n⚠️  Delete or restrict access to this script after use.\n";
