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
    if (currentLocation) {
      
      // 1. MODO "EXPLORACIÓN" (Primera Carga)
      // ¿Es la primera vez que te encontramos?
      if (!didCenterMap.current) {
        map.flyTo([currentLocation.lat, currentLocation.lng], 17);
        didCenterMap.current = true;
      }
      
      // 2. MODO "NAVEGACIÓN" (Seguimiento)
      // ¿Ya te encontramos Y ADEMÁS estás navegando?
      else if (navigationActive) {
        map.flyTo([currentLocation.lat, currentLocation.lng], map.getZoom());
      }
      
      // 3. SI NINGUNO SE CUMPLE:
      // (Es decir, ya te encontramos pero NO estás navegando)
      // No hacemos nada. El marcador se mueve, pero la cámara se queda quieta.
    }
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