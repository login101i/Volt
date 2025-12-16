# Volt Server

Basic Express.js server application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Start the server:
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## Project Structure

```
server/
├── server.js              # Main server file
├── routes/
│   └── index.js          # Route definitions
├── controllers/
│   └── exampleController.js  # Controller functions
└── package.json
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/example` - Example GET endpoint
- `POST /api/example` - Example POST endpoint






