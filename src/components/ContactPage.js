// src/components/ContactPage.js
import React from "react";
import contactImage from "../assets/contact.jpg";

export default function ContactPage({ onBack }) {
  return (
    <div className="container mt-4">
      {/*<button className="btn btn-secondary mb-3" onClick={onBack}>
        &larr; Vissza
      </button> */}

      <div className="text-center mb-4">
        <img src={contactImage} alt="Kapcsolat" className="img-fluid rounded" />
      </div>

      <h2>Kapcsolat</h2>
      <h5>
        Ha technikai problémát tapasztalsz az oldalon, vagy új lelkigyakorlatot szeretnél felvinni, írj nekünk bátran a
        <p>
		</p>
	  </h5>
      <p>
        <strong>lgykereso@gmail.com</strong>
      </p>
      <h5>
        címre – örömmel segítünk! Szívesen fogadjuk a visszajelzéseidet és ötleteidet is, hogyan tehetnénk még jobbá az oldalt. 
        Igyekszünk minden üzenetre néhány napon belül válaszolni. Kérjük, vedd figyelembe, hogy ezen a címen technikai és szervezési 
        ügyekben tudunk segíteni, lelki vezetést vagy tanácsadást nem tudunk biztosítani.
      </h5>
    </div>
  );
}
