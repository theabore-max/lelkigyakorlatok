import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../hooks/useAuth";

export default function NewEventForm() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [contact, setContact] = useState("");
  const [organization, setOrganization] = useState("");
  const [registrationLink, setRegistrationLink] = useState("");
  const [message, setMessage] = useState("");

  if (!user) {
    return <p>Be kell jelentkezned, hogy új eseményt hozhass létre.</p>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Egyszerű validáció
    if (!title || !startDate) {
      setMessage("Kérlek töltsd ki a kötelező mezőket.");
      return;
    }

    const { data, error } = await supabase.from("events").insert([
      {
        title,
        description,
        start_date: startDate,
        end_date: endDate || startDate,
        contact,
        organization,
        registration_link: registrationLink,
      },
    ]);

    if (error) {
      console.error(error);
      setMessage("Hiba történt az esemény létrehozásakor.");
    } else {
      setMessage("Az esemény sikeresen létrehozva!");
      // Űrlap ürítése
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setContact("");
      setOrganization("");
      setRegistrationLink("");
    }
  };

  return (
    <div>
      <h2>Új esemény létrehozása</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Esemény neve*:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Leírás:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>
        <div>
          <label>Kezdés*:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Vége:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div>
          <label>Kapcsolattartó:</label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>
        <div>
          <label>Szervező közösség:</label>
          <input
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
        </div>
        <div>
          <label>Jelentkezési link:</label>
          <input
            type="url"
            value={registrationLink}
            onChange={(e) => setRegistrationLink(e.target.value)}
          />
        </div>
        <button type="submit">Esemény létrehozása</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
