'use client';

import { useState } from 'react';
import GlobalPopup from './GlobalPopup';

interface LightingConfigPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (lightingControl: number, isThreePhase: boolean) => void;
  onAddAnotherDevice?: () => void;
  onAddSockets?: () => void;
}

export default function LightingConfigPopup({
  isOpen,
  onClose,
  onConfirm,
  onAddAnotherDevice,
  onAddSockets,
}: LightingConfigPopupProps) {
  const [lightingControl, setLightingControl] = useState(1);
  const [isThreePhase, setIsThreePhase] = useState(false);

  const handleConfirm = () => {
    onConfirm(lightingControl, isThreePhase);
    setLightingControl(1);
    setIsThreePhase(false);
    onClose();
  };

  return (
    <GlobalPopup isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-4">
        {/* Załączanie oświetlenia section */}
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Załączanie oświetlenia</h3>
          </div>
          
          <div className="space-y-2">
            {[1, 2, 3, 4].map((num) => (
              <label
                key={num}
                className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-yellow-100 rounded"
              >
                <input
                  type="radio"
                  name="lightingControl"
                  value={num}
                  checked={lightingControl === num}
                  onChange={() => setLightingControl(num)}
                  className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-900">
                  Załączanie z {num} {num === 1 ? 'miejsca' : 'miejsc'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => {
              onClose();
              if (onAddAnotherDevice) {
                onAddAnotherDevice();
              }
            }}
            className="flex-1 px-4 py-2 bg-purple-100 text-gray-900 rounded-lg hover:bg-purple-200 flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">+ Dodaj kolejne urządzenie</span>
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-green-100 text-gray-900 rounded-lg hover:bg-green-200 flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-sm font-medium">Dodaj oświetlenie</span>
          </button>
          <button
            onClick={() => {
              onClose();
              if (onAddSockets) {
                onAddSockets();
              }
            }}
            className="flex-1 px-4 py-2 bg-purple-100 text-gray-900 rounded-lg hover:bg-purple-200 flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-sm font-medium">Dodaj gniazda</span>
          </button>
        </div>

        {/* 3 fazowe checkbox */}
        <div className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            id="lighting-threePhase"
            checked={isThreePhase}
            onChange={(e) => setIsThreePhase(e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="lighting-threePhase" className="text-sm font-medium text-gray-900">
            3 fazowe
          </label>
        </div>

        {/* Confirm button */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Anuluj
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Dodaj
          </button>
        </div>
      </div>
    </GlobalPopup>
  );
}

