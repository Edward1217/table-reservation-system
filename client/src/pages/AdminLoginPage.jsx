import { useState } from "react";
import { useNavigate } from "react-router-dom";

import API_URL from "../utils/api";

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid email or password.");
        return;
      }

      localStorage.setItem("adminToken", data.token);

      navigate("/admin");
    } catch (error) {
      console.error(error);

      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='admin-login-page'>
      <div className='admin-login-card'>
        <div className='admin-login-icon'>A</div>

        <div className='admin-login-header'>
          <h1>Admin Login</h1>
          <p>Sign in to manage restaurant reservations.</p>
        </div>

        <form className='admin-login-form' onSubmit={handleLogin}>
          <div className='admin-login-field'>
            <label htmlFor='admin-email'>Email</label>

            <input
              id='admin-email'
              type='email'
              placeholder='Enter your email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete='email'
              required
            />
          </div>

          <div className='admin-login-field'>
            <label htmlFor='admin-password'>Password</label>

            <input
              id='admin-password'
              type='password'
              placeholder='Enter your password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete='current-password'
              required
            />
          </div>

          {error && <div className='admin-login-error'>{error}</div>}

          <button
            className='admin-login-button'
            type='submit'
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className='admin-login-footer'>Restaurant Reservation System</p>
      </div>
    </div>
  );
}

export default AdminLoginPage;
