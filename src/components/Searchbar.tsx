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
        <div className="absolute shrink-0 z-1000 w-full bg-white shadow-md dark:bg-gray-900 dark:border-b dark:border-gray-700">
            
            {/* Contenedor principal con logo y buscador */}
            <div className="flex items-center p-4">
                {/* Logo a la izquierda */}
                <div className="flex-shrink-0 mr-4">
                    <img 
                        src="./src/assets/Logo_uninav.png" 
                        alt="Logo" 
                        className="h-15 w-20 justify-left" 
                        // Ajusta la ruta y tamaño según tu logo
                    />
                </div>

                {/* Contenedor del buscador centrado */}
                <div className="flex-1 max-w-2xl mx-auto">
                    <div className="flex items-center relative">
                        <Search className="h-5 w-5 text-gray-400 ml-2 absolute left-0" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder={isRoutingLoading ? "Cargando rutas..." : "Buscar destino..."}
                            disabled={isRoutingLoading}
                            className="flex-1 p-2 pl-8 text-lg bg-transparent focus:outline-none w-full"
                        />
                        <button 
                            onClick={() => startListening()}
                            className={`p-2 rounded-full ml-2 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-blue-600'}`}
                        >
                            <Mic className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Lista de resultados flotante */}
                    {results.length > 0 && (
                        <ul 
                            className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-10"
                        >
                            {results.map(dest => (
                                <li 
                                    key={dest.name} 
                                    onClick={() => handleSelect(dest)}
                                    className="p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 first:rounded-t-lg last:rounded-b-lg last:border-b-0"
                                >
                                    <div className="font-medium">{dest.displayName}</div>
                                    <div className="text-sm text-gray-500">{dest.category}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};