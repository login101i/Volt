const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;
let expressApp;
let expressServer;

// Determine if we're in development or production
const isDev = process.env.NODE_ENV !== 'production';
const isPackaged = app.isPackaged;

// Paths configuration
const getServerPath = () => {
  if (isPackaged) {
    // In production, server is bundled with the app
    return path.join(process.resourcesPath, 'server');
  }
  return path.join(__dirname, '..', 'server');
};

const getFrontendPath = () => {
  if (isPackaged) {
    // In production, use the built Next.js app
    return path.join(process.resourcesPath, 'frontend');
  }
  return path.join(__dirname, '..', 'frontend');
};

// Start Express server
function startExpressServer() {
  return new Promise((resolve, reject) => {
    const serverPath = getServerPath();
    
    // Set environment variables
    process.env.PORT = '5000';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.NODE_ENV = isDev ? 'development' : 'production';

    // Load server dependencies
    try {
      const serverMain = require(path.join(serverPath, 'server.js'));
      expressApp = serverMain;
      
      // Start the server
      expressServer = expressApp.listen(5000, 'localhost', () => {
        console.log('Express server started on port 5000');
        resolve();
      });

      expressServer.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log('Port 5000 already in use, using existing server');
          resolve();
        } else {
          reject(err);
        }
      });
    } catch (error) {
      console.error('Error starting Express server:', error);
      reject(error);
    }
  });
}

// Start Next.js server (for production builds)
function startNextServer() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      // In development, Next.js dev server should already be running
      // Wait a bit to ensure it's ready
      setTimeout(() => {
        resolve();
      }, 2000);
      return;
    }

    const frontendPath = getFrontendPath();
    const standalonePath = path.join(frontendPath, '.next', 'standalone');
    const serverPath = path.join(standalonePath, 'server.js');
    
    // Set environment variables for Next.js
    const env = {
      ...process.env,
      PORT: '3000',
      HOSTNAME: 'localhost',
      NEXT_PUBLIC_API_URL: 'http://localhost:5000',
      NODE_ENV: 'production'
    };

    // Check if standalone server exists
    const fs = require('fs');
    if (!fs.existsSync(serverPath)) {
      console.error('Next.js standalone server not found. Please run "npm run build" in the frontend directory.');
      reject(new Error('Next.js standalone server not found'));
      return;
    }

    // Start Next.js standalone server
    const nextServer = spawn('node', [serverPath], {
      cwd: standalonePath,
      env: env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let serverReady = false;

    nextServer.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Next.js:', output);
      if (output.includes('Ready') || output.includes('started server')) {
        if (!serverReady) {
          serverReady = true;
          resolve();
        }
      }
    });

    nextServer.stderr.on('data', (data) => {
      console.error('Next.js error:', data.toString());
    });

    nextServer.on('error', (err) => {
      console.error('Error starting Next.js server:', err);
      if (!serverReady) {
        reject(err);
      }
    });

    nextServer.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`Next.js server exited with code ${code}`);
      }
    });

    // Timeout fallback - resolve after 5 seconds even if no ready message
    setTimeout(() => {
      if (!serverReady) {
        console.log('Next.js server timeout - assuming ready');
        serverReady = true;
        resolve();
      }
    }, 5000);

    serverProcess = nextServer;
  });
}

function createWindow() {
  const fs = require('fs');
  const iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
  const iconExists = fs.existsSync(iconPath);
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    ...(iconExists && { icon: iconPath }),
    show: false // Don't show until ready
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : 'http://localhost:3000';

  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle navigation errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    if (!isDev) {
      // Retry after a delay
      setTimeout(() => {
        mainWindow.loadURL(startUrl);
      }, 2000);
    }
  });
}

// App event handlers
app.whenReady().then(async () => {
  try {
    // Start Express server first
    await startExpressServer();
    
    // Start Next.js server (or wait for dev server)
    await startNextServer();
    
    // Create window
    createWindow();
  } catch (error) {
    console.error('Error during app initialization:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // Clean up servers
  if (expressServer) {
    expressServer.close();
  }
  if (serverProcess) {
    serverProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  // Clean up servers
  if (expressServer) {
    expressServer.close();
  }
  if (serverProcess) {
    serverProcess.kill();
  }
});

// Handle IPC messages
ipcMain.handle('get-api-url', () => {
  return 'http://localhost:5000';
});















