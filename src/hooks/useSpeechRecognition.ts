// /src/hooks/useSpeechRecognition.ts
import { useState, useEffect, useRef } from 'react';

// Comprobación de tipo para la API del navegador
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// Asegurarse de que la API existe
const isSpeechSupported = !!SpeechRecognition;

interface UseSpeechRecognitionReturn {
    /** El texto transcrito del audio. */
    transcript: string;
    /** Verdadero si el micrófono está escuchando activamente. */
    isListening: boolean;
    /** Inicia la escucha. */
    startListening: () => void;
    /** Detiene la escucha. */
    stopListening: () => void;
    /** Verdadero si el navegador soporta la API. */
    isSupported: boolean;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    
    // Usamos useRef para el objeto de reconocimiento para que no cambie en cada render
    const recognition = useRef<any | null>(null);

    useEffect(() => {
        if (!isSpeechSupported) {
            console.warn('Speech Recognition no es soportado en este navegador.');
            return;
        }

        // Inicializar la instancia
        recognition.current = new SpeechRecognition();
        recognition.current.continuous = false; // Queremos que pare después de una frase
        recognition.current.lang = 'es-ES';
        recognition.current.interimResults = false; // Solo resultados finales

        // Evento: cuando se obtiene un resultado
        recognition.current.onresult = (event: any) => {
            const lastResult = event.results[event.results.length - 1];
            const text = lastResult[0].transcript;
            setTranscript(text);
        };

        // Evento: cuando termina de escuchar
        recognition.current.onend = () => {
            setIsListening(false);
        };

        // Evento: en caso de error
        recognition.current.onerror = (event: any) => {
            console.error('Error en Speech Recognition:', event.error);
            setIsListening(false);
        };

    }, []); // Se ejecuta solo una vez al montar

    const startListening = () => {
        if (recognition.current && !isListening) {
            setTranscript(''); // Limpiar transcripción anterior
            recognition.current.start();
            setIsListening(true);
        }
    };

    const stopListening = () => {
        if (recognition.current && isListening) {
            recognition.current.stop();
            setIsListening(false);
        }
    };

    return { 
        transcript, 
        isListening, 
        startListening, 
        stopListening, 
        isSupported: isSpeechSupported 
    };
};