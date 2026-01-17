<?php
require_once 'includes/config.php';

echo "<h1>Database Connection Test</h1>";

try {
    // Test connection
    if ($conn->ping()) {
        echo "<p style='color: green;'>✅ Successfully connected to the database!</p>";
        
        // Test creating a test table
        $testTable = "CREATE TABLE IF NOT EXISTS test_connection (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        if ($conn->query($testTable) === TRUE) {
            echo "<p style='color: green;'>✅ Test table created successfully</p>";
            
            // Test inserting data
            $testMessage = "Test message at " . date('Y-m-d H:i:s');
            $insert = $conn->prepare("INSERT INTO test_connection (message) VALUES (?)");
            $insert->bind_param("s", $testMessage);
            
            if ($insert->execute()) {
                echo "<p style='color: green;'>✅ Test data inserted successfully</p>";
                
                // Test reading data
                $result = $conn->query("SELECT * FROM test_connection ORDER BY created_at DESC LIMIT 5");
                if ($result->num_rows > 0) {
                    echo "<h3>Recent test records:</h3>";
                    echo "<ul>";
                    while($row = $result->fetch_assoc()) {
                        echo "<li>" . htmlspecialchars($row['message']) . "</li>";
                    }
                    echo "</ul>";
                }
            } else {
                echo "<p style='color: red;'>❌ Failed to insert test data: " . $conn->error . "</p>";
            }
        } else {
            echo "<p style='color: red;'>❌ Failed to create test table: " . $conn->error . "</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ Connection failed: " . $conn->error . "</p>";
    }
    
    // Display database version
    $version = $conn->server_info;
    echo "<p>Database version: " . $version . "</p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
    
    // Show connection details (for debugging, remove in production)
    echo "<h3>Connection Details:</h3>";
    echo "<pre>" . print_r([
        'server' => DB_SERVER,
        'port' => DB_PORT,
        'username' => DB_USERNAME,
        'database' => DB_NAME,
        'error' => $conn->error ?? 'No error'
    ], true) . "</pre>";
}
?>

<h2>Next Steps:</h2>
<ol>
    <li><a href="database/schema.sql" target="_blank">View Database Schema</a></li>
    <li><a href="index.php">Go to Homepage</a></li>
</ol>
