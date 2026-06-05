import axios from "axios"

const API = axios.create({ baseURL: "https://mcdss-backend.onrender.com" })
// Auth
export const login  = (data) => API.post("/api/login", data)
export const signup = (data) => API.post("/api/signup", data)

// Decision
export const analyseDecision = (data) => API.post("/api/analyse", data)
export const getTemplates    = ()     => API.get("/api/templates")