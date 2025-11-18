// /src/hooks/useRouting.ts
import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
    buildGraphFromGeoJSON, 
    findPathDijkstra, 
    formatRouteResult 
} from '../utils/routing';
import { findNearestNodes } from '../utils/geometry';
import { BuildingData, RoutesData, IGraphData, Location, Destination } from '../types';

interface UseRoutingReturn {
    isRoutingLoading: boolean;
    calculateRoute: (destination: Destination) => void;
}

// Para evitar recálculos, mantenemos el grafo fuera del estado
let graphData: IGraphData | null = null;

export const useRouting = (): UseRoutingReturn => {
    // --- 1. NECESITAMOS 'dispatch' ---
    const { state, dispatch } = useAppContext();
    const [isLoading, setIsLoading] = useState(true);

    // 1. Cargar datos y construir el grafo UNA SOLA VEZ
    useEffect(() => {
        if (graphData) {
            setIsLoading(false);
            return;
        }
        
        const loadGraphData = async () => {
            try {
                // --- 2. SOLUCIÓN: Cargar AMBOS archivos aquí ---
                console.log("Cargando map.geojson (edificios)...");
                const buildingRes = await fetch('map.geojson');
                const buildingData = (await buildingRes.json()) as BuildingData;
                
                // Guardar los edificios en el estado global (para que useDestinations los use)
                dispatch({ type: 'SET_BUILDING_DATA', payload: buildingData });

                console.log("Cargando map_routes.geojson (rutas)...");
                const routeRes = await fetch('map_routes.geojson');
                const routeData = (await routeRes.json()) as RoutesData;
                
                // --- 3. YA NO NECESITAMOS LA COMPROBACIÓN ANTIGUA ---
                // (El 'if (!state.buildingData)' se va)
                
                console.log("Construyendo grafo de rutas...");
                // Ahora sí tenemos ambos datos para construir el grafo
                graphData = buildGraphFromGeoJSON(routeData, buildingData);
                console.log("Grafo construido:", graphData);
                console.log(`   Nodos: ${graphData.graph.nodes.length}`);
                console.log(`   Ejes: ${graphData.graph.edges.length}`);
            } catch (error) {
                console.error('Error cargando sistema de rutas:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadGraphData();
    // --- 4. SOLO SE EJECUTA UNA VEZ ---
    }, [dispatch]); // dispatch es una dependencia estable

    // 2. Función para CALCULAR una ruta
    const calculateRoute = useCallback((destination: Destination) => {
        // --- 5. AÑADIR 'isLoading' A LA COMPROBACIÓN ---
        if (isLoading || !graphData || !state.currentLocation) {
            console.warn('Grafo no cargado (o aún cargando) o falta ubicación de inicio');
            return;
        }

        const { graph, nodesById } = graphData;
        const { currentLocation, settings } = state;
        
        if (!destination.lat || !destination.lng) {
            console.error("¡El destino no tiene coordenadas!", destination);
            return;
        }
        const destinationLocation = { lat: destination.lat, lng: destination.lng };
        
        const startNodes = findNearestNodes(currentLocation, graph.nodes, 150);
        const endNodes = findNearestNodes(destinationLocation, graph.nodes, 150);

        if (startNodes.length === 0 || endNodes.length === 0) {
            console.error("No se encontraron nodos. El usuario o el destino están muy lejos de las rutas (aceras).");
            return;
        }

        const startNode = startNodes[0].node;
        const endNode = endNodes[0].node;

        const routeResult = findPathDijkstra(graph, nodesById, startNode.id, endNode.id, settings);

        if (routeResult) {
            const finalRoute = formatRouteResult(
                routeResult, 
                currentLocation, 
                destinationLocation, 
                destination.displayName
            );
            
            dispatch({ type: 'SET_ROUTE', payload: finalRoute });
            dispatch({ type: 'START_NAVIGATION' });
            
        } else {
            console.warn('No se encontró ruta con Dijkstra');
            dispatch({ type: 'SET_ROUTE', payload: null });
        }

    }, [dispatch, isLoading, state.currentLocation, state.settings]); // <-- Añadir isLoading

    return { isRoutingLoading: isLoading, calculateRoute };
};