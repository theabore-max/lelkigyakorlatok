import './index.css';
import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import AuthForm from "./components/AuthForm";
import FilterBar from "./components/FilterBar";
import EventList from "./components/EventList";
import NewEventForm from "./components/NewEventForm";

export default function App() {
  const { user } = useAuth();

  // Kereső és szűrő state
  const [search, setSearch] = useState("");
  const [targetGroup, setTargetGroup] = useState("");
  const [location, setLocation] = useState("");

  // Előredefiniált opciók
  const targetGroups = ["Fiatalok", "Felnőttek", "Családok"];
  const locations = ["Budapest", "Szeged", "Debrecen"];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Lelkigyakorlatok</h1>

      {/* Belépési blokk */}
      {!user && (
        <div className="mb-6">
          <AuthForm />
        </div>
      )}

      {/* Szűrős kereső */}
      <div className="mb-4">
        <FilterBar
          search={search} setSearch={setSearch}
          targetGroup={targetGroup} setTargetGroup={setTargetGroup}
          location={location} setLocation={setLocation}
          targetGroups={targetGroups}
          locations={locations}
        />
      </div>

      {/* Eseménylista */}
      <div className="mb-6">
        <EventList
          search={search}
          targetGroup={targetGroup}
          location={location}
        />
      </div>

      {/* Új esemény létrehozása belépett user-nek */}
      {user && (
        <div className="mb-6">
          <NewEventForm />
        </div>
      )}
    </div>
  );
}