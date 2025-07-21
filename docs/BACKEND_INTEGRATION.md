# Matrix Terminal - Backend Integration

This document explains how the Matrix Terminal frontend integrates with the Go backend API for user session management.

## 🏗️ Architecture Overview

```
┌─────────────────┐    HTTP/REST    ┌─────────────────┐
│   Matrix        │ ──────────────→ │   Go Backend    │
│   Terminal      │                 │   (Port 8080)   │
│   (Frontend)    │ ←────────────── │                 │
└─────────────────┘    JSON API     └─────────────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │   File System   │
                                    │   data/*.txt    │
                                    └─────────────────┘
```

## 🔌 Integration Points

### 1. User Session Creation

**When**: After user enters their email in the terminal
**Endpoint**: `POST /user/create`
**Action**: Creates a session file `<email>_<sessionId>.txt`

**Frontend Code**:
```typescript
private async proceedAfterEmail(): Promise<void> {
  try {
    const result = await this.api.createUser(this.userEmail, this.sessionId);
    this.addSystemMessage(`✓ Sesión creada: ${result.filename}`);
  } catch (error) {
    this.addSystemMessage('⚠ Error al crear sesión de usuario');
  }
}
```

**File Created**:
```
data/user@example.com_session123.txt
```
```text
user@example.com
session123
```

### 2. Question Management

**When**: User selects profile (Créditos, Servicio, Clientes)
**Endpoints**: 
- `GET /choose-questions` - Get random question IDs
- `GET /question?id=<ID>` - Get specific question
- `GET /answer?question_id=<ID>` - Get answer for question

**Frontend Flow**:
```typescript
// Get random questions
const questionIds = await this.api.getRandomQuestions();

// Load first question
const questionId = `CRD${String(questionIds[0]).padStart(4, '0')}`;
const question = await this.api.getQuestion(questionId);
```

## 🚀 Usage Instructions

### 1. Start the Backend

```bash
cd src/backend/go/cmd
go run main.go
```

Server will start on `http://localhost:8080`

### 2. Start the Frontend

```bash
cd src/frontend
npm run dev
```

Frontend will start on `http://localhost:5173` (or similar)

### 3. Test the Integration

**Option A: Use the debug environment**
```bash
# Open debug.html directly
open http://localhost:5173/debug.html
```

**Option B: Run integration tests**
```bash
# Make sure Go server is running first
./tests/integration/test-api-integration.sh
```

## 🔄 User Flow

1. **Welcome Screen**: User sees Matrix-style welcome
2. **Enter to Continue**: User presses Enter to start
3. **Boot Sequence**: System shows loading messages
4. **Email Collection**: Terminal prompts for email
5. **Session Creation**: 
   - Frontend calls `POST /user/create`
   - Backend creates `data/<email>_<sessionId>.txt`
   - Frontend shows confirmation
6. **Profile Selection**: User chooses analysis profile
7. **Question Loading**: 
   - Frontend calls `GET /choose-questions`
   - Frontend calls `GET /question?id=<ID>`
   - Terminal displays questions

## 🛠️ API Service

The frontend uses a centralized API service (`services/terminal-api.ts`):

```typescript
export class TerminalAPI {
  constructor(baseUrl = 'http://localhost:8000', goApiUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl;      // Python AI service (future)
    this.goApiUrl = goApiUrl;    // Go backend (current)
  }

  // User management
  async createUser(userEmail: string, sessionId: string): Promise<CreateUserResponse>
  
  // Question management  
  async getQuestion(questionId: string): Promise<Question>
  async getAnswer(questionId: string): Promise<Answer>
  async getRandomQuestions(): Promise<number[]>
}
```

## 🔍 Debugging

### Frontend Debugging
- Open browser DevTools Console
- Check network tab for API calls
- Use `debugTerminal` utilities in debug.html

### Backend Debugging
- Check Go server logs for file creation
- Verify files in `data/` directory
- Test API endpoints with curl:

```bash
# Test user creation
curl -X POST http://localhost:8080/user/create \
  -H "Content-Type: application/json" \
  -d '{"userEmail": "test@example.com", "sessionId": "session123"}'

# Test question retrieval
curl http://localhost:8080/question?id=CRD0001
```

## 📁 File Structure

```
src/
├── frontend/
│   ├── components/
│   │   └── matrix-terminal.ts      # Main terminal component
│   ├── services/
│   │   └── terminal-api.ts         # API integration service
│   └── debug.html                  # Debug environment
└── backend/
    └── go/
        └── cmd/
            └── main.go             # Go server with APIs

data/                               # Created by backend
└── user@example.com_session123.txt
```

## 🔮 Future Enhancements

1. **Python AI Integration**: Add NLP processing for dynamic responses
2. **WebSocket Support**: Real-time bidirectional communication
3. **Session Persistence**: Store terminal state and progress
4. **Analytics Dashboard**: Track user performance and engagement

This integration provides a solid foundation for the Matrix Terminal's backend communication and session management.
