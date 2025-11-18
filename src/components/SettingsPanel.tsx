// /src/components/SettingsPanel.tsx
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { X, Moon } from 'lucide-react'; // Iconos

interface SettingsPanelProps {
  onClose: () => void; // Función para cerrarse
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const { state, dispatch } = useAppContext();
  const { highContrastMode } = state.settings;

  const handleToggle = () => {
    dispatch({
      type: 'UPDATE_SETTING',
      payload: { key: 'highContrastMode', value: !highContrastMode }
    });
  };

  return (
    // Fondo oscuro semi-transparente que cubre todo
    <div 
      className="absolute inset-0 z-[1010] bg-black/40 flex items-center justify-center p-4"
      onClick={onClose} // Cierra el panel si haces clic fuera
    >
      {/* El panel en sí */}
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()} // Evita que el panel se cierre al hacer clic en él
      >
        {/* Encabezado del Panel */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-medium dark:text-white">Ajustes</h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cuerpo del Panel (con el interruptor) */}
        <div className="p-4">
          <div className="flex justify-between items-center">
            <label 
              htmlFor="highContrastToggle" 
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-200"
            >
              <Moon className="h-5 w-5" />
              <span>Modo Alto Contraste</span>
            </label>
            
            {/* El Interruptor (Toggle Switch) */}
            <button
              id="highContrastToggle"
              role="switch"
              aria-checked={highContrastMode}
              onClick={handleToggle}
              className={`relative inline-flex items-center h-6 w-11 flex-shrink-0 rounded-full cursor-pointer transition-colors duration-200 ease-in-out
                ${highContrastMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}
              `}
            >
              <span 
                className={`inline-block h-5 w-5 bg-white rounded-full shadow-lg transform transition duration-200 ease-in-out
                  ${highContrastMode ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
          {/* Aquí puedes añadir más ajustes (ej: Evitar Escaleras) en el futuro */}
        </div>
      </div>
    </div>
  );
};