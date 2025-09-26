// src/components/LoginForm.js
import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      console.error("Supabase login error:", error);
      setErrorMessage(error.message);
    } else {
      console.log("Bejelentkezés sikeres:", data);
      if (onLoginSuccess) onLoginSuccess(data.user);
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: "400px" }}>
      <h3>Belépés</h3>

      <div className="mb-3">
        <label>Email</label>
        <input
          type="email"
          className="form-control"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
      </div>

      <div className="mb-3">
        <label>Jelszó</label>
        <input
          type="password"
          className="form-control"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Jelszó"
        />
      </div>

      {errorMessage && <div className="text-danger mb-3">{errorMessage}</div>}

      <button
        className="btn btn-primary"
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? "Betöltés..." : "Belépés"}
      </button>
    </div>
  );
}
