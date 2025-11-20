// /src/components/NavigationPanel.tsx
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { X, Navigation, MapPin } from 'lucide-react';
import { calculateDistance } from '../utils/geometry';

export const NavigationPanel: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { navigationActive, currentRoute, currentInstruction, currentLocation } = state;

    if (!navigationActive || !currentRoute) {
        return null;
    }

    const handleCancel = () => {
        dispatch({ type: 'STOP_NAVIGATION' });
    };

    // Calcular distancia restante
    const getRemainingDistance = () => {
        if (!currentLocation || !currentRoute.instructions.length) return currentRoute.distance;
        
        const lastInstruction = currentRoute.instructions[currentRoute.instructions.length - 1];
        const distanceToDestination = calculateDistance(currentLocation, lastInstruction.node);
        return Math.round(distanceToDestination);
    };

    const remainingDistance = getRemainingDistance();
    const totalDistance = Math.round(currentRoute.distance);

    // Encontrar la próxima acción importante
    const getNextAction = () => {
        if (!currentRoute.instructions.length) return null;
        
        for (let i = 0; i < currentRoute.instructions.length; i++) {
            const instruction = currentRoute.instructions[i];
            if (instruction.type === 'turn' || instruction.type === 'stairs' || instruction.type === 'ramp') {
                return instruction;
            }
        }
        return null;
    };

    const nextAction = getNextAction();
    const progressPercentage = totalDistance > 0 ? Math.round(((totalDistance - remainingDistance) / totalDistance) * 100) : 0;

    return (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
            {/* Encabezado */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                    <Navigation className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        Navegando
                    </h3>
                </div>
                <button 
                    onClick={handleCancel}
                    className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-red-100 dark:hover:bg-red-900 text-gray-700 dark:text-gray-300 hover:text-red-600"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Información de distancia */}
            <div className="flex justify-between items-center mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300">Distancia restante:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                    {remainingDistance} metros
                </span>
            </div>

            {/* Instrucción actual */}
            {currentInstruction && (
                <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                        {currentInstruction}
                    </p>
                </div>
            )}

            {/* Próxima acción */}
            {nextAction && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <MapPin className="h-4 w-4" />
                    <span>Próximo: {nextAction.text}</span>
                </div>
            )}

            {/* Barra de progreso */}
            <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Progreso</span>
                    <span>{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};