const API_URL = import.meta.env.VITE_API_URL;

export const adminFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("adminToken");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,

    headers: {
      ...options.headers,

      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("adminToken");

    window.location.href = "/admin/login";

    throw new Error("Authentication expired");
  }

  return response;
};

export default API_URL;
