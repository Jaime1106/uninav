// /src/hooks/useGPS.ts
import { useState, useEffect } from 'react';
import { useGeolocated } from 'react-geolocated';
import { useAppContext } from '../context/AppContext';
import { Location } from '../types';

interface UseGPSReturn {
    isTracking: boolean;
    error: Error | null;
    startTracking: () => void;
    stopTracking: () => void;
}

export const useGPS = (): UseGPSReturn => {
    const { dispatch } = useAppContext();
    const [error, setError] = useState<Error | null>(null);
    const [isTracking, setIsTracking] = useState(false);

    // --- 1. Usamos la librería react-geolocated ---
    // Esta es la configuración de alta precisión que siempre intentará 
    // obtener la ubicación real del usuario.
    const { coords, isGeolocationAvailable, isGeolocationEnabled, positionError } =
        useGeolocated({
            positionOptions: {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 10000,
            },
            watchPosition: true, // Siempre intentará rastrear
            userDecisionTimeout: 5000,
        });

    // --- 2. Efecto para manejar los datos de la librería ---
    useEffect(() => {
        // Manejo de errores
        if (!isGeolocationAvailable) {
            setError(new Error("Geolocalización no está disponible en este navegador."));
            setIsTracking(false);
            return;
        }
        if (!isGeolocationEnabled) {
            setError(new Error("Permiso de ubicación denegado."));
            setIsTracking(false);
            return;
        }
        if (positionError) {
            setError(new Error(`Error de GPS: ${positionError.message}`)); // (Aquí verás el TIMEOUT)
            setIsTracking(false);
            return;
        }

        // Manejo de éxito
        if (coords) {
            setIsTracking(true);
            setError(null); // Limpiamos el error si funciona

            // Formateamos la ubicación para nuestro AppContext
            const location: Location = {
                lat: coords.latitude,
                lng: coords.longitude,
                accuracy: coords.accuracy || 0,
                heading: coords.heading || null,
                speed: coords.speed || null,
                timestamp: Date.now(),
            };
            
            // Enviamos la ubicación al estado global
            dispatch({ type: 'SET_LOCATION', payload: location });
        }

    }, [coords, isGeolocationAvailable, isGeolocationEnabled, positionError, dispatch]);

    // Las funciones start/stop ahora solo inician la lógica del hook.
    // El 'useEffect' en App.tsx las llamará, y el hook 'useGeolocated'
    // se activará y comenzará a observar.
    const startTracking = () => {
        // La lógica se maneja en el 'useEffect' de arriba
        setIsTracking(true);
    };

    const stopTracking = () => {
        // El hook se detiene solo cuando el componente se desmonta
        setIsTracking(false); 
    };

    return { isTracking, error, startTracking, stopTracking };
};