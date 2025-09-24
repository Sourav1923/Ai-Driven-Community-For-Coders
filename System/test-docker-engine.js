// Test script to demonstrate the new Docker execution engine
// This shows how the system can now run projects directly from file tree structure

const testFileTree = {
    'package.json': {
        type: 'file',
        contents: JSON.stringify({
            name: 'test-project',
            version: '1.0.0',
            description: 'Test project for Docker execution',
            main: 'index.js',
            scripts: {
                start: 'node index.js',
                test: 'echo "No tests specified"'
            },
            dependencies: {
                express: '^4.18.2'
            }
        }, null, 2)
    },
    'index.js': {
        type: 'file',
        contents: `
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({
        message: 'Hello from Docker!',
        timestamp: new Date().toISOString(),
        project: 'test-project',
        method: 'file-tree-execution'
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', uptime: process.uptime() });
});

app.listen(port, () => {
    console.log(\`Server running on port \${port}\`);
    console.log(\`Visit http://localhost:\${port} to see the application\`);
});
        `.trim()
    },
    'README.md': {
        type: 'file',
        contents: `
# Test Project

This is a test project that demonstrates running directly from file tree structure in Docker.

## Features

- Express.js server
- Health check endpoint
- JSON API responses
- Docker containerization

## Running

The project can be run directly from the file tree without uploading files.

## API Endpoints

- GET / - Main endpoint
- GET /health - Health check
        `.trim()
    },
    'src/config.js': {
        type: 'file',
        contents: `
// Configuration file
module.exports = {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
};
        `.trim()
    }
};

console.log('Test File Tree Structure:');
console.log('========================');
console.log('This demonstrates the new Docker execution engine that can run projects directly from file tree structure.');
console.log('');
console.log('File Tree:');
Object.keys(testFileTree).forEach(filePath => {
    const file = testFileTree[filePath];
    if (file.type === 'file') {
        console.log(`📄 ${filePath} (${file.contents.length} characters)`);
    } else {
        console.log(`📁 ${filePath}/`);
    }
});

console.log('');
console.log('How it works:');
console.log('1. The file tree structure is sent to the backend');
console.log('2. Backend creates actual files from the tree structure');
console.log('3. Docker container is built with these files');
console.log('4. Container runs the application');
console.log('5. No file upload required - everything runs from the tree structure');
console.log('');
console.log('Benefits:');
console.log('- No need to upload files');
console.log('- Instant execution from current file tree');
console.log('- Automatic container updates when files change');
console.log('- Real-time development workflow');
console.log('');
console.log('To test this:');
console.log('1. Create a project in the web interface');
console.log('2. Add files to the file tree');
console.log('3. Switch to Docker tab');
console.log('4. Click "Run from Files"');
console.log('5. Container will be created and started automatically'); 