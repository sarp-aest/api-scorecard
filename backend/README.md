
# API Readiness Scorecard

A smart API analysis tool that parses OpenAPI specifications to score the readiness of your API documentation. It now supports direct spec files and human-facing documentation pages that embed those specs.

---

## ✨ Features

- Accepts OpenAPI specs via:
  - File upload (`/api/upload`)
  - URL to raw spec (`/api/upload-url`)
  - URL to public documentation pages (e.g., Swagger UI, Redoc)
- Automatically extracts OpenAPI spec URLs from HTML pages
- Parses `.yaml` and `.json`
- Evaluates APIs based on:
  - Authentication schemes
  - Response examples
  - Schema definitions
  - HTTP status code coverage
  - Description/documentation completeness
- Returns:
  - Readiness score (0–100)
  - Letter grade (A–F)
  - Detailed breakdown and missing documentation flags

---

## 🚀 Setup & Run

### 1. Install dependencies

```bash
npm install express express-fileupload swagger-parser axios js-yaml cheerio
```

### 2. Start the server

```bash
node server.js
```

It runs at: `http://localhost:3001`

---

## 📤 Endpoints

### POST `/api/upload`

Upload a local `.yaml` or `.json` OpenAPI file.

#### Example:
```bash
curl -X POST http://localhost:3001/api/upload -F "apiSpec=@your-spec.yaml"
```

---

### POST `/api/upload-url`

Submit a URL to either:
- A direct `.yaml`/`.json` spec file, OR
- A documentation page (e.g., Swagger UI or Redoc)

#### Body:
```json
{
  "url": "https://docs.example.com/docs/api-docs/overview"
}
```

---

## 🧠 Scoring Breakdown

| Metric                | Weight |
|-----------------------|--------|
| Auth type present     | 20 pts |
| Response examples     | 15 pts |
| Response schemas      | 15 pts |
| Status code coverage  | 20 pts |
| Description coverage  | 30 pts |

Also returns grade:
- 90+ → A
- 80–89 → B
- 70–79 → C
- 60–69 → D
- <60 → F

---

## 🧱 Folder Structure

```
server.js               # Main backend logic
extractSpecUrl.js       # HTML parser for embedded spec links
README.md               # This file
```

---

## 📌 License

MIT
