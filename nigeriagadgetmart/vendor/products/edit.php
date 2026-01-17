<?php
require_once '../../includes/config.php';
require_once '../../includes/session.php';

// Check if user is logged in and is a vendor
if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'vendor') {
    header('Location: ../../login.php');
    exit();
}

$vendor_id = $_SESSION['user_id'];
$product_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$error = '';
$success = '';
$product = [];
$categories = [];

// Fetch product data
$stmt = $conn->prepare("SELECT * FROM products WHERE id = ? AND vendor_id = ?");
$stmt->execute([$product_id, $vendor_id]);
$product = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$product) {
    $_SESSION['error'] = 'Product not found or you do not have permission to edit it.';
    header('Location: index.php');
    exit();
}

// Fetch categories for dropdown
$stmt = $conn->query("SELECT id, name FROM categories WHERE status = 'active' ORDER BY name");
$categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Process form submission
    $name = trim($_POST['name']);
    $description = trim($_POST['description']);
    $price = (float)$_POST['price'];
    $compare_price = !empty($_POST['compare_price']) ? (float)$_POST['compare_price'] : null;
    $cost = !empty($_POST['cost']) ? (float)$_POST['cost'] : null;
    $category_id = (int)$_POST['category_id'];
    $sku = trim($_POST['sku']);
    $barcode = trim($_POST['barcode']);
    $quantity = (int)$_POST['quantity'];
    $status = $_POST['status'];
    $is_featured = isset($_POST['is_featured']) ? 1 : 0;
    
    // Validate inputs
    if (empty($name) || empty($price) || empty($category_id) || empty($quantity)) {
        $error = 'Please fill in all required fields.';
    } elseif ($price < 0) {
        $error = 'Price cannot be negative.';
    } elseif ($quantity < 0) {
        $error = 'Quantity cannot be negative.';
    } else {
        try {
            $conn->beginTransaction();
            
            // Update product
            $stmt = $conn->prepare("UPDATE products SET 
                name = ?, description = ?, price = ?, compare_price = ?, 
                cost = ?, category_id = ?, sku = ?, barcode = ?, 
                quantity = ?, status = ?, is_featured = ?, updated_at = NOW() 
                WHERE id = ? AND vendor_id = ?");
                
            $stmt->execute([
                $name, $description, $price, $compare_price, 
                $cost, $category_id, $sku, $barcode, 
                $quantity, $status, $is_featured, $product_id, $vendor_id
            ]);
            
            // Handle main image upload
            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $upload_dir = '../../uploads/products/';
                $file_extension = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
                $new_filename = 'product_' . $product_id . '_' . time() . '.' . $file_extension;
                $target_path = $upload_dir . $new_filename;
                
                // Validate image
                $valid_extensions = ['jpg', 'jpeg', 'png', 'gif'];
                if (!in_array($file_extension, $valid_extensions)) {
                    throw new Exception('Invalid file type. Only JPG, JPEG, PNG & GIF are allowed.');
                }
                
                // Delete old image if exists
                if (!empty($product['image'])) {
                    $old_image_path = $upload_dir . $product['image'];
                    if (file_exists($old_image_path)) {
                        unlink($old_image_path);
                    }
                }
                
                // Move uploaded file
                if (move_uploaded_file($_FILES['image']['tmp_name'], $target_path)) {
                    $stmt = $conn->prepare("UPDATE products SET image = ? WHERE id = ?");
                    $stmt->execute([$new_filename, $product_id]);
                }
            }
            
            // Handle additional images
            if (!empty($_FILES['additional_images']['name'][0])) {
                // Delete existing additional images
                $stmt = $conn->prepare("DELETE FROM product_images WHERE product_id = ?");
                $stmt->execute([$product_id]);
                
                // Upload new additional images
                $upload_dir = '../../uploads/products/additional/';
                if (!file_exists($upload_dir)) {
                    mkdir($upload_dir, 0777, true);
                }
                
                foreach ($_FILES['additional_images']['tmp_name'] as $key => $tmp_name) {
                    if ($_FILES['additional_images']['error'][$key] === UPLOAD_ERR_OK) {
                        $file_extension = strtolower(pathinfo($_FILES['additional_images']['name'][$key], PATHINFO_EXTENSION));
                        $new_filename = 'product_' . $product_id . '_' . uniqid() . '.' . $file_extension;
                        $target_path = $upload_dir . $new_filename;
                        
                        if (move_uploaded_file($tmp_name, $target_path)) {
                            $stmt = $conn->prepare("INSERT INTO product_images (product_id, image_path) VALUES (?, ?)");
                            $stmt->execute([$product_id, $new_filename]);
                        }
                    }
                }
            }
            
            $conn->commit();
            $_SESSION['success'] = 'Product updated successfully.';
            header('Location: index.php');
            exit();
            
        } catch (Exception $e) {
            $conn->rollBack();
            $error = 'Error updating product: ' . $e->getMessage();
        }
    }
}

// Fetch product images for display
$stmt = $conn->prepare("SELECT * FROM product_images WHERE product_id = ?");
$stmt->execute([$product_id]);
$product_images = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<?php include '../../includes/header.php'; ?>

<div class="container-fluid">
    <div class="row">
        <?php include '../includes/sidebar.php'; ?>
        
        <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2">Edit Product</h1>
                <div class="btn-toolbar mb-2 mb-md-0">
                    <a href="index.php" class="btn btn-sm btn-outline-secondary">
                        <i class="bi bi-arrow-left"></i> Back to Products
                    </a>
                </div>
            </div>

            <?php if ($error): ?>
                <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>

            <div class="card">
                <div class="card-body">
                    <form method="POST" enctype="multipart/form-data">
                        <div class="row">
                            <div class="col-md-8">
                                <div class="mb-3">
                                    <label for="name" class="form-label">Product Name *</label>
                                    <input type="text" class="form-control" id="name" name="name" 
                                           value="<?php echo htmlspecialchars($product['name']); ?>" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="description" class="form-label">Description</label>
                                    <textarea class="form-control" id="description" name="description" rows="5"><?php echo htmlspecialchars($product['description']); ?></textarea>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="price" class="form-label">Price (₦) *</label>
                                            <input type="number" step="0.01" class="form-control" id="price" 
                                                   name="price" value="<?php echo htmlspecialchars($product['price']); ?>" required>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="compare_price" class="form-label">Compare at Price (₦)</label>
                                            <input type="number" step="0.01" class="form-control" id="compare_price" 
                                                   name="compare_price" value="<?php echo htmlspecialchars($product['compare_price']); ?>">
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="cost" class="form-label">Cost per item (₦)</label>
                                            <input type="number" step="0.01" class="form-control" id="cost" 
                                                   name="cost" value="<?php echo htmlspecialchars($product['cost']); ?>">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="category_id" class="form-label">Category *</label>
                                            <select class="form-select" id="category_id" name="category_id" required>
                                                <option value="">Select Category</option>
                                                <?php foreach ($categories as $category): ?>
                                                    <option value="<?php echo $category['id']; ?>" 
                                                        <?php echo $category['id'] == $product['category_id'] ? 'selected' : ''; ?>>
                                                        <?php echo htmlspecialchars($category['name']); ?>
                                                    </option>
                                                <?php endforeach; ?>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="status" class="form-label">Status *</label>
                                            <select class="form-select" id="status" name="status" required>
                                                <option value="active" <?php echo $product['status'] === 'active' ? 'selected' : ''; ?>>Active</option>
                                                <option value="inactive" <?php echo $product['status'] === 'inactive' ? 'selected' : ''; ?>>Inactive</option>
                                                <option value="out_of_stock" <?php echo $product['status'] === 'out_of_stock' ? 'selected' : ''; ?>>Out of Stock</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="sku" class="form-label">SKU</label>
                                            <input type="text" class="form-control" id="sku" name="sku" 
                                                   value="<?php echo htmlspecialchars($product['sku']); ?>">
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="barcode" class="form-label">Barcode</label>
                                            <input type="text" class="form-control" id="barcode" name="barcode" 
                                                   value="<?php echo htmlspecialchars($product['barcode']); ?>">
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="quantity" class="form-label">Quantity *</label>
                                            <input type="number" class="form-control" id="quantity" name="quantity" 
                                                   value="<?php echo (int)$product['quantity']; ?>" required>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mb-3 form-check">
                                    <input type="checkbox" class="form-check-input" id="is_featured" name="is_featured" 
                                           value="1" <?php echo $product['is_featured'] ? 'checked' : ''; ?>>
                                    <label class="form-check-label" for="is_featured">Featured Product</label>
                                </div>
                            </div>
                            
                            <div class="col-md-4">
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <h5 class="card-title mb-0">Product Image</h5>
                                    </div>
                                    <div class="card-body text-center">
                                        <div class="mb-3">
                                            <?php if (!empty($product['image'])): ?>
                                                <img src="../../uploads/products/<?php echo htmlspecialchars($product['image']); ?>" 
                                                     class="img-fluid mb-2" style="max-height: 200px;" id="imagePreview">
                                            <?php else: ?>
                                                <div class="bg-light d-flex align-items-center justify-content-center" 
                                                     style="width: 100%; height: 200px;" id="imagePreview">
                                                    <span class="text-muted">No image</span>
                                                </div>
                                            <?php endif; ?>
                                        </div>
                                        <div class="mb-3">
                                            <label for="image" class="form-label">Change Main Image</label>
                                            <input class="form-control" type="file" id="image" name="image" 
                                                   accept="image/*" onchange="previewImage(this, 'imagePreview')">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="card">
                                    <div class="card-header">
                                        <h5 class="card-title mb-0">Additional Images</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="mb-3">
                                            <label for="additional_images" class="form-label">Add More Images</label>
                                            <input class="form-control" type="file" id="additional_images" 
                                                   name="additional_images[]" multiple accept="image/*">
                                        </div>
                                        
                                        <?php if (!empty($product_images)): ?>
                                            <div class="mt-3">
                                                <h6>Current Additional Images</h6>
                                                <div class="row g-2">
                                                    <?php foreach ($product_images as $img): ?>
                                                        <div class="col-4 position-relative">
                                                            <img src="../../uploads/products/additional/<?php echo htmlspecialchars($img['image_path']); ?>" 
                                                                 class="img-thumbnail" style="height: 80px; width: 100%; object-fit: cover;">
                                                            <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0 m-1" 
                                                                    onclick="deleteAdditionalImage(<?php echo $img['id']; ?>, this)">
                                                                <i class="bi bi-x"></i>
                                                            </button>
                                                        </div>
                                                    <?php endforeach; ?>
                                                </div>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-4">
                            <button type="submit" class="btn btn-primary">Update Product</button>
                            <a href="index.php" class="btn btn-secondary">Cancel</a>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    </div>
</div>

<!-- Delete Image Confirmation Modal -->
<div class="modal fade" id="deleteImageModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Delete Image</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete this image?</p>
                <input type="hidden" id="imageToDelete" value="">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmDeleteImage">Delete</button>
            </div>
        </div>
    </div>
</div>

<script>
// Image preview function
function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        if (preview.tagName === 'IMG') {
            preview.src = e.target.result;
        } else {
            preview.innerHTML = '';
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'img-fluid';
            img.style.maxHeight = '200px';
            preview.appendChild(img);
        }
    }
    
    if (file) {
        reader.readAsDataURL(file);
    }
}

// Delete additional image
function deleteAdditionalImage(imageId, button) {
    if (confirm('Are you sure you want to delete this image?')) {
        const formData = new FormData();
        formData.append('action', 'delete_image');
        formData.append('image_id', imageId);
        
        fetch('delete_image.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Remove the image container
                button.closest('.col-4').remove();
                
                // Show success message
                const alert = document.createElement('div');
                alert.className = 'alert alert-success mt-2';
                alert.textContent = 'Image deleted successfully';
                const cardBody = document.querySelector('.card-body');
                cardBody.insertBefore(alert, cardBody.firstChild);
                
                // Remove alert after 3 seconds
                setTimeout(() => {
                    alert.remove();
                }, 3000);
            } else {
                alert('Error deleting image: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting image. Please try again.');
        });
    }
    return false;
}

// Initialize any additional JS here
document.addEventListener('DOMContentLoaded', function() {
    // Initialize any additional JS here
});
</script>

<?php include '../../includes/footer.php'; ?>
