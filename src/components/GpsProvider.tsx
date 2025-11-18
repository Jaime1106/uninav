// /src/components/GpsProvider.tsx
import { useEffect } from 'react';
import { useGeolocated } from 'react-geolocated';
import { useAppContext } from '../context/AppContext';
import { Location } from '../types';

export const GpsProvider: React.FC = () => {
    const { dispatch } = useAppContext();

    // 1. Usamos el hook de la librería
    const { coords, isGeolocationAvailable, isGeolocationEnabled, positionError } =
        useGeolocated({
            // Estas son las opciones de alta precisión (tu código original)
            positionOptions: {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 10000,
            },
            watchPosition: true, // Esto es como 'watchPosition'
            userDecisionTimeout: 5000, // Tiempo para que el usuario acepte el permiso
        });

    // 2. Vigilamos los errores de la librería
    useEffect(() => {
        if (!isGeolocationAvailable || !isGeolocationEnabled) {
            console.error("Geolocalización no disponible o no activada.");
            // (Aquí podrías despachar un error a tu AppContext si quisieras)
        }
        if (positionError) {
            console.error("Error de GPS (Librería):", positionError.message);
        }
    }, [isGeolocationAvailable, isGeolocationEnabled, positionError]);

    // 3. Vigilamos la ubicación de la librería
    useEffect(() => {
        // Si 'coords' cambia (la librería encontró una ubicación)...
        if (coords) {
            // ...la formateamos y la despachamos a nuestro estado global
            const location: Location = {
                lat: coords.latitude,
                lng: coords.longitude,
                accuracy: coords.accuracy || 0,
                heading: coords.heading || null,
                speed: coords.speed || null,
                timestamp: Date.now(), // La librería no siempre provee 'timestamp'
            };
            dispatch({ type: 'SET_LOCATION', payload: location });
        }
    }, [coords, dispatch]);

    return null; // Este componente tampoco renderiza nada
};