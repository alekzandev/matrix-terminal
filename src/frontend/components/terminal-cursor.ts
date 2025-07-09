import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('terminal-cursor')
export class TerminalCursor extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }

    .cursor {
      display: inline-block;
      width: 8px;
      height: 1em;
      background-color: #00ff41;
      animation: cursor-blink 1s infinite;
      margin-left: 2px;
      vertical-align: top;
    }

    .cursor.typing {
      animation: none;
      opacity: 1;
    }

    .cursor.solid {
      animation: none;
      opacity: 1;
    }

    @keyframes cursor-blink {
      0%, 50% { 
        opacity: 1; 
      }
      51%, 100% { 
        opacity: 0; 
      }
    }

    .block-cursor {
      background-color: #00ff41;
      color: #000000;
      padding: 0 2px;
    }

    .underline-cursor {
      border-bottom: 2px solid #00ff41;
      background: transparent;
    }

    .bar-cursor {
      width: 2px;
      background-color: #00ff41;
    }
  `;

  @property({ type: String })
  type: 'block' | 'underline' | 'bar' = 'bar';

  @property({ type: Boolean })
  isTyping = false;

  @property({ type: Boolean })
  solid = false;

  @property({ type: String })
  character = '';

  render() {
    const cursorClasses = [
      'cursor',
      this.type === 'block' ? 'block-cursor' : '',
      this.type === 'underline' ? 'underline-cursor' : '',
      this.type === 'bar' ? 'bar-cursor' : '',
      this.isTyping ? 'typing' : '',
      this.solid ? 'solid' : ''
    ].filter(Boolean).join(' ');

    return html`
      <span class="${cursorClasses}">
        ${this.type === 'block' && this.character ? this.character : ''}
      </span>
    `;
  }
}
