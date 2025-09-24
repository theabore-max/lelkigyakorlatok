export default function FilterBar({ search, setSearch, targetGroup, setTargetGroup, location, setLocation, targetGroups, locations }) {
  return (
    <div className="filter-bar">
      <input
        type="text"
        placeholder="Keresés név alapján..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <select value={targetGroup} onChange={e => setTargetGroup(e.target.value)}>
        <option value="">Minden célcsoport</option>
        {targetGroups.map(group => (
          <option key={group} value={group}>{group}</option>
        ))}
      </select>
      <select value={location} onChange={e => setLocation(e.target.value)}>
        <option value="">Minden helyszín</option>
        {locations.map(loc => (
          <option key={loc} value={loc}>{loc}</option>
        ))}
      </select>
    </div>
  );
}