// /src/components/MapControls.tsx
import React, { useState } from 'react'; // <-- Importa useState
import { useMap } from 'react-leaflet';
import { useAppContext } from '../context/AppContext';
import { Settings, Crosshair } from 'lucide-react';
import { SettingsPanel } from './SettingsPanel'; // <-- 1. Importa el panel

export const MapControls: React.FC = () => {
    const map = useMap();
    const { state } = useAppContext();
    
    // --- 2. Estado para mostrar/ocultar el panel ---
    const [showSettings, setShowSettings] = useState(false);

    const handleRecenter = () => {
        if (state.currentLocation) {
            map.flyTo([state.currentLocation.lat, state.currentLocation.lng], 18);
        }
    };

    return (
        <>
            {/* Botones Flotantes */}
            <div className="absolute top-24 right-4 z-1000 flex flex-col space-y-3">
                {/* Botón de Ajustes */}
                <button 
                    onClick={() => setShowSettings(true)} // <-- 3. Abrir el panel
                    className="p-3 bg-white rounded-full shadow-md text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                >
                    <Settings className="h-6 w-6" />
                </button>
                
                {/* Botón de Re-centrar */}
                <button 
                    onClick={handleRecenter}
                    className="p-3 bg-white rounded-full shadow-md text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                >
                    <Crosshair className="h-6 w-6" />
                </button>
            </div>

            {/* --- 4. Renderizado Condicional --- */}
            {/* Si showSettings es true, muestra el panel */}
            {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
        </>
    );
};