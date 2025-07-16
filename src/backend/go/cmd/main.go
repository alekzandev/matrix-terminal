package main

import (
	"encoding/json"
	"net/http"
	"log"
)

type Question struct {
	ID       string `json:"id"`
	Question string `json:"question"`
}

type Answer struct {
	QuestionID string `json:"question_id"`
	Answer     string `json:"answer"`
}

var questions = []Question{
	{ID: "1", Question: "What is the capital of France?"},
	{ID: "2", Question: "What is 2 + 2?"},
	{ID: "3", Question: "What is the largest mammal?"},
}

var answers = []Answer{
	{QuestionID: "1", Answer: "Paris"},
	{QuestionID: "2", Answer: "4"},
	{QuestionID: "3", Answer: "Blue Whale"},
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

func main() {
	http.HandleFunc("/question", getQuestionByID)
	http.HandleFunc("/answer", getAnswerByQuestionID)
	log.Println("Starting server on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
