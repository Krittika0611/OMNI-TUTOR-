import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

export const askQuestion = (payload) => api.post("/chat/ask", payload).then((r) => r.data);

export const getHistory = (conversationId) =>
  api.get(`/chat/history/${conversationId}`).then((r) => r.data);

export const generateMcqs = (payload) => api.post("/study/mcqs", payload).then((r) => r.data);

export const generateFlashcards = (payload) =>
  api.post("/study/flashcards", payload).then((r) => r.data);

export const generateSummary = (payload) => api.post("/study/summary", payload).then((r) => r.data);

export const generatePracticeQuestions = (payload) =>
  api.post("/study/practice-questions", payload).then((r) => r.data);

export const submitQuiz = (payload) => api.post("/study/quiz/submit", payload).then((r) => r.data);

export const uploadDocument = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/rag/upload", form).then((r) => r.data);
};

export const getProgress = (userId) => api.get(`/progress/${userId}`).then((r) => r.data);

export const getRecommendations = (userId) =>
  api.get(`/progress/${userId}/recommendations`).then((r) => r.data);

export default api;
