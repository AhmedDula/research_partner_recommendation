# Researcher–Industry Partner Recommendation System: Backend

Backend for the graduation project. It imports research papers (CSV, manual entry, OpenAlex), stores them in MongoDB Atlas, and prepares data for the similarity (AI) component.

## Tech Stack

- Node.js (CommonJS), Express 5
- MongoDB Atlas, Mongoose
- Axios (external HTTP calls)
- Multer (file uploads), csv-parse (CSV parsing)
- Joi (validation), dotenv (environment variables)
- helmet, cors, hpp, compression, morgan (HTTP middleware)

## Project Structure

```
src/
  config/
    env.js                     # Reads and validates environment variables
    db.js                      # MongoDB connection with retry
  integrations/
    openalex/                  # OpenAlex API client and service
    ai/ai.api.js               # AI similarity service client (mock or real)
  middlewares/
    errorHandler.js            # Central error handler
  modules/
    research/                  # Research papers: model, validation, service, controller, routes
    similarity/                # Similarity run: validation, service, controller, routes
  utils/
    apiResponse.js             # ApiError and sendSuccess helpers
    csvParser.js               # CSV buffer to row objects
    fileUpload.js              # Multer config (CSV only, max 5 MB)
    normalizeResearch.js       # Normalizes raw records, computes contentHash
  app.js                       # Express app and middleware setup
  server.js                    # Entry point: connects DB, starts server
samples/
  research-data.csv            # Sample research dataset
  company-challenge.csv        # Sample company challenges
```

## Setup

### 1. Install dependencies

```powershell
npm install
```

### 2. Create the environment file

Copy `.env.example` to `.env` and fill in the values. Never commit `.env`.

```
NODE_ENV=development
PORT=5000
MONGO_URI=<MongoDB Atlas connection string>
CLIENT_URL=http://localhost:3000

# Reserved for the auth phase
JWT_ACCESS_SECRET=<at least 32 characters>
JWT_REFRESH_SECRET=<at least 32 characters>
PEPPER=<at least 32 characters>

# Optional: raises the OpenAlex daily budget
OPENALEX_API_KEY=

# AI similarity service
AI_SERVICE_MOCK=true
AI_SERVICE_URL=
AI_SERVICE_TIMEOUT_MS=15000
```

The server stops at startup if a required variable is missing or invalid.

### 3. Run

```powershell
npm run dev     # development, restarts on change (nodemon)
npm start       # production
```

Expected startup output:

```
MongoDB connected: <host>
Server running on port 5000 [development]
```

## Database

- Database name: `research_partner_recommendation`
- Collections:
  - `research_papers`: research records (source: `csv`, `manual`, or `openalex`)
  - `import_reports`: one report per import run, with counts and row-level errors

### Duplicate prevention

A record is rejected as a duplicate if any of these unique indexes is hit:

- `doi` (when present)
- `source` + `externalId` (when present, for OpenAlex records)
- `contentHash` (always set): SHA-256 of normalized title, year, and sorted authors

The `contentHash` covers records without a DOI, such as CSV rows.

## API Endpoints

Base URL: `http://localhost:5000/api/v1`

Every response has the shape `{ "success": true|false, "message": "...", "data": ... }`.

| Method | Route | Body | Purpose |
|---|---|---|---|
| GET | `/health` | none | Server status |
| POST | `/research/import` | form-data, field `file` (CSV) | Import a research CSV |
| POST | `/research/import-openalex` | JSON `{ "orcid": "0000-0002-1298-3089" }` | Import an author's works from OpenAlex |
| POST | `/research` | JSON (`title` required, plus optional fields) | Create one research paper manually |
| GET | `/research` | query: `page`, `limit` (max 50), `year`, `keyword` | List papers with pagination |
| GET | `/research/:id` | none | Get one paper by id |
| POST | `/similarity/run` | form-data, fields `research` (CSV) and `challenge` (CSV) | Validate both files and run similarity |

### Status codes

- `200` / `201`: success
- `400`: invalid input, invalid file, or invalid id
- `404`: route or record not found, or no OpenAlex author for the ORCID
- `409`: duplicate record (manual create)
- `413`: file too large
- `429`: OpenAlex rate limit reached
- `502`: AI service returned an invalid response
- `503`: OpenAlex or AI service unavailable
- `504`: AI service timed out

### CSV formats

Research CSV (`research` field): columns `title`, `authors` (separated by `;`), `year`, `venue`, `doi`, `abstract`, `keywords` (separated by `;`). Only `title` is required by the model; `contentHash` is computed on import.

Challenge CSV (`challenge` field): required columns `title` and `description`. Optional columns: `domain`, `required_skills` (separated by `;`).

## Similarity Integration

`POST /similarity/run` validates both files, builds this payload, and sends it to the AI service:

```json
{
  "researchPapers": [{ "id": "R1", "title": "...", "abstract": "...", "keywords": [], "year": 2022, "authors": [] }],
  "challenges": [{ "id": "C1", "title": "...", "domain": "...", "description": "...", "requiredSkills": [] }]
}
```

Expected AI response:

```json
{ "matches": [{ "challengeId": "C1", "researchId": "R1", "score": 0.82 }] }
```

Matches are checked against the submitted ids and a score between 0 and 1. Invalid matches are dropped and counted in `dropped`.

**Status:** the payload and response shape are a draft. They must be agreed with the AI team. With `AI_SERVICE_MOCK=true` the service returns an empty match list without calling any external service.

## Testing

Manual API tests are done with Postman. Quick checks:

```powershell
curl.exe http://localhost:5000/api/v1/health
```

Recommended test order:

1. Health check returns `200`.
2. Import `samples/research-data.csv` twice. The second run should show `skipped: 3`.
3. Create a manual paper, then repeat it to get `409`.
4. List with `?page=1&limit=2`.
5. Import from OpenAlex with a known ORCID, then repeat to see duplicates skipped.
6. Run similarity with both sample files. Expected: `source: "mock"`, `matches: []`.
7. Error cases: missing file (`400`), `.txt` file (`400`), missing CSV column (`400`).

## Notes

- Authentication (JWT, bcrypt, roles) is not implemented yet. The related environment variables are validated but unused.
- OpenAlex abstracts are rebuilt from `abstract_inverted_index`. Many works have no abstract.
- Semantic Scholar and ORCID integrations are planned as supplementary sources. They are not implemented yet.