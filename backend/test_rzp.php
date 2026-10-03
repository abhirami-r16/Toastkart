<?php
require 'vendor/autoload.php';
use Razorpay\Api\Api;
$api = new Api('rzp_live_Tdrd9TNusHdI9T', 'P2QS7zgRhGdpfWkgBA02T9N1');
try {
    $api->plan->all();
    echo "Success";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
