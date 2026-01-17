<?php
require_once '../../includes/config.php';
require_once '../../includes/session.php';

header('Content-Type: application/json');

// Check if user is logged in and is a vendor
if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'vendor') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit();
}

$vendor_id = $_SESSION['user_id'];
$image_id = isset($_POST['image_id']) ? (int)$_POST['image_id'] : 0;
$response = ['success' => false, 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $image_id > 0) {
    try {
        // Begin transaction
        $conn->beginTransaction();
        
        // First, get the image path and verify the product belongs to the vendor
        $stmt = $conn->prepare("
            SELECT pi.image_path 
            FROM product_images pi
            JOIN products p ON pi.product_id = p.id
            WHERE pi.id = ? AND p.vendor_id = ?
        ");
        $stmt->execute([$image_id, $vendor_id]);
        $image = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($image) {
            $image_path = '../../uploads/products/additional/' . $image['image_path'];
            
            // Delete the image file
            if (file_exists($image_path)) {
                unlink($image_path);
            }
            
            // Delete the record from the database
            $stmt = $conn->prepare("DELETE FROM product_images WHERE id = ?");
            $stmt->execute([$image_id]);
            
            if ($stmt->rowCount() > 0) {
                $response = [
                    'success' => true, 
                    'message' => 'Image deleted successfully.'
                ];
                $conn->commit();
            } else {
                throw new Exception('Failed to delete image record from database.');
            }
        } else {
            throw new Exception('Image not found or you do not have permission to delete it.');
        }
    } catch (Exception $e) {
        $conn->rollBack();
        $response = [
            'success' => false, 
            'message' => 'Error deleting image: ' . $e->getMessage()
        ];
    }
} else {
    $response = [
        'success' => false, 
        'message' => 'Invalid request method or image ID.'
    ];
}

echo json_encode($response);
?>
