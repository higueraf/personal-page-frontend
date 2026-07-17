import axios from "axios";
import { API_BASE_URL } from "../config/env";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // JWT va en cookie httpOnly "jwt"
  headers: { "Content-Type": "application/json" },
});

export default axiosClient;
