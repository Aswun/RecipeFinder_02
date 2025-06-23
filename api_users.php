<?php
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

try {
    $db = new PDO('mysql:host=localhost;dbname=recipefinder', 'root', '');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    echo json_encode(['error' => 'Failed to connect to database']);
    exit;
}

switch ($action) {
    case 'read':
        try {
            $stmt = $db->query("SELECT id, name, roles FROM user");
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($users);
        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'create':
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || !isset($data['name'], $data['roles'], $data['password'])) {
                echo json_encode(['error' => 'Invalid input']);
                break;
            }

            // Check if username already exists
            $check = $db->prepare("SELECT id FROM user WHERE name = ?");
            $check->execute([$data['name']]);
            if ($check->fetch()) {
                echo json_encode(['error' => 'Username already exists']);
                break;
            }

            // ✅ Secure password hash
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

            $stmt = $db->prepare("INSERT INTO user (name, roles, password) VALUES (?, ?, ?)");
            $stmt->execute([$data['name'], $data['roles'], $hashedPassword]);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'update':
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || !isset($data['id'], $data['name'], $data['roles'])) {
                echo json_encode(['error' => 'Invalid input']);
                break;
            }

            if (!empty($data['password'])) {
                // ✅ Secure password hash for update
                $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
                $stmt = $db->prepare("UPDATE user SET name=?, roles=?, password=? WHERE id=?");
                $stmt->execute([$data['name'], $data['roles'], $hashedPassword, $data['id']]);
            } else {
                $stmt = $db->prepare("UPDATE user SET name=?, roles=? WHERE id=?");
                $stmt->execute([$data['name'], $data['roles'], $data['id']]);
            }

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'delete':
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || !isset($data['id'])) {
                echo json_encode(['error' => 'Invalid input']);
                break;
            }

            $stmt = $db->prepare("DELETE FROM user WHERE id=?");
            $stmt->execute([$data['id']]);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'login':
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || !isset($data['name'], $data['password'])) {
                echo json_encode(['error' => 'Invalid input']);
                break;
            }

            $stmt = $db->prepare("SELECT id, name, roles, password FROM user WHERE name = ?");
            $stmt->execute([$data['name']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            // ✅ Verify hashed password
            if ($user && password_verify($data['password'], $user['password'])) {
                echo json_encode([
                    'success' => true,
                    'user' => [
                        'id' => $user['id'],
                        'name' => $user['name'],
                        'roles' => $user['roles']
                    ]
                ]);
            } else {
                echo json_encode(['error' => 'Invalid username or password']);
            }
        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['error' => 'Invalid action']);
        break;
}
?>