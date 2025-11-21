// /src/App.tsx
import React, { useEffect, useRef } from "react";
import { Map } from "./components/Map";
import { Searchbar } from "./components/Searchbar";
import { NavigationPanel } from "./components/NavigationPanel";
import { useAppContext } from "./context/AppContext";
import { useTTS } from "./hooks/useTTS";
import { usePointsOfInterest } from "./hooks/usePointsOfInterest";
import { calculateDistance } from "./utils/geometry";
import { useGPS } from "./hooks/useGPS";
import { SimulationProvider } from "./components/SimulationProvider";
import { EnhancedInstruction } from "./types";

const IS_DEVELOPMENT = false;

/**
 * Simplifica las instrucciones para avisos de distancia
 */
const getSimplifiedInstruction = (instruction: EnhancedInstruction): string => {
    switch (instruction.type) {
        case 'turn':
            if (instruction.direction === 'left') {
                return 'gire a la izquierda';
            } else if (instruction.direction === 'right') {
                return 'gire a la derecha';
  }
            return 'realice la maniobra';   
        
        case 'continue':
            return 'continúe recto';
        
        case 'stairs':
            return 'encuentre las escaleras';
        
        case 'elevator':
            return 'tome el ascensor';
        
        case 'arrival':
            return 'llegará a su destino';
        
        case 'start':
            return 'inicie la ruta';
        
        default:
            return 'siga la ruta';
    }
};

export const App: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { currentLocation, currentRoute, navigationActive, pointsData, settings } = state;

    const { speak, cancel } = useTTS();
    const currentInstructionIndex = useRef(0);
    const announcedPOIs = React.useRef(new Set<string>());
    const announcedDistances = React.useRef(new Set<string>());
    const { startTracking, stopTracking } = useGPS();
    const { pointsData: loadedPointsData } = usePointsOfInterest();

    // --- REFERENCIAS PARA SIMULADOR ---
    const simulationIntervalRef = useRef<number | null>(null);
    const routeStepIndex = useRef(0);

    // --- SISTEMA DE ALTO CONTRASTE ---
    useEffect(() => {
        const root = document.documentElement;
        
        // Remover todas las clases de tema primero
        root.classList.remove('high-contrast', 'dark');
        
        // Aplicar solo alto contraste si está activado
        if (settings.highContrastMode) {
            root.classList.add('high-contrast');
        }
    }, [settings.highContrastMode]);
    
    // --- INICIAR GPS ---
    useEffect(() => {
        startTracking();
        return () => stopTracking();
    }, [startTracking, stopTracking]);

    // --- BUCLE PRINCIPAL DE NAVEGACIÓN MEJORADO ---
    React.useEffect(() => {
        if (!currentLocation || !currentRoute || !navigationActive || !settings.isVoiceActive) {
            return;
        }

        // --- Lógica de Puntos de Interés (POI) ---
        const PROXIMITY_POI = 15;
        
        loadedPointsData?.features.forEach((point) => {
            const pointId = point.properties.name + point.geometry.coordinates.join(',');
            if (announcedPOIs.current.has(pointId)) return;

            const [lng, lat] = point.geometry.coordinates;
            const distance = calculateDistance(currentLocation, { lat, lng });
            if (distance <= PROXIMITY_POI) {
                speak(point.properties.message, true);
                announcedPOIs.current.add(pointId);
            }
        });

        // --- Lógica de Instrucciones con Cálculos Correctos ---
        const PROXIMITY_INSTRUCTION = 8;

        // Si ya completamos todas las instrucciones
        if (currentInstructionIndex.current >= currentRoute.instructions.length) {
            const finalNode = currentRoute.instructions[currentRoute.instructions.length - 1]?.node;
            if (finalNode) {
                const distanceToDestination = calculateDistance(currentLocation, finalNode);
                if (distanceToDestination <= PROXIMITY_INSTRUCTION) {
                    speak("¡Has llegado a tu destino!", true);
                    dispatch({ type: "SET_INSTRUCTION", payload: "¡Has llegado a tu destino!" });
                }
            }
            return;
        }

        // Obtener la instrucción actual
        const currentInstruction = currentRoute.instructions[currentInstructionIndex.current];
        
        // Calcular distancia REAL hasta el nodo de la instrucción actual
        const distanceToCurrentNode = calculateDistance(currentLocation, currentInstruction.node);
        
        // Si estamos cerca del punto de instrucción actual, ejecutarla
        if (distanceToCurrentNode <= PROXIMITY_INSTRUCTION) {
            // 🎯 CORRECCIÓN: La instrucción YA incluye la distancia, solo hablarla
            speak(currentInstruction.text, true);
            dispatch({ type: "SET_INSTRUCTION", payload: currentInstruction.text });
            currentInstructionIndex.current += 1;
            announcedDistances.current.clear();
            return;
        }

        // --- AVISOS ANTICIPADOS PARA MANIOBRAS (solo para giros) ---
        if (currentInstruction.type === 'turn') {
            const roundedDistance = Math.round(distanceToCurrentNode);
            
            // Avisos anticipados solo para giros
            if (roundedDistance === 50 || roundedDistance === 25 || roundedDistance === 10) {
                const announcementKey = `prealert_${currentInstructionIndex.current}_${roundedDistance}`;
                if (!announcedDistances.current.has(announcementKey)) {
                    let preAlertMessage = "";
                    
                    if (roundedDistance === 50) {
                        preAlertMessage = `En 50 metros, ${getSimplifiedInstruction(currentInstruction)}`;
                    } else if (roundedDistance === 25) {
                        preAlertMessage = `En 25 metros, ${getSimplifiedInstruction(currentInstruction)}`;
                    } else if (roundedDistance === 10) {
                        preAlertMessage = `En 10 metros, ${getSimplifiedInstruction(currentInstruction)}`;
                    }
                    
                    if (preAlertMessage) {
                        speak(preAlertMessage, false);
                        announcedDistances.current.add(announcementKey);
                        
                        // Actualizar UI con aviso anticipado
                        dispatch({ 
                            type: "SET_INSTRUCTION", 
                            payload: `Prepararse: ${preAlertMessage}` 
                        });
                    }
                }
            }
        }
    }, [
        currentLocation,
        currentRoute,
        navigationActive,
        pointsData,
        speak,
        dispatch,
        settings.isVoiceActive,
        loadedPointsData
    ]);

    // --- RESETEO AL DETENER NAVEGACIÓN ---
    useEffect(() => {
        if (!navigationActive) {
            currentInstructionIndex.current = 0;
            announcedPOIs.current.clear();
            announcedDistances.current.clear();
            cancel();
            dispatch({ type: 'SET_INSTRUCTION', payload: null });
        }
    }, [navigationActive, cancel, dispatch]);

    const handleTestLocation = () => {
        console.log("Forzando ubicación de prueba...");
        dispatch({
            type: "SET_LOCATION",
            payload: {
                lat: 10.995113771511754,
                lng: -74.78906942140793,
                accuracy: 5,
                heading: null,
                speed: null,
                timestamp: Date.now(),
            },
        });
    };

    // --- SIMULACIÓN DE MOVIMIENTO (SOLO DESARROLLO) ---
    useEffect(() => {
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
        }

        if (IS_DEVELOPMENT && navigationActive && currentRoute) {
            console.log("SIMULACIÓN: Iniciando movimiento a lo largo de la ruta.");
            routeStepIndex.current = 1;

            simulationIntervalRef.current = window.setInterval(() => {
                const routeCoords = currentRoute.coordinates;

                if (routeStepIndex.current >= routeCoords.length) {
                    clearInterval(simulationIntervalRef.current!);
                    console.log("SIMULACIÓN: Ruta completada.");
                    return;
                }

                const nextCoord = routeCoords[routeStepIndex.current];
                
                const simulatedLocation: any = {
                    lat: nextCoord[0],
                    lng: nextCoord[1],
                    accuracy: 5,
                    heading: 0,
                    speed: 5,
                    timestamp: Date.now()
                };

                dispatch({ type: 'SET_LOCATION', payload: simulatedLocation });
                routeStepIndex.current += 1;

            }, 2000);
        }

        return () => {
            if (simulationIntervalRef.current) {
                clearInterval(simulationIntervalRef.current);
            }
        };
    }, [IS_DEVELOPMENT, navigationActive, currentRoute, dispatch]);

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100">
            <Searchbar />
            {IS_DEVELOPMENT && <SimulationProvider />}
            <div className="relative flex-1">
                <Map />
                <NavigationPanel />
                <div
                    style={{
                        position: "absolute",
                        display: IS_DEVELOPMENT ? "block" : "none",
                        top: 100,
                        left: 10,
                        zIndex: 1000,
                        background: "rgba(255, 255, 255, 0.9)",
                        padding: "10px",
                        borderRadius: "5px",
                        border: "1px solid black",
                        maxWidth: "calc(100% - 40px)",
                    }}
                >
                    <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                        Panel de Diagnóstico
                    </div>
                    <button
                        onClick={handleTestLocation}
                        style={{ width: "100%", padding: "5px" }}
                    >
                        Simular Ubicación (Click)
                    </button>
                    <div style={{ marginTop: "10px", fontSize: "12px" }}>
                        <strong>Estado del GPS Real:</strong>
                        {currentLocation && (
                            <div style={{ color: "green", wordBreak: "break-all" }}>
                                ¡Ubicación Recibida! ({currentLocation.lat.toFixed(4)},{" "}
                                {currentLocation.lng.toFixed(4)})
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};