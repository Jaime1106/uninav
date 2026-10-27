
import React, { useEffect, useRef } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import { useAppContext } from '../context/AppContext';
import L from 'leaflet';

const userIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export const UserMarker: React.FC = () => {
  const { state } = useAppContext();
  const { currentLocation } = state;
  const map = useMap();

  // Evita centrar el mapa más de una vez automáticamente.
  const didCenterMap = useRef(false);

  useEffect(() => {
    if (!currentLocation) return;

    // Centrar únicamente al recibir la primera ubicación GPS.
    if (!didCenterMap.current) {
      map.flyTo(
        [currentLocation.lat, currentLocation.lng],
        17,
        {
          animate: true,
          duration: 0.8,
        }
      );

      didCenterMap.current = true;
    }

    // IMPORTANTE:
    // No usar flyTo() ni panTo() cuando cambia el GPS.
    // El usuario puede explorar el mapa sin que la cámara
    // lo devuelva constantemente a su ubicación.
  }, [currentLocation, map]);

  // Si todavía no hay ubicación, no mostrar el marcador.
  if (!currentLocation) {
    return null;
  }

  return (
    <Marker
      position={[
        currentLocation.lat,
        currentLocation.lng,
      ]}
      icon={userIcon}
    >
      <Popup>
        Estás aquí
        <br />
        Precisión: {currentLocation.accuracy.toFixed(1)} m
      </Popup>
    </Marker>
  );
};
