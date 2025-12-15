<?php
// logout.php
session_set_cookie_params([
    'domain' => '.minionsenterprises.com',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax'
]);
session_start();
session_unset();
session_destroy();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://' . $_SERVER['HTTP_ORIGIN']);
header('Access-Control-Allow-Credentials: true');

echo json_encode(['success' => true]);
exit;
?>
