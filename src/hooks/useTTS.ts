// /src/hooks/useTTS.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

// Interfaz (la que te faltaba antes)
interface UseTTSReturn {
    speak: (text: string, priority?: boolean) => void;
    cancel: () => void;
    isSpeaking: boolean;
}

export const useTTS = (): UseTTSReturn => {
    const { state } = useAppContext();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const queue = useRef<SpeechSynthesisUtterance[]>([]);
    const speechEnded = useRef(true);

    // --- 1. ARREGLO: Usar Refs para el estado y las props ---
    // Creamos un Ref para rastrear 'isSpeaking' sin causar re-renders
    const isSpeakingRef = useRef(isSpeaking);
    useEffect(() => {
        isSpeakingRef.current = isSpeaking;
    }, [isSpeaking]);

    // Creamos un Ref para rastrear la configuración sin causar re-renders
    const settingsRef = useRef(state.settings);
    useEffect(() => {
        settingsRef.current = state.settings;
    }, [state.settings]);
    // ----------------------------------------------------

    const processQueue = useCallback(() => {
        // Usamos el Ref
        if (!isSpeakingRef.current && queue.current.length > 0) {
            speechEnded.current = false;
            const utterance = queue.current.shift();
            if (utterance) {
                setIsSpeaking(true);
                window.speechSynthesis.speak(utterance);
            }
        }
    }, []); // Dependencias vacías = 100% estable

    const speak = useCallback((text: string, priority = false) => {
        // --- 2. ARREGLO: Leer la configuración desde el Ref ---
        // En lugar de depender de 'state' (que cambia), leemos el valor actual del Ref.
        
        // ----------------------------------------------------
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        
        utterance.onend = () => {
            if (speechEnded.current) return;
            speechEnded.current = true;
            setIsSpeaking(false);
        };
        
        utterance.onerror = (e) => { 
            console.error('Error en SpeechSynthesis:', e);
            if (speechEnded.current) return;
            speechEnded.current = true;
            setIsSpeaking(false);
        };

        if (priority) {
            console.log("ejecutando cola");
            
            window.speechSynthesis.cancel();
            queue.current = [];
            speechEnded.current = false;
            setIsSpeaking(true);
            window.speechSynthesis.speak(utterance);
        } else if (isSpeakingRef.current) { // Usamos el Ref
            queue.current.push(utterance);
        } else {
            speechEnded.current = false;
            setIsSpeaking(true);
            window.speechSynthesis.speak(utterance);
        }
    }, []); // <-- 3. ARREGLO: Dependencias 100% vacías

    useEffect(() => {
        if (!isSpeaking) {
            processQueue();
        }
    }, [isSpeaking, processQueue]);

    const cancel = useCallback(() => {
        speechEnded.current = true;
        queue.current = [];
        setIsSpeaking(false);
        window.speechSynthesis.cancel();
    }, []); // Dependencias vacías = 100% estable

    return { speak, cancel, isSpeaking };
};