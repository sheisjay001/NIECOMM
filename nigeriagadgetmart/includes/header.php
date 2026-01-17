<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($page_title) ? htmlspecialchars($page_title) . ' · NIECOMM' : 'NIECOMM'; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
</head>
<body data-theme="light">
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg sticky-top bg-white">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center gap-2" href="index.php">
                <div class="bg-primary text-white rounded p-1 d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                    <i class="fas fa-bolt"></i>
                </div>
                <span class="fw-bold text-dark tracking-tight">NIECOMM</span>
            </a>
            
            <button class="navbar-toggler border-0" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebar" aria-label="Open menu">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-4 me-auto mb-2 mb-lg-0">
                    <li class="nav-item">
                        <a class="nav-link px-3" href="index.php">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link px-3" href="products.php">Marketplace</a>
                    </li>
                    <?php $role = strtolower($_SESSION['role'] ?? ''); if ($role !== 'vendor'): ?>
                        <li class="nav-item">
                            <a class="nav-link px-3" href="vendors.php">Vendors</a>
                        </li>
                    <?php endif; ?>
                </ul>
                
                <form action="products.php" method="get" class="d-none d-lg-flex align-items-center me-4" style="min-width: 300px;">
                    <div class="input-group navbar-search bg-light rounded-pill overflow-hidden border">
                        <span class="input-group-text bg-transparent border-0 ps-3"><i class="fas fa-search text-muted"></i></span>
                        <input type="text" name="q" class="form-control bg-transparent border-0 shadow-none" placeholder="Search phones, laptops...">
                    </div>
                </form>
                
                <div class="d-flex align-items-center gap-3">
                    <?php $role = strtolower($_SESSION['role'] ?? ''); if ($role !== 'vendor'): ?>
                        <a href="cart.php" class="position-relative text-secondary hover-primary">
                            <i class="fas fa-shopping-cart fa-lg"></i>
                            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white cart-count" style="font-size: 0.6rem;">0</span>
                        </a>
                        <div class="vr mx-2 text-muted opacity-25"></div>
                    <?php endif; ?>
                    
                    <?php if (isset($_SESSION['user_id'])): ?>
                        <div class="dropdown">
                            <a href="#" class="d-flex align-items-center text-decoration-none dropdown-toggle" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                <div class="bg-light rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold border" style="width: 38px; height: 38px;">
                                    <?php echo strtoupper(substr($_SESSION['username'] ?? 'U', 0, 1)); ?>
                                </div>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2" aria-labelledby="userDropdown">
                                <li>
                                    <?php $role = strtolower($_SESSION['role'] ?? ''); ?>
                                    <?php if ($role === 'vendor'): ?>
                                        <a class="dropdown-item py-2" href="vendor_dashboard.php"><i class="fas fa-chart-line me-2 text-muted"></i> Dashboard</a>
                                    <?php elseif ($role === 'admin'): ?>
                                        <a class="dropdown-item py-2" href="admin_dashboard.php"><i class="fas fa-toolbox me-2 text-muted"></i> Admin</a>
                                        <a class="dropdown-item py-2" href="admin_messages.php"><i class="fas fa-comments me-2 text-muted"></i> Admin Messages</a>
                                    <?php else: ?>
                                        <a class="dropdown-item py-2" href="user_dashboard.php"><i class="fas fa-home me-2 text-muted"></i> Dashboard</a>
                                    <?php endif; ?>
                                </li>
                                <li><a class="dropdown-item py-2" href="messages.php"><i class="fas fa-comments me-2 text-muted"></i> Messages</a></li>
                                <li><a class="dropdown-item py-2" href="user_profile.php"><i class="fas fa-user me-2 text-muted"></i> Profile</a></li>
                                <li><a class="dropdown-item py-2" href="orders.php"><i class="fas fa-box me-2 text-muted"></i> My Orders</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item py-2 text-danger" href="logout.php"><i class="fas fa-sign-out-alt me-2"></i> Logout</a></li>
                            </ul>
                        </div>
                    <?php else: ?>
                        <a href="login.php" class="btn btn-outline-primary btn-sm px-3 rounded-pill">Log In</a>
                        <a href="register.php" class="btn btn-primary btn-sm px-3 rounded-pill">Sign Up</a>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </nav>

    <div class="offcanvas offcanvas-start" tabindex="-1" id="sidebar">
        <div class="offcanvas-header">
            <h5 class="offcanvas-title">Menu</h5>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body">
            <ul class="list-unstyled">
                <li class="mb-2"><a class="text-dark" href="index.php">Home</a></li>
                <?php $role = strtolower($_SESSION['role'] ?? ''); if ($role !== 'vendor'): ?>
                <li class="mb-2"><a class="text-dark" href="vendors.php">Vendors</a></li>
                <?php endif; ?>
                <li class="mb-2"><a class="text-dark" href="about.php">About</a></li>
                <li class="mb-2"><a class="text-dark" href="contact.php">Contact</a></li>
                <li class="mb-2"><a class="text-dark" href="privacy.php">Privacy</a></li>
                <li class="mb-2"><a class="text-dark" href="terms.php">Terms</a></li>
                <li class="mb-2"><a class="text-dark" href="return-policy.php">Return Policy</a></li>
                <?php if ($role !== 'vendor'): ?>
                <li class="mb-2"><a class="text-dark" href="cart.php">Cart</a></li>
                <?php endif; ?>
                <?php if (isset($_SESSION['user_id'])): ?>
                    <li class="mb-2"><a class="text-dark" href="orders.php">Orders</a></li>
                    <li class="mb-2"><a class="text-dark" href="messages.php">Messages</a></li>
                <?php endif; ?>
                <li class="mb-2"><a class="text-dark" href="login.php">Login</a></li>
                <li class="mb-2"><a class="text-dark" href="register.php">Register</a></li>
            <hr>
            <form action="products.php" method="get" class="d-grid gap-2">
                <input type="text" name="q" class="form-control" placeholder="Search gadgets">
                <button class="btn btn-primary" type="submit">Search</button>
            </form>
            </ul>
        </div>
    </div>
