
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDestinations } from '../hooks/useDestinations';
import { useRouting } from '../hooks/useRouting';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { Destination } from '../types';
import { Search, Mic } from 'lucide-react';
import logo from '../assets/Logo_uninav.png';

// Normaliza el texto para comparar nombres aunque tengan
// diferencias de tildes, mayúsculas o signos de puntuación.
const normalizeText = (text: string): string =>
    text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[¿?¡!.,;:]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

// Elimina expresiones comunes usadas al pedir una ruta por voz.
const cleanVoiceCommand = (text: string): string =>
    normalizeText(text)
        .replace(
            /^(por favor\s+)?(quiero\s+)?(ir|llegar|dirigirme|navegar|llevarme|ll[eé]vame|gu[ií]ame)\s+(hasta\s+|hacia\s+|a\s+|al\s+|a la\s+|a los\s+|a las\s+)?/,
            ''
        )
        .replace(/^(el|la|los|las|un|una)\s+/, '')
        .replace(/\s+(por favor|gracias)$/, '')
        .trim();

export const Searchbar: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Destination[]>([]);
    const [voiceMessage, setVoiceMessage] = useState('');

    const { allDestinations } = useDestinations();
    const { calculateRoute, isRoutingLoading } = useRouting();
    const {
        transcript,
        isListening,
        startListening,
        isSupported
    } = useSpeechRecognition();

    // Evita procesar repetidamente el mismo reconocimiento de voz.
    const lastProcessedTranscript = useRef('');

    const handleSelect = useCallback(
        (destination: Destination) => {
            setQuery(destination.displayName);
            setResults([]);
            setVoiceMessage(`Calculando ruta hacia ${destination.displayName}...`);

            // Inicia el cálculo de la ruta al destino seleccionado.
            calculateRoute(destination);
        },
        [calculateRoute]
    );

    const handleSearch = useCallback(
        (searchQuery: string) => {
            setQuery(searchQuery);

            const normalizedQuery = normalizeText(searchQuery);

            if (normalizedQuery.length > 2) {
                const filtered = allDestinations.filter((destination) =>
                    normalizeText(destination.displayName).includes(normalizedQuery)
                );

                setResults(filtered);
            } else {
                setResults([]);
            }
        },
        [allDestinations]
    );

    // Procesa la orden de voz e intenta seleccionar automáticamente
    // el destino antes de mostrar las coincidencias manuales.
    useEffect(() => {
        if (!transcript?.trim()) return;

        const originalTranscript = transcript.trim();

        // No volver a procesar la misma frase continuamente.
        if (lastProcessedTranscript.current === originalTranscript) return;

        lastProcessedTranscript.current = originalTranscript;

        const cleanedCommand = cleanVoiceCommand(originalTranscript);
        const normalizedTranscript = normalizeText(originalTranscript);

        if (!cleanedCommand) {
            handleSearch(originalTranscript);
            return;
        }

        const normalizedDestinations = allDestinations.map((destination) => ({
            destination,
            name: normalizeText(destination.displayName)
        }));

        // Prioridad 1: coincidencia exacta con el nombre del destino
        // o con la orden de voz después de limpiarla.
        const exactMatches = normalizedDestinations.filter(
            ({ name }) =>
                name === cleanedCommand ||
                name === normalizedTranscript
        );

        if (exactMatches.length === 1) {
            handleSelect(exactMatches[0].destination);
            return;
        }

        // Prioridad 2: el usuario pronunció una frase que contiene
        // claramente el nombre completo de un destino.
        const containedMatches = normalizedDestinations.filter(
            ({ name }) =>
                name.length > 2 &&
                (
                    cleanedCommand.includes(name) ||
                    normalizedTranscript.includes(name)
                )
        );

        if (containedMatches.length === 1) {
            handleSelect(containedMatches[0].destination);
            return;
        }

        // Prioridad 3: permite órdenes como "bloque A" cuando el
        // nombre completo registrado es, por ejemplo, "Bloque A".
        const startsWithMatches = normalizedDestinations.filter(
            ({ name }) =>
                name.length > 2 &&
                (
                    name.startsWith(cleanedCommand) ||
                    cleanedCommand.startsWith(name)
                )
        );

        if (startsWithMatches.length === 1) {
            handleSelect(startsWithMatches[0].destination);
            return;
        }

        // Si no existe una coincidencia única, no se elige un
        // edificio al azar: se muestran las opciones encontradas.
        handleSearch(cleanedCommand || originalTranscript);
        setVoiceMessage(
            'No pude identificar un único destino. Selecciona el bloque correcto de la lista.'
        );
    }, [transcript, allDestinations, handleSearch, handleSelect]);

    // Si el usuario escribe manualmente, mantiene la búsqueda normal.
    const handleInputChange = (value: string) => {
        setVoiceMessage('');
        lastProcessedTranscript.current = '';
        handleSearch(value);
    };

    return (
        <div className="absolute shrink-0 z-[1000] w-full bg-white shadow-md border-b border-gray-200">
            <div className="flex items-center p-4">
                <div className="flex-shrink-0 mr-4">
                    <img
                        src={logo}
                        alt="Logo de UniNav"
                        className="h-13 w-15 object-contain"
                    />
                </div>

                <div className="flex-1 max-w-2xl mx-auto">
                    <div className="flex items-center relative">
                        <Search
                            className="h-5 w-5 text-gray-400 ml-2 absolute left-0"
                            aria-hidden="true"
                        />

                        <input
                            type="text"
                            value={query}
                            onChange={(event) =>
                                handleInputChange(event.target.value)
                            }
                            placeholder={
                                isRoutingLoading
                                    ? 'Calculando ruta...'
                                    : 'Buscar destino...'
                            }
                            disabled={isRoutingLoading}
                            aria-label="Buscar bloque o destino"
                            aria-autocomplete="list"
                            className="flex-1 p-2 pl-8 text-lg bg-transparent focus:outline-none w-full text-gray-900 placeholder-gray-500"
                        />

                        <button
                            type="button"
                            onClick={() => {
                                setVoiceMessage('');
                                lastProcessedTranscript.current = '';
                                startListening();
                            }}
                            disabled={!isSupported || isRoutingLoading}
                            aria-label={
                                isListening
                                    ? 'Escuchando. Pulsa para hablar de nuevo'
                                    : 'Dar orden por voz para iniciar una ruta'
                            }
                            aria-pressed={isListening}
                            title={isListening ? 'Escuchando...' : 'Hablar'}
                            className={`min-h-12 min-w-[104px] px-4 rounded-xl border-2 font-semibold flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-blue-300 transition ${
                                isListening
                                    ? 'bg-red-600 text-white border-red-600 animate-pulse'
                                    : 'bg-blue-700 text-white border-blue-700 hover:bg-blue-800'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <Mic className="h-6 w-6" aria-hidden="true" />
                            <span>
                                {isListening ? 'Escuchando' : 'Hablar'}
                            </span>
                        </button>
                    </div>

                    <div
                        className="mt-1 ml-1 text-sm text-gray-600"
                        aria-live="polite"
                        role="status"
                    >
                        {isRoutingLoading
                            ? 'Calculando la ruta al destino...'
                            : voiceMessage
                                ? voiceMessage
                                : isListening
                                    ? 'Di, por ejemplo: «Ir al bloque A».'
                                    : isSupported
                                        ? 'Pulsa Hablar y di el nombre del bloque al que quieres ir.'
                                        : 'La búsqueda por voz no está disponible en este navegador.'}
                    </div>

                    {results.length > 0 && (
                        <ul
                            className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-10"
                            role="listbox"
                            aria-label="Destinos encontrados"
                        >
                            {results.map((destination, index) => (
                                <li
                                    key={`${destination.name}-${index}`}
                                    role="option"
                                    aria-selected={false}
                                    onClick={() => handleSelect(destination)}
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === 'Enter' ||
                                            event.key === ' '
                                        ) {
                                            event.preventDefault();
                                            handleSelect(destination);
                                        }
                                    }}
                                    tabIndex={0}
                                    className="p-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-100 focus:outline-none border-b border-gray-100 first:rounded-t-lg last:rounded-b-lg last:border-b-0 text-gray-900"
                                >
                                    <div className="font-medium">
                                        {destination.displayName}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {destination.category}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};
