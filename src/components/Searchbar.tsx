// /src/components/Searchbar.tsx
import React, { useState, useEffect } from 'react';
import { useDestinations } from '../hooks/useDestinations';
import { useRouting } from '../hooks/useRouting';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { Destination } from '../types';
import { Search, Mic } from 'lucide-react';

export const Searchbar: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Destination[]>([]);

    const { allDestinations } = useDestinations();
    const { calculateRoute, isRoutingLoading } = useRouting();
    const { transcript, isListening, startListening } = useSpeechRecognition();

    useEffect(() => {
        if (transcript) {
            setQuery(transcript);
            handleSearch(transcript);
        }
    }, [transcript, allDestinations]); // <--- Asegúrate de incluir 'allDestinations'

    const handleSearch = (searchQuery: string) => {
        setQuery(searchQuery);
        if (searchQuery.length > 2) {
            const filtered = allDestinations.filter(d => 
                d.displayName.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setResults(filtered);
        } else {
            setResults([]);
        }
    };

    const handleSelect = (destination: Destination) => {
        setQuery(destination.displayName);
        setResults([]);
        calculateRoute(destination);
    };

    return (
        // --- ESTA ES LA ESTRUCTURA MODIFICADA ---
        // 1. El contenedor es ahora 'relative' y estático (no 'absolute')
        <div className="absolute shrink-0 z-1000 w-full bg-white shadow-md dark:bg-gray-900 dark:border-b dark:border-gray-700">
            
            {/* Input y botones */}
            <div className="flex items-center p-4">
                <Search className="h-5 w-5 text-gray-400 ml-2" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={isRoutingLoading ? "Cargando rutas..." : "Buscar destino..."}
                    disabled={isRoutingLoading}
                    className="flex-1 p-2 text-lg bg-transparent focus:outline-none"
                />
                <button 
                    onClick={() => startListening()}
                    className={`p-2 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-blue-600'}`}
                >
                    <Mic className="h-6 w-6" />
                </button>
            </div>

            {/* 2. La lista de resultados AHORA flota */}
            {results.length > 0 && (
                <ul 
                    className="absolute left-4 right-4 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                >
                    {results.map(dest => (
                        <li 
                            key={dest.name} 
                            onClick={() => handleSelect(dest)}
                            // Añadimos mejor espaciado y bordes redondeados
                            className="p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 first:rounded-t-lg last:rounded-b-lg last:border-b-0"
                        >
                            <div className="font-medium">{dest.displayName}</div>
                            <div className="text-sm text-gray-500">{dest.category}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};