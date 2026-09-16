<?php
/**
 * FoodiesGoodies Database Connectivity and Authentication Handler
 * - Secure environment variable support with sensible local defaults
 * - Parameterized prepared statements preventing SQL injection
 * - Secure password hashing with password_hash() and verification with password_verify()
 * - Strict input validation & sanitization
 * - Internal error logging without exposing sensitive database errors to clients
 */

// Start session if not started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Database configuration via environment variables or defaults
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
$db_name = getenv('DB_NAME') ?: 'foodiesgoodies';
$db_port = getenv('DB_PORT') ? (int)getenv('DB_PORT') : 3306;

// Helper function to respond to client (JSON for AJAX or redirect)
function respond($success, $message, $redirectUrl = null) {
    $isAjax = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    $isJsonRequested = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

    if ($isAjax || $isJsonRequested) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => $success,
            'message' => $message,
            'redirect' => $redirectUrl
        ]);
        exit;
    }

    if ($redirectUrl) {
        $statusParam = $success ? 'status=success' : 'status=error';
        $delimiter = (strpos($redirectUrl, '?') !== false) ? '&' : '?';
        $fullRedirect = $redirectUrl . $delimiter . $statusParam . '&msg=' . urlencode($message);
        header("Location: " . $fullRedirect);
        exit;
    }

    echo htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
    exit;
}

// Only allow POST requests for authentication
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Invalid request method.', 'pages/login.html');
}

// Sanitize and validate inputs
$email = isset($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL) : '';
$password = isset($_POST['password']) ? trim($_POST['password']) : '';
$action = isset($_POST['action']) ? trim($_POST['action']) : (isset($_GET['action']) ? trim($_GET['action']) : 'register');

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Please provide a valid email address.', 'pages/login.html');
}

if (empty($password) || strlen($password) < 6) {
    respond(false, 'Password must be at least 6 characters long.', 'pages/login.html');
}

// Establish database connection
try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name, $db_port);
    $conn->set_charset('utf8mb4');

    // Auto-create table if it does not exist
    $tableSql = "CREATE TABLE IF NOT EXISTS customer_info (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $conn->query($tableSql);

} catch (Exception $e) {
    // Log internal error without exposing sensitive connection details
    error_log("Database Connection Error: " . $e->getMessage());
    respond(false, 'Unable to connect to database service. Please try again later.', 'pages/login.html');
}

// Process Action: Login vs Registration
if ($action === 'login') {
    // Login flow
    try {
        $stmt = $conn->prepare("SELECT id, email, password FROM customer_info WHERE email = ? LIMIT 1");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($row = $result->fetch_assoc()) {
            if (password_verify($password, $row['password'])) {
                $_SESSION['user_id'] = $row['id'];
                $_SESSION['user_email'] = $row['email'];
                $stmt->close();
                $conn->close();
                respond(true, 'Login successful! Welcome back.', 'index.html');
            } else {
                $stmt->close();
                $conn->close();
                respond(false, 'Invalid email or password.', 'pages/login.html');
            }
        } else {
            $stmt->close();
            $conn->close();
            respond(false, 'No account found with this email.', 'pages/login.html');
        }
    } catch (Exception $e) {
        error_log("Login Query Error: " . $e->getMessage());
        $conn->close();
        respond(false, 'An error occurred while logging in. Please try again.', 'pages/login.html');
    }
} else {
    // Registration flow (default)
    try {
        // Check if email already exists
        $checkStmt = $conn->prepare("SELECT id FROM customer_info WHERE email = ? LIMIT 1");
        $checkStmt->bind_param("s", $email);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();

        if ($checkResult->num_rows > 0) {
            $checkStmt->close();
            $conn->close();
            respond(false, 'An account with this email already exists. Please log in.', 'pages/login.html');
        }
        $checkStmt->close();

        // Hash the password securely
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        // Insert new user
        $insertStmt = $conn->prepare("INSERT INTO customer_info (email, password) VALUES (?, ?)");
        $insertStmt->bind_param("ss", $email, $hashed_password);
        $insertStmt->execute();

        $_SESSION['user_id'] = $insertStmt->insert_id;
        $_SESSION['user_email'] = $email;

        $insertStmt->close();
        $conn->close();
        respond(true, 'Registration successful! Welcome to Foodies Goodies.', 'index.html');

    } catch (Exception $e) {
        error_log("Registration Query Error: " . $e->getMessage());
        $conn->close();
        respond(false, 'An error occurred during registration. Please try again.', 'pages/login.html');
    }
}
?>