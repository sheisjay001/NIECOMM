<?php
require_once __DIR__ . '/../includes/config.php';
$file = __DIR__ . '/../database/schema.sql';
if (!file_exists($file)) {
    fwrite(STDERR, "SQL file not found: $file\n");
    exit(1);
}
$sql = file_get_contents($file);
$queries = explode(';', $sql);
$success = 0;
$errors = 0;
foreach ($queries as $query) {
    $query = trim($query);
    if ($query === '') continue;
    try {
        if ($conn->query($query) === TRUE) {
            $success++;
        } else {
            $errors++;
            fwrite(STDERR, "Error: " . $conn->error . "\n");
        }
    } catch (Throwable $e) {
        $errors++;
        fwrite(STDERR, "Exception: " . $e->getMessage() . "\n");
    }
}
echo "Executed queries: $success\n";
if ($errors > 0) {
    echo "Errors: $errors\n";
    exit(1);
}
echo "Schema import completed.\n";
