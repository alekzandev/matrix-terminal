import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { TerminalLine } from '../types/terminal.js';

@customElement('terminal-output')
export class TerminalOutput extends LitElement {
  static styles = css`
    :host {
      display: block;
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding-right: 10px;
      scrollbar-width: thin;
      scrollbar-color: #003300 transparent;
    }

    :host::-webkit-scrollbar {
      width: 6px;
    }

    :host::-webkit-scrollbar-track {
      background: transparent;
    }

    :host::-webkit-scrollbar-thumb {
      background: #003300;
      border-radius: 3px;
    }

    :host::-webkit-scrollbar-thumb:hover {
      background: #008f11;
    }

    .terminal-line {
      display: flex;
      align-items: flex-start;
      margin-bottom: 4px;
      min-height: 20px;
      word-wrap: break-word;
      white-space: pre-wrap;
      animation: line-appear 0.3s ease-out forwards;
    }

    @keyframes line-appear {
      from {
        opacity: 0;
        transform: translateY(5px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .terminal-line.output {
      color: #00ff41;
      text-shadow: 0 0 5px rgba(0, 255, 65, 0.3);
    }

    .terminal-line.input {
      color: #00ff41;
      font-weight: 500;
    }

    .terminal-line.prompt {
      color: #008f11;
      font-weight: 500;
    }

    .terminal-line.system {
      color: #666666;
      font-style: italic;
      font-size: 12px;
    }

    .line-content {
      flex: 1;
      word-break: break-word;
    }

    .typing-effect {
      overflow: hidden;
      white-space: nowrap;
      border-right: 2px solid #00ff41;
      animation: 
        typing var(--typing-duration) steps(var(--char-count)),
        blink 1s step-end infinite;
    }

    @keyframes typing {
      from { width: 0; }
      to { width: 100%; }
    }

    @keyframes blink {
      0%, 50% { border-color: #00ff41; }
      51%, 100% { border-color: transparent; }
    }

    .loading-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #008f11;
      font-style: italic;
      margin: 10px 0;
    }

    .loading-dots {
      display: inline-flex;
      gap: 2px;
    }

    .loading-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #008f11;
      animation: loading-pulse 1.5s ease-in-out infinite;
    }

    .loading-dot:nth-child(2) {
      animation-delay: 0.2s;
    }

    .loading-dot:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes loading-pulse {
      0%, 80%, 100% {
        opacity: 0.3;
        transform: scale(0.8);
      }
      40% {
        opacity: 1;
        transform: scale(1);
      }
    }
  `;

  @property({ type: Array })
  lines: TerminalLine[] = [];

  @property({ type: Boolean })
  isWaitingForResponse = false;

  protected updated(): void {
    // Auto-scroll to bottom when new lines are added
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    this.scrollTop = this.scrollHeight;
  }

  private renderLine(line: TerminalLine) {
    const isTyping = line.isTyping;
    const charCount = line.content.length;
    
    return html`
      <div class="terminal-line ${line.type}">
        <div class="line-content ${isTyping ? 'typing-effect' : ''}"
             style=${isTyping ? `--char-count: ${charCount}; --typing-duration: ${charCount * 50}ms` : ''}>
          ${line.content}
        </div>
      </div>
    `;
  }

  render() {
    console.log('terminal-output render called with lines:', this.lines.length);
    console.log('lines content:', this.lines.map(line => ({ type: line.type, content: line.content.substring(0, 30) })));
    
    return html`
      ${this.lines.map(line => this.renderLine(line))}
      
      ${this.isWaitingForResponse ? html`
        <div class="loading-indicator">
          <span>Processing</span>
          <div class="loading-dots">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
          </div>
        </div>
      ` : ''}
    `;
  }
}
