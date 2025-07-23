import { UserMessage, AIResponse, TerminalMessage, Question } from '../types/terminal.js';

// Interface for user creation API
export interface CreateUserRequest {
  userEmail: string;
  sessionId: string;
  timestamp?: string;
}

export interface CreateUserResponse {
  status: string;
  message: string;
  filename: string;
  user: {
    userEmail: string;
    sessionId: string;
    createdAt: string;
  };
}

// Interface for winner count API
export interface WinnerCountRequest {
  userEmail?: string;
  sessionId?: string;
}

export interface WinnerCountResponse {
  status: string;
  message: string;
  winnerCount: number;
  updatedAt?: string;
}

export class TerminalAPI {
  private baseUrl: string;
  private goApiUrl: string;

  constructor(baseUrl = 'http://localhost:8000', goApiUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
    this.goApiUrl = goApiUrl;
  }

  async processInput(sessionId: string, input: string): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          input: input,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        type: 'ai_response',
        sessionId: sessionId,
        content: data.content || 'No response from AI service',
        prompt: data.prompt,
        options: data.options,
        timestamp: Date.now()
      };

    } catch (error) {
      // Return fallback response
      return {
        type: 'ai_response',
        sessionId: sessionId,
        content: 'Error: Unable to process request. AI service may be unavailable.',
        timestamp: Date.now()
      };
    }
  }

  async getSessionInfo(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/session/${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      return null;
    }
  }

  async resetSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/session/${sessionId}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return response.ok;

    } catch (error) {
      return false;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Create user session file via Go API
  async createUser(userEmail: string, sessionId: string): Promise<CreateUserResponse> {
    try {
      const timestamp = new Date().toISOString();
      
      const response = await fetch(`${this.goApiUrl}/user/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          sessionId,
          timestamp
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      throw error;
    }
  }

  // Get question by ID from Go API
  async getQuestion(questionId: string): Promise<Question> {
    try {
      const response = await fetch(`${this.goApiUrl}/question?id=${questionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Get answer by question ID from Go API
  async getAnswer(questionId: string): Promise<{ question_id: string; answer: string; description?: string }> {
    try {
      const response = await fetch(`${this.goApiUrl}/answer?question_id=${questionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Get random question IDs from Go API
  async getRandomQuestions(profile: string = "1"): Promise<{profile: string, questionIds: number[]}> {
    try {
      const response = await fetch(`${this.goApiUrl}/choose-questions?profile=${profile}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle backward compatibility - if the response is just an array, convert it
      if (Array.isArray(result)) {
        return {
          profile: "1",
          questionIds: result
        };
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Update user session file with questions and answers via Go API
  async updateUserWithAnswers(userEmail: string, sessionId: string, questionIds: number[], userAnswers: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.goApiUrl}/user/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          sessionId,
          questionIds,
          userAnswers
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return false;
      }

      const result = await response.json();
      return true;

    } catch (error) {
      return false;
    }
  }

  async updateUser(email: string, sessionId: string, questionId: string, answer: string): Promise<any> {
    try {
      const response = await fetch(`${this.goApiUrl}/user/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          sessionId,
          questionId,
          answer
        })
      });
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async evaluateAnswers(questionIds: string[], userAnswers: string[]): Promise<any> {
    try {
      const response = await fetch(`${this.goApiUrl}/evaluate-answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionIds,
          userAnswers
        })
      });
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Simulated responses for offline/development mode
  getSimulatedResponse(input: string, sessionId: string): AIResponse {
    const responses = this.getResponseMap();
    const normalizedInput = input.toLowerCase().trim();
    
    let content = responses[normalizedInput] || this.getDefaultResponse(input);

    return {
      type: 'ai_response',
      sessionId: sessionId,
      content: content,
      timestamp: Date.now()
    };
  }

  private getResponseMap(): Record<string, string> {
    return {
      '1': 'Accessing data analysis modules...\n\nSelect analysis type:\n> [a] User Behavior Analysis\n> [b] Performance Metrics\n> [c] Trend Analysis\n> [d] Custom Query Builder',
      
      '2': 'System Status Report:\n\n' +
           '◉ Status: ONLINE\n' +
           '◉ CPU Usage: 45.2%\n' +
           '◉ Memory: 12.3GB / 16GB\n' +
           '◉ Uptime: 47:23:15\n' +
           '◉ Matrix Protocols: ACTIVE\n' +
           '◉ Neural Network: SYNCHRONIZED\n' +
           '◉ AI Services: OPERATIONAL',
      
      '3': 'ConvAnalytics Matrix Terminal - Help\n\n' +
           'Available Commands:\n' +
           '• Numbers 1-4: Navigate main menu options\n' +
           '• Natural language: Ask questions or make requests\n' +
           '• "clear": Clear terminal output\n' +
           '• "exit": Disconnect from terminal\n' +
           '• "status": Show system status\n' +
           '• "help": Show this help message\n\n' +
           'Navigation:\n' +
           '• ↑/↓ arrows: Browse command history\n' +
           '• Tab: Auto-complete (coming soon)\n' +
           '• Esc: Cancel current operation',
      
      '4': 'Custom Query Mode Activated\n\n' +
           'You can now ask questions in natural language.\n' +
           'Examples:\n' +
           '• "Show me user engagement trends"\n' +
           '• "What are the top performing features?"\n' +
           '• "Analyze conversion rates by region"\n' +
           '• "Generate a dashboard for mobile users"\n\n' +
           'Please describe what you would like to analyze:',
      
      'a': 'User Behavior Analysis Module\n\n' +
           'Available metrics:\n' +
           '• Session duration and frequency\n' +
           '• Click-through rates\n' +
           '• User journey mapping\n' +
           '• Feature adoption rates\n' +
           '• Churn prediction\n\n' +
           'Select a metric or ask a specific question:',
      
      'b': 'Performance Metrics Dashboard\n\n' +
           'Current Performance:\n' +
           '• Response Time: 245ms avg\n' +
           '• Throughput: 1,247 req/sec\n' +
           '• Error Rate: 0.03%\n' +
           '• Availability: 99.97%\n' +
           '• Cache Hit Rate: 94.2%\n\n' +
           'What would you like to analyze?',
      
      'c': 'Trend Analysis Engine\n\n' +
           'Available trend categories:\n' +
           '• Traffic patterns (hourly, daily, weekly)\n' +
           '• User growth and retention\n' +
           '• Feature usage trends\n' +
           '• Revenue and conversion trends\n' +
           '• Seasonal patterns\n\n' +
           'Which trend would you like to explore?',
      
      'clear': '', // Special case - will clear terminal
      
      'exit': 'Disconnecting from Matrix Terminal...\n' +
              'Saving session data...\n' +
              'Connection terminated.\n\n' +
              'Thank you for using ConvAnalytics Matrix Terminal.',
      
      'status': 'Quick Status Check:\n\n' +
                '◉ Terminal: ACTIVE\n' +
                '◉ Session: AUTHENTICATED\n' +
                '◉ Data Pipeline: FLOWING\n' +
                '◉ AI Engine: LEARNING\n' +
                '◉ Matrix Grid: STABLE\n\n' +
                'All systems operational.',
      
      'help': 'Quick Help - Type "3" for detailed help'
    };
  }

  private getDefaultResponse(input: string): string {
    const templates = [
      `Processing query: "${input}"\n\nAnalyzing request patterns...\nGenerating insights...\n\nQuery processed successfully.\n\nOptions:\n> [1] Run Full Analysis\n> [2] Export Results\n> [3] Modify Query\n> [4] Return to Main Menu`,
      
      `Analyzing: "${input}"\n\nSearching knowledge base...\nApplying ML models...\nCross-referencing data sources...\n\nAnalysis complete. Would you like to:\n> [a] View detailed results\n> [b] Generate visualization\n> [c] Export to dashboard\n> [d] Ask follow-up question`,
      
      `Understanding request: "${input}"\n\nProcessing natural language...\nMapping to available data...\nPreparing response...\n\nI can help you with that. Please specify:\n> What time range should I analyze?\n> Which user segments interest you?\n> What format would you prefer?`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  // Winner count API methods
  async getWinnerCount(): Promise<WinnerCountResponse> {
    try {
      const response = await fetch(`${this.goApiUrl}/winner/count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  async incrementWinnerCount(userEmail?: string, sessionId?: string): Promise<WinnerCountResponse> {
    try {
      const requestBody: WinnerCountRequest = {};
      if (userEmail) requestBody.userEmail = userEmail;
      if (sessionId) requestBody.sessionId = sessionId;

      const response = await fetch(`${this.goApiUrl}/winner/increment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }
}
