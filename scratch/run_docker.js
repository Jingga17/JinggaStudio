const { execSync } = require('child_process');
const path = require('path');

try {
    console.log("Executing docker compose down...");
    execSync('docker compose down', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    
    console.log("Executing docker compose up --build -d...");
    execSync('docker compose up --build -d', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    
    console.log("Docker commands executed successfully!");
} catch (error) {
    console.error("Error executing docker commands:", error.message);
}
