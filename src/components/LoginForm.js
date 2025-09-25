import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function LoginForm({ setPage }) {
  const [mode, setMode] = useState("login"); // 'login' | 'register' | 'reset'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage("Sikeres bejelentkezés");
        setPage("home");
      } else if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Regisztráció sikeres — ellenőrizd az emailedet.");
      } else if (mode === "reset") {
        try {
          // Próbáljuk a Supabase kliens reset metódusát, ha elérhető
          if (supabase.auth.resetPasswordForEmail) {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            setMessage("Jelszó-visszaállító email elküldve.");
          } else {
            setMessage("Jelszó visszaállításhoz kérjük használd a Supabase Auth beállításait vagy próbáld később.");
          }
        } catch (err) {
          setMessage("Nem sikerült a jelszó-visszaállítás: " + err.message);
        }
      }
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="container mt-4">
      <button className="btn btn-secondary mb-3" onClick={() => setPage("home")}>Vissza</button>
      <h2>{mode === "login" ? "Bejelentkezés" : mode === "register" ? "Regisztráció" : "Jelszó visszaállítás"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <input className="form-control" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        {mode !== "reset" && (
          <div className="mb-2">
            <input className="form-control" type="password" placeholder="Jelszó" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
        )}

        <div className="mb-2">
          <button className="btn btn-primary me-2" type="submit">
            {mode === "login" ? "Bejelentkezés" : mode === "register" ? "Regisztráció" : "Küldés"}
          </button>
          <button type="button" className="btn btn-link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Regisztráció" : "Bejelentkezés"}
          </button>
          {mode !== "reset" && (
            <button type="button" className="btn btn-link" onClick={() => setMode("reset")}>
              Elfelejtett jelszó
            </button>
          )}
        </div>
      </form>

      {message && <div className="alert alert-info mt-2">{message}</div>}
    </div>
  );
}