// src/pages/Organizers.js
import React from "react";

export default function Organizers() {
  return (
    <div className="container py-4">
      <h1 className="mb-3">Szervezőknek</h1>
      <p className="lead">
        Két módon kerülhet fel a lelkigyakorlat: <strong>kézi felvitel</strong> (belépés után), vagy
        <strong> forrás beküldése</strong> (RSS / programoldal URL).
      </p>

      <h3 className="mt-4">1) Kézi felvitel</h3>
      <p>Belépés után kattints a <strong>„Lelkigyakorlat hozzáadása”</strong> gombra a főoldalon.</p>

      <h3 className="mt-4">2) RSS / Oldal beküldése</h3>
      <p>Add meg az RSS feededet, vagy a programoldalad URL-jét. Feldolgozzuk és beemeljük.</p>

      {/* ⇩ Formspree – ezt használd szabadon */}
      <form
        className="row g-3"
        action="https://formspree.io/f/mrbyvogo"  // ← a te Formspree ID-d
        method="POST"
      >
        {/* rejtett mezők */}
        <input type="hidden" name="_subject" value="Lelkigyakorlat forrás beküldés" />
        <input type="hidden" name="_next" value="https://lelkigyakorlatok.vercel.app/szervezoknek?ok=1" />
        {/* honeypot anti-spam */}
        <input type="text" name="_gotcha" style={{ display: "none" }} tabIndex="-1" autoComplete="off" />

        <div className="col-md-6">
          <label className="form-label">Közösség neve</label>
          <input className="form-control" name="community" required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Kapcsolattartó e-mail</label>
          <input className="form-control" type="email" name="email" required />
        </div>
        <div className="col-md-12">
          <label className="form-label">RSS feed vagy programoldal URL</label>
          <input className="form-control" name="url" placeholder="https://..." required />
        </div>
        <div className="col-md-12">
          <label className="form-label">Megjegyzés (opcionális)</label>
          <textarea className="form-control" name="note" rows={3} placeholder="Pl. programleírás, elérhetőség…" />
        </div>

        <div className="col-12 d-flex align-items-center gap-3">
          <button className="btn btn-primary" type="submit">Beküldés</button>
          <span className="text-muted small">A beküldés után visszairányítunk ide.</span>
        </div>
      </form>

      <hr className="my-4" />
      <h3>Mit érdemes feltüntetni?</h3>
      <ul>
        <li><strong>Cím, leírás, időpont</strong> (kezdés/befejezés).</li>
        <li><strong>Jelentkezési link</strong> és kapcsolattartó.</li>
        <li><strong>Plakát</strong> feltöltése (jobb megjelenés a kártyán).</li>
      </ul>

      <div className="alert alert-info mt-4">
        Ha nincs RSS-ed, a programoldalad URL-je is elég – megpróbáljuk kinyerni belőle az adatokat.
      </div>
    </div>
  );
}

