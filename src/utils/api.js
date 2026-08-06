// src/utils/api.js
const API_BASE = "https://sara2backend-production.up.railway.app";
const TOKEN_KEY = "token";

export function getToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export async function apiFetch(pathOrUrl, options = {}) {
    const token = getToken();
    const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
    const isAuthEndpoint = url.includes("/api/auth/");

    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    // Solo forzamos logout/redirect en 401 de endpoints protegidos,
    // nunca en /api/auth/login (ahí un 401 es "contraseña incorrecta", no sesión vencida).
    if (response.status === 401 && !isAuthEndpoint) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("user");
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem("user");
        window.location.href = "/login";
    }

    return response;
}