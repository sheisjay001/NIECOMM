<?php
require_once '../../includes/config.php';
require_once '../../includes/session.php';

// Check if user is logged in and is a vendor
if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'vendor') {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit();
}

$vendor_id = $_SESSION['user_id'];
$product_id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
$response = ['success' => false, 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $product_id > 0) {
    try {
        // Begin transaction
        $conn->beginTransaction();
        
        // Get product details to delete associated images
        $stmt = $conn->prepare("SELECT image FROM products WHERE id = ? AND vendor_id = ?");
        $stmt->execute([$product_id, $vendor_id]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($product) {
            // Delete main product image if exists
            if (!empty($product['image'])) {
                $image_path = '../../uploads/products/' . $product['image'];
                if (file_exists($image_path)) {
                    unlink($image_path);
                }
            }
            
            // Get and delete additional images
            $stmt = $conn->prepare("SELECT image_path FROM product_images WHERE product_id = ?");
            $stmt->execute([$product_id]);
            $additional_images = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            foreach ($additional_images as $image) {
                $image_path = '../../uploads/products/additional/' . $image;
                if (file_exists($image_path)) {
                    unlink($image_path);
                }
            }
            
            // Delete from product_images table
            $stmt = $conn->prepare("DELETE FROM product_images WHERE product_id = ?");
            $stmt->execute([$product_id]);
            
            // Delete from products table
            $stmt = $conn->prepare("DELETE FROM products WHERE id = ? AND vendor_id = ?");
            $stmt->execute([$product_id, $vendor_id]);
            
            if ($stmt->rowCount() > 0) {
                $response = [
                    'success' => true, 
                    'message' => 'Product deleted successfully.',
                    'redirect' => 'index.php'
                ];
                $conn->commit();
            } else {
                throw new Exception('No product found with the specified ID or you do not have permission to delete it.');
            }
        } else {
            throw new Exception('Product not found or you do not have permission to delete it.');
        }
    } catch (Exception $e) {
        $conn->rollBack();
        $response = [
            'success' => false, 
            'message' => 'Error deleting product: ' . $e->getMessage()
        ];
    }
} else {
    $response = [
        'success' => false, 
        'message' => 'Invalid request method or product ID.'
    ];
}

// Return JSON response
header('Content-Type: application/json');
echo json_encode($response);
?>
