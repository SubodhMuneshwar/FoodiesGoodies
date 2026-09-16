<?php
/**
 * FoodiesGoodies Recipe Search Proxy Endpoint (Edamam API v2)
 * Connects to Edamam Recipe Search API v2, keeps credentials server-side,
 * and streams live recipe search results to the front-end.
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$query = isset($_GET['q']) ? trim($_GET['q']) : '';

if (empty($query)) {
    echo json_encode([
        'success' => false,
        'message' => 'Please provide a search term.',
        'hits' => []
    ]);
    exit;
}

if (strlen($query) > 100) {
    $query = substr($query, 0, 100);
}

// Server-side environment variables with credentials
$appId = getenv('EDAMAM_APP_ID') ?: '7aa516a5';
$appKey = getenv('EDAMAM_APP_KEY') ?: 'dc836a223fb788b11ae390504d9e97ce';

// Edamam API v2 Endpoint
$url = 'https://api.edamam.com/api/recipes/v2?type=public&q=' . urlencode($query) .
       '&app_id=' . urlencode($appId) .
       '&app_key=' . urlencode($appKey);

$response = false;

// Attempt cURL
if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'FoodiesGoodies-App/2.0');
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300 && $response) {
        $decoded = json_decode($response, true);
        if (isset($decoded['hits'])) {
            echo json_encode([
                'success' => true,
                'query' => htmlspecialchars($query, ENT_QUOTES, 'UTF-8'),
                'count' => count($decoded['hits']),
                'hits' => $decoded['hits'],
                'source' => 'edamam_v2_live'
            ]);
            exit;
        }
    }
} elseif (ini_get('allow_url_fopen')) {
    $context = stream_context_create([
        'http' => [
            'timeout' => 10,
            'header' => "User-Agent: FoodiesGoodies-App/2.0\r\n"
        ]
    ]);
    $response = @file_get_contents($url, false, $context);
    if ($response) {
        $decoded = json_decode($response, true);
        if (isset($decoded['hits'])) {
            echo json_encode([
                'success' => true,
                'query' => htmlspecialchars($query, ENT_QUOTES, 'UTF-8'),
                'count' => count($decoded['hits']),
                'hits' => $decoded['hits'],
                'source' => 'edamam_v2_live'
            ]);
            exit;
        }
    }
}

echo json_encode([
    'success' => false,
    'message' => 'Unable to connect to Edamam service directly from PHP.',
    'hits' => []
]);
