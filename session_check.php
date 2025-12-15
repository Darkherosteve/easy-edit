<?php
session_set_cookie_params([
    'lifetime' => 2700, // 45 minutes
    'path' => '/',
    'domain' => '.minionsenterprises.com',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'None'
]);
session_start();

header('Content-Type: application/json');

$timeout_duration = 2700; // 45 minutes
$response = ['logged_in' => false];

if (!empty($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {

    // Check for timeout
    if (isset($_SESSION['LAST_ACTIVITY'])) {
        $elapsed = time() - $_SESSION['LAST_ACTIVITY'];
        if ($elapsed > $timeout_duration) {
            session_unset();
            session_destroy();
            echo json_encode([
                'logged_in' => false,
                'reason' => 'timeout'
            ]);
            exit;
        }
    }

    // Update last activity
    $_SESSION['LAST_ACTIVITY'] = time();

    // ✅ Send back full user info for real-time display
    $response = [
        'logged_in'   => true,
        'username'    => $_SESSION['username'] ?? 'Unknown',
        'role'        => $_SESSION['role'] ?? 'User',
        'company'     => $_SESSION['company'] ?? 'Minions Enterprises',
        'login_time'  => $_SESSION['login_time'] ?? date('Y-m-d H:i:s')
    ];
}

echo json_encode($response);
exit;
?>
