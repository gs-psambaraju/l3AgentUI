# L3 Agent UI

A modern React-based chat interface for the L3 Agent that provides intelligent error diagnosis and troubleshooting assistance for Gainsight connectors.

## 🎯 Project Goal

Build a modern React chat interface for L3 Agent - intelligent error diagnosis for Gainsight connectors.
**Target**: Reduce L3 escalations from 25% to 5%.

## 🚀 Features

- **Chat-style Interface**: WhatsApp/Slack-like conversation flow
- **Error Analysis**: Paste stack traces and get intelligent diagnosis
- **Dynamic Questioning**: Progressive diagnostic questions based on AI analysis
- **Resolution Display**: Step-by-step solution guidance
- **Confidence Indicators**: Visual confidence levels and explanations
- **Conversation Management**: New chat, conversation history, escalation flows
- **Responsive Design**: Modern, mobile-friendly UI

## 🛠️ Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Build Tool**: Vite
- **State Management**: React Context API

## 📋 Prerequisites

- Node.js 18+ and npm
- L3 Agent Backend running on `http://localhost:8080`

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to `http://localhost:5173`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_NAME=L3 Agent
VITE_APP_VERSION=1.0.0
```

### API Integration

The application connects to the L3 Agent backend API:

- **Base URL**: `http://localhost:8080`
- **Health Check**: `GET /api/v1/conversations/health`
- **Start Conversation**: `POST /api/v1/conversations`
- **Continue Conversation**: `POST /api/v1/conversations/{id}/message`

## 📁 Project Structure

```
src/
├── components/
│   ├── Chat/              # Chat UI components
│   │   ├── ChatContainer.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── InputArea.tsx
│   │   ├── QuestionCard.tsx
│   │   └── ConfidenceBar.tsx
│   └── Common/            # Reusable components
│       └── Button.tsx
├── services/              # API integration
│   ├── api.ts
│   └── conversationService.ts
├── hooks/                 # Custom React hooks
│   └── useConversation.ts
├── context/               # React Context
│   └── ConversationContext.tsx
├── types/                 # TypeScript definitions
│   └── index.ts
├── utils/                 # Constants and helpers
│   └── constants.ts
├── App.tsx
└── main.tsx
```

## 🎨 Usage

### Starting a Conversation

1. Paste your stack trace or error details in the input area
2. Optionally provide error description and connector type
3. Click "Start Analysis" to begin the diagnostic process

### Answering Questions

1. The AI will ask diagnostic questions based on the error analysis
2. Answer each question using the appropriate input type (text, yes/no, URL, etc.)
3. Click "Submit Answers" to continue the conversation

### Getting Resolution

1. Once enough information is gathered, the system will provide:
   - Root cause analysis
   - Step-by-step solution guidance
   - Copy-to-clipboard functionality

### Escalation

If the issue cannot be resolved automatically, it will be escalated to L3 engineering with:
- Escalation package with priority level
- Technical details and customer impact
- Attempted solutions and next steps

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Options

- **Netlify**: JAMstack hosting
- **AWS S3 + CloudFront**: Scalable static hosting
- **Docker**: Containerized deployment

## 🧪 API Health Check

The application includes automatic health checking of the backend API:

```typescript
// Health check endpoint
GET http://localhost:8080/api/v1/conversations/health

// Expected response
{
  "status": "healthy",
  "timestamp": "2025-05-24T11:26:19.824Z",
  "version": "1.0.0"
}
```

## 🎯 Key Features

### Conversation Flow

1. **Start**: User submits stack trace and error details
2. **Analysis**: AI analyzes the error and generates diagnostic questions
3. **Questions**: User answers progressive diagnostic questions
4. **Resolution**: System provides step-by-step solution or escalates to L3

### UI Components

- **MessageBubble**: Displays chat messages with timestamps and confidence
- **QuestionCard**: Renders dynamic questions with validation
- **ConfidenceBar**: Shows analysis confidence with color coding
- **InputArea**: Stack trace input with connector type selection

### State Management

- **ConversationContext**: Global state management for conversation flow
- **useConversation**: Custom hook for conversation actions and state

## 📚 Documentation

For complete API documentation and backend setup, refer to:
- `L3-Agent-API-Documentation.md`
- `Backend-Status-Report.md`
- `Technical-Implementation-Guide.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

© 2025 Gainsight. All rights reserved.

---

**Built with ❤️ by the Gainsight L3 Engineering Team** 