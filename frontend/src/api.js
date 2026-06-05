import axios from "axios"

const API = axios.create({ baseURL: "http://127.0.0.1:8000" })

// Auth
export const login  = (data) => API.post("/api/login", data)
export const signup = (data) => API.post("/api/signup", data)

// Decision
export const analyseDecision = (data) => API.post("/api/analyse", data)
export const getTemplates    = ()     => API.get("/api/templates")