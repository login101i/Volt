'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AddRoomPopup from '@/components/AddRoomPopup';
import CircuitConfig from '@/components/CircuitConfig';
import api from '@/lib/api';

interface Room {
  id: string;
  name: string;
  circuits: number[];
}

interface CircuitData {
  roomId: string;
  circuitNumber: number;
  deviceCount: 'single' | 'multiple';
  deviceName: string;
  isThreePhase: boolean;
  fuseType: '10A' | '16A' | '20A' | '25A';
}

const STORAGE_KEY = 'volt_offer_draft';

export default function NewOfferPage() {
  const router = useRouter();
  const [additionalItemsOnly, setAdditionalItemsOnly] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    clientData: true,
    property: true,
    rooms: true,
  });
  
  // Form data
  const [investmentName, setInvestmentName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [propertyInfo, setPropertyInfo] = useState('');
  const [area, setArea] = useState('');
  
  // Rooms and circuits
  const [rooms, setRooms] = useState<Room[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});
  const [circuitData, setCircuitData] = useState<Record<string, CircuitData>>({});
  
  // UI state
  const [isAddRoomPopupOpen, setIsAddRoomPopupOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isInitialLoad = useRef(true);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setAdditionalItemsOnly(parsed.additionalItemsOnly || false);
        setInvestmentName(parsed.investmentName || '');
        setEmail(parsed.email || '');
        setPhone(parsed.phone || '');
        setPropertyInfo(parsed.propertyInfo || '');
        setArea(parsed.area || '');
        setRooms(parsed.rooms || []);
        setExpandedRooms(parsed.expandedRooms || {});
        setCircuitData(parsed.circuitData || {});
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    } finally {
      // Mark initial load as complete after a short delay to ensure all state is set
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 100);
    }
  }, []);

  // Save data to localStorage whenever form data changes (but not on initial load)
  useEffect(() => {
    // Skip saving during initial load
    if (isInitialLoad.current) {
      return;
    }
    
    const formData = {
      additionalItemsOnly,
      investmentName,
      email,
      phone,
      propertyInfo,
      area,
      rooms,
      expandedRooms,
      circuitData,
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [additionalItemsOnly, investmentName, email, phone, propertyInfo, area, rooms, expandedRooms, circuitData]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleRoom = (roomId: string) => {
    setExpandedRooms(prev => ({
      ...prev,
      [roomId]: !prev[roomId],
    }));
  };

  const handleAddRoom = (roomName: string) => {
    const newRoom: Room = {
      id: Date.now().toString(),
      name: roomName,
      circuits: [],
    };
    setRooms([...rooms, newRoom]);
    setExpandedRooms(prev => ({ ...prev, [newRoom.id]: true }));
  };

  const handleEditRoom = (roomId: string, newName: string) => {
    setRooms(rooms.map(room => 
      room.id === roomId ? { ...room, name: newName } : room
    ));
    setEditingRoomId(null);
  };

  const handleDeleteRoom = (roomId: string) => {
    setRooms(rooms.filter(room => room.id !== roomId));
    const newExpanded = { ...expandedRooms };
    delete newExpanded[roomId];
    setExpandedRooms(newExpanded);
    // Remove circuit data for deleted room
    const newCircuitData = { ...circuitData };
    Object.keys(newCircuitData).forEach(key => {
      if (newCircuitData[key].roomId === roomId) {
        delete newCircuitData[key];
      }
    });
    setCircuitData(newCircuitData);
  };

  const handleAddCircuit = (roomId: string) => {
    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        const nextCircuitNumber = room.circuits.length + 1;
        const circuitKey = `${roomId}-${nextCircuitNumber}`;
        // Initialize circuit data
        setCircuitData(prev => ({
          ...prev,
          [circuitKey]: {
            roomId,
            circuitNumber: nextCircuitNumber,
            deviceCount: 'single',
            deviceName: '',
            isThreePhase: false,
            fuseType: '16A',
          },
        }));
        return { ...room, circuits: [...room.circuits, nextCircuitNumber] };
      }
      return room;
    }));
  };

  const handleDeleteCircuit = (roomId: string, circuitNumber: number) => {
    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        const updatedCircuits = room.circuits
          .filter(num => num !== circuitNumber)
          .map((num, index) => index + 1);
        return { ...room, circuits: updatedCircuits };
      }
      return room;
    }));
    // Remove circuit data
    const circuitKey = `${roomId}-${circuitNumber}`;
    const newCircuitData = { ...circuitData };
    delete newCircuitData[circuitKey];
    // Renumber remaining circuits
    Object.keys(newCircuitData).forEach(key => {
      if (newCircuitData[key].roomId === roomId && newCircuitData[key].circuitNumber > circuitNumber) {
        const newNum = newCircuitData[key].circuitNumber - 1;
        const newKey = `${roomId}-${newNum}`;
        newCircuitData[newKey] = { ...newCircuitData[key], circuitNumber: newNum };
        delete newCircuitData[key];
      }
    });
    setCircuitData(newCircuitData);
  };

  const updateCircuitData = useCallback((roomId: string, circuitNumber: number, data: Partial<CircuitData>) => {
    setCircuitData(prev => {
      const circuitKey = `${roomId}-${circuitNumber}`;
      return {
        ...prev,
        [circuitKey]: {
          ...prev[circuitKey],
          ...data,
        },
      };
    });
  }, []);

  // Calculate statistics for the estimate dashboard
  const calculateStats = () => {
    const totalRooms = rooms.length;
    const totalCircuits = rooms.reduce((sum, room) => sum + room.circuits.length, 0);
    const totalPoints = totalCircuits; // Points = circuits
    const pricePerPoint = 120; // Default price per point
    const estimatedValue = totalPoints * pricePerPoint;

    return {
      rooms: totalRooms,
      circuits: totalCircuits,
      points: totalPoints,
      estimatedValue,
    };
  };

  const stats = calculateStats();

  // Determine progress steps based on form completion
  const getProgressSteps = () => {
    const hasClientData = email.trim() && investmentName.trim();
    const hasPropertyData = area.trim();
    const hasRooms = rooms.length > 0;
    
    return {
      step1: hasClientData,
      step2: hasPropertyData,
      step3: hasRooms,
      step4: false, // Only complete after submission
    };
  };

  const progress = getProgressSteps();

  const handleSubmit = async () => {
    // Validation
    if (!email.trim()) {
      setSubmitError('Email jest wymagany');
      return;
    }
    if (!area.trim()) {
      setSubmitError('Powierzchnia jest wymagana');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare rooms with circuit data
      const roomsWithCircuits = rooms.map(room => ({
        id: room.id,
        name: room.name,
        circuits: room.circuits.map(circuitNumber => {
          const circuitKey = `${room.id}-${circuitNumber}`;
          return circuitData[circuitKey] || {
            roomId: room.id,
            circuitNumber,
            deviceCount: 'single' as const,
            deviceName: '',
            isThreePhase: false,
            fuseType: '16A' as const,
          };
        }),
      }));

      const offerData = {
        additionalItemsOnly,
        clientData: {
          investmentName: investmentName.trim(),
          email: email.trim(),
          phone: phone.trim(),
        },
        property: {
          info: propertyInfo.trim(),
          area: parseFloat(area) || 0,
        },
        rooms: roomsWithCircuits,
      };

      const response = await api.offers.create(offerData);
      
      if (response.success) {
        const offerId = response.data.id;
        
        // Save offer ID to localStorage so calculation page can use it
        const currentData = {
          additionalItemsOnly,
          investmentName,
          email,
          phone,
          propertyInfo,
          area,
          rooms,
          expandedRooms,
          circuitData,
          offerId, // Save the offer ID
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
        
        // Redirect to calculation page with offer ID
        router.push(`/calculation?offerId=${offerId}`);
      } else {
        setSubmitError(response.error || 'Błąd podczas zapisywania oferty');
      }
    } catch (error) {
      console.error('Error submitting offer:', error);
      setSubmitError(error instanceof Error ? error.message : 'Błąd podczas zapisywania oferty');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white shadow-sm min-h-screen">
        {/* Header with Back Button */}
        <div className="px-6 py-4 border-b border-gray-200">
          <Link href="/" className="text-gray-600 hover:text-gray-900 flex items-center">
            <span className="text-xl mr-2">←</span>
            <span>Powrót</span>
          </Link>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {/* Step 1: Dane Klienta */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                progress.step1 
                  ? 'bg-green-500 text-white' 
                  : 'bg-purple-200 text-purple-700'
              }`}>
                {progress.step1 ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  '1'
                )}
              </div>
              <span className={`mt-2 text-xs font-medium ${progress.step1 ? 'text-green-600' : 'text-purple-700'}`}>
                Dane Klienta
              </span>
            </div>
            
            {/* Connector */}
            <div className={`flex-1 h-0.5 mx-2 ${progress.step2 ? 'bg-green-500' : 'bg-gray-300'}`}></div>

            {/* Step 2: Nieruchomość */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                progress.step2 
                  ? 'bg-green-500 text-white' 
                  : progress.step1
                  ? 'bg-gray-200 text-gray-500'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {progress.step2 ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  '2'
                )}
              </div>
              <span className={`mt-2 text-xs font-medium ${progress.step2 ? 'text-green-600' : 'text-gray-500'}`}>
                Nieruchomość
              </span>
            </div>

            {/* Connector */}
            <div className={`flex-1 h-0.5 mx-2 ${progress.step3 ? 'bg-green-500' : 'bg-gray-300'}`}></div>

            {/* Step 3: Pomieszczenia */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                progress.step3 
                  ? 'bg-green-500 text-white' 
                  : progress.step2
                  ? 'bg-gray-200 text-gray-500'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {progress.step3 ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  '3'
                )}
              </div>
              <span className={`mt-2 text-xs font-medium ${progress.step3 ? 'text-green-600' : 'text-gray-500'}`}>
                Pomieszczenia
              </span>
            </div>

            {/* Connector */}
            <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>

            {/* Step 4: Oferta */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-semibold">
                4
              </div>
              <span className="mt-2 text-xs font-medium text-gray-500">Oferta</span>
            </div>
          </div>
        </div>

        {/* Estimate Dashboard */}
        <div className="px-6 py-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Pomieszczenia Card */}
            <div className="bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg p-4 text-white shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm opacity-90 mb-1">Pomieszczenia</p>
                  <p className="text-3xl font-bold">{stats.rooms}</p>
                </div>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            </div>

            {/* Obwody Card */}
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg p-4 text-white shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm opacity-90 mb-1">Obwody</p>
                  <p className="text-3xl font-bold">{stats.circuits}</p>
                </div>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
            </div>

            {/* Suma punktów Card */}
            <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg p-4 text-white shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm opacity-90 mb-1">Suma punktów</p>
                  <p className="text-3xl font-bold">{stats.points}</p>
                </div>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>

            {/* Szacowana wartość Card */}
            <div className="bg-gradient-to-br from-green-400 to-teal-500 rounded-lg p-4 text-white shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm opacity-90 mb-1">Szacowana wartość</p>
                  <p className="text-3xl font-bold">{stats.estimatedValue} zł</p>
                </div>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Wycena tylko dodatkowych pozycji */}
          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="additionalItemsOnly"
              checked={additionalItemsOnly}
              onChange={(e) => setAdditionalItemsOnly(e.target.checked)}
              className="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="additionalItemsOnly" className="flex-1 text-sm text-gray-700">
              <span className="font-medium">Wycena tylko dodatkowych pozycji</span>
              <p className="text-gray-600 mt-1">
                Włącz ten tryb aby utworzyć wycenę bez instalacji elektrycznej (np. tylko domofon, monitoring, itp.)
              </p>
            </label>
          </div>

          {/* Dane Klienta Section */}
          <div className="border border-gray-200 rounded-lg shadow-sm">
            <button
              onClick={() => toggleSection('clientData')}
              className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-lg font-semibold text-gray-900">Dane Klienta</h2>
              <svg
                className={`w-5 h-5 text-gray-500 transform transition-transform ${
                  expandedSections.clientData ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {expandedSections.clientData && (
              <div className="px-6 pb-6 space-y-4 border-t border-gray-200">
                <div>
                  <label htmlFor="investmentName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nazwa inwestycji / Nazwisko
                  </label>
                  <input
                    type="text"
                    id="investmentName"
                    value={investmentName}
                    onChange={(e) => setInvestmentName(e.target.value)}
                    placeholder="Wprowadź nazwę inwestycji lub nazwisko klienta"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+48 123 456 789"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Informacje o Nieruchomości Section */}
          <div className="border border-gray-200 rounded-lg shadow-sm">
            <button
              onClick={() => toggleSection('property')}
              className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-lg font-semibold text-gray-900">Informacje o Nieruchomości</h2>
              <svg
                className={`w-5 h-5 text-gray-500 transform transition-transform ${
                  expandedSections.property ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {expandedSections.property && (
              <div className="px-6 pb-6 space-y-4 border-t border-gray-200">
                <div>
                  <label htmlFor="propertyInfo" className="block text-sm font-medium text-gray-700 mb-2">
                    Dodaj informacje o nieruchomości
                  </label>
                  <textarea
                    id="propertyInfo"
                    rows={4}
                    value={propertyInfo}
                    onChange={(e) => setPropertyInfo(e.target.value)}
                    placeholder="Wprowadź dodatkowe informacje o nieruchomości..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
                  />
                </div>
                
                <div>
                  <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
                    Powierzchnia (m²) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="area"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Wprowadź powierzchnię w metrach kwadratowych"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pomieszczenia Section - Redirect to Calculation Page */}
          <div className="border border-gray-200 rounded-lg shadow-sm">
            <div className="w-full px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Pomieszczenia</h2>
              <div className="flex items-center space-x-2">
                {progress.step2 && (
                  <Link
                    href="/calculation"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium flex items-center transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    Przejdź do Kalkulacji Obwodów
                  </Link>
                )}
                {!progress.step2 && (
                  <span className="text-sm text-gray-500">Wypełnij najpierw dane klienta i nieruchomość</span>
                )}
              </div>
            </div>
            {progress.step2 && (
              <div className="px-6 pb-6 border-t border-gray-200 pt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Kalkulacja Obwodów</strong> - Kliknij przycisk powyżej aby przejść do strony kalkulacji obwodów elektrycznych.
                  </p>
                  <p className="text-xs text-blue-700">
                    Na stronie kalkulacji będziesz mógł zarządzać obwodami, dodawać szablony, eksportować dane i wykonywać obliczenia.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generate Offer Button */}
        <div className="px-6 py-6 border-t border-gray-200 bg-gray-50">
          {submitError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {submitError}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-semibold text-lg flex items-center justify-center transition-colors"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Zapisywanie...
              </>
            ) : (
              <>
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Generuj Ofertę
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Room Popup */}
      <AddRoomPopup
        isOpen={isAddRoomPopupOpen}
        onClose={() => setIsAddRoomPopupOpen(false)}
        onConfirm={handleAddRoom}
      />
    </div>
  );
}

// Room Item Component
interface RoomItemProps {
  room: Room;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddCircuit: () => void;
  onDeleteCircuit: (circuitNumber: number) => void;
  isEditing: boolean;
  onSaveEdit: (newName: string) => void;
  onCancelEdit: () => void;
  circuitData: Record<string, CircuitData>;
  onUpdateCircuitData: (circuitNumber: number, data: Partial<CircuitData>) => void;
}

function RoomItem({
  room,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddCircuit,
  onDeleteCircuit,
  isEditing,
  onSaveEdit,
  onCancelEdit,
  circuitData,
  onUpdateCircuitData,
}: RoomItemProps) {
  const [editName, setEditName] = useState(room.name);

  const handleSave = () => {
    if (editName.trim()) {
      onSaveEdit(editName.trim());
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
      {/* Room Header */}
      <div className="flex items-center">
        <div className="w-1 h-16 bg-purple-500 rounded-l-lg"></div>
        <button
          onClick={onToggle}
          className="flex-1 flex items-center justify-between px-4 py-4 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <svg
              className={`w-5 h-5 text-gray-500 transform transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="px-2 py-1 border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-900"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') onCancelEdit();
                }}
              />
            ) : (
              <span className="font-semibold text-gray-900">{room.name}</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                >
                  Zapisz
                </button>
                <button
                  onClick={onCancelEdit}
                  className="px-3 py-1 bg-gray-300 text-gray-900 rounded text-sm hover:bg-gray-400"
                >
                  Anuluj
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onEdit}
                  className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-900 hover:bg-gray-50 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edytuj
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
              </>
            )}
          </div>
        </button>
      </div>

      {/* Room Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Display existing circuits */}
          {room.circuits.length > 0 && (
            <div className="mb-4 space-y-3">
              {room.circuits.map((circuitNumber) => {
                const circuitKey = `${room.id}-${circuitNumber}`;
                const data = circuitData[circuitKey] || {
                  roomId: room.id,
                  circuitNumber,
                  deviceCount: 'single' as const,
                  deviceName: '',
                  isThreePhase: false,
                  fuseType: '16A' as const,
                };
                return (
                  <CircuitConfig
                    key={circuitNumber}
                    roomName={room.name}
                    circuitNumber={circuitNumber}
                    onDelete={() => onDeleteCircuit(circuitNumber)}
                    deviceCount={data.deviceCount}
                    deviceName={data.deviceName}
                    isThreePhase={data.isThreePhase}
                    fuseType={data.fuseType}
                    onUpdate={(updates) => onUpdateCircuitData(circuitNumber, updates)}
                  />
                );
              })}
            </div>
          )}
          
          <div className="ml-6 mt-2 mb-3">
            <p className="text-sm text-gray-500">Dodaj obwód</p>
          </div>
          {room.circuits.length === 0 && (
            <div className="ml-6 mb-4">
              <p className="text-sm text-gray-500 text-center mb-2">Brak obwodów. Dodaj pierwszy obwód aby zacząć.</p>
            </div>
          )}
          <button
            onClick={onAddCircuit}
            className="ml-6 bg-green-400 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            Dodaj obwód nr {room.circuits.length + 1}
          </button>
        </div>
      )}
    </div>
  );
}
