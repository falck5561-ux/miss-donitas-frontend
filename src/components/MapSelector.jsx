// Archivo: src/components/MapSelector.jsx (Versión con Búsqueda)

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import toast from 'react-hot-toast';

const libraries = ['places']; // Habilita la API de Places para la búsqueda

const MapSelector = ({ onLocationSelect, initialAddress }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [marker, setMarker] = useState(null);
  const autocompleteRef = useRef(null);

  // Efecto para poner el marcador si hay una dirección inicial (ej. guardada)
  useEffect(() => {
    if (initialAddress && initialAddress.lat && initialAddress.lng) {
      setMarker({ lat: initialAddress.lat, lng: initialAddress.lng });
    }
  }, [initialAddress]);


  const mapContainerStyle = { width: '100%', height: '300px' };
  const center = { lat: 19.8468, lng: -90.5361 }; // Centro por defecto en Campeche

  const onMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setMarker({ lat, lng });

    // Usamos Geocoder para obtener la dirección a partir de las coordenadas
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        // Le pasamos al padre la información completa
        onLocationSelect({ lat, lng, description: results[0].formatted_address });
      } else {
        toast.error('No se pudo obtener la dirección para esta ubicación.');
        onLocationSelect({ lat, lng, description: `Ubicación personalizada (${lat.toFixed(4)})` });
      }
    });
  }, [onLocationSelect]);

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setMarker({ lat, lng });
        // Le pasamos al padre la información completa
        onLocationSelect({ lat, lng, description: place.formatted_address });
      }
    }
  };

  if (loadError) return <div>Error al cargar el mapa. Asegúrate de que la clave de API de Google Maps sea correcta y tenga la "Places API" habilitada.</div>;
  if (!isLoaded) return <div>Cargando mapa...</div>;

  return (
    <>
      <Autocomplete
        onLoad={(ref) => (autocompleteRef.current = ref)}
        onPlaceChanged={onPlaceChanged}
        fields={["geometry", "formatted_address"]}
      >
        <input
          type="text"
          placeholder="Escribe tu calle, número y colonia..."
          className="form-control mb-2"
        />
      </Autocomplete>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={15}
        center={marker || center}
        onClick={onMapClick}
      >
        {marker && <Marker position={marker} />}
      </GoogleMap>
    </>
  );
};

export default MapSelector;