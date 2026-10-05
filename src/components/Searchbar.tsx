// /src/components/Searchbar.tsx
import React, { useState, useEffect } from 'react';
import { useDestinations } from '../hooks/useDestinations';
import { useRouting } from '../hooks/useRouting';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { Destination } from '../types';
import { Search, Mic } from 'lucide-react';
import logo from '../assets/Logo_uninav.png'

export const Searchbar: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Destination[]>([]);

    const { allDestinations } = useDestinations();
    const { calculateRoute, isRoutingLoading } = useRouting();
    const { transcript, isListening, startListening, isSupported } = useSpeechRecognition();

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
        // Header completamente blanco
        <div className="absolute shrink-0 z-1000 w-full bg-white shadow-md border-b border-gray-200">

            {/* Contenedor principal con logo y buscador */}
            <div className="flex items-center p-4">
                {/* Logo a la izquierda */}
                <div className="flex-shrink-0 mr-4">
                    <img
                        src={logo}
                        alt="Logo"
                        className="h-13 w-15 object-containS"
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
                            className="flex-1 p-2 pl-8 text-lg bg-transparent focus:outline-none w-full text-gray-900 placeholder-gray-500"                        />
                        {/* Botón del micrófono con fondo blanco */}
                        <button
                            type="button"
                            onClick={startListening}
                            disabled={!isSupported || isRoutingLoading}
                            aria-label={
                                isListening
                                    ? 'Escuchando. Pulsa para hablar de nuevo'
                                    : 'Hablar para buscar un destino'
                            }
                            aria-pressed={isListening}
                            title={isListening ? 'Escuchando...' : 'Hablar'}
                            className={`min-h-12 min-w-[104px] px-4 rounded-xl border-2 font-semibold flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-blue-300 transition ${isListening
                                ? 'bg-red-600 text-white border-red-600 animate-pulse'
                                : 'bg-blue-700 text-white border-blue-700 hover:bg-blue-800'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <Mic className="h-6 w-6" aria-hidden="true" />
                            <span>{isListening ? 'Escuchando' : 'Hablar'}</span>
                        </button>
                    </div>

                    <div className="mt-1 ml-1 text-sm text-gray-600" aria-live="polite">
                        {isListening
                            ? 'Di el nombre del lugar al que quieres ir.'
                            : isSupported
                                ? 'Pulsa Hablar para buscar por voz.'
                                : 'La búsqueda por voz no está disponible en este navegador.'}
                    </div>
                    {/* Lista de resultados flotante - también blanca */}
                    {results.length > 0 && (
                        <ul
                            className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-10"
                        >
                            {results.map(dest => (
                                <li
                                    key={dest.name}
                                    onClick={() => handleSelect(dest)}
                                    className="p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 first:rounded-t-lg last:rounded-b-lg last:border-b-0 text-gray-900"
                                >
                                    <div className="font-medium">{dest.displayName}</div>
                                    <div className="text-sm text-gray-600">{dest.category}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};