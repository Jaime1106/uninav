// /src/components/SimulationProvider.tsx
import { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

// --- ¡TU PUNTO DE INICIO! ---
// (Usa las coordenadas de la entrada de la Cl. 58 que copiaste de tu GeoJSON)
const startLocation = { lat: 10.9948, lng: -74.7912 }; // <-- EJEMPLO

export const SimulationProvider: React.FC = () => {
    const { dispatch } = useAppContext();

    // Este hook se ejecuta SÓLO UNA VEZ cuando la app carga
    useEffect(() => {
        console.warn(
            "MODO DE SIMULACIÓN: Ubicación inicial establecida en la entrada."
        );
        
        // 1. Despachar la ubicación inicial
        dispatch({ 
            type: 'SET_LOCATION', 
            payload: { 
                ...startLocation, 
                accuracy: 5, 
                heading: 0, 
                speed: 0, // Inicia detenido
                timestamp: Date.now() 
            } 
        });
    }, [dispatch]); // El array vacío asegura que solo se ejecute una vez

    return null; // No renderiza nada
};