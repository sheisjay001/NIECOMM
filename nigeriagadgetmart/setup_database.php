<?php
require_once 'includes/config.php';

echo "<h1>Database Setup</h1>";

// Function to execute SQL from file
function executeSQLFromFile($file, $conn) {
    if (!file_exists($file)) {
        die("<p style='color: red;'>❌ SQL file not found: $file</p>");
    }
    
    $sql = file_get_contents($file);
    
    // Split the SQL file into individual queries
    $queries = explode(';', $sql);
    $success = 0;
    $errors = [];
    
    // Execute each query
    foreach ($queries as $query) {
        $query = trim($query);
        if (!empty($query)) {
            try {
                if ($conn->query($query) === TRUE) {
                    $success++;
                } else {
                    $errors[] = "Error executing query: " . $conn->error . "<br>Query: " . substr($query, 0, 200) . "...";
                }
            } catch (Exception $e) {
                $errors[] = "Exception: " . $e->getMessage() . "<br>Query: " . substr($query, 0, 200) . "...";
            }
        }
    }
    
    return [
        'success' => $success,
        'errors' => $errors
    ];
}

// Auto import via GET param
if (isset($_GET['auto']) && $_GET['auto'] == '1') {
    $result = executeSQLFromFile('database/schema.sql', $conn);
    echo "<div class='alert alert-success'>Executed {$result['success']} queries.</div>";
    if (!empty($result['errors'])) {
        echo "<div class='alert alert-warning'><ul>";
        foreach ($result['errors'] as $error) {
            echo "<li>$error</li>";
        }
        echo "</ul></div>";
    }
    exit;
}

// Check if the form was submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['import_schema'])) {
    echo "<div class='alert alert-info'>Importing database schema...</div>";
    
    // Execute the schema file
    $result = executeSQLFromFile('database/schema.sql', $conn);
    
    // Display results
    echo "<div class='alert alert-success'>";
    echo "Successfully executed {$result['success']} queries.";
    echo "</div>";
    
    if (!empty($result['errors'])) {
        echo "<div class='alert alert-warning'>";
        echo "<h4>Encountered " . count($result['errors']) . " errors:</h4>";
        echo "<ul>";
        foreach ($result['errors'] as $error) {
            echo "<li>$error</li>";
        }
        echo "</ul>";
        echo "</div>";
    }
    
    // Test if tables were created
    $tables = [];
    $result = $conn->query("SHOW TABLES");
    if ($result) {
        while ($row = $result->fetch_array()) {
            $tables[] = $row[0];
        }
    }
    
    if (!empty($tables)) {
        echo "<div class='alert alert-success'>";
        echo "<h4>Tables in the database:</h4>";
        echo "<ul>";
        foreach ($tables as $table) {
            echo "<li>$table</li>";
        }
        echo "</ul>";
        echo "</div>";
    } else {
        echo "<div class='alert alert-warning'>No tables found in the database.</div>";
    }
    
    echo "<a href='index.php' class='btn btn-primary'>Go to Homepage</a>";
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Setup - NIECOMM</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <h2 class="h4 mb-0">Database Setup</h2>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-info">
                            <h4>Before you begin:</h4>
                            <ol>
                                <li>Make sure your database connection is properly configured in <code>includes/config.php</code></li>
                                <li>This will create all necessary tables in your database</li>
                                <li>Make sure you have the necessary permissions to create tables</li>
                            </ol>
                        </div>
                        
                        <div class="alert alert-warning">
                            <h4>⚠️ Warning:</h4>
                            <p>This will drop existing tables with the same names and recreate them. All existing data will be lost!</p>
                        </div>
                        
                        <form method="post" onsubmit="return confirm('Are you sure you want to import the database schema? This will delete existing data!');">
                            <button type="submit" name="import_schema" class="btn btn-primary btn-lg">
                                Import Database Schema
                            </button>
                            <a href="test_connection.php" class="btn btn-outline-secondary">Test Connection First</a>
                        </form>
                    </div>
                </div>
                
                <div class="card mt-4">
                    <div class="card-header">
                        <h3 class="h5 mb-0">Current Database Status</h3>
                    </div>
                    <div class="card-body">
                        <?php
                        // Display current database information
                        echo "<p><strong>Database Name:</strong> " . DB_NAME . "</p>";
                        echo "<p><strong>Server:</strong> " . DB_SERVER . "</p>";
                        
                        // Check if tables exist
                        $tables = [];
                        $result = $conn->query("SHOW TABLES");
                        if ($result) {
                            while ($row = $result->fetch_array()) {
                                $tables[] = $row[0];
                            }
                            $result->free();
                        }
                        
                        if (!empty($tables)) {
                            echo "<div class='alert alert-success'>";
                            echo "<h4>Existing Tables (" . count($tables) . ")</h4>";
                            echo "<ul class='list-group'>";
                            foreach ($tables as $table) {
                                echo "<li class='list-group-item d-flex justify-content-between align-items-center'>";
                                echo htmlspecialchars($table);
                                
                                // Get row count for each table
                                $countResult = $conn->query("SELECT COUNT(*) as count FROM `$table`");
                                $count = $countResult ? $countResult->fetch_assoc()['count'] : 0;
                                echo "<span class='badge bg-primary rounded-pill'>$count rows</span>";
                                
                                echo "</li>";
                            }
                            echo "</ul>";
                            echo "</div>";
                        } else {
                            echo "<div class='alert alert-warning'>No tables found in the database.</div>";
                        }
                        ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
