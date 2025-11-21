// /src/components/NavigationPanel.tsx
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { X, Navigation } from 'lucide-react';
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

    // Calcular distancia hasta el próximo punto de instrucción
    const getDistanceToNextInstruction = () => {
        if (!currentLocation || !currentRoute.instructions.length) return null;
        
        // Buscar la próxima instrucción que no haya sido completada
        for (let i = 0; i < currentRoute.instructions.length; i++) {
            const instruction = currentRoute.instructions[i];
            const distanceToNode = calculateDistance(currentLocation, instruction.node);
            
            // Considerar como "próxima" si está a más de 5 metros (no completada)
            if (distanceToNode > 5) {
                return {
                    distance: Math.round(distanceToNode),
                    instruction: instruction,
                    isTurn: instruction.type === 'turn'
                };
            }
        }
        
        return null;
    };

    // Calcular distancia total restante hasta el destino
    const getRemainingDistanceToDestination = () => {
        if (!currentLocation || !currentRoute.instructions.length) return Math.round(currentRoute.distance);
        
        const lastInstruction = currentRoute.instructions[currentRoute.instructions.length - 1];
        const distanceToDestination = calculateDistance(currentLocation, lastInstruction.node);
        return Math.round(distanceToDestination);
    };

    const nextInstructionInfo = getDistanceToNextInstruction();
    const remainingDistanceToDestination = getRemainingDistanceToDestination();
    const totalDistance = Math.round(currentRoute.distance);

    // Calcular progreso basado en distancia recorrida
    const progressPercentage = totalDistance > 0 ? 
        Math.round(((totalDistance - remainingDistanceToDestination) / totalDistance) * 100) : 0;

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

            {/* Próxima instrucción con distancia */}
            {nextInstructionInfo && (
                <div className={`mb-3 p-3 rounded border ${
                    nextInstructionInfo.isTurn 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                }`}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {nextInstructionInfo.isTurn ? 'Próximo giro:' : 'Próxima instrucción:'}
                        </span>
                        <span className={`font-bold ${
                            nextInstructionInfo.isTurn
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-green-600 dark:text-green-400'
                        }`}>
                            {nextInstructionInfo.distance} metros
                        </span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                        {nextInstructionInfo.instruction.text}
                    </p>
                    {nextInstructionInfo.isTurn && (
                        <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                            Avisos anticipados: 50m • 25m • 10m
                        </div>
                    )}
                </div>
            )}

            {/* Instrucción actual */}
            {currentInstruction && (
                <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 uppercase">
                            Instrucción actual:
                        </span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                        {currentInstruction}
                    </p>
                </div>
            )}

            {/* Información de distancias */}
            <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-gray-600 dark:text-gray-400">Distancia total:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                        {totalDistance} metros
                    </span>
                </div>
                <div className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-gray-600 dark:text-gray-400">Restante al destino:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                        {remainingDistanceToDestination} metros
                    </span>
                </div>
            </div>

            {/* Barra de progreso */}
            <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Progreso de la ruta</span>
                    <span>{progressPercentage}% completado</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                    <span>Inicio</span>
                    <span>Destino</span>
                </div>
            </div>

            {/* Información adicional */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {nextInstructionInfo && nextInstructionInfo.isTurn ? (
                        <span>La guía vocal anunciará el giro a 50, 25 y 10 metros</span>
                    ) : (
                        <span>Siga las instrucciones de la guía vocal</span>
                    )}
                </div>
            </div>
        </div>
    );
};