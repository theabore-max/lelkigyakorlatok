import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // login / signup
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await supabase.auth.signInWithPassword({ email, password });
      } else {
        await supabase.auth.signUp({ email, password });
      }
      setMessage("Sikeres bejelentkezés / regisztráció!");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto" }}>
      <h3>{mode === "login" ? "Bejelentkezés" : "Regisztráció"}</h3>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Jelszó" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">{mode === "login" ? "Bejelentkezés" : "Regisztráció"}</button>
      </form>
      <button onClick={() => setMode(mode === "login" ? "signup" : "login")}>
        {mode === "login" ? "Regisztráció" : "Bejelentkezés"} váltás
      </button>
      <button onClick={() => supabase.auth.signOut()}>Kijelentkezés</button>
      <p>{message}</p>
    </div>
  );
}