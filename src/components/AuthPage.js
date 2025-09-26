// src/components/AuthPage.js
import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function AuthPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // login vagy register

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErrorMessage(error.message);
    else if (onLoginSuccess) onLoginSuccess(data.user);
  };

  const handleRegister = async () => {
    setLoading(true);
    setErrorMessage("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setErrorMessage(error.message);
    else if (onLoginSuccess) onLoginSuccess(data.user);
  };

  const handlePasswordReset = async () => {
    if (!email) return setErrorMessage("Add meg az email címet a jelszó visszaállításhoz");
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setErrorMessage(error.message);
    else alert("Jelszó visszaállító link elküldve az email címre!");
  };

  return (
    <div className="container mt-4" style={{ maxWidth: "400px" }}>
      <h3>{mode === "login" ? "Belépés" : "Regisztráció"}</h3>
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
      {mode === "login" ? (
        <>
          <button className="btn btn-primary" onClick={handleLogin} disabled={loading}>
            {loading ? "Betöltés..." : "Belépés"}
          </button>
          <button className="btn btn-link" onClick={handlePasswordReset}>
            Jelszó visszaállítás
          </button>
          <p>
            Nincs fiókod? <button className="btn btn-link p-0" onClick={() => setMode("register")}>Regisztráció</button>
          </p>
        </>
      ) : (
        <>
          <button className="btn btn-success" onClick={handleRegister} disabled={loading}>
            {loading ? "Betöltés..." : "Regisztráció"}
          </button>
          <p>
            Már van fiókod? <button className="btn btn-link p-0" onClick={() => setMode("login")}>Belépés</button>
          </p>
        </>
      )}
    </div>
  );
}
