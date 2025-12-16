'use client';

import { useState, useEffect, useRef } from 'react';
import LightingConfigPopup from './LightingConfigPopup';

interface Device {
  id: string;
  name: string;
  lightingControl?: number;
  isThreePhase?: boolean;
}

interface CircuitConfigProps {
  roomName: string;
  circuitNumber: number;
  onDelete: () => void;
  deviceCount?: 'single' | 'multiple';
  deviceName?: string;
  isThreePhase?: boolean;
  fuseType?: '10A' | '16A' | '20A' | '25A';
  onUpdate?: (data: {
    deviceCount?: 'single' | 'multiple';
    deviceName?: string;
    devices?: Device[];
    isThreePhase?: boolean;
    fuseType?: '10A' | '16A' | '20A' | '25A';
  }) => void;
}

export default function CircuitConfig({
  roomName,
  circuitNumber,
  onDelete,
  deviceCount: initialDeviceCount = 'single',
  deviceName: initialDeviceName = '',
  isThreePhase: initialIsThreePhase = false,
  fuseType: initialFuseType = '16A',
  onUpdate,
}: CircuitConfigProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [deviceCount, setDeviceCount] = useState<'single' | 'multiple'>(initialDeviceCount);
  const [deviceName, setDeviceName] = useState(initialDeviceName);
  const [devices, setDevices] = useState<Device[]>([]);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [isThreePhase, setIsThreePhase] = useState(initialIsThreePhase);
  const [fuseType, setFuseType] = useState<'10A' | '16A' | '20A' | '25A'>(initialFuseType);
  const [isLightingPopupOpen, setIsLightingPopupOpen] = useState(false);
  const isInitialMount = useRef(true);

  // Reset fuse type to 16A if 3-phase is unchecked and current fuse type is 20A or 25A
  useEffect(() => {
    if (!isThreePhase && (fuseType === '20A' || fuseType === '25A')) {
      setFuseType('16A');
    }
  }, [isThreePhase, fuseType]);

  // Update parent when state changes (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (onUpdate) {
      onUpdate({
        deviceCount,
        deviceName,
        devices: deviceCount === 'multiple' ? devices : undefined,
        isThreePhase,
        fuseType,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceCount, deviceName, devices, isThreePhase, fuseType]);

  const handleAddDevice = () => {
    if (newDeviceName.trim()) {
      const newDevice: Device = {
        id: Date.now().toString(),
        name: newDeviceName.trim(),
      };
      setDevices([...devices, newDevice]);
      setNewDeviceName('');
    }
  };

  const handleDeleteDevice = (deviceId: string) => {
    setDevices(devices.filter(d => d.id !== deviceId));
  };

  const handleAddLighting = () => {
    setIsLightingPopupOpen(true);
  };

  const handleLightingConfirm = (lightingControl: number, isThreePhaseLighting: boolean) => {
    const newDevice: Device = {
      id: Date.now().toString(),
      name: `Oświetlenie (${lightingControl} ${lightingControl === 1 ? 'miejsce' : 'miejsc'})`,
      lightingControl,
      isThreePhase: isThreePhaseLighting,
    };
    setDevices([...devices, newDevice]);
  };

  const handleAddSockets = () => {
    const newDevice: Device = {
      id: Date.now().toString(),
      name: 'Gniazda',
    };
    setDevices([...devices, newDevice]);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-gray-900 hover:text-gray-700"
        >
          <svg
            className={`w-5 h-5 text-green-600 transform transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="font-semibold">{roomName} - Obwód nr {circuitNumber}</span>
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Usuń
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Ilość urządzeń */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ilość urządzeń
            </label>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeviceCount('multiple')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                  deviceCount === 'multiple'
                    ? 'bg-purple-100 border-purple-500 text-gray-900'
                    : 'bg-white border-gray-300 hover:border-gray-400 text-gray-900'
                }`}
              >
                <div className="flex flex-col items-center">
                  <svg className="w-6 h-6 text-gray-900 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Wiele urządzeń</span>
                </div>
              </button>
              <button
                onClick={() => setDeviceCount('single')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                  deviceCount === 'single'
                    ? 'bg-green-100 border-green-500 text-gray-900'
                    : 'bg-white border-gray-300 hover:border-gray-400 text-gray-900'
                }`}
              >
                <div className="flex flex-col items-center">
                  <svg className="w-6 h-6 text-gray-900 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">1 urządzenie</span>
                </div>
              </button>
            </div>
          </div>

          {/* Dodaj urządzenia - shown only when multiple devices */}
          {deviceCount === 'multiple' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dodaj urządzenia
              </label>
              
              {/* Device input field */}
              <div className="mb-3">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={newDeviceName}
                      onChange={(e) => setNewDeviceName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddDevice();
                        }
                      }}
                      placeholder="Urządzenie"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  {newDeviceName && (
                    <button
                      onClick={() => setNewDeviceName('')}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="text-sm">Usuń</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-2 mb-3">
                <button
                  onClick={handleAddDevice}
                  className="flex-1 px-4 py-2 bg-purple-100 text-gray-900 rounded-lg hover:bg-purple-200 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-medium">+ Dodaj kolejne urządzenie</span>
                </button>
                <button
                  onClick={handleAddLighting}
                  className="flex-1 px-4 py-2 bg-green-100 text-gray-900 rounded-lg hover:bg-green-200 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-sm font-medium">Dodaj oświetlenie</span>
                </button>
                <button
                  onClick={handleAddSockets}
                  className="flex-1 px-4 py-2 bg-purple-100 text-gray-900 rounded-lg hover:bg-purple-200 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span className="text-sm font-medium">Dodaj gniazda</span>
                </button>
              </div>

              {/* List of added devices */}
              {devices.length > 0 && (
                <div className="space-y-2">
                  {devices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-900">{device.name}</span>
                      <button
                        onClick={() => handleDeleteDevice(device.id)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-xs">Usuń</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Wybierz urządzenie - shown only when single device */}
          {deviceCount === 'single' && (
            <div>
              <label htmlFor={`device-${circuitNumber}`} className="block text-sm font-medium text-gray-700 mb-2">
                Wybierz urządzenie
              </label>
              <input
                type="text"
                id={`device-${circuitNumber}`}
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Wprowadź nazwę urządzenia"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>
          )}

          {/* 3 fazowe checkbox */}
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id={`threePhase-${circuitNumber}`}
              checked={isThreePhase}
              onChange={(e) => setIsThreePhase(e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={`threePhase-${circuitNumber}`} className="text-sm font-medium text-gray-700">
              3 fazowe
            </label>
          </div>

          {/* Typ bezpiecznika */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Typ bezpiecznika
            </label>
            <div className="flex space-x-3">
              <button
                onClick={() => setFuseType('10A')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                  fuseType === '10A'
                    ? 'bg-green-100 border-green-500 text-gray-900'
                    : 'bg-white border-gray-300 hover:border-gray-400 text-gray-900'
                }`}
              >
                <span className="text-sm font-medium">10A</span>
              </button>
              <button
                onClick={() => setFuseType('16A')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                  fuseType === '16A'
                    ? 'bg-green-100 border-green-500 text-gray-900'
                    : 'bg-white border-gray-300 hover:border-gray-400 text-gray-900'
                }`}
              >
                <span className="text-sm font-medium">16A</span>
              </button>
              {isThreePhase && (
                <>
                  <button
                    onClick={() => setFuseType('20A')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      fuseType === '20A'
                        ? 'bg-green-100 border-green-500 text-gray-900'
                        : 'bg-white border-gray-300 hover:border-gray-400 text-gray-900'
                    }`}
                  >
                    <span className="text-sm font-medium">20A</span>
                  </button>
                  <button
                    onClick={() => setFuseType('25A')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      fuseType === '25A'
                        ? 'bg-green-100 border-green-500 text-gray-900'
                        : 'bg-white border-gray-300 hover:border-gray-400 text-gray-900'
                    }`}
                  >
                    <span className="text-sm font-medium">25A</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Lighting Configuration Popup */}
      <LightingConfigPopup
        isOpen={isLightingPopupOpen}
        onClose={() => setIsLightingPopupOpen(false)}
        onConfirm={handleLightingConfirm}
        onAddAnotherDevice={() => {
          setIsLightingPopupOpen(false);
          // Focus on the device input
          setTimeout(() => {
            const input = document.querySelector(`input[placeholder="Urządzenie"]`) as HTMLInputElement;
            if (input) input.focus();
          }, 100);
        }}
        onAddSockets={() => {
          setIsLightingPopupOpen(false);
          handleAddSockets();
        }}
      />
    </div>
  );
}

