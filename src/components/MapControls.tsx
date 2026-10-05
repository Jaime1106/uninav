// /src/components/MapControls.tsx
import React, { useState } from 'react'; // <-- Importa useState
import { useMap } from 'react-leaflet';
import { useAppContext } from '../context/AppContext';
import { Settings, Crosshair, Plus, Minus } from 'lucide-react';
import { SettingsPanel } from './SettingsPanel'; // <-- 1. Importa el panel

export const MapControls: React.FC = () => {
    const map = useMap();
    const { state } = useAppContext();

    // --- 2. Estado para mostrar/ocultar el panel ---
    const [showSettings, setShowSettings] = useState(false);

    const handleRecenter = () => {
        if (state.currentLocation) {
            map.flyTo(
                [state.currentLocation.lat, state.currentLocation.lng],
                Math.max(map.getZoom(), 20)
            );
        }
    };

    const controlClass =
        'w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-md ' +
        'border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95 ' +
        'focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-gray-800 dark:text-white';

    return (
        <>
            {/* Botones Flotantes */}
            <div
                className="absolute top-24 right-4 z-[1000] flex flex-col gap-2"
                aria-label="Controles del mapa"
            >
                {/* boton + */}
                <button
                    type="button"
                    onClick={() => map.zoomIn()}
                    className={controlClass}
                    aria-label="Acercar mapa"
                    title="Acercar mapa"
                >
                    <Plus className="h-7 w-7" aria-hidden="true" />
                </button>

                {/* boton - */}
                <button
                    type="button"
                    onClick={() => map.zoomOut()}
                    className={controlClass}
                    aria-label="Alejar mapa"
                    title="Alejar mapa"
                >
                    <Minus className="h-7 w-7" aria-hidden="true" />
                </button>

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