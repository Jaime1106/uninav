// /src/types.ts
// /src/types.ts
import { FeatureCollection, Point, Polygon, LineString } from 'geojson'; // <-- Añade LineString aquí

// --- Estado y Configuración ---
export interface IDijkstraResult {
    path: number[];           // Array de IDs de nodos (ej: [1, 5, 12, 30])
    nodes: GraphNode[];       // Los objetos GraphNode completos de ese path
    totalDistance: number;    // La distancia total calculada de la ruta
}


export interface Settings {
    isVoiceActive: boolean;
    avoidStairs: boolean;
    prioritizeElevators: boolean;
    highContrastMode: boolean;
    useGPS: boolean;
    voiceCommands: boolean;
}

export interface Location {
    lat: number;
    lng: number;
    accuracy: number;
    heading: number | null;
    speed: number | null;
    timestamp: number;
}

export interface CurrentRoute {
    coordinates: [number, number][];
    distance: number;
    type: 'dijkstra_optimized' | 'direct';
    instructions: EnhancedInstruction[]; // Cambiar Instruction por EnhancedInstruction
    nodes: GraphNode[];
}

export interface Instruction {
    type: string;
    text: string;
    distance: number;
    node: GraphNode;
}

// REEMPLAZA la interface EnhancedInstruction con:
export interface EnhancedInstruction {
  type: 'start' | 'turn' | 'continue' | 'arrival' | 'elevator' | 'stairs' | 'ramp';
  direction?: 'left' | 'right' | 'straight';
  text: string;
  distance: number;
  node: GraphNode;
  cumulativeDistance: number;
  turnAngle?: number;
}
// --- Destinos ---

export interface Destination {
    name: string;
    displayName: string;
    category: string;
    icon: string;
    lat?: number;
    lng?: number;
}

export interface DestinationCategory {
    id: string;
    name: string;
    icon: string;
    items: { name: string; displayName: string }[];
}

// --- Grafo de Rutas (Routing) ---

export interface GraphNode {
    id: number;
    lat: number;
    lng: number;
    coord: [number, number]; // [lat, lng]
    route: string;
    routeType: 'stairs' | 'ramp' | 'normal' | 'connection' | 'relief_change';
    isEndpoint: boolean;
    isNearObstacle: boolean;
}

export interface GraphEdge {
    from: number;
    to: number;
    distance: number;
    cost: number;
    route: string;
    routeType: 'stairs' | 'ramp' | 'normal' | 'connection' | 'relief_change';
    bidirectional: boolean;
}

export interface IGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
    obstacleNodes: Set<number>;
}

export interface IGraphData {
    graph: IGraph;
    nodesById: Map<number, GraphNode>;
    nodeMap: Map<string, GraphNode[]>;
}

// --- GeoJSON Tipado (Tus archivos .geojson) ---

// Propiedades de map.geojson (edificios)
export interface BuildingProperties {
    name: string;
    obstacle?: boolean;
    routing?: 'avoid';
}

// Propiedades de map_points.geojson (puntos de interés)
export interface POIProperties {
    type: 'stairs' | 'ramp' | 'ramp_start' | 'relief_change' | 'building_entrance';
    name: string;
    message: string;
    priority: 'high' | 'medium' | 'info';
    audio_alert: boolean;
}

export type BuildingData = FeatureCollection<Polygon, BuildingProperties>;
export type PointsData = FeatureCollection<Point, POIProperties>;
export type RoutesData = FeatureCollection<LineString, any>; // <-- LÍNEA CORRECTA // 'any' porque las propiedades son dinámicas

// --- Estado Global de la App ---

export interface IAppState {
    settings: Settings;
    currentLocation: Location | null;
    selectedDestination: Destination | null;
    currentRoute: CurrentRoute | null;
    navigationActive: boolean;
    buildingData: BuildingData | null;
    pointsData: PointsData | null;
    currentInstruction: string | null; // <-- AÑADE ESTA LÍNEA
}