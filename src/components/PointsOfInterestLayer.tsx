// /src/components/PointsOfInterestLayer.tsx
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { usePointsOfInterest } from '../hooks/usePointsOfInterest';

// Función para crear iconos personalizados (tu lógica original)
const getPointIcon = (type: string) => {
  const iconConfig = {
    stairs: { color: '#ef4444', icon: '🔺' }, // Rojo
    ramp: { color: '#10b981', icon: '🔄' },   // Verde
    relief_change: { color: '#f59e0b', icon: '⚠️' }, // Amarillo
    default: { color: '#6b7280', icon: '📍' } // Gris
  };
  const config = iconConfig[type as keyof typeof iconConfig] || iconConfig.default;

  return L.divIcon({
    className: `point-marker point-${type}`,
    html: `<div style="background-color: ${config.color}; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">
             ${config.icon}
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

export const PointsOfInterestLayer: React.FC = () => {
  const { pointsData } = usePointsOfInterest(); // Llama al hook

  if (!pointsData) {
    return null;
  }

  return (
    <>
      {pointsData.features.map((point, index) => {
        const [lng, lat] = point.geometry.coordinates;
        const props = point.properties;

        return (
          <Marker
            key={`poi-${index}`}
            position={[lat, lng]}
            icon={getPointIcon(props.type)}
          >
            <Popup>
              <strong>{props.name}</strong>
              <p>{props.message}</p>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};