# Quick Start Guide - Building Volt as .exe

## 🚀 Fast Track (3 Steps)

### 1. Install Dependencies
```bash
npm install
cd frontend && npm install && cd ..
cd server && npm install && cd ..
```

### 2. Build Frontend
```bash
cd frontend
npm run build
cd ..
```

### 3. Create .exe File
```bash
npm run dist:win
```

**Done!** Your .exe installer will be in the `dist/` folder.

---

## 📦 What You Get

After building, you'll find:
- **`dist/Volt Setup x.x.x.exe`** - Installer (recommended for distribution)
- **`dist/win-unpacked/Volt.exe`** - Portable version (no installation needed)

---

## 🧪 Test Before Building

To test the Electron app in development:

```bash
npm run electron:dev
```

This starts both servers and launches Electron automatically.

---

## ⚙️ Customization

### Change App Name
Edit `package.json` → `productName`

### Add Icon
1. Create `build/icon.ico` (256x256 pixels)
2. Rebuild: `npm run dist:win`

---

## ❓ Troubleshooting

**Build fails?**
- Run `npm install` in root, frontend, and server directories
- Make sure ports 3000 and 5000 are available

**App won't start?**
- Check console for errors (Ctrl+Shift+I in Electron)
- Verify both servers are running

**Need more help?**
See `README-EXE.md` for detailed documentation.















