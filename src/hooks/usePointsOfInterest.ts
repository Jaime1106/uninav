// /src/hooks/usePointsOfInterest.ts
import { useState, useEffect } from 'react';
import { PointsData } from '../types';

interface UsePOIResult {
    pointsData: PointsData | null;
    isLoading: boolean;
    error: Error | null;
}

export const usePointsOfInterest = (): UsePOIResult => {
    const [pointsData, setPointsData] = useState<PointsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Este hook solo se ejecuta una vez para cargar los datos
        const fetchData = async () => {
            try {
                const response = await fetch('map_points.geojson');
                if (!response.ok) {
                    throw new Error(`Error al cargar puntos: ${response.statusText}`);
                }
                const data = (await response.json()) as PointsData;
                setPointsData(data);
            } catch (err) {
                setError(err as Error);
                console.error('Error cargando map_points.geojson:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []); // El array vacío asegura que solo se ejecute al montar

    return { pointsData, isLoading, error };
};