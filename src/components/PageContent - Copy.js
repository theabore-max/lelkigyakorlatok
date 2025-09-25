import React from "react";
import LoginForm from "./LoginForm";
import AddEventForm from "./AddEventForm";
import EditEventForm from "./EditEventForm";

const PageContent = ({ page, setPage, user }) => {
  if (page === "about") {
    return (
      <div className="container mt-4">
        <button className="btn btn-secondary mb-3" onClick={() => setPage("home")}>Vissza</button>
        <h2>Az oldal célja</h2>
        <p>
          Az oldal célja, hogy összegyűjtse és bemutassa a különféle katolikus lelkigyakorlatokat. 
          A látogatók könnyen kereshetnek és jelentkezhetnek a számukra megfelelő programokra, a szervezők pedig új lelkigyakorlatokat vihetnek fel, hogy minél több emberhez eljuthasson a meghívás.
          Így az oldal segíti a közösségeket és az érdeklődőket abban, hogy egymásra találjanak, és minél többen részt vehessenek lelki megújulást hozó alkalmakon.
        </p>
        <blockquote className="blockquote">
          <p className="mb-0">1 Kor 2,9-10</p>
        </blockquote>
        <img src="https://via.placeholder.com/800x300" alt="About" className="img-fluid mt-3"/>
      </div>
    );
  }
  if (page === "contact") {
    return (
      <div className="container mt-4">
        <button className="btn btn-secondary mb-3" onClick={() => setPage("home")}>Vissza</button>
        <h2>Kapcsolat</h2>
        <p>
          Ha technikai problémát tapasztalsz az oldalon, vagy új lelkigyakorlatot szeretnél felvinni, írj nekünk bátran a
          <br /><strong>lgykereso@gmail.com</strong>
          <br />címre – örömmel segítünk! Szívesen fogadjuk a visszajelzéseidet és ötleteidet is, hogyan tehetnénk még jobbá az oldalt.
          Igyekszünk minden üzenetre néhány napon belül válaszolni. Kérjük, vedd figyelembe, hogy ezen a címen technikai és szervezési ügyekben tudunk segíteni, lelki vezetést vagy tanácsadást nem tudunk biztosítani.
        </p>
        <img src="https://via.placeholder.com/800x300" alt="Contact" className="img-fluid mt-3"/>
      </div>
    );
  }
  if (page === "login") return <LoginForm setPage={setPage} />;
  if (page === "add") return <AddEventForm setPage={setPage} user={user} />;
  if (page === "edit") return <EditEventForm setPage={setPage} user={user} />;
  return null;
};

export default PageContent;
