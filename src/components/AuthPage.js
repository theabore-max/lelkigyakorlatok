// src/components/AuthPage.js
import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function AuthPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // "login" vagy "signup"
  const [error, setError] = useState(null);

  async function handleAuth(e) {
    e.preventDefault();
    setError(null);

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLoginSuccess(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePasswordReset() {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      alert("Jelszó-visszaállítási email elküldve!");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to right, #74ebd5, #ACB6E5)",
      }}
    >
      <div
        className="card shadow-lg rounded p-4"
        style={{ maxWidth: "400px", width: "100%" }}
      >
        <h3 className="text-center mb-4">
          {mode === "login" ? "Belépés" : "Regisztráció"}
        </h3>

        {error && (
          <div className="alert alert-danger text-center">{error}</div>
        )}

        <form onSubmit={handleAuth}>
          <div className="form-floating mb-3">
            <input
              type="email"
              className="form-control"
              id="floatingEmail"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label htmlFor="floatingEmail">Email cím</label>
          </div>

          <div className="form-floating mb-3">
            <input
              type="password"
              className="form-control"
              id="floatingPassword"
              placeholder="Jelszó"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label htmlFor="floatingPassword">Jelszó</label>
          </div>

          <button type="submit" className="btn btn-primary w-100 mb-3">
            {mode === "login" ? "Belépés" : "Regisztráció"}
          </button>
        </form>

        {mode === "login" && (
          <div className="text-center">
            <button
              className="btn btn-link text-muted"
              onClick={handlePasswordReset}
            >
              Elfelejtett jelszó?
            </button>
          </div>
        )}

        <div className="text-center mt-3">
          {mode === "login" ? (
            <p>
              Nincs fiókod?{" "}
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => setMode("signup")}
              >
                Regisztráció
              </button>
            </p>
          ) : (
            <p>
              Már van fiókod?{" "}
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => setMode("login")}
              >
                Belépés
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
