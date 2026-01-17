<?php
require_once '../includes/config.php';
$page_title = 'Vendor Register';
include '../includes/header.php';
?>
<section class="py-5">
    <div class="container">
        <h2 class="mb-4">Vendor Registration</h2>
        <form class="row g-3 needs-validation" novalidate method="post">
            <div class="col-md-6">
                <input type="text" name="business_name" class="form-control" placeholder="Business Name" required>
            </div>
            <div class="col-md-6">
                <input type="text" name="city" class="form-control" placeholder="City" required>
            </div>
            <div class="col-12">
                <textarea name="description" class="form-control" rows="4" placeholder="Description"></textarea>
            </div>
            <div class="col-12">
                <button class="btn btn-primary" type="submit">Register</button>
            </div>
        </form>
        <?php
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            echo '<div class="alert alert-success mt-3">Vendor submission received.</div>';
        }
        ?>
    </div>
<?php include '../includes/footer.php'; ?>
