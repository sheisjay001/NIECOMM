<?php
require_once 'includes/config.php';
$page_title = 'Cart';
include 'includes/header.php';
?>
<section class="py-5">
    <div class="container">
        <h2 class="mb-4">Your Cart</h2>
        <div id="cart-items" class="row g-4"></div>
        <div class="mt-3">
            <a href="products.php" class="btn btn-primary">Continue Shopping</a>
        </div>
    </div>
<?php include 'includes/footer.php'; ?>
