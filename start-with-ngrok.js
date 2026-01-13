const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Volt app with ngrok...\n');

// Start frontend dev server
console.log('📦 Starting frontend dev server...');
const frontend = spawn('npm', ['run', 'dev:frontend'], {
  cwd: path.join(__dirname, 'frontend'),
  shell: true,
  stdio: 'inherit'
});

// Start backend server
console.log('🔧 Starting backend server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'server'),
  shell: true,
  stdio: 'inherit'
});

// Wait a bit for servers to start, then start ngrok
setTimeout(() => {
  console.log('\n🌐 Starting ngrok tunnels...\n');
  const ngrok = spawn('node', ['start-ngrok.js'], {
    shell: true,
    stdio: 'inherit'
  });

  ngrok.on('close', () => {
    console.log('\n👋 Shutting down...');
    frontend.kill();
    backend.kill();
    process.exit(0);
  });
}, 5000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down all processes...');
  frontend.kill();
  backend.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  frontend.kill();
  backend.kill();
  process.exit(0);
});






































