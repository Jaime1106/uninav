// /src/components/SettingsPanel.tsx
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { X, Moon, Volume2, VolumeX } from 'lucide-react'; // Iconos actualizados

interface SettingsPanelProps {
  onClose: () => void; // Función para cerrarse
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const { state, dispatch } = useAppContext();
  const { highContrastMode, isVoiceActive } = state.settings;

  const handleToggleHighContrast = () => {
    dispatch({
      type: 'UPDATE_SETTING',
      payload: { key: 'highContrastMode', value: !highContrastMode }
    });
  };

  const handleToggleVoiceGuide = () => {
    dispatch({
      type: 'UPDATE_SETTING',
      payload: { key: 'isVoiceActive', value: !isVoiceActive }
    });
  };

return (
    <div 
      className="absolute inset-0 z-[1010] bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Agregar clase high-contrast condicional al panel */}
      <div 
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm ${
          highContrastMode ? 'border-2 border-yellow-500' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado con borde más visible en alto contraste */}
        <div className={`flex justify-between items-center p-4 border-b dark:border-gray-700 ${
          highContrastMode ? 'border-yellow-500' : ''
        }`}>
          <h3 className="text-lg font-medium dark:text-white">Ajustes de Accesibilidad</h3>
          <button 
            onClick={onClose} 
            className={`p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              highContrastMode ? 'border border-white' : ''
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cuerpo del Panel con los ajustes */}
        <div className="p-4 space-y-6">
          {/* Ajuste de Guía de Voz */}
          <div className="flex justify-between items-center">
            <label 
              htmlFor="voiceGuideToggle" 
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-200"
            >
              {isVoiceActive ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
              <span className="font-medium">Guía de Voz</span>
            </label>
            
            <button
              id="voiceGuideToggle"
              role="switch"
              aria-checked={isVoiceActive}
              onClick={handleToggleVoiceGuide}
              className={`relative inline-flex items-center h-6 w-11 flex-shrink-0 rounded-full cursor-pointer transition-colors duration-200 ease-in-out
                ${isVoiceActive ? 
                  highContrastMode ? 'bg-yellow-500' : 'bg-blue-600' 
                  : 'bg-gray-200 dark:bg-gray-600'
                }`}
            >
              <span 
                className={`inline-block h-4 w-4 bg-white rounded-full shadow-lg transform transition duration-200 ease-in-out
                  ${isVoiceActive ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Ajuste de Alto Contraste */}
          <div className="flex justify-between items-center">
            <label 
              htmlFor="highContrastToggle" 
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-200"
            >
              <Moon className="h-5 w-5" />
              <span className="font-medium">Modo Alto Contraste</span>
            </label>
            
            <button
              id="highContrastToggle"
              role="switch"
              aria-checked={highContrastMode}
              onClick={handleToggleHighContrast}
              className={`relative inline-flex items-center h-6 w-11 flex-shrink-0 rounded-full cursor-pointer transition-colors duration-200 ease-in-out
                ${highContrastMode ? 
                  highContrastMode ? 'bg-yellow-500' : 'bg-blue-600' 
                  : 'bg-gray-200 dark:bg-gray-600'
                }`}
            >
              <span 
                className={`inline-block h-4 w-4 bg-white rounded-full shadow-lg transform transition duration-200 ease-in-out
                  ${highContrastMode ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Indicador de estado */}
          {highContrastMode && (
            <div className="p-2 bg-yellow-500 text-black text-center rounded text-sm font-bold">
              🎯 MODO ALTO CONTRASTE ACTIVADO
            </div>
          )}
        </div>
      </div>
    </div>
);
};