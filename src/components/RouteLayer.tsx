// /src/components/RouteLayer.tsx
import React from 'react';
import { Polyline } from 'react-leaflet';
import { useAppContext } from '../context/AppContext';

export const RouteLayer: React.FC = () => {
  const { state } = useAppContext();
  const { currentRoute } = state;

  if (!currentRoute) {
    return null; // No dibujar ruta si no hay
  }

  return (
    <Polyline
      positions={currentRoute.coordinates}
      color="#3b82f6" // Azul (Tailwind blue-500)
      weight={6}
    />
  );
};