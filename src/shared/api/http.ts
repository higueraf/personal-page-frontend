import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api",
  withCredentials: true, // JWT va en cookie httpOnly "jwt"
  headers: { "Content-Type": "application/json" },
});

export default http;
