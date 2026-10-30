const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function getApiUrl(path = "") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(getApiUrl(path), {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = raw || `API request failed (${response.status})`;
    let code;
    let payload;

    try {
      const data = JSON.parse(raw);
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (data.detail && typeof data.detail === "object" && !Array.isArray(data.detail)) {
        message = data.detail.message || data.detail.code || message;
        code = data.detail.code;
        payload = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail
          .map((item) => item.msg || JSON.stringify(item))
          .join(" ");
      } else if (data.message) {
        message = data.message;
      }
    } catch {
      // keep raw text
    }

    const error = new Error(message);
    error.status = response.status;
    error.code = code;
    error.payload = payload;
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export function getGoogleAuthUrl() {
  return getApiUrl("/api/auth/google");
}

export function maskEmail(email = "") {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, 1) || "*";
  return `${visible}***@${domain}`;
}
