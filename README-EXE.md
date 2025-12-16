# Building Volt Desktop Application as .exe File

This guide explains how to build and package the Volt application as a Windows executable (.exe) file using Electron.

## Prerequisites

Before you begin, make sure you have the following installed:

1. **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
2. **npm** (comes with Node.js)
3. **Windows 10/11** (for building Windows executables)

## Project Structure

```
Volt/
├── electron/          # Electron main process files
│   ├── main.js       # Main Electron process
│   └── preload.js    # Preload script for security
├── frontend/          # Next.js frontend application
├── server/            # Express backend server
├── package.json       # Root package.json with Electron config
└── dist/              # Output directory (created after build)
```

## Installation Steps

### 1. Install Dependencies

First, install dependencies for all parts of the application:

```bash
# Install root dependencies (Electron, electron-builder, etc.)
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install server dependencies
cd server
npm install
cd ..
```

### 2. Development Mode (Testing)

To test the Electron app in development mode:

```bash
# Start the app in development mode
# This will start both the frontend and backend servers, then launch Electron
npm run electron:dev
```

Or manually:

```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start frontend server
cd frontend
npm run dev

# Terminal 3: Start Electron
npm run electron
```

## Building the .exe File

### Step 1: Build the Frontend

First, build the Next.js frontend application:

```bash
cd frontend
npm run build
cd ..
```

This creates an optimized production build in `frontend/.next/` directory.

### Step 2: Build the Executable

Build the Windows executable:

```bash
npm run dist:win
```

Or for all platforms:

```bash
npm run dist
```

This will:
1. Build the frontend application
2. Package everything with Electron
3. Create an installer in the `dist/` directory

### Step 3: Find Your Executable

After the build completes, you'll find:

- **Installer**: `dist/Volt Setup x.x.x.exe` - Use this to install the application
- **Portable version**: `dist/win-unpacked/Volt.exe` - Standalone executable (no installation needed)

## Distribution

### Option 1: Installer (Recommended)

The installer (`Volt Setup x.x.x.exe`) provides:
- Professional installation experience
- Desktop shortcut creation
- Start menu entry
- Uninstaller
- Automatic updates support (if configured)

**To distribute:**
1. Share the `Volt Setup x.x.x.exe` file with your client
2. Client runs the installer
3. Application will be installed in `C:\Users\[Username]\AppData\Local\Volt\`

### Option 2: Portable Version

The portable version (`dist/win-unpacked/Volt.exe`) can run without installation:
- Extract the entire `win-unpacked` folder
- Run `Volt.exe` directly
- No installation required

**To distribute:**
1. Zip the entire `win-unpacked` folder
2. Share the zip file with your client
3. Client extracts and runs `Volt.exe`

## Configuration

### Customizing the Application

#### Change App Name/Version

Edit `package.json` in the root directory:

```json
{
  "name": "volt-desktop",
  "version": "1.0.0",
  "build": {
    "productName": "Volt",
    "appId": "com.volt.desktop"
  }
}
```

#### Change Icon

1. Create an icon file: `build/icon.ico` (256x256 pixels recommended for Windows)
   - You can use online tools like [ICO Convert](https://icoconvert.com/) to convert PNG to ICO
   - Or use [ImageMagick](https://imagemagick.org/): `magick convert icon.png -resize 256x256 icon.ico`
2. Place it in the `build/` directory
3. The icon path is already configured in `package.json` - just make sure the file exists

**Note:** If you don't have an icon file, Electron will use a default icon. The app will still work fine.

#### Change Window Size

Edit `electron/main.js`:

```javascript
mainWindow = new BrowserWindow({
  width: 1400,  // Change width
  height: 900,  // Change height
  // ...
});
```

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Solution: Make sure all dependencies are installed (`npm install` in root, frontend, and server directories)

**Error: "Port already in use"**
- Solution: The app uses ports 3000 (frontend) and 5000 (backend). Make sure these ports are available or change them in `electron/main.js`

### Application Won't Start

**App opens but shows blank screen**
- Check if both servers are running (ports 3000 and 5000)
- Check the console for errors (DevTools: Ctrl+Shift+I)
- Verify the build completed successfully

**"Failed to connect to server" error**
- Ensure the Express server started successfully
- Check firewall settings
- Verify ports 3000 and 5000 are not blocked

### Build Size is Too Large

The initial build includes all dependencies. To reduce size:
- Use `electron-builder` compression options
- Remove unused dependencies
- Consider using `asar` packaging (enabled by default)

## Advanced Configuration

### Environment Variables

You can set environment variables in `electron/main.js`:

```javascript
process.env.PORT = '5000';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:5000';
```

### Code Signing (Optional)

For production distribution, you may want to sign your executable:

1. Obtain a code signing certificate
2. Add to `package.json`:

```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.pfx",
      "certificatePassword": "password"
    }
  }
}
```

### Auto-Updater (Optional)

To enable automatic updates, you'll need to:
1. Set up an update server
2. Configure `electron-updater` in `electron/main.js`
3. Host update files on a server

## File Structure After Build

```
dist/
├── Volt Setup x.x.x.exe    # Installer
├── latest.yml              # Update manifest
└── win-unpacked/          # Portable version
    ├── Volt.exe
    ├── resources/
    │   ├── app/
    │   │   ├── electron/
    │   │   ├── frontend/
    │   │   └── server/
    │   └── server/
    └── ...
```

## Quick Reference Commands

```bash
# Development
npm run electron:dev          # Start in development mode

# Building
npm run build                 # Build frontend
npm run dist:win              # Build Windows .exe
npm run dist                  # Build for all platforms
npm run pack                  # Build without installer (for testing)

# Installation
npm install                   # Install all dependencies
npm run postinstall          # Install app dependencies
```

## Notes

- The first build may take several minutes as it downloads Electron binaries
- Subsequent builds are faster
- The built application is self-contained and doesn't require Node.js on the client's machine
- All dependencies are bundled with the executable

## Support

If you encounter issues:
1. Check the console output for error messages
2. Verify all prerequisites are installed
3. Ensure ports 3000 and 5000 are available
4. Check that all dependencies are correctly installed

## Version History

- v1.0.0 - Initial Electron setup with Next.js and Express backend


