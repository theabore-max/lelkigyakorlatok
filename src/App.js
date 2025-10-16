// App.js
import React, { useEffect, useState, useCallback } from "react";
import { Container } from "react-bootstrap";
import PageContent from "./components/PageContent";
import { supabase } from "./supabaseClient";

function App() {
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
    <>
      {/* Ha később vissza akarod hozni a Navbar-t, ide teheted;
          a user itt már biztosan be van olvasva */}
      <Container className="mt-4">
        <PageContent
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          user={user}
          onSignOut={handleSignOut}
        />
      </Container>
    </>
  );
}

export default App;

