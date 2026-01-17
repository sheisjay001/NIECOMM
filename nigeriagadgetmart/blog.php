<?php
require_once 'includes/config.php';
$page_title = 'Blog';
include 'includes/header.php';
?>
<section class="py-5">
    <div class="container">
        <h2 class="mb-4">Blog</h2>
        <p class="text-muted mb-4">Insights, tips, and updates from the NIECOMM team and community.</p>
        <div class="row g-4">
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">Buying Safely from Verified Vendors</h5>
                        <p class="card-text">Learn how our vendor verification protects buyers and ensures authentic products.</p>
                        <a href="#post-buying-safely" class="btn btn-outline-primary btn-sm">Read</a>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">Top Laptop Picks for 2026</h5>
                        <p class="card-text">A curated list of high-performance laptops for work and play.</p>
                        <a href="#post-laptop-picks" class="btn btn-outline-primary btn-sm">Read</a>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">Understanding Escrow on NIECOMM</h5>
                        <p class="card-text">How our 3-day return window and escrow ensure fair transactions.</p>
                        <a href="#post-escrow" class="btn btn-outline-primary btn-sm">Read</a>
                    </div>
                </div>
            </div>
        </div>
        <hr class="my-5">
        <article id="post-buying-safely" class="mb-5">
            <h3 class="mb-3">Buying Safely from Verified Vendors</h3>
            <p class="text-muted">NIECOMM verifies vendors through CAC registration and physical shop checks to reduce fraud and ensure product authenticity.</p>
            <ul>
                <li>Look for the Verified badge on vendor profiles.</li>
                <li>Use in-app messaging to confirm product details before paying.</li>
                <li>Payments are held in escrow until delivery is confirmed.</li>
            </ul>
            <p>If anything goes wrong, our support team will step in to resolve disputes quickly and fairly.</p>
        </article>
        <article id="post-laptop-picks" class="mb-5">
            <h3 class="mb-3">Top Laptop Picks for 2026</h3>
            <p class="text-muted">Whether you’re coding, designing, or gaming, these laptops deliver strong performance and battery life.</p>
            <ul>
                <li>Ultrabook: Lightweight, all-day battery, great for productivity.</li>
                <li>Creator: High‑color accuracy displays and powerful GPUs.</li>
                <li>Gaming: Latest-gen CPUs, fast SSDs, and high refresh rate screens.</li>
            </ul>
            <p>Browse laptops on our marketplace and filter by RAM, storage, GPU, and price to find the right fit.</p>
        </article>
        <article id="post-escrow" class="mb-3">
            <h3 class="mb-3">Understanding Escrow on NIECOMM</h3>
            <p class="text-muted">Escrow protects both buyers and vendors by holding funds until delivery is confirmed.</p>
            <ul>
                <li>Funds are released when buyer and vendor confirm delivery.</li>
                <li>There’s a 3‑day window for returns on eligible gadgets.</li>
                <li>Refunds are processed quickly if a return is accepted.</li>
            </ul>
            <p>This system keeps transactions fair and transparent, reducing risk for everyone.</p>
        </article>
    </div>
</section>
<?php include 'includes/footer.php'; ?>
