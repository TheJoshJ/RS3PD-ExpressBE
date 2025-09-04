# 🗡️ RS3 Player Dashboard Backend

> A comprehensive backend service for RuneScape 3 players, featuring secure image management, player data retrieval, and interactive API documentation.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21+-lightgrey.svg)](https://expressjs.com/)
[![Swagger](https://img.shields.io/badge/Swagger-Interactive-orange.svg)](http://localhost:3000/api-docs)

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Environment Setup](#-environment-setup)
- [API Documentation](#-api-documentation)
- [API Endpoints](#-api-endpoints)
- [Authentication](#-authentication)
- [Usage Examples](#-usage-examples)
- [Development](#-development)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- **🔐 Secure Image Management**: Upload and view images with Bearer token authentication
- **📊 Multiple Pagination Methods**: Continuation tokens, offset-based, and page-based pagination
- **🎮 RuneScape Data Integration**: Player stats, experience history, and high scores
- **📚 Interactive API Documentation**: Full Swagger UI documentation
- **☁️ Cloudflare R2 Integration**: Scalable cloud storage for images
- **🛡️ Type-Safe**: Full TypeScript implementation with proper error handling
- **🚀 Production Ready**: CORS enabled, environment-based configuration

## 🚀 Quick Start

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd rs3pd-expressbe
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **View API documentation:**
   - 📖 **Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
   - 🏠 **Health Check**: [http://localhost:3000/](http://localhost:3000/)

## ⚙️ Environment Setup

Create a `.env` file in the root directory:

```env
# API Authentication
API_KEY=your_secret_api_key_here

# Cloudflare R2 Storage Configuration
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET=your_r2_bucket_name
R2_PUBLIC_DOMAIN=https://www.your-domain.com

# Server Configuration (optional)
PORT=3000
NODE_ENV=development
```

### 🔑 Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `API_KEY` | Secret key for image endpoints | `my_secret_key_123` |
| `R2_ACCOUNT_ID` | Cloudflare R2 Account ID | `1234567890abcdef` |
| `R2_ACCESS_KEY_ID` | R2 Access Key ID | `your_access_key` |
| `R2_SECRET_ACCESS_KEY` | R2 Secret Access Key | `your_secret_key` |
| `R2_BUCKET` | R2 Bucket name | `my-images-bucket` |
| `R2_PUBLIC_DOMAIN` | Public domain for images | `https://www.example.com` |

> **⚠️ Important**: Always use the `www.` prefix in `R2_PUBLIC_DOMAIN` for CDN compatibility with your live site.

## 📖 API Documentation

### Interactive Documentation
🔗 **[Swagger UI](http://localhost:3000/api-docs)** - Full interactive API documentation

Features:
- ✅ Try endpoints directly in the browser
- ✅ View request/response schemas
- ✅ Test authentication
- ✅ Generate API client code
- ✅ Download OpenAPI specification

## 🎯 API Endpoints

### 🔐 Image Management (Requires Authentication)

#### Upload Images
```http
POST /api/v1/images/upload/upload-url
Authorization: Bearer <your-api-key>
Content-Type: application/json

{
  "filename": "screenshot.jpg",
  "contentType": "image/jpeg"
}
```

#### View Images with Pagination
```http
GET /api/v1/images/view?limit=20&page=1
Authorization: Bearer <your-api-key>
```

### 📊 RuneScape Data (Public)

#### Player Data
```http
GET /api/v1/player-data?username=Zezima&quests=true
```

#### Experience History
```http
GET /api/v1/experience-history?username=Zezima&skillId=0
```

#### High Scores
```http
GET /api/v1/high-scores
```

## 🔐 Authentication

### Bearer Token Authentication

All image management endpoints require authentication using Bearer tokens:

**Header Format:**
```
Authorization: Bearer <your-api-key>
```

**Example:**
```bash
curl -H "Authorization: Bearer my_secret_key_123" \
  "http://localhost:3000/api/v1/images/view"
```

### Error Responses

**Missing Authentication:**
```json
{
  "error": "Authorization header is required",
  "message": "Please provide an Authorization header with Bearer token"
}
```

**Invalid Token:**
```json
{
  "error": "Invalid API key",
  "message": "The provided API key is not valid"
}
```

## 💡 Usage Examples

### Image Upload Flow

1. **Get Upload URL:**
```bash
curl -X POST http://localhost:3000/api/v1/images/upload/upload-url \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "my-screenshot.jpg",
    "contentType": "image/jpeg"
  }'
```

2. **Upload File to Signed URL:**
```bash
curl -X PUT -T my-screenshot.jpg "SIGNED_UPLOAD_URL_FROM_STEP_1"
```

3. **View Uploaded Images:**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/api/v1/images/view?limit=10"
```

### Pagination Examples

**Continuation Token (Recommended):**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/api/v1/images/view?limit=20&continuationToken=NEXT_TOKEN"
```

**Offset-based:**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/api/v1/images/view?limit=20&offset=40"
```

**Page-based:**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/api/v1/images/view?limit=20&page=3"
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start           # Start production server
npm run docs        # View docs URL info
```

### Project Structure

```
src/
├── app.ts                    # Express app configuration
├── server.ts                 # Server entry point
├── middlewares/
│   └── authMiddleware.ts     # API key authentication
├── routes/
│   ├── index.ts             # Main routes
│   └── api/v1/
│       ├── images/          # Image management routes
│       │   ├── index.ts     # Images router
│       │   ├── upload.ts    # Upload functionality
│       │   └── view.ts      # View/list functionality
│       ├── getPlayerData.ts # Player data endpoint
│       ├── getHighScores.ts # High scores endpoint
│       └── getExperienceHistory.ts # XP history endpoint
└── utils/
    └── async.ts             # Utility functions
```

### Building for Production

```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

### Development Guidelines

- Use TypeScript for all new code
- Follow existing code style and patterns
- Add JSDoc comments for new functions
- Update Swagger documentation for new endpoints
- Write clear commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/) and [TypeScript](https://www.typescriptlang.org/)
- API documentation powered by [Swagger](https://swagger.io/)
- Cloud storage via [Cloudflare R2](https://www.cloudflare.com/products/r2/)
- RuneScape data from [RuneScape APIs](https://runescape.wiki/w/RuneScape:Real-time_API)

---

**Made with ❤️ for the RuneScape community**

📧 **Questions?** Feel free to open an issue or reach out!
🔗 **API Docs**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)