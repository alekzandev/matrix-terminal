package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
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

var questions = []Question{
	{ID: "CRD0001", Question: "¿Cuál es el mayor monto total desembolsado en la historia de créditos de Nequi?", Options: []string{"220.317.663.560", "1.500.000.000.000", "300.000.000.000", "500.000.000.000"}},
	{ID: "CRD0002", Question: "¿Cuál es el total de monto desembolsado en la historia de Nequi?", Options: []string{"1.000.000.000.000", "2.000.000.000.000", "3.000.000.000.000", "4.000.000.000.000"}},
	{ID: "CRD0003", Question: "¿Cuántos Nequis con ocupación registrada han tenido un crédito siendo estudiantes?", Options: []string{"100.000", "200.000", "300.000", "400.000"}},
	{ID: "CRD0004", Question: "¿Qué segmento ha tenido 58.627 desembolsos en la historia?", Options: []string{"Estudiantes", "Emprendedores", "Jubilados", "Trabajadores"}},
	{ID: "CRD0005", Question: "¿Cuál es el monto promedio desembolsado en Préstamo Propulsor por parte de los Nequis?", Options: []string{"1.000.000", "2.000.000", "3.000.000", "4.000.000"}},
	{ID: "CRD0006", Question: "¿Cuántas personas de 50 años han tenido desembolsos?", Options: []string{"10.000", "20.000", "30.000", "40.000"}},
	{ID: "CRD0007", Question: "¿Cuánto se espera desembolsar en montos para diciembre de 2025 según previsión?", Options: []string{"100.000.000.000", "200.000.000.000", "300.000.000.000", "400.000.000.000"}},
	{ID: "CRD0008", Question: "¿Cuántas personas con ciudad de nacimiento BARRANQUILLA ATLÁNTICO han tenido un desembolso?", Options: []string{"5.000", "10.000", "15.000", "20.000"}},
	{ID: "CRD0009", Question: "¿Cuál es el total de créditos cancelados del tipo Bajo Monto?", Options: []string{"1.000", "2.000", "3.000", "4.000"}},
	{ID: "CRD0010", Question: "¿Cuál fue la variación porcentual en el valor desembolsado entre abril y marzo 2025?", Options: []string{"5%", "10%", "15%", "20%"}},
	{ID: "CRD0011", Question: "¿Cuál es el promedio de variación porcentual de desembolsos en todo el año 2025?", Options: []string{"1%", "2%", "3%", "4%"}},
	{ID: "CRD0012", Question: "¿Cuántos clientes han tenido un desembolso con Nequi?", Options: []string{"100.000", "200.000", "300.000", "400.000"}},
	{ID: "CRD0013", Question: "¿Qué edad ha tenido la mayor cantidad de personas con desembolsos?", Options: []string{"18", "25", "30", "40"}},
	{ID: "CRD0014", Question: "¿Cuánto ha sido el total desembolsado por el segmento Camellador en Préstamo Propulsor?", Options: []string{"100.000.000", "200.000.000", "300.000.000", "400.000.000"}},
	{ID: "CRD0015", Question: "¿Cuántos créditos han sido suspendidos para el segmento Dinamizador?", Options: []string{"1.000", "2.000", "3.000", "4.000"}},
	{ID: "CRD0016", Question: "¿Cuál ha sido el total histórico de desembolsos del segmento Joven?", Options: []string{"1.000.000.000", "2.000.000.000", "3.000.000.000", "4.000.000.000"}},
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
	var numbers []int
	for i := 0; i < 5; i++ {
		numbers = append(numbers, rand.Intn(16)+1)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(numbers)
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

func main() {
	http.HandleFunc("/question", withMiddleware(getQuestionByID))
	http.HandleFunc("/answer", withMiddleware(getAnswerByQuestionID))
	http.HandleFunc("/choose-questions", withMiddleware(getQuestionIDs))
	http.HandleFunc("/user/create", withMiddleware(createUser))
	http.HandleFunc("/user/update", withMiddleware(updateUser))
	http.HandleFunc("/evaluate-answers", withMiddleware(evaluateAnswers))

	log.Println("🚀 Starting DelfosProfiler Go API Server on :8080")
	log.Println("📡 CORS enabled for all origins")
	log.Println("📋 Available endpoints:")
	log.Println("  GET  /question?id=<ID>")
	log.Println("  GET  /answer?question_id=<ID>")
	log.Println("  GET  /choose-questions")
	log.Println("  POST /user/create")
	log.Println("  POST /user/update")
	log.Println("  POST /evaluate-answers")
	log.Println("🔧 Middleware: CORS + Logging enabled")

	log.Fatal(http.ListenAndServe(":8080", nil))
}
