package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"time"
)

type Question struct {
	ID       string `json:"id"`
	Question string `json:"question"`
}

type Answer struct {
	QuestionID  string `json:"question_id"`
	Answer      string `json:"answer"`
	Description string `json:"description,omitempty"` // Optional field for additional context
}

var questions = []Question{
	{ID: "CRD0001", Question: "¿Cuál es el mayor monto total desembolsado en la historia de créditos de Nequi?"},
	{ID: "CRD0002", Question: "¿Cuál es el total de monto desembolsado en la historia de Nequi?"},
	{ID: "CRD0003", Question: "¿Cuántos Nequis con ocupación registrada han tenido un crédito siendo estudiantes?"},
	{ID: "CRD0004", Question: "¿Qué segmento ha tenido 58.627 desembolsos en la historia?"},
	{ID: "CRD0005", Question: "¿Cuál es el monto promedio desembolsado en Préstamo Propulsor por parte de los Nequis?"},
	{ID: "CRD0006", Question: "¿Cuántas personas de 50 años han tenido desembolsos?"},
	{ID: "CRD0007", Question: "¿Cuánto se espera desembolsar en montos para diciembre de 2025 según previsión?"},
	{ID: "CRD0008", Question: "¿Cuántas personas con ciudad de nacimiento BARRANQUILLA ATLÁNTICO han tenido un desembolso?"},
	{ID: "CRD0009", Question: "¿Cuál es el total de créditos cancelados del tipo Bajo Monto?"},
	{ID: "CRD0010", Question: "¿Cuál fue la variación porcentual en el valor desembolsado entre abril y marzo 2025?"},
	{ID: "CRD0011", Question: "¿Cuál es el promedio de variación porcentual de desembolsos en todo el año 2025?"},
	{ID: "CRD0012", Question: "¿Cuántos clientes han tenido un desembolso con Nequi?"},
	{ID: "CRD0013", Question: "¿Qué edad ha tenido la mayor cantidad de personas con desembolsos?"},
	{ID: "CRD0014", Question: "¿Cuánto ha sido el total desembolsado por el segmento Camellador en Préstamo Propulsor?"},
	{ID: "CRD0015", Question: "¿Cuántos créditos han sido suspendidos para el segmento Dinamizador?"},
	{ID: "CRD0016", Question: "¿Cuál ha sido el total histórico de desembolsos del segmento Joven?"},
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

func main() {
	http.HandleFunc("/question", getQuestionByID)
	http.HandleFunc("/answer", getAnswerByQuestionID)
	http.HandleFunc("/choose-questions", getQuestionIDs)
	log.Println("Starting server on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
