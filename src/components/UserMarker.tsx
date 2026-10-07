// /src/components/UserMarker.tsx
import React, { useEffect, useRef } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import { useAppContext } from '../context/AppContext';
import L from 'leaflet';

const userIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export const UserMarker: React.FC = () => {
  const { state } = useAppContext();
  const { currentLocation, navigationActive } = state;
  const map = useMap();

  // --- AÑADIMOS ESTA LÍNEA ---
  // Usamos un Ref para saber si ya centramos la cámara una vez
  const didCenterMap = useRef(false);

  useEffect(() => {
    if (!currentLocation) return;

    // 1. MODO "EXPLORACIÓN" (Primera carga)
    // Centrar el mapa solamente la primera vez
    if (!didCenterMap.current) {
      map.flyTo(
        [currentLocation.lat, currentLocation.lng],
        17
      );

      didCenterMap.current = true;
      return;
    }

    // 2. MODO "NAVEGACIÓN" (Seguimiento)
    // Durante una ruta, seguimos al usuario
    // sin modificar el nivel de zoom.
    if (navigationActive) {
      map.panTo(
        [currentLocation.lat, currentLocation.lng],
        {
          animate: true,
          duration: 0.5
        }
      );
    }

    // 3. Si no estamos navegando:
    // no movemos la cámara.
  }, [currentLocation, navigationActive, map]);

  if (!currentLocation) {
    return null; // No renderizar nada si no hay ubicación
  }

  return (
    <Marker position={[currentLocation.lat, currentLocation.lng]} icon={userIcon}>
      <Popup>
        Estás aquí <br />
        (Precisión: {currentLocation.accuracy.toFixed(1)}m)
      </Popup>
    </Marker>
  );
};