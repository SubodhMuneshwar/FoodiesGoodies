<?php
/**
 * FoodiesGoodies Secure Contact Form Processing Endpoint
 * Validates inquiries and securely logs or forwards them without client credentials.
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method. Only POST is accepted.'
    ]);
    exit;
}

// Read either JSON payload or Form data
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!is_array($data) || empty($data)) {
    $data = $_POST;
}

$name = isset($data['name']) ? trim(strip_tags($data['name'])) : '';
$email = isset($data['email']) ? filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL) : '';
$subject = isset($data['subject']) ? trim(strip_tags($data['subject'])) : '';
$message = isset($data['message']) ? trim(strip_tags($data['message'])) : '';

// Validation
if (empty($name) || mb_strlen($name) < 2) {
    echo json_encode(['success' => false, 'message' => 'Please enter your valid full name.']);
    exit;
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email address.']);
    exit;
}

if (empty($subject) || mb_strlen($subject) < 2) {
    echo json_encode(['success' => false, 'message' => 'Please provide a subject for your message.']);
    exit;
}

if (empty($message) || mb_strlen($message) < 5) {
    echo json_encode(['success' => false, 'message' => 'Please include a message with at least 5 characters.']);
    exit;
}

// Prepare secure log entry
$timestamp = date('Y-m-d H:i:s');
$logEntry = sprintf(
    "[%s] IP: %s | Name: %s | Email: %s | Subject: %s | Message: %s\n",
    $timestamp,
    $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
    $name,
    $email,
    $subject,
    str_replace(["\r", "\n"], ' ', $message)
);

// Save to private log directory
$logDir = __DIR__ . '/../data';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0750, true);
}
@file_put_contents($logDir . '/contact_inquiries.log', $logEntry, FILE_APPEND | LOCK_EX);

// If server has mail() or SMTP configured via ENV, send notification
$adminEmail = getenv('ADMIN_NOTIFICATION_EMAIL') ?: 'subodhum1603@gmail.com';
$mailSubject = "New FoodiesGoodies Message: " . $subject;
$mailBody = "You received a new inquiry from Foodies Goodies:\n\n" .
            "Name: " . $name . "\n" .
            "Email: " . $email . "\n" .
            "Subject: " . $subject . "\n\n" .
            "Message:\n" . $message . "\n";
$headers = "From: webmaster@foodiesgoodies.local\r\n" .
           "Reply-To: " . $email . "\r\n" .
           "X-Mailer: PHP/" . phpversion();

// Attempt mail send if mail function enabled (suppress warnings if local mail server is not configured)
@mail($adminEmail, $mailSubject, $mailBody, $headers);

echo json_encode([
    'success' => true,
    'message' => 'Your message has been sent successfully! Our culinary team will get back to you soon.'
]);
