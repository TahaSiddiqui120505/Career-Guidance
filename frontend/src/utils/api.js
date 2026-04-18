import axios from "axios";

const API = (process.env.REACT_APP_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

const api = axios.create({
  baseURL: API
});

export default api;