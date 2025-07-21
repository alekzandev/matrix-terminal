import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('terminal-input')
export class TerminalInput extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 15px 0 10px 0;
      border-top: 1px solid #003300;
      margin-top: 15px;
    }

    .terminal-input-area {
      display: flex;
      align-items: center;
      width: 100%;
    }

    .terminal-prompt {
      color: #008f11;
      margin-right: 8px;
      font-weight: 500;
      user-select: none;
      font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
      font-size: 14px;
    }

    .terminal-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #00ff41;
      font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
      font-size: 14px;
      line-height: 1.4;
      caret-color: #00ff41;
      text-shadow: 0 0 5px rgba(0, 255, 65, 0.3);
    }

    .terminal-input::placeholder {
      color: #003300;
      opacity: 0.7;
    }

    .terminal-input:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .terminal-input:focus {
      background: linear-gradient(
        90deg,
        transparent,
        rgba(0, 255, 65, 0.05),
        transparent
      );
      border-radius: 2px;
    }

    .command-history {
      position: absolute;
      bottom: 100%;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.95);
      border: 1px solid #003300;
      border-radius: 4px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 100;
      display: none;
    }

    .command-history.visible {
      display: block;
    }

    .history-item {
      padding: 8px 12px;
      cursor: pointer;
      color: #008f11;
      transition: background 0.2s ease;
      font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
      font-size: 14px;
    }

    .history-item:hover,
    .history-item.selected {
      background: rgba(0, 255, 65, 0.1);
      color: #00ff41;
    }
  `;

  @property({ type: Boolean })
  disabled = false;

  @state()
  private currentInput = '';

  @state()
  private commandHistory: string[] = [];

  @state()
  private historyIndex = -1;

  @state()
  private showHistory = false;

  @state()
  private selectedHistoryIndex = -1;

  private inputElement!: HTMLInputElement;

  protected firstUpdated(): void {
    this.inputElement = this.shadowRoot?.querySelector('.terminal-input') as HTMLInputElement;
    if (this.inputElement) {
      this.inputElement.focus();
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.disabled) return;

    switch (event.key) {
      case 'Enter':
        this.handleSubmit();
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        this.navigateHistory(1);
        break;
      
      case 'ArrowDown':
        event.preventDefault();
        this.navigateHistory(-1);
        break;
      
      case 'Tab':
        event.preventDefault();
        // Future: implement auto-completion
        break;
      
      case 'Escape':
        this.hideHistory();
        break;
    }
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.currentInput = target.value;
    
    // Show command history if user starts typing and has history
    if (this.currentInput.length > 0 && this.commandHistory.length > 0) {
      this.showFilteredHistory();
    } else {
      this.hideHistory();
    }
  }

  private handleSubmit(): void {
    const input = this.currentInput.trim();
    
    // Always dispatch the event, even for empty inputs
    // The parent component will decide how to handle it
    
    // Add to command history only if input is not empty
    if (input && this.commandHistory[this.commandHistory.length - 1] !== input) {
      this.commandHistory.push(input);
      
      // Keep only last 50 commands
      if (this.commandHistory.length > 50) {
        this.commandHistory.shift();
      }
    }

    // Reset input
    this.currentInput = '';
    this.historyIndex = -1;
    this.hideHistory();

    // Dispatch event to parent (always dispatch, even for empty input)
    this.dispatchEvent(new CustomEvent('user-input', {
      detail: input,
      bubbles: true,
      composed: true
    }));

    // Update input element
    if (this.inputElement) {
      this.inputElement.value = '';
      this.inputElement.focus();
    }
  }

  private navigateHistory(direction: number): void {
    if (this.commandHistory.length === 0) return;

    const newIndex = Math.max(
      -1,
      Math.min(
        this.commandHistory.length - 1,
        this.historyIndex + direction
      )
    );

    this.historyIndex = newIndex;

    if (newIndex === -1) {
      this.currentInput = '';
    } else {
      this.currentInput = this.commandHistory[newIndex];
    }

    // Update input element
    if (this.inputElement) {
      this.inputElement.value = this.currentInput;
      this.inputElement.focus();
    }
  }

  private showFilteredHistory(): void {
    if (this.commandHistory.length === 0) return;

    this.showHistory = true;
    this.selectedHistoryIndex = -1;
  }

  private hideHistory(): void {
    this.showHistory = false;
    this.selectedHistoryIndex = -1;
  }

  private selectHistoryItem(index: number): void {
    if (index >= 0 && index < this.getFilteredHistory().length) {
      const filteredHistory = this.getFilteredHistory();
      this.currentInput = filteredHistory[index];
      
      if (this.inputElement) {
        this.inputElement.value = this.currentInput;
        this.inputElement.focus();
      }
      
      this.hideHistory();
    }
  }

  private getFilteredHistory(): string[] {
    if (!this.currentInput) return this.commandHistory;
    
    return this.commandHistory.filter(cmd =>
      cmd.toLowerCase().includes(this.currentInput.toLowerCase())
    );
  }

  render() {
    const filteredHistory = this.getFilteredHistory();

    return html`
      <div class="terminal-input-area" style="position: relative;">
        <div class="terminal-prompt">dataCrack:~$</div>
        <input
          class="terminal-input"
          type="text"
          .value=${this.currentInput}
          .disabled=${this.disabled}
          placeholder=${this.disabled ? 'Waiting for response...' : 'Enter command...'}
          @keydown=${this.handleKeyDown}
          @input=${this.handleInput}
          autocomplete="off"
          spellcheck="false"
        />

        <div class="command-history ${this.showHistory ? 'visible' : ''}">
          ${filteredHistory.map((cmd, index) => html`
            <div
              class="history-item ${index === this.selectedHistoryIndex ? 'selected' : ''}"
              @click=${() => this.selectHistoryItem(index)}
            >
              ${cmd}
            </div>
          `)}
        </div>
      </div>
    `;
  }
}
