// src/components/AboutPage.js
import React from "react";
import aboutImage from "../assets/about.jpg";

export default function AboutPage({ onBack }) {
  return (
    <div
      style={{
        backgroundImage: `url(${aboutImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh", // teljes magasság
        width: "100%",
        color: "black"
      }}
    >
      <div className="container py-5">
	  {/*<button className="btn btn-light mb-3" onClick={onBack}>
          &larr; Vissza
	  </button>*/}		
        <div className="bg-white bg-opacity-75 p-4 rounded">
          <h2>Az oldal célja</h2>
          <h5>
            Az oldal célja, hogy összegyűjtse és bemutassa a különféle katolikus lelkigyakorlatokat.
            A látogatók könnyen kereshetnek és jelentkezhetnek a számukra megfelelő programokra,
            a szervezők pedig új lelkigyakorlatokat vihetnek fel, hogy minél több emberhez
            eljuthasson a meghívás.</h5>
		  <h5>  
            Így az oldal segíti a közösségeket és az érdeklődőket abban, hogy egymásra találjanak,
            és minél többen részt vehessenek lelki megújulást hozó alkalmakon.
          </h5>
		
          <blockquote className="blockquote mt-4">
            <p p className="mb-2 fst-italic">
              „Amit szem nem látott, és fül nem hallott, és ember szívébe fel nem vetődött,
              azt készítette el Isten azoknak, akik szeretik őt.”
            </p>
            <footer className="blockquote-footer mt-2">
              1 Kor 2,9-10
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}

