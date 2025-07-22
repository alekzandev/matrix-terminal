package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// CORS middleware to handle cross-origin requests
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers for all requests
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept")
		w.Header().Set("Access-Control-Max-Age", "3600")
		w.Header().Set("Access-Control-Allow-Credentials", "false")

		// Handle preflight OPTIONS request
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Call the next handler
		next(w, r)
	}
}

// Enhanced logging middleware
func loggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		log.Printf("🌐 %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)

		next(w, r)

		duration := time.Since(start)
		log.Printf("✅ Completed %s %s in %v", r.Method, r.URL.Path, duration)
	}
}

// Combined middleware wrapper
func withMiddleware(handler http.HandlerFunc) http.HandlerFunc {
	return corsMiddleware(loggingMiddleware(handler))
}

type Question struct {
	ID       string   `json:"id"`
	Question string   `json:"question"`
	Options  []string `json:"options"` // Required field for multiple choice questions
}

type Answer struct {
	QuestionID  string `json:"question_id"`
	Answer      string `json:"answer"`
	Description string `json:"description,omitempty"` // Optional field for additional context
}

// User represents the data for creating a new user session file
type User struct {
	UserEmail string `json:"userEmail"`
	SessionID string `json:"sessionId"`
	CreatedAt string `json:"createdAt"`
}

// CreateUserRequest represents the request body for user creation
type CreateUserRequest struct {
	UserEmail string `json:"userEmail"`
	SessionID string `json:"sessionId"`
}

// CreateUserResponse represents the response for user creation
type CreateUserResponse struct {
	Status   string `json:"status"`
	Message  string `json:"message"`
	Filename string `json:"filename"`
	User     User   `json:"user"`
}

// UpdateUserRequest represents the request body for updating user with answers
type UpdateUserRequest struct {
	UserEmail   string   `json:"userEmail"`
	SessionID   string   `json:"sessionId"`
	QuestionIds []int    `json:"questionIds"`
	UserAnswers []string `json:"userAnswers"`
}

// UpdateUserResponse represents the response for user update
type UpdateUserResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// EvaluateAnswersRequest represents the request body for answer evaluation
type EvaluateAnswersRequest struct {
	QuestionIds []string `json:"questionIds"`
	UserAnswers []string `json:"userAnswers"`
}

// AnswerEvaluationResult represents the result for a single question evaluation
type AnswerEvaluationResult struct {
	QuestionID    string `json:"questionId"`
	UserAnswer    string `json:"userAnswer"`
	CorrectAnswer string `json:"correctAnswer"`
	IsCorrect     bool   `json:"isCorrect"`
	Description   string `json:"description,omitempty"`
}

// EvaluateAnswersResponse represents the response for answer evaluation
type EvaluateAnswersResponse struct {
	Status           string                   `json:"status"`
	Message          string                   `json:"message"`
	TotalQuestions   int                      `json:"totalQuestions"`
	CorrectAnswers   int                      `json:"correctAnswers"`
	IncorrectAnswers int                      `json:"incorrectAnswers"`
	ScorePercentage  float64                  `json:"scorePercentage"`
	Results          []AnswerEvaluationResult `json:"results"`
}

// WinnerCountRequest represents the request body for updating winner count
type WinnerCountRequest struct {
	UserEmail string `json:"userEmail,omitempty"` // Optional field to track which user won
	SessionID string `json:"sessionId,omitempty"` // Optional field to track session
}

// WinnerCountResponse represents the response for winner count operations
type WinnerCountResponse struct {
	Status      string `json:"status"`
	Message     string `json:"message"`
	WinnerCount int    `json:"winnerCount"`
	UpdatedAt   string `json:"updatedAt,omitempty"`
}

var questions = []Question{
	{ID: "CRD0001", Question: "¿Cuál es el mayor monto total desembolsado en la historia de créditos de Nequi?", Options: []string{"220.317.663.560", "220.560.317.663", "202.317.663.560", "222.317.663.560"}},
	{ID: "CRD0002", Question: "¿Cuál es el total de monto desembolsado en la historia de Nequi?", Options: []string{"212.445.004.347", "3.654.343.244.567", "2.112.445.004.347", "2.211.544.400.743"}},
	{ID: "CRD0003", Question: "¿Cuántos Nequis con ocupación registrada han tenido un crédito siendo estudiantes?", Options: []string{"234.245", "114.859", "34.567", "7.535"}},
	{ID: "CRD0004", Question: "¿Qué segmento ha tenido 58.627 desembolsos en la historia?", Options: []string{"Camellador", "Emprendedor", "Jugador", "Dinamizador"}},
	{ID: "CRD0005", Question: "¿Cuál es el monto promedio desembolsado en Préstamo Propulsor por parte de los Nequis?", Options: []string{"1.524.869", "2.412.512", "3.412.512", "4.356.234"}},
	{ID: "CRD0006", Question: "¿Cuántas personas de 50 años han tenido desembolsos?", Options: []string{"11.913", "12.456", "33.235", "12.546"}},
	{ID: "CRD0007", Question: "¿Cuánto se espera desembolsar en montos para diciembre de 2025 según previsión?", Options: []string{"301.232.961.021", "247.934.545.098", "295.958.450.136", "247.897.010.598"}},
	{ID: "CRD0008", Question: "¿Cuántas personas con ciudad de nacimiento BARRANQUILLA ATLÁNTICO han tenido un desembolso?", Options: []string{"26.861", "21.346", "38.671", "15.981"}},
	{ID: "CRD0009", Question: "¿Cuál es el total de créditos cancelados del tipo Bajo Monto?", Options: []string{"10.495", "10.456", "10.053", "10.563"}},
	{ID: "CRD0010", Question: "¿Cuál fue la variación porcentual en el valor desembolsado entre abril y marzo 2025?", Options: []string{"56.71%", "57.61%", "55.67%", "57.56%"}},
	{ID: "CRD0011", Question: "¿Cuál es el promedio de variación porcentual de desembolsos en todo el año 2025?", Options: []string{"7.16%", "2.53%", "1.78%", "5.16%"}},
	{ID: "CRD0012", Question: "¿Cuántos clientes han tenido un desembolso con Nequi?", Options: []string{"1.980.596", "1.098.596", "1.089.686", "1.809.586"}},
	{ID: "CRD0013", Question: "¿Qué edad ha tenido la mayor cantidad de personas con desembolsos?", Options: []string{"53", "24", "34", "29"}},
	{ID: "CRD0014", Question: "¿Cuánto ha sido el total desembolsado por el segmento Camellador en Préstamo Propulsor?", Options: []string{"786.334.794.036", "567.334.794.036", "978.334.794.036", "876.334.794.036"}},
	{ID: "CRD0015", Question: "¿Cuántos créditos han sido suspendidos para el segmento Dinamizador?", Options: []string{"7.456", "10.234", "6.345", "9.821"}},
	{ID: "CRD0016", Question: "¿Cuál ha sido el total histórico de desembolsos del segmento Joven?", Options: []string{"45.807", "54.678", "23.567", "38.910"}},

	{ID: "SRV0001", Question: "¿Qué peso tienen todos los tickets de la categoría “Envíos” dentro del total?", Options: []string{"6%", "8%", "9%", "7%"}},
	{ID: "SRV0002", Question: "¿En qué mes explotó la categoría PSE con la mayor cantidad de tickets?", Options: []string{"Abril 2024", "Mayo 2025", "Junio 2024", "Marzo 2025"}},
	{ID: "SRV0003", Question: "¿Cuántos tickets por llamada hemos tenido en toda la historia?", Options: []string{"4.159.226", "4.129.345", "4.169.226", "4.915.622"}},
	{ID: "SRV0004", Question: "¿Cuál ha sido el promedio de tickets por día entre enero y junio 2025?", Options: []string{"30.727", "36.075", "40.856", "48.745"}},
	{ID: "SRV0005", Question: "¿En abril de 2025, cuántos tickets diarios en promedio entraron por el canal de CHAT?", Options: []string{"24.267", "26.129", "22.803", "23.556"}},
	{ID: "SRV0006", Question: "¿Cuál es la mediana del tiempo total de contacto (en minutos)?", Options: []string{"30", "24", "40", "45"}},
	{ID: "SRV0007", Question: "¿Cuánto es la mediana del tiempo hablando con un agente en llamada?", Options: []string{"8", "10", "9", "12"}},
	{ID: "SRV0008", Question: "¿Cuál es la proporción histórica de tickets tipo incidente?", Options: []string{"47%", "59%", "69%", "57%"}},
	{ID: "SRV0009", Question: "¿Tuvimos tickets abiertos en abril 2025? ¿Cuántos fueron?", Options: []string{"34", "28", "45", "38"}},
	{ID: "SRV0010", Question: "¿Cuánto se espera que entren de tickets en diciembre 2025, según el pronóstico?", Options: []string{"2.212.212,51", "2.212.026,51", "2.245.026,53", "2.212.620,51"}},
	{ID: "SRV0011", Question: "¿Cuál fue el mes más intenso en toda la historia por cantidad de tickets?", Options: []string{"1.422.837", "1.337.585", "1.413.595", "1.320.121"}},
	{ID: "SRV0012", Question: "¿Cuántos tickets en total se han registrado por la razón: 01_transacciones_fraude?", Options: []string{"814.230", "789.045", "630.389", "714.846"}},
	{ID: "SRV0013", Question: "¿Cuál fue la proporción de tickets de tipo aclaración en junio 2025?", Options: []string{"36%", "45%", "34%", "47%"}},
	{ID: "SRV0014", Question: "¿Cuántos tickets totales se han registrado en la categoría onboarding?", Options: []string{"4.246", "5.645", "4.365", "5.945"}},
	{ID: "SRV0015", Question: "En diciembre 2024, ¿cuántos tickets tuvimos por el tipo de incidente evento_masivo?", Options: []string{"12.567", "13.650", "12.456", "13.434"}},
	{ID: "SRV0016", Question: "¿Cuál fue el promedio diario de contactos por APP en marzo 2025?", Options: []string{"9.579", "9.208", "9.8971", "10.623"}},

	{ID: "EXP0001", Question: "¿Cuántas transacciones se registraron en total durante abril de 2025?", Options: []string{"3.224", "5.621", "7.456", "4.879"}},
	{ID: "EXP0002", Question: "¿Cuál ha sido el total histórico de transacciones ACH salida registradas?", Options: []string{"2.089", "1.183", "1.399", "2.145"}},
	{ID: "EXP0003", Question: "¿Qué proporción representan las transacciones entre Nequis dentro del total de conceptos?", Options: []string{"24%", "38%", "40%", "35%"}},
	{ID: "EXP0004", Question: "¿Cuántos usuarios únicos realizaron transacciones durante mayo de 2025?", Options: []string{"482", "578", "688", "458"}},
	{ID: "EXP0005", Question: "¿Cuál fue el monto total transado en recargas en comercio durante junio de 2025 (en quetzales)?", Options: []string{"356.934", "456.934", "389.919", "387.129"}},
	{ID: "EXP0006", Question: "En diciembre de 2025, ¿qué concepto tuvo el mayor monto total transado?", Options: []string{"Recarga en comercio", "Transferencia Nequi a BAM", "Fondos desde BAM", "Fondos desde Bancolombia"}},
	{ID: "EXP0007", Question: "¿Cuántas transferencias totales se han hecho por concepto de cierre de cuentas?", Options: []string{"3", "2", "7", "4"}},
	{ID: "EXP0008", Question: "¿Cuál es el promedio de montos en transferencias por concepto \"Fondos desde BAM\"?", Options: []string{"354", "411", "600", "354"}},
	{ID: "EXP0009", Question: "¿Cuántas cuentas fueron aperturadas durante marzo de 2025?", Options: []string{"1.304", "1.845", "1.789", "1.403"}},
	{ID: "EXP0010", Question: "Según la previsión, ¿cuántas aperturas de cuentas se esperan para diciembre de 2025?", Options: []string{"7.799", "4.678", "7.679", "8.861"}},
	{ID: "EXP0011", Question: "¿Cuántas cuentas han sido canceladas en total en toda la historia?", Options: []string{"657", "535", "387", "678"}},
	{ID: "EXP0012", Question: "¿Cuántos clientes con 35 años tienen cuentas activas actualmente?", Options: []string{"342", "543", "287", "567"}},
	{ID: "EXP0013", Question: "¿Cuál es el segundo departamento con más clientes con cuentas activas?", Options: []string{"Escuintla", "Quetzaltenango", "Sacatepequez", "Chimaltenango"}},
	{ID: "EXP0014", Question: "¿Cuál es el total de saldo en Chubales para las cuentas creadas entre el 1 de abril y el 30 de junio de 2025?", Options: []string{"3.450", "5.755", "3.234", "2.324"}},
	{ID: "EXP0015", Question: "¿Cuál es el saldo total actual de todas las cuentas Nequi Guatemala?", Options: []string{"456.340", "760.450", "673.070", "560.912"}},
	{ID: "EXP0016", Question: "¿Cuál fue el promedio de montos enviados entre cuentas Nequi durante mayo de 2025?", Options: []string{"56", "44", "96", "85"}},
}

var answers = []Answer{
	{QuestionID: "CRD0001", Answer: "a", Description: "220.317.663.560"},
	{QuestionID: "CRD0002", Answer: "c", Description: "2.112.445.004.347"},
	{QuestionID: "CRD0003", Answer: "b", Description: "114.859"},
	{QuestionID: "CRD0004", Answer: "b", Description: "Emprendedor"},
	{QuestionID: "CRD0005", Answer: "b", Description: "2.412.512"},
	{QuestionID: "CRD0006", Answer: "a", Description: "11.913"},
	{QuestionID: "CRD0007", Answer: "d", Description: "247.897.010.598"},
	{QuestionID: "CRD0008", Answer: "b", Description: "21.346"},
	{QuestionID: "CRD0009", Answer: "c", Description: "10.053"},
	{QuestionID: "CRD0010", Answer: "a", Description: "56.71%"},
	{QuestionID: "CRD0011", Answer: "c", Description: "1.78%"},
	{QuestionID: "CRD0012", Answer: "b", Description: "1.098.596"},
	{QuestionID: "CRD0013", Answer: "b", Description: "24"},
	{QuestionID: "CRD0014", Answer: "d", Description: "876.334.794.036"},
	{QuestionID: "CRD0015", Answer: "d", Description: "9.821"},
	{QuestionID: "CRD0016", Answer: "a", Description: "45.807"},

	{QuestionID: "SRV0001", Answer: "b", Description: "8%"},
	{QuestionID: "SRV0002", Answer: "b", Description: "Mayo 2025"},
	{QuestionID: "SRV0003", Answer: "a", Description: "4.159.226"},
	{QuestionID: "SRV0004", Answer: "c", Description: "40.856"},
	{QuestionID: "SRV0005", Answer: "d", Description: "23.556"},
	{QuestionID: "SRV0006", Answer: "c", Description: "40"},
	{QuestionID: "SRV0007", Answer: "a", Description: "8"},
	{QuestionID: "SRV0008", Answer: "b", Description: "59%"},
	{QuestionID: "SRV0009", Answer: "b", Description: "28"},
	{QuestionID: "SRV0010", Answer: "b", Description: "2.212.026,51"},
	{QuestionID: "SRV0011", Answer: "a", Description: "1.422.837"},
	{QuestionID: "SRV0012", Answer: "d", Description: "714.846"},
	{QuestionID: "SRV0013", Answer: "a", Description: "36%"},
	{QuestionID: "SRV0014", Answer: "a", Description: "4.246"},
	{QuestionID: "SRV0015", Answer: "d", Description: "13.434"},
	{QuestionID: "SRV0016", Answer: "b", Description: "9.208"},

	{QuestionID: "EXP0001", Answer: "b", Description: "5.621"},
	{QuestionID: "EXP0002", Answer: "a", Description: "2.089"},
	{QuestionID: "EXP0003", Answer: "d", Description: "35%"},
	{QuestionID: "EXP0004", Answer: "a", Description: "482"},
	{QuestionID: "EXP0005", Answer: "c", Description: "389.919"},
	{QuestionID: "EXP0006", Answer: "c", Description: "Fondos desde BAM"},
	{QuestionID: "EXP0007", Answer: "b", Description: "2"},
	{QuestionID: "EXP0008", Answer: "b", Description: "411"},
	{QuestionID: "EXP0009", Answer: "a", Description: "1.304"},
	{QuestionID: "EXP0010", Answer: "d", Description: "8.861"},
	{QuestionID: "EXP0011", Answer: "b", Description: "535"},
	{QuestionID: "EXP0012", Answer: "a", Description: "342"},
	{QuestionID: "EXP0013", Answer: "a", Description: "Escuintla"},
	{QuestionID: "EXP0014", Answer: "d", Description: "2.324"},
	{QuestionID: "EXP0015", Answer: "c", Description: "673.070"},
	{QuestionID: "EXP0016", Answer: "c", Description: "96"},
}

func getQuestionByID(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	for _, q := range questions {
		if q.ID == id {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(q)
			return
		}
	}
	w.WriteHeader(http.StatusNotFound)
	w.Write([]byte("Question not found"))
}

func getAnswerByQuestionID(w http.ResponseWriter, r *http.Request) {
	questionID := r.URL.Query().Get("question_id")
	for _, a := range answers {
		if a.QuestionID == questionID {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(a)
			return
		}
	}
	w.WriteHeader(http.StatusNotFound)
	w.Write([]byte("Answer not found"))
}

func getQuestionIDs(w http.ResponseWriter, r *http.Request) {
	rand.Seed(time.Now().UnixNano())

	// Get profile parameter from query string (default to "1" for CRD questions)
	profile := r.URL.Query().Get("profile")
	if profile == "" {
		profile = "1" // Default to profile 1 (CRD questions)
	}

	// Create a map to track used numbers and ensure uniqueness
	used := make(map[int]bool)
	var numbers []int
	var maxQuestions int

	// Determine the range of questions based on profile
	switch profile {
	case "1": // Créditos - CRD0001 to CRD0016
		maxQuestions = 16
	case "2": // Servicio - SRV0001 to SRV0016
		maxQuestions = 16
	case "3": // Expansión - EXP0001 to EXP0016
		maxQuestions = 16
	default:
		maxQuestions = 16 // Default to CRD questions
	}

	// Generate 8 unique random numbers within the appropriate range
	for len(numbers) < 8 {
		num := rand.Intn(maxQuestions) + 1 // Generate number between 1-maxQuestions
		if !used[num] {
			used[num] = true
			numbers = append(numbers, num)
		}
	}

	// Create response with profile info
	response := map[string]interface{}{
		"profile":     profile,
		"questionIds": numbers,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// createUser handles the creation of a new user file
// It expects a POST request with JSON body containing userEmail and sessionId
func createUser(w http.ResponseWriter, r *http.Request) {
	// Only allow POST requests (OPTIONS is handled by middleware)
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding request: %v", err)
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.UserEmail == "" || req.SessionID == "" {
		log.Printf("Missing required fields: userEmail=%s, sessionId=%s", req.UserEmail, req.SessionID)
		http.Error(w, "userEmail and sessionId are required", http.StatusBadRequest)
		return
	}

	// Create user object with timestamp
	user := User{
		UserEmail: req.UserEmail,
		SessionID: req.SessionID,
		CreatedAt: time.Now().Format(time.RFC3339),
	}

	// Create filename: userEmail_sessionId.txt (changed from .json to .txt)
	filename := req.UserEmail + "_" + req.SessionID + ".txt"

	// Ensure the data directory exists
	dataDir := "data"
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		log.Printf("Error creating data directory: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Full file path
	filePath := filepath.Join(dataDir, filename)

	// Create plain text content with email and sessionId on separate lines
	fileContent := req.UserEmail + "\n" + req.SessionID + "\n"

	// Write file as plain text
	if err := os.WriteFile(filePath, []byte(fileContent), 0644); err != nil {
		log.Printf("Error writing user file: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	log.Printf("Successfully created user file: %s", filePath)

	// Create response
	response := CreateUserResponse{
		Status:   "success",
		Message:  "User session file created successfully",
		Filename: filename,
		User:     user,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// updateUser handles updating an existing user file with questions and answers
// It expects a POST request with JSON body containing userEmail, sessionId, questionIds, and userAnswers
func updateUser(w http.ResponseWriter, r *http.Request) {
	// Only allow POST requests (OPTIONS is handled by middleware)
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding update request: %v", err)
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.UserEmail == "" || req.SessionID == "" {
		log.Printf("Missing required fields: userEmail=%s, sessionId=%s", req.UserEmail, req.SessionID)
		http.Error(w, "userEmail and sessionId are required", http.StatusBadRequest)
		return
	}

	// Create filename: userEmail_sessionId.txt
	filename := req.UserEmail + "_" + req.SessionID + ".txt"
	dataDir := "data"
	filePath := filepath.Join(dataDir, filename)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		log.Printf("User file does not exist: %s", filePath)
		http.Error(w, "User file not found", http.StatusNotFound)
		return
	}

	// Read existing content
	existingContent, err := os.ReadFile(filePath)
	if err != nil {
		log.Printf("Error reading user file: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Convert question IDs to comma-separated string
	questionIdsStr := ""
	for i, id := range req.QuestionIds {
		if i > 0 {
			questionIdsStr += ","
		}
		questionIdsStr += fmt.Sprintf("%d", id)
	}

	// Convert answers to comma-separated string (uppercase)
	answersStr := ""
	for i, answer := range req.UserAnswers {
		if i > 0 {
			answersStr += ","
		}
		answersStr += strings.ToUpper(answer)
	}

	// Append new lines with question IDs and answers
	updatedContent := string(existingContent) + questionIdsStr + "\n" + answersStr + "\n"

	// Write updated content back to file
	if err := os.WriteFile(filePath, []byte(updatedContent), 0644); err != nil {
		log.Printf("Error updating user file: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	log.Printf("Successfully updated user file: %s with %d questions and %d answers",
		filePath, len(req.QuestionIds), len(req.UserAnswers))

	// Create response
	response := UpdateUserResponse{
		Status:  "success",
		Message: fmt.Sprintf("User file updated with %d questions and %d answers", len(req.QuestionIds), len(req.UserAnswers)),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// evaluateAnswers handles the evaluation of user answers
// It expects a POST request with JSON body containing questionIds and userAnswers
func evaluateAnswers(w http.ResponseWriter, r *http.Request) {
	// Only allow POST requests (OPTIONS is handled by middleware)
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req EvaluateAnswersRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding evaluation request: %v", err)
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if len(req.QuestionIds) == 0 || len(req.UserAnswers) == 0 {
		http.Error(w, "questionIds and userAnswers are required", http.StatusBadRequest)
		return
	}

	// Evaluate answers
	var results []AnswerEvaluationResult
	correctCount := 0
	incorrectCount := 0

	for i, questionID := range req.QuestionIds {
		var result AnswerEvaluationResult
		result.QuestionID = questionID
		result.UserAnswer = req.UserAnswers[i]

		// Find correct answer
		for _, a := range answers {
			if a.QuestionID == questionID {
				result.CorrectAnswer = a.Answer
				break
			}
		}

		// Check if answer is correct (case-insensitive)
		if strings.EqualFold(strings.TrimSpace(result.UserAnswer), strings.TrimSpace(result.CorrectAnswer)) {
			result.IsCorrect = true
			correctCount++
		} else {
			result.IsCorrect = false
			incorrectCount++
		}

		results = append(results, result)
	}

	// Calculate score percentage
	scorePercentage := (float64(correctCount) / float64(len(req.QuestionIds))) * 100

	// Create response
	response := EvaluateAnswersResponse{
		Status:           "success",
		Message:          "Answers evaluated successfully",
		TotalQuestions:   len(req.QuestionIds),
		CorrectAnswers:   correctCount,
		IncorrectAnswers: incorrectCount,
		ScorePercentage:  scorePercentage,
		Results:          results,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// getWinnerCount handles getting the current winner count
// It expects a GET request and returns the current winner count
func getWinnerCount(w http.ResponseWriter, r *http.Request) {
	// Only allow GET requests
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	count, err := readWinnerCount()
	if err != nil {
		log.Printf("Error reading winner count: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	response := WinnerCountResponse{
		Status:      "success",
		Message:     "Winner count retrieved successfully",
		WinnerCount: count,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// incrementWinnerCount handles incrementing the winner count
// It expects a POST request with JSON body containing optional userEmail and sessionId
func incrementWinnerCount(w http.ResponseWriter, r *http.Request) {
	// Only allow POST requests
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req WinnerCountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding winner count request: %v", err)
		// Continue even if body is invalid, as userEmail and sessionId are optional
	}

	// Read current count
	currentCount, err := readWinnerCount()
	if err != nil {
		log.Printf("Error reading current winner count: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Increment and write new count
	newCount := currentCount + 1
	err = writeWinnerCount(newCount)
	if err != nil {
		log.Printf("Error writing new winner count: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Log the winner information if provided
	if req.UserEmail != "" {
		log.Printf("🏆 New winner #%d: %s (Session: %s)", newCount, req.UserEmail, req.SessionID)
	} else {
		log.Printf("🏆 New winner #%d recorded", newCount)
	}

	response := WinnerCountResponse{
		Status:      "success",
		Message:     fmt.Sprintf("Winner count updated to %d", newCount),
		WinnerCount: newCount,
		UpdatedAt:   time.Now().Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// readWinnerCount reads the current winner count from file
func readWinnerCount() (int, error) {
	dataDir := "data"
	filePath := filepath.Join(dataDir, "winner_count.txt")

	// Create data directory if it doesn't exist
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return 0, fmt.Errorf("failed to create data directory: %w", err)
	}

	// If file doesn't exist, return 0
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return 0, nil
	}

	// Read the file
	content, err := os.ReadFile(filePath)
	if err != nil {
		return 0, fmt.Errorf("failed to read winner count file: %w", err)
	}

	// Parse the count
	countStr := strings.TrimSpace(string(content))
	if countStr == "" {
		return 0, nil
	}

	count, err := strconv.Atoi(countStr)
	if err != nil {
		return 0, fmt.Errorf("invalid winner count format in file: %s", countStr)
	}

	return count, nil
}

// writeWinnerCount writes the winner count to file
func writeWinnerCount(count int) error {
	dataDir := "data"
	filePath := filepath.Join(dataDir, "winner_count.txt")

	// Create data directory if it doesn't exist
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return fmt.Errorf("failed to create data directory: %w", err)
	}

	// Write the count to file
	content := fmt.Sprintf("%d", count)
	err := os.WriteFile(filePath, []byte(content), 0644)
	if err != nil {
		return fmt.Errorf("failed to write winner count file: %w", err)
	}

	return nil
}

func main() {
	http.HandleFunc("/question", withMiddleware(getQuestionByID))
	http.HandleFunc("/answer", withMiddleware(getAnswerByQuestionID))
	http.HandleFunc("/choose-questions", withMiddleware(getQuestionIDs))
	http.HandleFunc("/user/create", withMiddleware(createUser))
	http.HandleFunc("/user/update", withMiddleware(updateUser))
	http.HandleFunc("/evaluate-answers", withMiddleware(evaluateAnswers))
	http.HandleFunc("/winner/count", withMiddleware(getWinnerCount))
	http.HandleFunc("/winner/increment", withMiddleware(incrementWinnerCount))

	log.Println("🚀 Starting DelfosProfiler Go API Server on :8080")
	log.Println("📡 CORS enabled for all origins")
	log.Println("📋 Available endpoints:")
	log.Println("  GET  /question?id=<ID>")
	log.Println("  GET  /answer?question_id=<ID>")
	log.Println("  GET  /choose-questions")
	log.Println("  POST /user/create")
	log.Println("  POST /user/update")
	log.Println("  POST /evaluate-answers")
	log.Println("  GET  /winner/count")
	log.Println("  POST /winner/increment")
	log.Println("🔧 Middleware: CORS + Logging enabled")

	log.Fatal(http.ListenAndServe(":8080", nil))
}
