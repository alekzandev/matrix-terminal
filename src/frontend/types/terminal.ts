export interface TerminalLine {
  id: string;
  content: string;
  type: 'output' | 'input' | 'prompt' | 'system';
  timestamp: number;
  isTyping?: boolean;
}

export interface TerminalState {
  lines: TerminalLine[];
  currentInput: string;
  isWaitingForResponse: boolean;
  sessionId: string;
  connected: boolean;
}

export interface UserMessage {
  type: 'user_input';
  sessionId: string;
  content: string;
  timestamp: number;
}

export interface AIResponse {
  type: 'ai_response';
  sessionId: string;
  content: string;
  prompt?: string;
  options?: string[];
  timestamp: number;
}

export type TerminalMessage = UserMessage | AIResponse;
