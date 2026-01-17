    </div>

    <footer class="site-footer mt-5 border-top border-secondary border-opacity-10">
        <div class="container py-5">
            <div class="row g-5">
                <div class="col-lg-4">
                    <div class="d-flex align-items-center gap-2 mb-4">
                        <div class="bg-primary text-white rounded p-1 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                            <i class="fas fa-bolt fa-sm"></i>
                        </div>
                        <span class="fw-bold text-white tracking-tight h5 mb-0">NIECOMM</span>
                    </div>
                    <p class="text-secondary mb-4">
                        Nigeria's most trusted marketplace for verified electronics. 
                        We connect buyers with legitimate local vendors for safe, fast, and secure transactions.
                    </p>
                    <div class="d-flex gap-3 social-links">
                        <a href="#" class="btn btn-icon btn-outline-light rounded-circle btn-sm"><i class="fab fa-twitter"></i></a>
                        <a href="#" class="btn btn-icon btn-outline-light rounded-circle btn-sm"><i class="fab fa-facebook-f"></i></a>
                        <a href="#" class="btn btn-icon btn-outline-light rounded-circle btn-sm"><i class="fab fa-instagram"></i></a>
                        <a href="#" class="btn btn-icon btn-outline-light rounded-circle btn-sm"><i class="fab fa-linkedin-in"></i></a>
                    </div>
                </div>
                
                <div class="col-6 col-lg-2">
                    <h6 class="text-white fw-bold mb-4">Shop</h6>
                    <ul class="list-unstyled d-flex flex-column gap-2">
                        <li><a href="products.php" class="text-secondary hover-primary text-decoration-none">All Products</a></li>
                        <li><a href="products.php?category=phones" class="text-secondary hover-primary text-decoration-none">Phones</a></li>
                        <li><a href="products.php?category=laptops" class="text-secondary hover-primary text-decoration-none">Laptops</a></li>
                        <li><a href="vendors.php" class="text-secondary hover-primary text-decoration-none">Vendors</a></li>
                    </ul>
                </div>
                
                <div class="col-6 col-lg-2">
                    <h6 class="text-white fw-bold mb-4">Company</h6>
                    <ul class="list-unstyled d-flex flex-column gap-2">
                        <li><a href="about.php" class="text-secondary hover-primary text-decoration-none">About Us</a></li>
                        <li><a href="careers.php" class="text-secondary hover-primary text-decoration-none">Careers</a></li>
                        <li><a href="blog.php" class="text-secondary hover-primary text-decoration-none">Blog</a></li>
                        <li><a href="contact.php" class="text-secondary hover-primary text-decoration-none">Contact</a></li>
                    </ul>
                </div>
                
                <div class="col-lg-4">
                    <h6 class="text-white fw-bold mb-4">Stay Updated</h6>
                    <p class="text-secondary small mb-3">Subscribe to our newsletter for the latest gadget deals.</p>
                    <form action="#" class="mb-3">
                        <div class="input-group">
                            <input type="email" class="form-control bg-transparent border-secondary text-white placeholder-secondary" placeholder="Enter your email">
                            <button class="btn btn-primary" type="button">Subscribe</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <hr class="my-5 border-secondary opacity-25">
            
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                <p class="text-secondary small mb-0">&copy; <?php echo date('Y'); ?> NIECOMM. All rights reserved.</p>
                <div class="d-flex gap-4">
                    <a href="privacy.php" class="text-secondary small text-decoration-none hover-primary">Privacy Policy</a>
                    <a href="terms.php" class="text-secondary small text-decoration-none hover-primary">Terms of Service</a>
                    <a href="sitemap.php" class="text-secondary small text-decoration-none hover-primary">Sitemap</a>
                </div>
            </div>
        </div>
    </footer>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/main.js"></script>
    <div id="toast-container" class="position-fixed bottom-0 end-0 p-3" style="z-index: 1080;"></div>
</body>
</html>
