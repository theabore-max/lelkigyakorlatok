// src/App.js
import React, { useEffect, useState, useCallback } from "react";
import { Container } from "react-bootstrap";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import PageContent from "./components/PageContent";
import Organizers from "./pages/Organizers";
import { supabase } from "./supabaseClient";

function App() {
  // Egyszerű kliens oldali oldalváltáshoz a PageContent-nek továbbra is átadjuk
  const [currentPage, setCurrentPage] = useState("home");

  // Supabase auth állapot
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Kezdeti session beolvasás + feliratkozás változásokra
  useEffect(() => {
    let alive = true;

    // 1) jelenlegi session
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setUser(data?.session?.user ?? null);
      setAuthLoading(false);
    });

    // 2) változások figyelése (signin/signout/token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setUser(session?.user ?? null);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  // (opcionális) kijelentkezés segédfüggvény
  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  if (authLoading) {
    // amíg a session tölt, ne rendereljünk "Belépés" állapotot
    return (
      <Container className="mt-4">
        <div className="text-muted">Bejelentkezés ellenőrzése…</div>
      </Container>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Főoldal */}
        <Route
          path="/"
          element={
            <Container className="mt-4">
              <PageContent
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                user={user}
                onSignOut={handleSignOut}
              />
            </Container>
          }
        />

        {/* Szervezőknek oldal */}
        <Route
          path="/szervezoknek"
          element={
            <Container className="mt-4">
              <Organizers />
            </Container>
          }
        />

        {/* Minden más útvonal visszairányít a főoldalra */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
