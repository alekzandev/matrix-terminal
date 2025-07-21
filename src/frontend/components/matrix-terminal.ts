import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { TerminalLine, TerminalState, Question } from '../types/terminal';
import { TerminalAPI } from '../services/terminal-api';
import './terminal-input';
import './terminal-output';

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
      position: relative;
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
    
    @keyframes matrix-fall {
      0% {
        transform: translateY(-100%);
        opacity: 1;
      }
      100% {
        transform: translateY(100%);
        opacity: 0;
      }
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

    .timeout-screen {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      color: #ff4444;
    }

    .failed-screen {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      color: #ff4444;
    }

    .winner-screen {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      color: #00ff41;
      padding: 20px;
    }

    .winner-results {
      margin: 20px 0;
      padding: 20px;
      border: 2px solid #00ff41;
      border-radius: 10px;
      background: rgba(0, 255, 65, 0.1);
      min-width: 400px;
    }

    .results-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      font-size: 16px;
    }

    .results-label {
      color: #008f11;
    }

    .results-value {
      color: #00ff41;
      font-weight: bold;
    }

    .score-highlight {
      font-size: 24px;
      color: #00ff41;
      text-shadow: 0 0 10px rgba(0, 255, 65, 0.8);
      margin: 15px 0;
    }

    .welcome-logo {
      font-size: 32px;
      font-weight: 500;
      margin-bottom: 20px;
      text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
      animation: logo-glow 3s ease-in-out infinite;
    }
    
    .timeout-logo {
      font-size: 32px;
      font-weight: 500;
      margin-bottom: 20px;
      text-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
      animation: logo-glow-timeout 3s ease-in-out infinite;
    }

    .failed-logo {
      font-size: 32px;
      font-weight: 500;
      margin-bottom: 20px;
      text-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
      animation: logo-glow-failed 3s ease-in-out infinite;
    }

    .winner-logo {
      font-size: 32px;
      font-weight: 500;
      margin-bottom: 20px;
      text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
      animation: logo-glow-winner 3s ease-in-out infinite;
    }

    @keyframes logo-glow {
      0%, 100% { text-shadow: 0 0 10px rgba(0, 255, 65, 0.5); }
      50% { text-shadow: 0 0 20px rgba(0, 255, 65, 0.8), 0 0 30px rgba(0, 255, 65, 0.3); }
    }
    
    @keyframes logo-glow-timeout {
      0%, 100% { text-shadow: 0 0 10px rgba(255, 68, 68, 0.5); }
      50% { text-shadow: 0 0 20px rgba(255, 68, 68, 0.8), 0 0 30px rgba(255, 68, 68, 0.3); }
    }

    @keyframes logo-glow-failed {
      0%, 100% { text-shadow: 0 0 10px rgba(255, 68, 68, 0.5); }
      50% { text-shadow: 0 0 20px rgba(255, 68, 68, 0.8), 0 0 30px rgba(255, 68, 68, 0.3); }
    }

    @keyframes logo-glow-winner {
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
    .rule-message {
      font-size: 14px;
      line-height: 1.6;
      max-width: 600px;
      color: #ece7f5;
      margin-bottom: 30px;
      text-align: left;
    }

    .press-enter {
      font-size: 16px;
      color: #00ff41;
      text-shadow: 0 0 5px rgba(0, 255, 65, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cursor {
      width: 10px;
      height: 20px;
      background-color: #00ff41;
      margin-left: 5px;
      animation: blink 1s step-start infinite;
    }

    @keyframes blink {
      50% { opacity: 0; }
    }

    .boot-sequence {
      color: #9da9a0ff;
      font-size: 12px;
      text-align: left;
      opacity: 0;
      animation: boot-appear 2s ease-out forwards;
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
      opacity: 0.6;
    }

    .countdown-timer {
      font-size: 24px; /* Increased font size */
      color: #00ff41;
      text-shadow: 0 0 5px rgba(0, 255, 65, 0.3);
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .countdown-timer.critical {
      color: #ff4444; /* Red color for critical time */
      text-shadow: 0 0 5px rgba(255, 68, 68, 0.3);
    }

    .countdown-timer.blink {
      animation: blink 1s step-start infinite;
    }

    @keyframes blink {
      50% { opacity: 0; }
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

  @state()
  private countdownTime: number = 300; // 5 minutes in seconds

  @state()
  private readonly totalCountdownTime: number = this.countdownTime; // Total time in seconds

  @state()
  private timeOver: boolean = false;

  @state()
  private showPressEnter: boolean = true;

  @state()
  private userEmail: string = '';

  @state()
  private isCollectingEmail: boolean = false;

  @state()
  private currentQuestions: number[] = [];

  @state()
  private currentQuestionIndex: number = 0;

  @state()
  private userAnswers: string[] = [];

  @state()
  private isAnsweringQuestions: boolean = false;

  @state()
  private quizFailed: boolean = false;

  @state()
  private quizPassed: boolean = false;

  @state()
  private evaluationResults: any = null;

  private matrixChars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  private api: TerminalAPI;

  constructor() {
    super();
    // Explicitly set the Go API URL to ensure it uses port 8080
    this.api = new TerminalAPI('http://localhost:8000', 'http://localhost:8080');
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated(_changedProperties);
    this.initializeWelcomeScreen();
  }

  private initializeWelcomeScreen(): void {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        window.removeEventListener('keydown', handleKeyPress);
        this.showPressEnter = false; // Hide 'Press Enter to continue'
        this.startTerminal();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
  }

  private startTerminal(): void {
    this.initializeTerminal();
    this.startMatrixBackground();
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9);
  }

  private async initializeTerminal(): Promise<void> {
    // Simulate boot sequence
    this.bootSequence = true;
    
    // Add boot messages
    this.addBootMessages();
    
    // Wait for boot messages to complete (5 messages * 400ms each + extra time)
    await this.delay(2000);
    
    // Hide welcome screen and show terminal
    this.showWelcome = false;
    this.terminalState = {
      ...this.terminalState,
      connected: true
    };
    // console.log('Switched to terminal view, showWelcome:', this.showWelcome); // Debug log
    this.requestUpdate();
    
    // Add a small delay to ensure the UI transition completes
    await this.delay(100);
    
    // Add initial greeting
    this.addSystemMessage('System initialized. Connection established.');
    this.addSystemMessage('Delfos Terminal v9.3.96 - Ready for interaction.');
    
    // Add another small delay before collecting email
    await this.delay(500);
    
    this.collectUserEmail();
  }

  private addBootMessages(): void {
    const bootMessages = [
      'Loading neural pathways from GenAI Account...',
      'Establishing quantum entanglement by Expody...',
      'Calibrating reality matrix through Bifröst...',
      'Connection secured.'
    ];

    bootMessages.forEach((message, index) => {
      setTimeout(() => {
        this.addSystemMessage(message);
      }, index * 100);
    });
  }

  private addSystemMessage(content: string): void {
    // console.log('addSystemMessage called with content:', content); // Debug log
    const line: TerminalLine = {
      id: this.generateLineId(),
      content,
      type: 'system',
      timestamp: Date.now()
    };
    
    // console.log('Created line object:', line); // Debug log
    // Create a new array to trigger Lit's reactivity
    this.terminalState = {
      ...this.terminalState,
      lines: [...this.terminalState.lines, line]
    };
    // console.log('Total lines after push:', this.terminalState.lines.length); // Debug log
    this.requestUpdate();
    // console.log('requestUpdate called'); // Debug log
  }

  private addPromptMessage(content: string): void {
    const line: TerminalLine = {
      id: this.generateLineId(),
      content,
      type: 'prompt',
      timestamp: Date.now(),
      isTyping: content.length > 0 // Only show typing effect for non-empty content
    };
    // Create a new array to trigger Lit's reactivity
    this.terminalState = {
      ...this.terminalState,
      lines: [...this.terminalState.lines, line]
    };
    this.requestUpdate();
    
    // Simulate typing effect only for non-empty content
    if (content.length > 0) {
      setTimeout(() => {
        line.isTyping = false;
        this.requestUpdate();
      }, content.length * 50);
    } else {
      // For empty lines, immediately set isTyping to false
      line.isTyping = false;
    }
  }

  private addUserInput(content: string): void {
    const line: TerminalLine = {
      id: this.generateLineId(),
      content: `> ${content}`,
      type: 'input',
      timestamp: Date.now()
    };
    
    // Create a new array to trigger Lit's reactivity
    this.terminalState = {
      ...this.terminalState,
      lines: [...this.terminalState.lines, line]
    };
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
    
    // Create a new array to trigger Lit's reactivity
    this.terminalState = {
      ...this.terminalState,
      lines: [...this.terminalState.lines, line]
    };
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

  private async handleUserInput(event: CustomEvent<string>): Promise<void> {
    const input = event.detail.trim();
    // console.log('User input received:', input, 'isCollectingEmail:', this.isCollectingEmail); // Debug log
    
    if (!input) return;

    // Add user input to terminal
    this.addUserInput(input);
    
    // Check if we're collecting email
    if (this.isCollectingEmail) {
      // console.log('Processing email input:', input); // Debug log
      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(input)) {
        // console.log('Email validation passed'); // Debug log
        this.userEmail = input;
        this.isCollectingEmail = false;
        this.proceedAfterEmail();
        // console.log('Email saved:', this.userEmail); // Debug log
      } else {
        // console.log('Email validation failed'); // Debug log
        this.addSystemMessage('Por favor, ingresa un correo electrónico válido:');
      }
      return;
    }

    // Check if we're answering questions
    if (this.isAnsweringQuestions) {
      await this.processAnswer(input);
      return;
    }
    
    // Set waiting state
    this.terminalState = {
      ...this.terminalState,
      isWaitingForResponse: true
    };
    this.requestUpdate();
    
    // Process input (simulated for now)
    this.processUserInput(input);
  }

  private async processUserInput(input: string): Promise<void> {
    // Simulate processing delay
    await this.delay(1000 + Math.random() * 100);

    let response = '';
    
    try {
      if (input === '1') {
        
        // Start countdown immediately when profile is selected
        this.startCountdown();
        
        // Get random questions from API
        const questionIds = await this.api.getRandomQuestions();
        this.currentQuestions = questionIds;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.isAnsweringQuestions = true;
        
        this.addSystemMessage(`Preguntas asignadas: ${questionIds.join(', ')}`);
        this.addPromptMessage('Iniciando evaluación. Responde con la letra correcta (a, b, c, d):');
        
        // Load first question
        await this.loadCurrentQuestion();
        
      } else if (input === '2') {
        // Start countdown immediately when profile is selected
        this.startCountdown();
      } else if (input === '3') {
        // Start countdown immediately when profile is selected
        this.startCountdown();
      } else if (input.toLowerCase() === 'clear') {
        this.terminalState = {
          ...this.terminalState,
          lines: [],
          isWaitingForResponse: false
        };
        this.addPromptMessage('Terminal cleared. What would you like to do next?');
        this.requestUpdate();
        return;
      } else if (input.toLowerCase() === 'exit') {
        response = 'Disconnecting from Matrix Terminal...\nConnection terminated.\nThank you for using our DELFOS ANALYTICS PROFILER.';
        this.terminalState = {
          ...this.terminalState,
          connected: false
        };
      }
      
    } catch (error) {
      console.error('Error processing user input:', error);
      response = 'Error: Unable to process request. Please try again or contact support.';
    }
    
    this.addOutput(response);
    this.terminalState = {
      ...this.terminalState,
      isWaitingForResponse: false
    };
    this.requestUpdate();
  }

  private async loadCurrentQuestion(): Promise<void> {
    if (this.currentQuestionIndex >= this.currentQuestions.length) {
      await this.finishQuestions();
      return;
    }

    const questionId = `CRD${String(this.currentQuestions[this.currentQuestionIndex]).padStart(4, '0')}`;
    
    try {
      const question = await this.api.getQuestion(questionId);
      const questionNumber = this.currentQuestionIndex + 1;
      
      // Display question header
      this.addPromptMessage(`Pregunta ${questionNumber} de ${this.currentQuestions.length}:`);
      await this.delay(100);
      
      this.addPromptMessage(''); // Empty line for spacing
      await this.delay(100);
      
      // Display the question text
      this.addPromptMessage(question.question);
      await this.delay(100);
      
      this.addPromptMessage(''); // Empty line for spacing
      await this.delay(100);
      
      // Display the options if they exist
      if (question.options && Array.isArray(question.options) && question.options.length > 0) {
        for (let index = 0; index < question.options.length; index++) {
          const option = question.options[index];
          const letter = String.fromCharCode(97 + index); // 'a', 'b', 'c', 'd'
          const optionText = `${letter}) ${option}`;
          this.addPromptMessage(optionText);
          await this.delay(100); // Small delay between options
        }
      } else {
        // If no options are available, show an error
        this.addSystemMessage('Error: Esta pregunta no tiene opciones disponibles.');
        this.currentQuestionIndex++;
        await this.loadCurrentQuestion();
        return;
      }
      
      this.addPromptMessage(''); // Empty line for spacing
      await this.delay(100);
      
    } catch (error) {
      console.error('Error loading question:', error);
      this.addSystemMessage(`Error cargando pregunta ${questionId}. Saltando a la siguiente...`);
      this.currentQuestionIndex++;
      await this.loadCurrentQuestion();
    }
  }

  private async processAnswer(input: string): Promise<void> {
    const validAnswers = ['a', 'b', 'c', 'd'];
    const answer = input.toLowerCase().trim();

    if (!validAnswers.includes(answer)) {
      this.addSystemMessage('Por favor responde con a, b, c o d');
      return;
    }

    // Store the answer
    this.userAnswers.push(answer);
    
    // Move to next question
    this.currentQuestionIndex++;
    
    if (this.currentQuestionIndex < this.currentQuestions.length) {
      this.addSystemMessage(`Respuesta registrada: ${answer.toUpperCase()}`);
      await this.delay(1000);
      await this.loadCurrentQuestion();
    } else {
      await this.finishQuestions();
    }
  }

  private async finishQuestions(): Promise<void> {
    this.isAnsweringQuestions = false;
    this.addSystemMessage('¡Evaluación completada!');
    
    // Update user file with questions and answers
    try {
      const updateSuccess = await this.api.updateUserWithAnswers(
        this.userEmail,
        this.sessionId,
        this.currentQuestions,
        this.userAnswers
      );
      
      if (updateSuccess) {
        this.addSystemMessage(`Respuestas enviadas: ${this.userAnswers.join(', ').toUpperCase()}`);
      } else {
        this.addSystemMessage('⚠️ Error al guardar resultados, pero se completó la evaluación.');
      }
    } catch (error) {
      console.error('Error updating user file:', error);
      this.addSystemMessage('⚠️ Error al guardar resultados, pero se completó la evaluación.');
    }
    
    // Evaluate answers using the API
    this.addSystemMessage('🔄 Evaluando respuestas...');
    
    try {
      // Format question IDs correctly (CRD0001, CRD0002, etc.)
      const questionIds = this.currentQuestions.map(q => `CRD${String(q).padStart(4, '0')}`);
      const evaluation = await this.api.evaluateAnswers(questionIds, this.userAnswers);
      
      if (evaluation.status === 'success') {
        // Display detailed results
        await this.delay(3000); // Small delay before showing results
        this.addSystemMessage('✅ Evaluación completada');
        
        // Show final message based on score
        if (evaluation.scorePercentage >= 75) {
          // User passed the quiz - show winner screen
          this.evaluationResults = evaluation;
          setTimeout(() => {
            this.quizPassed = true;
            this.requestUpdate();
          }, 3000); // Show the winner screen after 3 seconds
        } else {
          // User failed the quiz - show failed screen
          setTimeout(() => {
            this.quizFailed = true;
            this.requestUpdate();
          }, 3000); // Show the failed screen after 3 seconds

          // if (evaluation.scorePercentage >= 60) {
          //   this.addOutput('📈 Buen intento, pero necesitas mejorar.');
          //   this.addOutput('   El 75% es requerido para aprobar. ¡Sigue practicando!');
          // } else {
          //   this.addOutput('📚 No alcanzaste el puntaje mínimo.');
          //   this.addOutput('   Te recomendamos estudiar más y volver a intentarlo.');
          // }
        }
        
      } else {
        // Fallback if evaluation fails
        this.addSystemMessage('⚠️ Error al evaluar respuestas. Mostrando resultado básico.');
        this.addOutput(`Respuestas completadas: ${this.userAnswers.length}/${this.currentQuestions.length}`);
      }
      
    } catch (error) {
      console.error('Error evaluating answers:', error);
      this.addSystemMessage('⚠️ Error al evaluar respuestas. Mostrando resultado básico.');
      this.addOutput(`Respuestas completadas: ${this.userAnswers.length}/${this.currentQuestions.length}`);
    }
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
      }, 70000);
    };

    // Create periodic matrix chars
    setInterval(createMatrixChar, 450);
  }

  private startCountdown(): void {
    const timerInterval = setInterval(() => {
      if (this.countdownTime > 0) {
        this.countdownTime -= 1;
        this.requestUpdate();
      } else {
        clearInterval(timerInterval);
        this.timeOver = true;
        this.requestUpdate();
      }
    }, 1000);
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private renderCountdownTimer(): import("lit").TemplateResult {
    const minutes = Math.floor(this.countdownTime / 60);
    const seconds = this.countdownTime % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const isCritical = this.countdownTime < this.totalCountdownTime * 0.2;

    return html`
      <div class="countdown-timer ${isCritical ? 'critical blink' : ''}">
        ${formattedTime}
      </div>
    `;
  }

  private collectUserEmail(): void {
    // console.log('collectUserEmail called'); // Debug log
    this.addPromptMessage('Ingresa tu correo electrónico para continuar...');
    this.isCollectingEmail = true;
    // console.log('isCollectingEmail set to true'); // Debug log
    this.requestUpdate();
    // console.log('requestUpdate called from collectUserEmail'); // Debug log
  }

  private async proceedAfterEmail(): Promise<void> {
    try {
      this.addSystemMessage(`Correo registrado: ${this.userEmail}`);
      
      // Call the backend API to create user file using the service
      await this.api.createUser(this.userEmail, this.sessionId);
      
      // Show the main menu after a delay
      setTimeout(() => {
        this.addPromptMessage('Elige tu perfil de investigador:');
        this.addPromptMessage('> [1] Créditos  [2] Servicio  [3] Clientes');
      }, 1500);
      
    } catch (error) {
      // Handle API or network errors
      console.error('Error calling user creation API:', error);
      this.addSystemMessage('⚠ Error al crear sesión de usuario');
      this.addSystemMessage('Continuando en modo offline...');
      
      // Continue anyway with the menu
      setTimeout(() => {
        this.addPromptMessage('Elige tu perfil de investigador:');
        this.addPromptMessage('> [1] Créditos  [2] Servicio  [3] Clientes');
      }, 1500);
    }
    
    // Continue with normal terminal flow
    this.terminalState = {
      ...this.terminalState,
      isWaitingForResponse: false
    };
    this.requestUpdate();
  }

  // Method to get the saved email (for debugging/testing)
  public getUserEmail(): string {
    return this.userEmail;
  }

  render() {
    // console.log('=== RENDER CALLED ===');
    // console.log('showWelcome:', this.showWelcome);
    // console.log('timeOver:', this.timeOver);
    // console.log('terminalState.lines length:', this.terminalState.lines.length);
    // console.log('terminalState.connected:', this.terminalState.connected);
    // console.log('isCollectingEmail:', this.isCollectingEmail);
    // console.log('userEmail:', this.userEmail);
    // console.log('Lines:', this.terminalState.lines.map(line => ({ type: line.type, content: line.content.substring(0, 50) })));
    // console.log('==================');

    const isTimeCritical = this.countdownTime < 0.2 * this.totalCountdownTime; // 20% of total time

    if (this.timeOver) {
      // console.log('Rendering timeout screen');
      return html`
        <div class="terminal-container screen-flicker">
          <div class="scanlines"></div>
          <div class="matrix-background"></div>
          
          <div class="timeout-screen">
            <div class="timeout-logo">⏳ ¡Ufff! Se te acabó el tiempo…</div>
            <div class="welcome-message">
              Esta vez no alcanzaste a completar el reto, pero tranqui que así es como se entrena un/a crack 💪
            </div>
            <div class="welcome-message">
              ¡A la próxima se rompe!
            </div>
          </div>
        </div>
      `;
    }

    if (this.quizFailed) {
      return html`
        <div class="terminal-container screen-flicker">
          <div class="scanlines"></div>
          <div class="matrix-background"></div>
          
          <div class="failed-screen">
            <div class="failed-logo">❌ ¡Oops! No lograste el puntaje mínimo</div>
            <div class="welcome-message">
              No te preocupes, crack! Todos los expertos empezaron desde abajo 📈
            </div>
            <div class="welcome-message">
              Sigue practicando y analiza más data para mejorar tus habilidades 🔍
            </div>
            <div class="welcome-message">
              ¡El siguiente reto será tuyo! 💪✨
            </div>
            <div class="press-enter" style="margin-top: 30px;">
              <span>Presiona F5 para intentar nuevamente</span>
              <div class="cursor"></div>
            </div>
          </div>
        </div>
      `;
    }

    if (this.quizPassed && this.evaluationResults) {
      return html`
        <div class="terminal-container screen-flicker">
          <div class="scanlines"></div>
          <div class="matrix-background"></div>
          
          <div class="winner-screen">
            <div class="winner-logo">🏆 ¡Qué crack!</div>
            <div class="welcome-message">
              Lo lograste, resolviste el reto de la caja negra como un verdadero/a #DataLover
            </div>
            <div class="welcome-message">
              Tu olfato analítico está on fire 🔥
            </div>
            
            <div class="winner-results">
              <div class="results-row">
                <span class="results-label">📊 Total de preguntas:</span>
                <span class="results-value">${this.evaluationResults.totalQuestions}</span>
              </div>
              <div class="results-row">
                <span class="results-label">✅ Respuestas correctas:</span>
                <span class="results-value">${this.evaluationResults.correctAnswers}</span>
              </div>
              <div class="results-row">
                <span class="results-label">❌ Respuestas incorrectas:</span>
                <span class="results-value">${this.evaluationResults.incorrectAnswers}</span>
              </div>
              <div class="score-highlight">
                🏆 Puntuación Final: ${this.evaluationResults.scorePercentage.toFixed(1)}%
              </div>
            </div>
            
            <div class="press-enter" style="margin-top: 30px;">
              <span>Presiona Enter para buscar tu premio</span>
              <div class="cursor"></div>
            </div>
          </div>
        </div>
      `;
    }

    if (this.showWelcome) {
      // console.log('Rendering welcome screen');
      return html`
        <div class="terminal-container screen-flicker">
          <div class="scanlines"></div>
          <div class="matrix-background"></div>
          
          <div class="welcome-screen">
            <div class="welcome-logo">🔮 DELFOS ANALYTICS PROFILER</div>
            <div>
              ¡Bienvenid@ crack de los datos!
            </div>
            <div class="welcome-message">
              Aquí arranca tu misión como investigador/a, donde vas a poner a prueba toda tu malicia, criterio y flow analítico 🧠✨.<br>
            </div>
            <div>
              Reto
            </div>
            <div class="welcome-message">
              Responder unas preguntas de acuerdo a tu rol... ¡y todo contrarreloj!<br>
              Prepárate pa' soltar la data con estilo<br><br>
            </div>
            <div>
              Pilas con estas reglas que no perdonan:<br><br>
            </div>
            <div class="rule-message">
              a. Tienes 5 minuticos pa' resolver todo el reto.<br>
              b. Te van a salir 8 preguntas del tema que te tocó, según tu perfil de investigador.<br>
              c. Necesitás mínimo un 80% de respuestas correctas pa' pasar el reto.<br>
              d. Vas a tener a la mano un tablero en Quicksight con los datos para analizar.<br><br>
              Ojo: Si tu rol es de crédito, mírese bien el tablero de crédito. No mezcle los fríjoles.
            </div>
            ${this.showPressEnter ? html`
              <div class="press-enter">
                Press Enter to continue<span class="cursor"></span>
              </div>
            ` : ''}
            ${this.bootSequence ? html`
              <div class="boot-sequence">
                <div>Initializing Data Mesh Protocol...</div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // console.log('Rendering main terminal interface');
    return html`
      <div class="terminal-container screen-flicker">
        <div class="scanlines"></div>
        <div class="matrix-background"></div>
        
        <div class="terminal-header">
          <div class="terminal-title">◉ DELFOS ANALYTICS PROFILER</div>
          <div class="terminal-status">
            <div class="connection-indicator ${this.terminalState.connected ? 'connected' : 'disconnected'}"></div>
            <span>${this.terminalState.connected ? 'CONNECTED' : 'DISCONNECTED'}</span>
            <span>|</span>
            <span>Session: ${this.terminalState.sessionId}</span>
          </div>
          ${this.renderCountdownTimer()}
        </div>

        <div class="terminal-content">
          <terminal-output 
            .lines=${this.terminalState.lines}
            .isWaitingForResponse=${this.terminalState.isWaitingForResponse}>
          </terminal-output>
          
          <terminal-input 
            .disabled=${(this.terminalState.isWaitingForResponse && !this.isCollectingEmail) || !this.terminalState.connected}
            @user-input=${this.handleUserInput}>
          </terminal-input>
        </div>
      </div>
    `;
  }
}
