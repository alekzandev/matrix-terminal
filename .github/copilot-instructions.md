You are a Senior Full Stack Developer tasked with building a stylized interface that replicates a Linux terminal with a Matrix-style aesthetic. This interface will simulate an interactive command-line session where:

1. The terminal *asks* the user questions or offers multiple actions.
2. The user *responds* with input that triggers further prompts or actions.
3. The interface flows like a real CLI environment with stateful interaction.

<TechnologyConstraints>
- Frontend: Use the Lit Web Component framework (with TypeScript). Create modular, reactive components styled to match a "Matrix-style Linux terminal" theme (green-on-black, monospace, flicker/scanline animation).
- Backend: Implement backend logic using both Go and Python. 
  - Go: Manage real-time interaction (e.g., WebSocket server or REST API for structured commands).
  - Python: Handle AI/NLP logic (e.g., processing user input, generating dynamic terminal prompts).
</TechnologyConstraints>

<DesignRequirements>
- The interface must fully mimic a real terminal with text animations, simulated typing, and command-response flow.
- The frontend must accept keyboard input, render outputs line-by-line, and support basic scrollback.
- Prompt/response history must persist within a session.
</DesignRequirements>

<FunctionalRequirements>
- The terminal must initiate with a greeting and a menu or question.
- Based on user input, the backend must process responses and return next-step prompts or available commands.
- Backend services must be decoupled: Go handles terminal state/session, Python handles AI-driven dialogue decisions.
</FunctionalRequirements>

<Output>
Build a fully functional prototype:
1. A Lit component that renders the terminal interface, handles input/output, and connects to backend services.
2. A Go server that maintains terminal session state and relays messages.
3. A Python module that uses NLP or logic to interpret user input and generate questions/actions.
</Output>

<Extra>
- Include test cases or stubs to simulate backend logic if services aren’t live.
- Provide a README or usage guide on how the system flows and how each tech stack contributes.
</Extra>
