// /src/hooks/useDestinations.ts
import { useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { BuildingData, Destination, DestinationCategory } from '../types';

// Importa tus datos estáticos
import { categories as baseCategories } from '../data/destinationCategories';
import { voiceCommandsDictionary } from '../data/voiceCommands';
import { getPolygonCenter } from '../utils/geometry';

// Tipamos el valor de retorno del hook
interface UseDestinationsReturn {
    /** Todas las categorías, con los bloques ya procesados y añadidos. */
    categories: DestinationCategory[];
    /** Una lista plana de todos los destinos para búsquedas. */
    allDestinations: Destination[];
    /** La lista generada de destinos rápidos. */
    quickDestinations: Destination[]; // O un tipo más específico si lo tienes
    /**
     * Busca un destino por nombre, alias o término de búsqueda.
     */
    findDestination: (searchTerm: string) => Destination | null;
}

// Función pura para extraer bloques (tu lógica original, pero más segura)
const extractBlocksFromData = (buildingData: BuildingData | null): DestinationCategory['items'] => {
    if (!buildingData) return [];

    const blockItems: DestinationCategory['items'] = [];
    const uniqueBlocks = new Set<string>();

    buildingData.features.forEach(feature => {
        const name = feature.properties.name;
        if (name && name.toLowerCase().includes('bloque')) {
            const blockMatch = name.match(/bloque\s*(\d+)/i);
            let displayName = name;
            let key: string;

            if (blockMatch) {
                const blockNumber = blockMatch[1];
                displayName = `Bloque ${blockNumber}`;
                key = blockNumber;
            } else {
                key = name;
            }

            if (!uniqueBlocks.has(key)) {
                uniqueBlocks.add(key);
                blockItems.push({ name: name, displayName: displayName });
            }
        }
    });

    // Ordenar numéricamente
    return blockItems.sort((a, b) => {
        const numA = parseInt(a.displayName.match(/\d+/)?. [0] || '0');
        const numB = parseInt(b.displayName.match(/\d+/)?. [0] || '0');
        return numA - numB;
    });
};

export const useDestinations = (): UseDestinationsReturn => {
    const { state } = useAppContext();
    const { buildingData } = state;

    // --- DATOS DERIVADOS CON useMemo ---

    // 1. Categorías con bloques (se recalcula SOLO si buildingData cambia)
    const categories = useMemo(() => {
        const blockItems = extractBlocksFromData(buildingData);
        
        // Mapeamos para no mutar el array original importado
        return baseCategories.map(category => {
            if (category.id === 'bloques') {
                return { ...category, items: blockItems };
            }
            return category;
        });
    }, [buildingData]);

    // 2. Lista plana de destinos (se recalcula SOLO si las categorías cambian)
// /src/hooks/useDestinations.ts

// (El resto de tu hook, 'useAppContext', 'extractBlocksFromData', 'categories', etc. se queda igual)
// ...

    const allDestinations = useMemo(() => {
        console.log("Recalculando todos los destinos (con lógica de coincidencia exacta)...");
        if (!buildingData) {
            console.warn("buildingData es nulo, no se pueden añadir coordenadas.");
        }
        
        const all: Destination[] = [];
        
        categories.forEach(category => {
            category.items.forEach(item => {
                let coords: { lat?: number, lng?: number } = {};
                const itemName = item.name; // <-- No necesitamos toLowerCase

                if (buildingData && (category.id === 'bloques' || category.id === 'servicios')) {
                    
                    // --- LÓGICA CORREGIDA (COINCIDENCIA EXACTA) ---
                    const buildingFeature = buildingData.features.find(feature =>
                        feature.properties.name === itemName
                    );
                    // ---------------------------------------------
                    
                    if (buildingFeature) {
                        const [lat, lng] = getPolygonCenter(buildingFeature.geometry.coordinates[0]);
                        coords = { lat, lng };
                    } else {
                        console.warn(`No se encontró edificio para: "${item.name}"`);
                    }
                }

                all.push({
                    ...item,
                    category: category.name,
                    icon: category.icon,
                    ...coords
                });
            });
        });
        return all;
    }, [categories, buildingData]);

// ... (El resto de tu hook 'useDestinations' sigue igual)

    // 3. Destinos rápidos (tu lógica de generateQuickDestinations)
    const quickDestinations = useMemo(() => {
        // Aquí puedes usar 'allDestinations' para encontrar
        // los destinos "Biblioteca CUC", "Central", etc. y crear tu lista
        // Por ahora, un array de ejemplo:
        const popularNames = ['Biblioteca CUC', 'Central', 'entrada Calle 58', 'Coliseo auditorio'];
        return allDestinations
            .filter(d => popularNames.includes(d.name))
            .slice(0, 8); // Limitar a 8
    }, [allDestinations]);

    // --- FUNCIONES ---

    // 4. Lógica de búsqueda (tu findDestination)
    const findDestination = useCallback((searchTerm: string): Destination | null => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return null;

        // Búsqueda exacta (más rápida)
        let dest = allDestinations.find(d => 
            d.name.toLowerCase() === term || 
            d.displayName.toLowerCase() === term
        );
        if (dest) return dest;

        // Búsqueda por alias (voiceCommandsDictionary)
        for (const [key, aliases] of Object.entries(voiceCommandsDictionary.destinations)) {
            if (aliases.some(alias => term.includes(alias))) {
                return allDestinations.find(d => 
                    d.displayName.toLowerCase().includes(key)
                ) || null;
            }
        }
        
        // Búsqueda parcial (más lenta)
        dest = allDestinations.find(d => 
            d.name.toLowerCase().includes(term) || 
            d.displayName.toLowerCase().includes(term)
        );
        if (dest) return dest;

        return null;
    }, [allDestinations]); // Se actualiza si 'allDestinations' cambia

    return { categories, allDestinations, quickDestinations, findDestination };
};