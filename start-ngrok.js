const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Check if ngrok is installed
function checkNgrokInstalled() {
  return new Promise((resolve) => {
    const check = spawn('ngrok', ['version'], { shell: true });
    check.on('close', (code) => {
      resolve(code === 0);
    });
    check.on('error', () => {
      resolve(false);
    });
  });
}

// Get ngrok public URL
function getNgrokUrl(port) {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:4040/api/tunnels', (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const tunnels = JSON.parse(data);
          const tunnel = tunnels.tunnels.find(t => 
            t.config.addr && t.config.addr.includes(`:${port}`)
          );
          if (tunnel) {
            resolve(tunnel.public_url);
          } else {
            reject(new Error(`No tunnel found for port ${port}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout waiting for ngrok API'));
    });
  });
}

async function startNgrok() {
  log('\n🚀 Starting ngrok tunnels...\n', 'bright');
  
  // Check if ngrok is installed
  const isInstalled = await checkNgrokInstalled();
  if (!isInstalled) {
    log('❌ ngrok is not installed!', 'red');
    log('\n📥 Please install ngrok:', 'yellow');
    log('   1. Download from: https://ngrok.com/download', 'cyan');
    log('   2. Extract ngrok.exe to a folder in your PATH', 'cyan');
    log('   3. Or install via: choco install ngrok (if you have Chocolatey)', 'cyan');
    log('   4. Sign up at https://dashboard.ngrok.com/get-started/your-authtoken', 'cyan');
    log('   5. Run: ngrok config add-authtoken YOUR_TOKEN\n', 'cyan');
    process.exit(1);
  }

  // Start ngrok tunnels
  // Note: Only frontend tunnel is needed since Next.js proxies backend requests
  log('Starting tunnel for frontend (port 3000)...', 'cyan');
  log('Starting tunnel for backend (port 5000) - optional...\n', 'cyan');

  const ngrok = spawn('ngrok', ['start', '--all', '--config', 'ngrok.yml'], {
    shell: true,
    stdio: 'inherit'
  });

  // Wait a bit for ngrok to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Try to get the URLs
  let frontendUrl = null;
  let backendUrl = null;

  for (let i = 0; i < 10; i++) {
    try {
      if (!frontendUrl) {
        frontendUrl = await getNgrokUrl(3000);
      }
      if (!backendUrl) {
        backendUrl = await getNgrokUrl(5000);
      }
      break;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (frontendUrl) {
    // Save URL to file for easy access
    const urlFile = path.join(__dirname, 'ngrok-url.txt');
    fs.writeFileSync(urlFile, frontendUrl, 'utf8');
    
    log('\n' + '='.repeat(70), 'green');
    log('✅ ngrok tunnel is active!', 'green');
    log('='.repeat(70), 'green');
    
    log('\n' + '🔗'.repeat(35), 'bright');
    log('\n📤 LINK DO UDOSTĘPNIENIA Z KOLEGĄ:', 'bright');
    log('\n' + '─'.repeat(70), 'bright');
    log(`\n   ${frontendUrl}`, 'bright');
    log('\n' + '─'.repeat(70), 'bright');
    log('🔗'.repeat(35) + '\n', 'bright');
    
    log('💾 URL zapisany również w pliku: ngrok-url.txt', 'cyan');
    
    if (backendUrl) {
      log(`\n🔧 Backend URL:  ${backendUrl} (opcjonalny - nie jest potrzebny)`, 'cyan');
    }
    
    log('\n📋 Instrukcje:', 'yellow');
    log('   1. Skopiuj link powyżej', 'cyan');
    log('   2. Wyślij go koledze', 'cyan');
    log('   3. Kolega otworzy link w przeglądarce', 'cyan');
    log('   4. Aplikacja będzie działać automatycznie!\n', 'cyan');
    
    log('⚠️  Ważne:', 'yellow');
    log('   - Upewnij się, że serwery działają:', 'cyan');
    log('     • Frontend: npm run dev:frontend', 'cyan');
    log('     • Backend:  npm run dev:server', 'cyan');
    log('   - Nie zamykaj tego okna (tunel musi być aktywny)', 'cyan');
    log('   - Link zmieni się po restarcie ngrok (darmowy plan)\n', 'cyan');
    
    log('💡 Wskazówki:', 'yellow');
    log('   - Dashboard ngrok: http://localhost:4040 (zobacz wszystkie requesty)', 'cyan');
    log('   - Frontend automatycznie przekierowuje API do backendu\n', 'cyan');
  } else {
    log('\n⚠️  Nie udało się automatycznie pobrać URL ngrok.', 'yellow');
    log('   Sprawdź dashboard ngrok: http://localhost:4040\n', 'cyan');
    log('   Tam znajdziesz publiczny URL tunelu.\n', 'cyan');
  }

  ngrok.on('close', (code) => {
    log(`\n❌ ngrok tunnel closed (code: ${code})`, 'red');
    process.exit(code);
  });

  ngrok.on('error', (error) => {
    log(`\n❌ Error starting ngrok: ${error.message}`, 'red');
    process.exit(1);
  });
}

startNgrok().catch((error) => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});




