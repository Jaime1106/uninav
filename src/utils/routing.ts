// /src/utils/routing.ts
import { 
    IGraph, IGraphData, GraphNode, Settings, BuildingData, RoutesData, 
    CurrentRoute, IDijkstraResult, Location,
    Instruction
} from '../types';
import { calculateDistance } from './geometry';

// --- Lógica de Construcción de Grafo ---

/**
 * Clasifica una ruta (línea del GeoJSON) basado en sus propiedades
 */
const classifyRouteType = (properties: any): GraphNode['routeType'] => {
    const propStr = JSON.stringify(properties).toLowerCase();
    if (propStr.includes('escaleras')) return 'stairs';
    if (propStr.includes('rampa')) return 'ramp';
    if (propStr.includes('cambio de relieve')) return 'relief_change';
    return 'normal';
};

const createIntersections = (graph: IGraph, connectionDistance: number) => {
    console.log("Creando intersecciones (puentes) entre rutas...");
    const nodes = graph.nodes;
    let intersectionsCreated = 0;

    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const node1 = nodes[i];
            const node2 = nodes[j];

            if (node1.route === node2.route) {
                continue;
            }

            const distance = calculateDistance(node1, node2);
            if (distance <= connectionDistance) {
                const cost = distance * 0.5;
                graph.edges.push({
                    from: node1.id, to: node2.id, distance, cost,
                    route: 'connection', routeType: 'connection', bidirectional: true
                });
                graph.edges.push({
                    from: node2.id, to: node1.id, distance, cost,
                    route: 'connection', routeType: 'connection', bidirectional: true
                });
                intersectionsCreated++;
            }
        }
    }
    console.log(`Se crearon ${intersectionsCreated} puentes de intersección.`);
};

export const buildGraphFromGeoJSON = (
    routeData: RoutesData, 
    buildingData: BuildingData
): IGraphData => {
    
    const graph: IGraph = { nodes: [], edges: [], obstacleNodes: new Set() };
    const nodesById: Map<number, GraphNode> = new Map();
    const nodeMap: Map<string, GraphNode[]> = new Map();
    
    let nodeId = 0;
    
    // --- 1. Usar el 'index' para un nombre único ---
    routeData.features.forEach((route, index) => {
        // Asegurarnos de que SÓLO leemos Líneas
        if (route.geometry.type !== 'LineString') {
            return;
        }

        const coordinates = route.geometry.coordinates as [number, number][];
        
        // Damos a cada acera un nombre único como "route_0", "route_1", etc.
        const routeName = `route_${index}`;
        
        // Esto ahora buscará {"type": "stairs"} si lo añades
        const routeType = classifyRouteType(route.properties); 
        
        const routeNodes: GraphNode[] = [];
        coordinates.forEach((coord, nodeIndex) => {
            const point: [number, number] = [coord[1], coord[0]]; // [lat, lng]
            
            const node: GraphNode = {
                id: nodeId++,
                lat: point[0],
                lng: point[1],
                coord: point,
                route: routeName, // <-- Nombre único
                routeType: routeType,
                isEndpoint: nodeIndex === 0 || nodeIndex === coordinates.length - 1,
                isNearObstacle: false, 
            };
            
            graph.nodes.push(node);
            nodesById.set(node.id, node);
            routeNodes.push(node);
        });
        
        // Crear conexiones (ejes) dentro de la misma acera
        for (let i = 1; i < routeNodes.length; i++) {
            const prevNode = routeNodes[i - 1];
            const currentNode = routeNodes[i];
            const distance = calculateDistance(prevNode, currentNode);
            const cost = distance; 
            
            graph.edges.push({
                from: prevNode.id, to: currentNode.id, distance, cost,
                route: routeName, routeType, bidirectional: true
            });
            graph.edges.push({
                from: currentNode.id, to: prevNode.id, distance, cost,
                route: routeName, routeType, bidirectional: true
            });
        }
    });
    
    // --- 2. Ya no necesitamos el "hack" de 1000m ---
    // Tu red está conectada, 20m es suficiente para unir pequeños huecos
    createIntersections(graph, 20);

    console.log(`Grafo construido: ${graph.nodes.length} nodos, ${graph.edges.length} ejes.`);
    return { graph, nodesById, nodeMap };
};


// --- Lógica de Búsqueda de Ruta (Dijkstra) ---
// (Esta es tu función 'findPathInGraph' original)
export const findPathDijkstra = (
    graph: IGraph, 
    nodesById: Map<number, GraphNode>,
    startId: number, 
    endId: number, 
    settings: Settings
): IDijkstraResult | null => {
    
    const distances: { [key: number]: number } = {};
    const costs: { [key: number]: number } = {};
    const previous: { [key: number]: number | null } = {};
    const unvisited = new Set<number>();

    graph.nodes.forEach(node => {
        distances[node.id] = node.id === startId ? 0 : Infinity;
        costs[node.id] = node.id === startId ? 0 : Infinity;
        previous[node.id] = null;
        unvisited.add(node.id);
    });
    
    while (unvisited.size > 0) {
        let currentId = -1;
        let minCost = Infinity;

        unvisited.forEach(nodeId => {
            if (costs[nodeId] < minCost) {
                minCost = costs[nodeId];
                currentId = nodeId;
            }
        });

        if (currentId === -1 || minCost === Infinity) break;
        if (currentId === endId) break; // ¡Encontrado!

        unvisited.delete(currentId);

        const connections = graph.edges.filter(edge => edge.from === currentId);

        connections.forEach(edge => {
            if (!unvisited.has(edge.to)) return;

            let edgeCost = edge.cost;

            // Aplicar preferencias de accesibilidad
            if (settings.avoidStairs && edge.routeType === 'stairs') {
                edgeCost *= 5; // Penalización alta por escaleras
            }
            if (settings.prioritizeElevators && edge.routeType === 'ramp') {
                edgeCost *= 0.3; // Bonificación por rampas/ascensores
            }

            const alternativeCost = costs[currentId] + edgeCost;
            
            if (alternativeCost < costs[edge.to]) {
                costs[edge.to] = alternativeCost;
                distances[edge.to] = distances[currentId] + edge.distance;
                previous[edge.to] = currentId;
            }
        });
    }

    // Reconstruir el camino
    if (previous[endId] === null && endId !== startId) return null; // No se encontró ruta

    const path: number[] = [];
    let currentId: number | null = endId;
    while (currentId !== null) {
        path.unshift(currentId);
        currentId = previous[currentId];
    }
    
    if (path[0] !== startId) return null; // Ruta inválida

    const pathNodes = path.map(id => nodesById.get(id)!);

    return { path, nodes: pathNodes, totalDistance: distances[endId] };
};

/**
 * Toma el resultado crudo de Dijkstra y crea una ruta navegable
 * con coordenadas e instrucciones paso a paso.
 */
export const formatRouteResult = (
    routeResult: IDijkstraResult, 
    startLocation: Location, 
    destinationLocation: {lat: number, lng: number},
    destinationName: string
): CurrentRoute => {
    
    const routeNodes = routeResult.nodes;
    const instructions: Instruction[] = [];
    
    // --- 1. AÑADIR COORDENADAS DE INICIO Y FIN ---
    const routeCoordinates: [number, number][] = [
        [startLocation.lat, startLocation.lng], // Punto de inicio (GPS)
        ...routeNodes.map(node => node.coord),   // Nodos de la ruta
        [destinationLocation.lat, destinationLocation.lng] // Punto final (Destino)
    ];
    
    // --- 2. GENERAR INSTRUCCIONES (AHORA SIMPLIFICADO) ---
    
    // Instrucción de inicio
    instructions.push({
        type: 'start',
        text: `Comienza a navegar hacia ${destinationName}`,
        distance: 0,
        node: routeNodes[0]
    });

    let lastInstructionNode = routeNodes[0];
    
    for (let i = 1; i < routeNodes.length; i++) {
        const currentNode = routeNodes[i];
        const prevNode = routeNodes[i-1];
        
        let instructionText = "";

        

        // --- HEMOS ELIMINADO EL "EVENTO 2" ---
        // (Ya no generamos "Atención, escaleras" desde aquí)

        // Si generamos una instrucción de GIRO, la añadimos
        if (instructionText) {
            const distance = calculateDistance(lastInstructionNode, currentNode);
            instructions.push({
                type: 'turn', // (Mejor tipo que 'routeType')
                text: instructionText,
                distance: distance,
                node: currentNode
            });
            lastInstructionNode = currentNode; // Reiniciar el contador de distancia
        }
    }
    
    // Instrucción de llegada
    instructions.push({
        type: 'arrival',
        text: `Has llegado a ${destinationName}`,
        distance: calculateDistance(lastInstructionNode, routeNodes[routeNodes.length-1]),
        node: routeNodes[routeNodes.length - 1]
    });
    
    return {
        coordinates: routeCoordinates,
        distance: routeResult.totalDistance,
        type: 'dijkstra_optimized',
        instructions: instructions,
        nodes: routeNodes
    };
};