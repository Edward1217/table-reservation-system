import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../utils/api";

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Temporarily store JWT
      localStorage.setItem("adminToken", data.token);

      navigate("/admin");
    } catch (error) {
      console.error(error);

      setError("Unable to connect to server");
    }
  };

  return (
    <div className='admin-login'>
      <h1>Admin Login</h1>

      <form onSubmit={handleLogin}>
        <label>Email</label>

        <input
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>

        <input
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className='login-error'>{error}</p>}

        <button type='submit'>Login</button>
      </form>
    </div>
  );
}

export default AdminLoginPage;
