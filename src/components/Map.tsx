// /src/components/Map.tsx
import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { UserMarker } from './UserMarker';
import { RouteLayer } from './RouteLayer';
import { PointsOfInterestLayer } from './PointsOfInterestLayer';
import { MapControls } from './MapControls'; // <-- 1. Importa los controles

export const Map: React.FC = () => {
  // Pon aquí las coordenadas REALES del centro de tu campus
  const defaultPosition: [number, number] = [10.9950, -74.7912]; // (Ej: CUC)

  return (
    <MapContainer
      center={defaultPosition}
      zoom={20}
      style={{ height: '100vh', width: '100%' }}
      zoomControl={false} // Ocultamos el zoom por defecto
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      
      <UserMarker />
      <RouteLayer />
      <PointsOfInterestLayer />
      
      <MapControls /> {/* <-- 2. Añade los controles DENTRO del mapa */}

    </MapContainer>
  );
};