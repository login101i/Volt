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
    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error('Timeout waiting for ngrok API'));
    });
  });
}

async function showUrl() {
  log('\n🔍 Sprawdzam aktualny URL ngrok...\n', 'cyan');
  
  try {
    const frontendUrl = await getNgrokUrl(3000);
    
    // Save to file
    const urlFile = path.join(__dirname, 'ngrok-url.txt');
    fs.writeFileSync(urlFile, frontendUrl, 'utf8');
    
    log('✅ Znaleziono aktywny tunel!\n', 'green');
    log('🔗'.repeat(35), 'bright');
    log('\n📤 LINK DO UDOSTĘPNIENIA:', 'bright');
    log('\n' + '─'.repeat(70), 'bright');
    log(`\n   ${frontendUrl}`, 'bright');
    log('\n' + '─'.repeat(70), 'bright');
    log('🔗'.repeat(35) + '\n', 'bright');
    log('💾 URL zapisany w pliku: ngrok-url.txt\n', 'cyan');
    
  } catch (error) {
    log('❌ Nie znaleziono aktywnego tunelu ngrok.', 'red');
    log('\nMożliwe przyczyny:', 'yellow');
    log('   • ngrok nie jest uruchomiony', 'cyan');
    log('   • ngrok działa na innym porcie', 'cyan');
    log('   • ngrok API nie odpowiada\n', 'cyan');
    log('💡 Rozwiązanie:', 'yellow');
    log('   1. Uruchom: npm run ngrok', 'cyan');
    log('   2. Lub sprawdź dashboard: http://localhost:4040\n', 'cyan');
    
    // Check if file exists
    const urlFile = path.join(__dirname, 'ngrok-url.txt');
    if (fs.existsSync(urlFile)) {
      const savedUrl = fs.readFileSync(urlFile, 'utf8').trim();
      log('📄 Ostatni zapisany URL:', 'yellow');
      log(`   ${savedUrl}`, 'cyan');
      log('   (może być nieaktualny - sprawdź czy ngrok działa)\n', 'yellow');
    }
    
    process.exit(1);
  }
}

showUrl();








