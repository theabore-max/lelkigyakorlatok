import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import EventList from "./components/EventList";
import PageContent from "./components/PageContent";
import { supabase } from "./supabaseClient";

function App() {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState("home"); // "home", "about", "contact", "login", "add", "edit"
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Supabase auth state
    const session = supabase.auth.session();
    setUser(session?.user ?? null);

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    // Lekérdezzük csak a mai vagy későbbi eseményeket
    const fetchEvents = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("start_date", today)
        .order("start_date", { ascending: true });

      if (error) console.error(error);
      else setEvents(data);
    };
    fetchEvents();
  }, []);

  return (
    <div>
      <Navbar setPage={setPage} user={user} />
      {page === "home" && <EventList events={events} user={user} />}
      {["about", "contact", "login", "add", "edit"].includes(page) && (
        <PageContent page={page} setPage={setPage} user={user} />
      )}
    </div>
  );
}

export default App;
