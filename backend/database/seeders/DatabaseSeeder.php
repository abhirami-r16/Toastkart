<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Three System Users (Admin, Store Owner, Customer)
        $admin = User::create([
            'name' => 'Platform Admin',
            'email' => 'admin@toastkart.local',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        $owner = User::create([
            'name' => 'Store Merchant Owner',
            'email' => 'owner@toastkart.local',
            'password' => Hash::make('password123'),
            'role' => 'merchant',
        ]);

        $customerUser = User::create([
            'name' => 'Sara Ahmed (Customer)',
            'email' => 'customer@toastkart.local',
            'password' => Hash::make('password123'),
            'role' => 'customer',
        ]);

        $user = $admin;

        // 2. Demo Stores
        $store1 = Store::create([
            'user_id' => $user->id,
            'name' => 'Glow Boutique',
            'slug' => 'glow-boutique',
            'logo' => 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=300&q=80',
            'currency' => 'USD',
            'description' => 'Premium skincare, cosmetics, and luxury wellness essentials.',
            'status' => 'Active',
        ]);

        $store2 = Store::create([
            'user_id' => $user->id,
            'name' => 'Modern Nest',
            'slug' => 'modern-nest',
            'logo' => 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300&q=80',
            'currency' => 'EUR',
            'description' => 'Minimalist home decor, smart lighting, and modern furniture.',
            'status' => 'Active',
        ]);

        $store3 = Store::create([
            'user_id' => $user->id,
            'name' => 'Urban Tech',
            'slug' => 'urban-tech',
            'logo' => 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&q=80',
            'currency' => 'GBP',
            'description' => 'Cutting edge electronics, wireless audio, and wearable tech.',
            'status' => 'Active',
        ]);

        // 3. Categories for Store 1 (Glow Boutique)
        $catFashion = Category::create([
            'store_id' => $store1->id,
            'name' => 'Apparel & Fashion',
            'slug' => 'apparel-fashion',
            'description' => 'Luxury clothing and seasonal streetwear',
            'featured' => true,
        ]);

        $catBeauty = Category::create([
            'store_id' => $store1->id,
            'name' => 'Beauty & Skincare',
            'slug' => 'beauty-skincare',
            'description' => 'Organic creams, serums, and fragrance',
            'featured' => true,
        ]);

        // Categories for Store 2 (Modern Nest)
        $catHome = Category::create([
            'store_id' => $store2->id,
            'name' => 'Living Room',
            'slug' => 'living-room',
            'description' => 'Sleek sofas, floor lamps, and ambient art',
            'featured' => true,
        ]);

        // Categories for Store 3 (Urban Tech)
        $catTech = Category::create([
            'store_id' => $store3->id,
            'name' => 'Audio & Accessories',
            'slug' => 'audio-accessories',
            'description' => 'Noise-canceling headphones & wireless gear',
            'featured' => true,
        ]);

        // 4. Products for Store 1
        $p1 = Product::create([
            'store_id' => $store1->id,
            'category_id' => $catFashion->id,
            'name' => 'Aurora Silk Jacket',
            'slug' => 'aurora-silk-jacket',
            'sku' => 'AUR-JKT-001',
            'price' => 129.99,
            'compare_price' => 160.00,
            'stock_quantity' => 24,
            'description' => 'Lightweight tailored silk jacket with subtle metallic shine.',
            'image' => 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80',
            'status' => 'In Stock',
            'is_active' => true,
        ]);

        $p2 = Product::create([
            'store_id' => $store1->id,
            'category_id' => $catBeauty->id,
            'name' => 'Botanical Glow Serum',
            'slug' => 'botanical-glow-serum',
            'sku' => 'GLW-SRM-002',
            'price' => 45.00,
            'compare_price' => 55.00,
            'stock_quantity' => 4,
            'description' => 'Hyaluronic acid infused serum for all-day skin hydration.',
            'image' => 'https://images.unsplash.com/photo-1608248597261-83325803d466?w=600&q=80',
            'status' => 'Low Stock',
            'is_active' => true,
        ]);

        $p3 = Product::create([
            'store_id' => $store1->id,
            'category_id' => $catBeauty->id,
            'name' => 'Velvet Matte Lipstick Set',
            'slug' => 'velvet-matte-lipstick-set',
            'sku' => 'VLV-LIP-003',
            'price' => 38.50,
            'stock_quantity' => 0,
            'description' => 'Trio of long-lasting non-drying matte lipstick shades.',
            'image' => 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&q=80',
            'status' => 'Out of Stock',
            'is_active' => true,
        ]);

        // Products for Store 2
        $p4 = Product::create([
            'store_id' => $store2->id,
            'category_id' => $catHome->id,
            'name' => 'Luma Ambient Desk Lamp',
            'slug' => 'luma-ambient-desk-lamp',
            'sku' => 'LUM-LMP-101',
            'price' => 89.00,
            'compare_price' => 110.00,
            'stock_quantity' => 18,
            'description' => 'Touch-sensitive dimmable LED lamp crafted from matte aluminum.',
            'image' => 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80',
            'status' => 'In Stock',
            'is_active' => true,
        ]);

        // Products for Store 3
        $p5 = Product::create([
            'store_id' => $store3->id,
            'category_id' => $catTech->id,
            'name' => 'Nova Pro Wireless Headphones',
            'slug' => 'nova-pro-wireless-headphones',
            'sku' => 'NVA-HDP-201',
            'price' => 199.99,
            'compare_price' => 249.99,
            'stock_quantity' => 12,
            'description' => 'Active noise cancellation headphones with 40-hour battery life.',
            'image' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
            'status' => 'In Stock',
            'is_active' => true,
        ]);

        // 5. Customers
        $c1 = Customer::create([
            'store_id' => $store1->id,
            'name' => 'Sara Ahmed',
            'email' => 'sara.ahmed@example.com',
            'phone' => '+1 (555) 234-5678',
            'address' => '742 Evergreen Terrace, Springfield, IL',
            'total_orders' => 2,
            'total_spent' => 304.49,
        ]);

        $c2 = Customer::create([
            'store_id' => $store1->id,
            'name' => 'Imran Malik',
            'email' => 'imran.malik@example.com',
            'phone' => '+1 (555) 876-5432',
            'address' => '100 Broadway St, Suite 400, New York, NY',
            'total_orders' => 1,
            'total_spent' => 45.00,
        ]);

        $c3 = Customer::create([
            'store_id' => $store2->id,
            'name' => 'Zainab Noor',
            'email' => 'zainab.noor@example.com',
            'phone' => '+44 20 7946 0912',
            'address' => '22 Baker Street, London, UK',
            'total_orders' => 1,
            'total_spent' => 93.45,
        ]);

        // 6. Orders
        $ord1 = Order::create([
            'order_number' => '#ORD-1001',
            'store_id' => $store1->id,
            'customer_id' => $c1->id,
            'customer_name' => $c1->name,
            'customer_email' => $c1->email,
            'customer_phone' => $c1->phone,
            'shipping_address' => $c1->address,
            'subtotal' => 259.98,
            'tax' => 13.00,
            'total_amount' => 272.98,
            'status' => 'Completed',
            'payment_status' => 'Paid',
        ]);

        OrderItem::create([
            'order_id' => $ord1->id,
            'product_id' => $p1->id,
            'product_name' => $p1->name,
            'quantity' => 2,
            'price' => $p1->price,
            'subtotal' => 259.98,
        ]);

        $ord2 = Order::create([
            'order_number' => '#ORD-1002',
            'store_id' => $store1->id,
            'customer_id' => $c2->id,
            'customer_name' => $c2->name,
            'customer_email' => $c2->email,
            'customer_phone' => $c2->phone,
            'shipping_address' => $c2->address,
            'subtotal' => 45.00,
            'tax' => 2.25,
            'total_amount' => 47.25,
            'status' => 'Pending',
            'payment_status' => 'Paid',
        ]);

        OrderItem::create([
            'order_id' => $ord2->id,
            'product_id' => $p2->id,
            'product_name' => $p2->name,
            'quantity' => 1,
            'price' => $p2->price,
            'subtotal' => 45.00,
        ]);

        $ord3 = Order::create([
            'order_number' => '#ORD-1003',
            'store_id' => $store2->id,
            'customer_id' => $c3->id,
            'customer_name' => $c3->name,
            'customer_email' => $c3->email,
            'customer_phone' => $c3->phone,
            'shipping_address' => $c3->address,
            'subtotal' => 89.00,
            'tax' => 4.45,
            'total_amount' => 93.45,
            'status' => 'Completed',
            'payment_status' => 'Paid',
        ]);

        OrderItem::create([
            'order_id' => $ord3->id,
            'product_id' => $p4->id,
            'product_name' => $p4->name,
            'quantity' => 1,
            'price' => $p4->price,
            'subtotal' => 89.00,
        ]);
    }
}
