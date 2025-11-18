// /src/components/NavigationPanel.tsx
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { X } from 'lucide-react';

export const NavigationPanel: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { navigationActive, currentRoute, currentInstruction } = state;

    if (!navigationActive || !currentRoute) {
        return null; // No mostrar nada si no estamos navegando
    }

    const handleCancel = () => {
        dispatch({ type: 'STOP_NAVIGATION' });
    };

    // Formatear distancia
    const distance = (currentRoute.distance / 1000).toFixed(1); // en km

    return (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-4 animate-slide-up">
            <div className="flex justify-between items-start">
                <div>
                    <div className="text-sm font-medium text-blue-600">
                        Ruta a {currentRoute.instructions.at(-1)?.node.route || 'destino'}
                    </div>
                    <div className="text-2xl font-bold text-black my-1">
                        {/* Muestra la instrucción actual que guardamos en el estado */}
                        {currentInstruction || 'Iniciando ruta...'}
                    </div>
                    <div className="text-sm text-gray-500">
                        Distancia total: {distance} km
                    </div>
                </div>
                <button 
                    onClick={handleCancel}
                    className="p-2 bg-gray-100 rounded-full hover:bg-red-100 text-gray-700 hover:text-red-600"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>
        </div>
    );
};