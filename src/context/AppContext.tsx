// /src/context/AppContext.tsx
import React, { createContext, useReducer, useContext, ReactNode } from 'react';
import type { IAppState, Settings, Location, CurrentRoute, BuildingData } from '../types';

// --- 1. Estado Inicial Tipado ---
const initialState: IAppState = {
    settings: {
        isVoiceActive: true,
        avoidStairs: true,
        prioritizeElevators: false,
        highContrastMode: false,
        useGPS: true,
        voiceCommands: true,
    },
    currentLocation: null,
    selectedDestination: null,
    currentRoute: null,
    navigationActive: false,
    buildingData: null,
    pointsData: null,
    currentInstruction: null, // <-- AÑADE ESTA LÍNEA
};

// --- 2. Acciones Tipadas (Discriminated Union) ---
export type AppAction =
    | { type: 'SET_LOCATION'; payload: Location }
    | { type: 'SET_BUILDING_DATA'; payload: BuildingData }
    | { type: 'SET_ROUTE'; payload: CurrentRoute | null }
    | { type: 'START_NAVIGATION' }
    | { type: 'STOP_NAVIGATION' }
    | { type: 'SET_INSTRUCTION'; payload: string | null }
    | { 
        type: 'UPDATE_SETTING'; 
        payload: { key: keyof Settings; value: boolean } 
      };

// --- 3. Reducer Tipado ---
const AppReducer = (state: IAppState, action: AppAction): IAppState => {
    switch (action.type) {
        case 'SET_LOCATION':
            return { ...state, currentLocation: action.payload };
        case 'SET_BUILDING_DATA':
            return { ...state, buildingData: action.payload };
        case 'SET_ROUTE':
            return { 
                ...state, 
                currentRoute: action.payload, 
                navigationActive: !!action.payload 
            };
        case 'START_NAVIGATION':
            return { ...state, navigationActive: true };
        case 'STOP_NAVIGATION':
            return { 
                ...state, 
                navigationActive: false, 
                currentRoute: null, 
                selectedDestination: null,
                currentInstruction: null // <-- AÑADE ESTO
            };
        case 'UPDATE_SETTING':
            return {
                ...state,
                settings: { 
                    ...state.settings, 
                    [action.payload.key]: action.payload.value 
                },
            };
        case 'SET_INSTRUCTION': // <-- AÑADE ESTE CASE
            return { ...state, currentInstruction: action.payload };
        default:
            return state;
    }
};

// --- 4. Contexto Tipado ---
interface IAppContext {
    state: IAppState;
    dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<IAppContext | undefined>(undefined);

// --- 5. Proveedor Tipado ---
interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(AppReducer, initialState);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

// --- 6. Hook de Contexto Tipado ---
export const useAppContext = (): IAppContext => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext debe ser usado dentro de un AppProvider');
    }
    return context;
};