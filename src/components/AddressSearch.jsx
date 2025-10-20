// Archivo: src/components/AddressSearch.jsx

import React from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

const AddressSearch = ({ onSelect }) => {
  const {
    ready,
    value,
    suggestions: { status, data = [] }, // 👈 valor por defecto: arreglo vacío
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => 19.83, lng: () => -90.53 },
      radius: 100 * 1000,
      componentRestrictions: { country: 'mx' },
    },
    debounce: 300,
  });

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();
    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onSelect({ lat, lng, text: address });
    } catch (error) {
      console.error("Error al obtener las coordenadas:", error);
    }
  };

  return (
    <div className="mb-3" style={{ position: 'relative' }}>
      <label className="form-label">Busca tu dirección:</label>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        className="form-control"
        placeholder="Ej: Calle 10, Colonia Centro..."
      />

      {/* Lista de sugerencias */}
      {status === "OK" && Array.isArray(data) && data.length > 0 && (
        <ul
          className="list-group"
          style={{ position: 'absolute', zIndex: 1000, width: '100%' }}
        >
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              onClick={() => handleSelect(description)}
              className="list-group-item list-group-item-action"
              style={{ cursor: 'pointer' }}
            >
              {description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressSearch;
