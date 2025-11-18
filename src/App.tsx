// /src/App.tsx
import React, { useEffect, useRef } from "react";
import { Map } from "./components/Map";
import { Searchbar } from "./components/Searchbar";
import { NavigationPanel } from "./components/NavigationPanel";
import { useAppContext } from "./context/AppContext"; // Importamos el hook
import { useTTS } from "./hooks/useTTS";
import { usePointsOfInterest } from "./hooks/usePointsOfInterest";
import { calculateDistance } from "./utils/geometry";
import { useGPS } from "./hooks/useGPS";
import { SimulationProvider } from "./components/SimulationProvider";
const IS_DEVELOPMENT = false
export const App: React.FC = () => {
  // --- AHORA NECESITAMOS dispatch AQUÍ ---
  const { state, dispatch } = useAppContext();
  const { currentLocation, currentRoute, navigationActive, pointsData, settings } = state;

  const { speak, cancel } = useTTS();
  const currentInstructionIndex = useRef(0);
  const announcedPOIs = React.useRef(new Set<string>());
  const { startTracking, stopTracking, error } = useGPS();
  const { pointsData: loadedPointsData } = usePointsOfInterest();

  // --- 1. REFERENCIAS PARA EL NUEVO SIMULADOR ---
  const simulationIntervalRef = useRef<number | null>(null);
  const routeStepIndex = useRef(0);

useEffect(() => {
    const root = document.documentElement; // Esto es el tag <html>
    if (settings.highContrastMode) {
      root.classList.add('dark'); // Añade la clase .dark
    } else {
      root.classList.remove('dark'); // Quita la clase .dark
    }
  }, [settings.highContrastMode]);
  // Iniciar GPS (se ejecuta 1 vez)
  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, [startTracking, stopTracking]);
  // (Tu Bucle Central de Navegación se queda aquí, sin cambios)
  React.useEffect(() => {
    if (!currentLocation || !currentRoute || !loadedPointsData) {
      return;
    }
  // --- Lógica de Puntos de Interés (POI) ---
    const PROXIMITY_POI = 15; // 15 metros
    
    loadedPointsData?.features.forEach((point) => {
      const pointId = point.properties.name + point.geometry.coordinates.join(',');
      if (announcedPOIs.current.has(pointId)) return;

      const [lng, lat] = point.geometry.coordinates;
      const distance = calculateDistance(currentLocation, { lat, lng });
      if (distance <= PROXIMITY_POI) {
        speak(point.properties.message, true); // (Voz para PDI)
        announcedPOIs.current.add(pointId);
      }
    });

    // ... (lógica de Instrucciones) ...
    const PROXIMITY_INSTRUCTION = 20; // metros
    if (currentInstructionIndex.current >= currentRoute.instructions.length)
      return;

    // Obtener la siguiente instrucción de la lista
    const nextInstruction = currentRoute.instructions[currentInstructionIndex.current];
    
    // Calcular la distancia a esa instrucción
    const distanceToNextNode = calculateDistance(currentLocation, nextInstruction.node);

    if (distanceToNextNode <= PROXIMITY_INSTRUCTION) {
      speak(nextInstruction.text, true);
      dispatch({ type: "SET_INSTRUCTION", payload: nextInstruction.text });
      currentInstructionIndex.current += 1;
    }
  }, [
    currentLocation,
    currentRoute,
    navigationActive,
    pointsData,
    speak,
    dispatch,
  ]);

useEffect(() => {
    if (!navigationActive) {
      currentInstructionIndex.current = 0; // Resetear el contador
      announcedPOIs.current.clear(); // Resetear PDI
      cancel(); // Cancelar cualquier voz pendiente
      dispatch({ type: 'SET_INSTRUCTION', payload: null }); // Limpiar UI
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
// --- 2. ¡NUEVO! BUCLE DE SIMULACIÓN DE MOVIMIENTO ---
  // Este useEffect se activa cuando 'navigationActive' o 'currentRoute' cambian.
  useEffect(() => {
    // Limpiar cualquier simulación anterior que esté corriendo
    if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
    }

    // Iniciar la simulación SÓLO si estamos en modo desarrollo,
    // navegando, y tenemos una ruta.
    if (IS_DEVELOPMENT && navigationActive && currentRoute) {
        
        console.log("SIMULACIÓN: Iniciando movimiento a lo largo de la ruta.");
        
        // Empezar en el paso 1 (el 0 es la ubicación actual donde ya estamos)
        routeStepIndex.current = 1; 

        // Creamos un "motor" que se ejecuta cada 2 segundos
        simulationIntervalRef.current = window.setInterval(() => {
            const routeCoords = currentRoute.coordinates;

            // --- Condición de Parada ---
            if (routeStepIndex.current >= routeCoords.length) {
                clearInterval(simulationIntervalRef.current!);
                console.log("SIMULACIÓN: Ruta completada.");
                // Opcional: Detener la navegación automáticamente
                // dispatch({ type: 'STOP_NAVIGATION' }); 
                return;
            }

            // --- Lógica de Movimiento ---
            // Obtener el siguiente punto de la ruta
            const nextCoord = routeCoords[routeStepIndex.current];
            console.log(currentRoute);
            
            const simulatedLocation: any = {
                lat: nextCoord[0],
                lng: nextCoord[1],
                accuracy: 5,
                heading: 0, // (Podríamos calcular el ángulo, pero 0 está bien)
                speed: 5,   // (Simulando 5 m/s)
                timestamp: Date.now()
            };

            // ¡Mover el marcador!
            dispatch({ type: 'SET_LOCATION', payload: simulatedLocation });

            // Avanzar al siguiente punto
            routeStepIndex.current += 1;

        }, 2000); // <-- Moverse cada 2 segundos (ajusta esta velocidad)
    }

    // Función de limpieza: se ejecuta si cancelas la ruta
    return () => {
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
        }
    };

  }, [IS_DEVELOPMENT, navigationActive, currentRoute, dispatch]);
  return (
    // --- ESTA ES LA NUEVA ESTRUCTURA ---
    // Contenedor principal: columna flex que ocupa toda la pantalla
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100">
      {/* 1. Proveedor de simulación (no se renderiza) */}

      {/* 2. Barra de búsqueda (arriba) */}
      <Searchbar />
      {IS_DEVELOPMENT && <SimulationProvider />}
      {/* 3. Contenedor del Mapa (abajo, ocupa el resto del espacio) */}
      <div className="relative flex-1">
        <Map />

        {/* El panel de navegación sigue flotando sobre el mapa */}
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

          {/* El Botón de Prueba Manual */}
          <button
            onClick={handleTestLocation}
            style={{ width: "100%", padding: "5px" }}
          >
            Simular Ubicación (Click)
          </button>

          {/* El Diagnóstico del GPS Real */}
          <div style={{ marginTop: "10px", fontSize: "12px" }}>
            <strong>Estado del GPS Real:</strong>

            {/* Si hay un error, lo mostrará aquí */}

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
