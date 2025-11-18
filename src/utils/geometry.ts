// /src/utils/geometry.ts

import { GraphNode } from '../types';

/**
 * Calcula la distancia en metros entre dos coordenadas (lat, lng) usando la fórmula de Haversine.
 * @param point1 Un objeto Location o un nodo con { lat, lng }.
 * @param point2 Un objeto Location o un nodo con { lat, lng }.
 * @returns La distancia en metros.
 */
export const calculateDistance = (
    point1: { lat: number, lng: number }, 
    point2: { lat: number, lng: number }
): number => {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distancia en metros
};

/**
 * Encuentra el nodo del grafo más cercano a una ubicación dada, dentro de un radio.
 * @param location La ubicación actual { lat, lng }.
 * @param nodes La lista completa de nodos del grafo.
 * @param maxDistance El radio máximo de búsqueda en metros.
 * @returns Un array de nodos cercanos, ordenados por distancia (el más cercano primero).
 */
export const findNearestNodes = (
    location: { lat: number, lng: number }, 
    nodes: GraphNode[], 
    maxDistance: number = 50
): { node: GraphNode, distance: number }[] => {
    
    const nearest = [];
    for (const node of nodes) {
        const distance = calculateDistance(location, node);
        if (distance <= maxDistance) {
            nearest.push({ node, distance });
        }
    }
    
    return nearest.sort((a, b) => a.distance - b.distance);
};

/**
 * Verifica si un punto (lat, lng) está dentro de un polígono.
 * @param point Coordenadas [lat, lng].
 * @param polygon Un array de coordenadas [lat, lng] que forman el polígono.
 * @returns Verdadero si el punto está dentro.
 */
export const isPointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
    const x = point[0]; // lat
    const y = point[1]; // lng
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0];
        const yi = polygon[i][1];
        const xj = polygon[j][0];
        const yj = polygon[j][1];
        
        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
    }
    
    return inside;
};

/**
 * Calcula el centroide (centro geográfico) de un polígono.
 * @param coordinates Array de coordenadas [lng, lat] (formato GeoJSON).
 * @returns Coordenadas [lat, lng] del centro.
 */
export const getPolygonCenter = (coordinates: number[][]): [number, number] => {
    let sumLat = 0;
    let sumLng = 0;
    coordinates.forEach(coord => {
        sumLng += coord[0];
        sumLat += coord[1];
    });
    return [sumLat / coordinates.length, sumLng / coordinates.length];
};