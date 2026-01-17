<?php
require_once 'includes/config.php';
require_once 'includes/csrf.php';
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}
$page_title = 'Checkout';
$message = null;
function generate_order_number() {
    return strtoupper('NGM-' . date('ymd') . '-' . substr(bin2hex(random_bytes(4)), 0, 8));
}
if ($_SERVER['REQUEST_METHOD'] === 'POST' && csrf_verify()) {
    $shipping_address = trim($_POST['shipping_address'] ?? '');
    $city_id = intval($_POST['city_id'] ?? ($_SESSION['city_id'] ?? 0));
    $state_id = intval($_POST['state_id'] ?? ($_SESSION['state_id'] ?? 0));
    $cart_json = $_POST['cart_json'] ?? '[]';
    $cart = json_decode($cart_json, true);
    if (!$cart || !is_array($cart)) $cart = [];
    if ($shipping_address === '' || empty($cart)) {
        $message = 'Please provide shipping address and items.';
    } else {
        try {
            $order_number = generate_order_number();
            $total = 0;
            $items = [];
            foreach ($cart as $item) {
                $pid = intval($item['id'] ?? 0);
                $qty = intval($item['quantity'] ?? 0);
                if ($pid <= 0 || $qty <= 0) continue;
                $stmt = $conn->prepare("SELECT id, price FROM products WHERE id = ? AND is_active = 1 AND stock_quantity > 0");
                $stmt->bind_param("i", $pid);
                $stmt->execute();
                $res = $stmt->get_result();
                if ($res && $res->num_rows) {
                    $p = $res->fetch_assoc();
                    $price = floatval($p['price']);
                    $items[] = ['id' => $pid, 'qty' => $qty, 'price' => $price];
                    $total += $price * $qty;
                }
            }
            if (empty($items)) {
                $message = 'No valid items.';
            } else {
                $stmt = $conn->prepare("INSERT INTO orders (order_number, customer_id, total_amount, shipping_address, city_id, state_id, status, payment_status) VALUES (?, ?, ?, ?, ?, ?, 'processing', 'held')");
                $cid = $_SESSION['user_id'];
                $stmt->bind_param("sidsss", $order_number, $cid, $total, $shipping_address, $city_id, $state_id);
                $stmt->execute();
                $order_id = $conn->insert_id;
                foreach ($items as $it) {
                    $stmt2 = $conn->prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
                    $stmt2->bind_param("iiid", $order_id, $it['id'], $it['qty'], $it['price']);
                    $stmt2->execute();
                }
                $message = 'Order placed: ' . $order_number;
            }
        } catch (Throwable $e) {
            $message = 'Failed to place order.';
        }
    }
}
include 'includes/header.php';
?>
<section class="py-5">
    <div class="container">
        <div class="mx-auto" style="max-width: 760px;">
            <div class="card shadow-sm">
                <div class="card-body">
                    <h2 class="mb-3">Checkout</h2>
                    <?php if ($message): ?><div class="alert alert-info"><?php echo htmlspecialchars($message); ?></div><?php endif; ?>
                    <form class="row g-3" method="post" onsubmit="return injectCartJSON();">
                        <?php csrf_input(); ?>
                        <div class="col-12">
                            <label class="form-label">Shipping Address</label>
                            <textarea name="shipping_address" class="form-control" rows="3" required></textarea>
                        </div>
                        <input type="hidden" name="city_id" value="<?php echo htmlspecialchars($_SESSION['city_id'] ?? ''); ?>">
                        <input type="hidden" name="state_id" value="<?php echo htmlspecialchars($_SESSION['state_id'] ?? ''); ?>">
                        <input type="hidden" name="cart_json" id="cart_json">
                        <div class="col-12 d-flex justify-content-end">
                            <button class="btn btn-primary" type="submit">Place Order</button>
                        </div>
                    </form>
                    <script>
                        function injectCartJSON() {
                            try {
                                var cart = JSON.parse(localStorage.getItem('cart') || '[]');
                                document.getElementById('cart_json').value = JSON.stringify(cart);
                            } catch (e) {
                                document.getElementById('cart_json').value = '[]';
                            }
                            return true;
                        }
                    </script>
                </div>
            </div>
        </div>
    </div>
<?php include 'includes/footer.php'; ?>
