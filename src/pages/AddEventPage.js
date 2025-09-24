import { useState } from "react";
import { useauth} from "../hooks/useauth";
import { supabase } from "../supabaseClient";

export default function AddEventPage() {
  const user = useauth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    location: "",
    target_group: "",
    organizer: "",
    contact: "",
    signup_link: ""
  });

  const [message, setMessage] = useState("");

  if (!user) return <p>Kérlek jelentkezz be az esemény létrehozásához.</p>;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from("events")
        .insert([{ ...formData, created_by: user.id }]);

      if (error) throw error;
      setMessage("Esemény sikeresen létrehozva!");
      setFormData({
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        location: "",
        target_group: "",
        organizer: "",
        contact: "",
        signup_link: ""
      });
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h2>Új esemény létrehozása</h2>
      <form onSubmit={handleSubmit}>
        {Object.keys(formData).map((key) => (
          <div key={key}>
            <label>{key.replace("_", " ")}:</label>
            <input
              type={key.includes("date") ? "date" : "text"}
              name={key}
              value={formData[key]}
              onChange={handleChange}
              required={key === "title" || key === "start_date"}
            />
          </div>
        ))}
        <button type="submit">Esemény létrehozása</button>
      </form>
      <p>{message}</p>
    </div>
  );
}