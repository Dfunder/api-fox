# 🌟 StellarAid-api
StellarAid Backend is the server-side API powering the StellarAid crowdfunding platform — a blockchain‑enabled system built on the Stellar network to support transparent, secure, and efficient fundraising for social impact initiatives.


# Folder structure 
```bash
/src
  /app.ts                # Express app bootstrap (middleware, routes registry)
  /server.ts             # HTTP server startup

  /config                # configuration & env loading
    env.ts
    logger.ts
    rateLimit.ts
    security.ts

  /database              # DB client & schema (Prisma/TypeORM/knex/etc.)
    index.ts
    prismaClient.ts      # (if using Prisma)
    migrations/          # (tool-specific)

  /common                # shared cross-cutting concerns
    /middlewares
      errorHandler.ts
      notFound.ts
      requireAuth.ts
      validate.ts
    /utils
      crypto.ts
      pagination.ts
      response.ts
    /types
      express.d.ts       # custom Request types (e.g. req.user)
    /events 
```
## 📌 Features

### 🎯 For Donors
- Discover global fundraising campaigns  
- Donate in XLM or Stellar assets  
- Wallet integration (Freighter, Albedo, Lobstr)  
- On-chain transparency: verify all transactions  

### 🎯 For Creators
- Create social impact projects  
- Accept multi-asset contributions  
- Real-time donation tracking  
- Withdraw funds directly on-chain  

### 🎯 For Admins
- Campaign approval workflow  
- User & KYC management  
- Analytics dashboard  

## 🏗️ Architecture Overview

StellarAid  Backend is built with: 
- Express js  
- MongoDB   
- Horizon API integration  
- Worker processes (BullMQ)
  
# 📚 API Documentation (Swagger)

StellarAid API includes Swagger (OpenAPI) documentation for easy exploration and testing of endpoints.

## Accessing Swagger UI

When the application is running with Swagger enabled:

- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI JSON**: http://localhost:3000/docs-json

## Authentication in Swagger

1. Click the **"Authorize"** button in the top right of the Swagger UI
2. Enter your JWT token in the format: `Bearer <your-token>`
3. Click **"Authorize"** and close the dialog
4. All protected endpoints will now include the Authorization header

## Environment Configuration

Swagger is controlled via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |
| `ENABLE_SWAGGER` | Override to enable/disable Swagger explicitly | - |

### Behavior

- **Development**: Swagger is **enabled** by default
- **Production**: Swagger is **disabled** by default (set `ENABLE_SWAGGER=true` to override)
- **Explicit override**: Set `ENABLE_SWAGGER=true` or `ENABLE_SWAGGER=false` to force enable/disable regardless of environment

## Rate limiting configuration

The application ships with a built‑in rate limiter based on [`express-rate-limit`](https://www.npmjs.com/package/express-rate-limit). It protects the entire API with a permissive window, and adds a more restrictive policy to
all `/api/auth` endpoints.

| Variable             | Description                                                 | Default         |
|----------------------|-------------------------------------------------------------|-----------------|
| `RATE_LIMIT_WINDOW_MS` | Time window in milliseconds                                | `900000` (15m)  |
| `RATE_LIMIT_MAX`       | Max requests per window for general routes                 | `100`           |
| `AUTH_RATE_LIMIT_MAX`  | Max requests per window for auth routes                    | `10`            |

When a client exceeds the limit the server replies with `429 Too Many Requests` and a `Retry-After` header indicating how many seconds remain
in the current window.

## Example `.env` Configuration

```env
# Enable Swagger in production (not recommended for public APIs)
NODE_ENV=production
ENABLE_SWAGGER=true

# Or disable in development
NODE_ENV=development
ENABLE_SWAGGER=false

# Rate limiting (optional overrides)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10
```

# 📌 How to Contribute

### 1. Fork the Repository
Click the **"Fork"** button in the top‑right of the GitHub repo and clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/stellaraid-api.git
cd stellaraid-api
````
###  Backend Setup
``bash
cp .env.example .env
npm install
npm run start:dev
``

### 2. Create a Branch
````bash
git checkout -b feature/add-donation-flow
````

### 3. Commit Messages
Use conventional commits:
````bash
feat: add wallet connection endpoint
fix: resolve donation API error
docs: update project README
refactor: clean up project creation form
````
### 4. Submitting a Pull Request (PR)
Push your branch:
```bash
git push origin feature/add-donation-flow
```
Open a Pull Request from your fork back to the main branch.

# 📜 License
MIT License — free to use, modify, and distribute.
