import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { TerminalLine, TerminalState } from '../types/terminal.js';
import './terminal-input.js';
import './terminal-output.js';
import './terminal-cursor.js';

@customElement('matrix-terminal')
export class MatrixTerminal extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      background: #000000;
      font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
      position: relative;
      overflow: hidden;
    }

    .terminal-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      padding: 20px;
      box-sizing: border-box;
    }

    .terminal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #003300;
      margin-bottom: 15px;
    }

    .terminal-title {
      color: #00ff41;
      font-size: 16px;
      font-weight: 500;
      text-shadow: 0 0 5px rgba(0, 255, 65, 0.3);
    }

    .terminal-status {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      color: #008f11;
    }

    .connection-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #00ff41;
      box-shadow: 0 0 5px #00ff41;
      animation: pulse 2s ease-in-out infinite;
    }

    .connection-indicator.disconnected {
      background-color: #ff4444;
      box-shadow: 0 0 5px #ff4444;
      animation: none;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .terminal-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .scanlines {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      background: linear-gradient(
        transparent 50%,
        rgba(0, 255, 65, 0.03) 50%
      );
      background-size: 100% 4px;
      animation: scanlines 0.1s linear infinite;
    }

    @keyframes scanlines {
      0% { transform: translateY(0); }
      100% { transform: translateY(4px); }
    }

    .screen-flicker {
      animation: flicker 0.15s ease-in-out infinite;
    }

    @keyframes flicker {
      0%, 98% { opacity: 1; }
      99% { opacity: 0.95; }
      100% { opacity: 1; }
    }

    .welcome-screen {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      color: #00ff41;
    }

    .welcome-logo {
      font-size: 32px;
      font-weight: 500;
      margin-bottom: 20px;
      text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
      animation: logo-glow 3s ease-in-out infinite;
    }

    @keyframes logo-glow {
      0%, 100% { text-shadow: 0 0 10px rgba(0, 255, 65, 0.5); }
      50% { text-shadow: 0 0 20px rgba(0, 255, 65, 0.8), 0 0 30px rgba(0, 255, 65, 0.3); }
    }

    .welcome-message {
      font-size: 14px;
      line-height: 1.6;
      max-width: 600px;
      color: #008f11;
      margin-bottom: 30px;
    }

    .boot-sequence {
      color: #00ff41;
      font-size: 12px;
      text-align: left;
      opacity: 0;
      animation: boot-appear 0.5s ease-out forwards;
    }

    @keyframes boot-appear {
      to { opacity: 1; }
    }

    .matrix-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      z-index: -1;
      opacity: 0.1;
    }
  `;

  @property({ type: String })
  sessionId = this.generateSessionId();

  @state()
  private terminalState: TerminalState = {
    lines: [],
    currentInput: '',
    isWaitingForResponse: false,
    sessionId: this.sessionId,
    connected: false
  };

  @state()
  private showWelcome = true;

  @state()
  private bootSequence = false;

  private matrixChars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  protected firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated(_changedProperties);
    this.initializeTerminal();
    this.startMatrixBackground();
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9);
  }

  private async initializeTerminal(): Promise<void> {
    // Simulate boot sequence
    this.bootSequence = true;
    
    await this.delay(1000);
    
    // Add boot messages
    this.addBootMessages();
    
    await this.delay(2000);
    
    // Hide welcome screen and show terminal
    this.showWelcome = false;
    this.terminalState.connected = true;
    
    // Add initial greeting
    this.addSystemMessage('System initialized. Connection established.');
    this.addSystemMessage('Matrix Terminal v1.0.0 - Ready for interaction.');
    
    await this.delay(500);
    
    // Add initial prompt
    this.addPromptMessage('Welcome to the ConvAnalytics Matrix Terminal.');
    this.addPromptMessage('What would you like to explore today?');
    this.addPromptMessage('> [1] Data Analysis  [2] System Info  [3] Help  [4] Custom Query');
    
    this.requestUpdate();
  }

  private addBootMessages(): void {
    const bootMessages = [
      'Initializing Matrix Protocol...',
      'Loading neural pathways...',
      'Establishing quantum entanglement...',
      'Calibrating reality matrix...',
      'Connection secured.',
      'Welcome to the Matrix.'
    ];

    bootMessages.forEach((message, index) => {
      setTimeout(() => {
        this.addSystemMessage(message);
      }, index * 300);
    });
  }

  private addSystemMessage(content: string): void {
    const line: TerminalLine = {
      id: this.generateLineId(),
      content,
      type: 'system',
      timestamp: Date.now()
    };
    
    this.terminalState.lines.push(line);
    this.requestUpdate();
  }

  private addPromptMessage(content: string): void {
    const line: TerminalLine = {
      id: this.generateLineId(),
      content,
      type: 'prompt',
      timestamp: Date.now(),
      isTyping: true
    };
    
    this.terminalState.lines.push(line);
    this.requestUpdate();
    
    // Simulate typing effect
    setTimeout(() => {
      line.isTyping = false;
      this.requestUpdate();
    }, content.length * 50);
  }

  private addUserInput(content: string): void {
    const line: TerminalLine = {
      id: this.generateLineId(),
      content: `> ${content}`,
      type: 'input',
      timestamp: Date.now()
    };
    
    this.terminalState.lines.push(line);
    this.requestUpdate();
  }

  private addOutput(content: string): void {
    const line: TerminalLine = {
      id: this.generateLineId(),
      content,
      type: 'output',
      timestamp: Date.now(),
      isTyping: true
    };
    
    this.terminalState.lines.push(line);
    this.requestUpdate();
    
    // Simulate typing effect
    setTimeout(() => {
      line.isTyping = false;
      this.requestUpdate();
    }, content.length * 30);
  }

  private generateLineId(): string {
    return 'line_' + Math.random().toString(36).substr(2, 9);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleUserInput(event: CustomEvent<string>): void {
    const input = event.detail.trim();
    
    if (!input) return;

    // Add user input to terminal
    this.addUserInput(input);
    
    // Set waiting state
    this.terminalState.isWaitingForResponse = true;
    this.requestUpdate();
    
    // Process input (simulated for now)
    this.processUserInput(input);
  }

  private async processUserInput(input: string): Promise<void> {
    // Simulate processing delay
    await this.delay(1000 + Math.random() * 1000);
    
    // Simple command processing (stub)
    let response = '';
    
    if (input === '1' || input.toLowerCase().includes('data')) {
      response = 'Accessing data analysis modules...\nSelect analysis type:\n> [a] User Behavior  [b] Performance Metrics  [c] Trend Analysis';
    } else if (input === '2' || input.toLowerCase().includes('system')) {
      response = 'System Status: ONLINE\nCPU: 45% | RAM: 12.3GB/16GB | Uptime: 47:23:15\nMatrix Protocols: ACTIVE\nNeural Network: SYNCHRONIZED';
    } else if (input === '3' || input.toLowerCase().includes('help')) {
      response = 'Available commands:\n• Type numbers 1-4 to navigate main menu\n• Use natural language for custom queries\n• Type "clear" to clear terminal\n• Type "exit" to disconnect';
    } else if (input === '4' || input.toLowerCase().includes('query')) {
      response = 'Custom Query Mode activated.\nPlease describe what you would like to analyze or explore:';
    } else if (input.toLowerCase() === 'clear') {
      this.terminalState.lines = [];
      this.addPromptMessage('Terminal cleared. What would you like to do next?');
      this.terminalState.isWaitingForResponse = false;
      this.requestUpdate();
      return;
    } else if (input.toLowerCase() === 'exit') {
      response = 'Disconnecting from Matrix Terminal...\nConnection terminated.\nThank you for using ConvAnalytics.';
      this.terminalState.connected = false;
    } else {
      response = `Processing query: "${input}"\nAnalyzing request...\nQuery processed. Would you like to:\n> [1] Run Analysis  [2] Export Data  [3] Modify Query  [4] Return to Menu`;
    }
    
    this.addOutput(response);
    this.terminalState.isWaitingForResponse = false;
    this.requestUpdate();
  }

  private startMatrixBackground(): void {
    const container = this.shadowRoot?.querySelector('.matrix-background');
    if (!container) return;

    const createMatrixChar = () => {
      const char = document.createElement('div');
      char.textContent = this.matrixChars[Math.floor(Math.random() * this.matrixChars.length)];
      char.style.position = 'absolute';
      char.style.left = Math.random() * 100 + '%';
      char.style.color = '#00ff41';
      char.style.fontSize = (10 + Math.random() * 8) + 'px';
      char.style.fontFamily = 'Fira Code, monospace';
      char.style.animation = `matrix-fall ${3 + Math.random() * 4}s linear forwards`;
      char.style.opacity = '0.6';

      container.appendChild(char);

      setTimeout(() => {
        char.remove();
      }, 7000);
    };

    // Create periodic matrix chars
    setInterval(createMatrixChar, 150);
  }

  render() {
    if (this.showWelcome) {
      return html`
        <div class="terminal-container screen-flicker">
          <div class="scanlines"></div>
          <div class="matrix-background"></div>
          
          <div class="welcome-screen">
            <div class="welcome-logo">◉ CONVANALYTICS</div>
            <div class="welcome-message">
              Matrix-Style Interactive Terminal<br>
              Establishing secure connection...
            </div>
            
            ${this.bootSequence ? html`
              <div class="boot-sequence">
                <div>Initializing Matrix Protocol...</div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    return html`
      <div class="terminal-container screen-flicker">
        <div class="scanlines"></div>
        <div class="matrix-background"></div>
        
        <div class="terminal-header">
          <div class="terminal-title">◉ ConvAnalytics Matrix Terminal</div>
          <div class="terminal-status">
            <div class="connection-indicator ${this.terminalState.connected ? 'connected' : 'disconnected'}"></div>
            <span>${this.terminalState.connected ? 'CONNECTED' : 'DISCONNECTED'}</span>
            <span>|</span>
            <span>Session: ${this.terminalState.sessionId}</span>
          </div>
        </div>

        <div class="terminal-content">
          <terminal-output 
            .lines=${this.terminalState.lines}
            .isWaitingForResponse=${this.terminalState.isWaitingForResponse}>
          </terminal-output>
          
          <terminal-input 
            .disabled=${this.terminalState.isWaitingForResponse || !this.terminalState.connected}
            @user-input=${this.handleUserInput}>
          </terminal-input>
        </div>
      </div>
    `;
  }
}
