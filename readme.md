# OpenBook 

An open-source, privacy-first study assistant for students with learning disabilities. Powered by local AI via Ollama — no data leaves your machine.

## Features

- Upload and manage PDF documents
- Chat with your documents using local AI
- Generate summaries
- Flashcards with spaced repetition
- Exam questions
- Multiple choice questions
- Accessibility features — dyslexia font, high contrast, reading ruler, font size control
- Dark/light theme

---

## Running with Docker (Recommended)

The easiest way to run OpenBook. Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

### Prerequisites
- Docker Desktop installed and running
- [Ollama](https://ollama.com) installed and running locally
- A model pulled in Ollama e.g. `ollama pull llama3.2`

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/openbook.git
cd openbook

# 2. Start the full stack
docker compose up --build
```

That's it. The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

To stop:
```bash
docker compose down
```

To start again without rebuilding:
```bash
docker compose up -d
```

---

## Running Manually

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 16
- [Ollama](https://ollama.com) installed and running
- A model pulled e.g. `ollama pull llama3.2`

### 1. Database

Start PostgreSQL and create the database:

```bash
psql -U postgres -c "CREATE DATABASE openbook;"
```

### 2. Backend

```bash
cd openbook-backend

# Create and activate virtual environment
python3.11 -m venv venv
source venv/bin/activate  # on Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your database URL and Ollama settings

# Run migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload
```

Backend runs at http://localhost:8000

### 3. Frontend

```bash
cd openbook-frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at http://localhost:5173

### 4. Ollama

Make sure Ollama is running:

```bash
ollama serve
```

Pull a model if you haven't already:

```bash
ollama pull llama3.2
# or
ollama pull gemma4:e2b
# or any other model that supports tools
```

---

## Environment Variables

Create a `.env` file in `openbook-backend/` based on this template:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/openbook
UPLOADS_DIR=uploads
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS, shadcn/ui |
| Routing | TanStack Router |
| State | Zustand |
| Backend | FastAPI, Python |
| Database | PostgreSQL |
| ORM | SQLAlchemy (async) |
| Migrations | Alembic |
| AI | Ollama (local) |
| Container | Docker + Docker Compose |

---

## Contributing

OpenBook is open source and contributions are welcome. Please open an issue or pull request on GitHub.

---

## Support the Developer

If OpenBook helps you or someone you know, consider supporting its development:

- ⭐ Star the repo on GitHub
