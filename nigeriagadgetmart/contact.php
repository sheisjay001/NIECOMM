<?php
require_once 'includes/config.php';
$page_title = 'Contact';
include 'includes/header.php';
?>
<section class="py-5">
    <div class="container">
        <h2 class="mb-4">Contact Us</h2>
        <form class="row g-3 needs-validation" novalidate method="post">
            <div class="col-md-6">
                <input type="text" name="name" class="form-control" placeholder="Your Name" required>
            </div>
            <div class="col-md-6">
                <input type="email" name="email" class="form-control" placeholder="Your Email" required>
            </div>
            <div class="col-12">
                <textarea name="message" class="form-control" rows="5" placeholder="Message" required></textarea>
            </div>
            <div class="col-12">
                <button class="btn btn-primary" type="submit">Send</button>
            </div>
        </form>
        <?php
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            echo '<div class="alert alert-success mt-3">Message received.</div>';
        }
        ?>
    </div>
<?php include 'includes/footer.php'; ?>
