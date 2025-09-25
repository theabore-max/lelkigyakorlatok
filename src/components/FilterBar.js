import React from "react";

const groups = ["Fiatalok", "Mindenki", "Idősek", "Fiatal házasok", "Érett házasok", "Jegyesek", "Tinédzserek", "Családok"];

const FilterBar = ({ filter, setFilter, search, setSearch }) => {
  return (
    <div>
      <h5>Szűrés</h5>
      <select className="form-control mb-2" value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="">Összes célcsoport</option>
        {groups.map(g => <option key={g} value={g}>{g}</option>)}
      </select>
      <input 
        className="form-control" 
        type="text" 
        placeholder="Keresés..." 
        value={search} 
        onChange={e => setSearch(e.target.value)} 
      />
    </div>
  );
};

export default FilterBar;
