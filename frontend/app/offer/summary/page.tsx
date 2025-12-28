'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface CustomItem {
  id: string;
  name: string;
  price: number;
}

function OfferSummaryPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const offerId = searchParams.get('id');
  
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pricing state
  const [pricePerPoint, setPricePerPoint] = useState(120);
  const [wireValue, setWireValue] = useState(0);
  const [connectionCost, setConnectionCost] = useState(0);
  const [vatRate, setVatRate] = useState(8);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [newCustomItem, setNewCustomItem] = useState({ name: '', price: '' });
  const [wireTypePrices, setWireTypePrices] = useState<Record<string, number>>({});
  
  useEffect(() => {
    if (offerId) {
      fetchOffer();
    } else {
      setError('Brak ID oferty');
      setLoading(false);
    }
  }, [offerId]);
  
  const fetchOffer = async () => {
    try {
      const response = await api.offers.getById(offerId!);
      if (response.success) {
        const offerData = response.data;
        setOffer(offerData);
        setPricePerPoint(offerData.pricing?.pricePerPoint || 120);
        setWireValue(offerData.pricing?.wireValue || 0);
        setConnectionCost(offerData.pricing?.connectionCost || 0);
        setVatRate(offerData.pricing?.vatRate || 8);
        setCustomItems(offerData.customItems || []);
        setWireTypePrices(offerData.pricing?.wireTypePrices || {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd podczas ładowania oferty');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddCustomItem = () => {
    if (newCustomItem.name.trim() && newCustomItem.price) {
      const item: CustomItem = {
        id: Date.now().toString(),
        name: newCustomItem.name.trim(),
        price: parseFloat(newCustomItem.price) || 0,
      };
      setCustomItems([...customItems, item]);
      setNewCustomItem({ name: '', price: '' });
    }
  };
  
  const handleDeleteCustomItem = (id: string) => {
    setCustomItems(customItems.filter(item => item.id !== id));
  };
  
  const handleSaveOffer = async () => {
    try {
      const updateData = {
        pricing: {
          pricePerPoint,
          wireValue: effectiveWireValue,
          connectionCost,
          vatRate,
          wireTypePrices,
        },
        customItems,
      };
      
      await api.offers.update(offerId!, updateData);
      alert('Oferta zapisana pomyślnie!');
    } catch (error) {
      alert('Błąd podczas zapisywania oferty');
    }
  };

  const handleWireTypePriceChange = (cableType: string, price: number) => {
    setWireTypePrices(prev => ({
      ...prev,
      [cableType]: price,
    }));
  };
  
  // Calculate totals - sum of socketSwitchCount from circuits
  const totalPoints = offer?.circuits && Array.isArray(offer.circuits) 
    ? offer.circuits.reduce((sum: number, circuit: any) => sum + (circuit.socketSwitchCount || 0), 0)
    : offer?.components?.totalCircuits || 0;
  const pointsValue = totalPoints * pricePerPoint;
  const componentCost = offer?.components?.components?.reduce((sum: number, comp: any) => sum + (comp.totalPrice || 0), 0) || 0;
  const customItemsTotal = customItems.reduce((sum, item) => sum + item.price, 0);

  // Calculate fuse types from circuits
  const fuseTypeCounts: Record<string, number> = {};
  if (offer?.circuits && Array.isArray(offer.circuits)) {
    offer.circuits.forEach((circuit: any) => {
      const fuseType = circuit.fuseType || '10A';
      fuseTypeCounts[fuseType] = (fuseTypeCounts[fuseType] || 0) + 1;
    });
  }

  // Fuse prices (approximate prices for different fuse types)
  const fusePrices: Record<string, number> = {
    '6A': 25, '10A': 28, '13A': 30, '16A': 32, '20A': 35, '25A': 38,
    '32A': 42, '40A': 48, '50A': 55, '63A': 65, '80A': 85, '100A': 120, '125A': 145
  };

  // Combine fuse types with manually added required components
  const allRequiredComponents: Array<{ name: string; quantity: number; fields?: number; price?: number; totalPrice?: number }> = [];
  
  // Add fuse types from circuits
  Object.entries(fuseTypeCounts).forEach(([fuseType, count]) => {
    if (count > 0) {
      const fusePrice = fusePrices[fuseType] || 30;
      allRequiredComponents.push({
        name: `Bezpiecznik ${fuseType}`,
        quantity: count,
        fields: 1, // Each fuse takes 1 field
        price: fusePrice,
        totalPrice: fusePrice * count,
      });
    }
  });

  // Add manually added required components from calculation page
  if (offer?.requiredComponents && Array.isArray(offer.requiredComponents)) {
    offer.requiredComponents.forEach((comp: any) => {
      if (comp.quantity > 0) {
        const compPrice = comp.price || 0;
        allRequiredComponents.push({
          name: comp.name || comp.id,
          quantity: comp.quantity,
          fields: comp.fields || 0,
          price: compPrice,
          totalPrice: compPrice * comp.quantity,
        });
      }
    });
  }

  // Calculate total components cost
  const totalComponentsCost = allRequiredComponents.reduce((sum, comp) => sum + (comp.totalPrice || 0), 0);

  // Calculate wire value breakdown by wire type
  const wireTypeBreakdown: Record<string, { totalLength: number; pricePerMeter: number; value: number }> = {};

  if (offer?.circuits && Array.isArray(offer.circuits)) {
    offer.circuits.forEach((circuit: any) => {
      const cableType = circuit.cable || 'Unknown';
      const length = circuit.length || 0;
      
      if (!wireTypeBreakdown[cableType]) {
        wireTypeBreakdown[cableType] = { 
          totalLength: 0, 
          pricePerMeter: wireTypePrices[cableType] || 0,
          value: 0 
        };
      }
      
      wireTypeBreakdown[cableType].totalLength += length;
    });

    // Calculate value based on price per meter × length for each type
    Object.keys(wireTypeBreakdown).forEach(cableType => {
      const pricePerMeter = wireTypePrices[cableType] || 0;
      wireTypeBreakdown[cableType].pricePerMeter = pricePerMeter;
      wireTypeBreakdown[cableType].value = pricePerMeter * wireTypeBreakdown[cableType].totalLength;
    });
  }

  // Calculate total wire value from individual wire types
  const calculatedWireValue = Object.values(wireTypeBreakdown).reduce((sum, data) => sum + data.value, 0);
  
  // Use calculated wire value if available, otherwise use manual wireValue
  const effectiveWireValue = calculatedWireValue > 0 ? calculatedWireValue : wireValue;

  const netTotal = pointsValue + effectiveWireValue + connectionCost + componentCost + totalComponentsCost + customItemsTotal;
  const vatAmount = netTotal * (vatRate / 100);
  const grossTotal = netTotal + vatAmount;
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Ładowanie...</div>
      </div>
    );
  }
  
  if (error || !offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error || 'Błąd podczas ładowania oferty'}</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Podsumowanie Oferty</h1>
        
        {/* Informacje o Kliencie */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Informacje o Kliencie</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Nazwa/Nazwisko:</label>
              <p className="text-sm text-gray-900 font-medium">
                {offer.clientData?.investmentName || 'Nie podano'}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-600">Email:</label>
              <p className="text-sm text-gray-900 font-medium">{offer.clientData?.email || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-600">Telefon:</label>
              <p className="text-sm text-gray-900 font-medium">{offer.clientData?.phone || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-600">Powierzchnia:</label>
              <p className="text-sm text-gray-900 font-medium">{offer.property?.area || 0} m²</p>
            </div>
          </div>
        </div>

        {/* Obwody z Kalkulacji */}
        {offer.circuits && Array.isArray(offer.circuits) && offer.circuits.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Obwody Elektryczne</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nr</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Opis</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ilość</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Strefa</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Napięcie</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Przewód</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Moc</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bezpiecznik</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Faza</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {offer.circuits.map((circuit: any, index: number) => (
                    <tr key={index} className={index >= 6 && index < 12 ? 'bg-orange-50' : ''}>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">{circuit.circuitNumber}</td>
                      <td className="px-2 py-2 text-xs text-gray-900">{circuit.description}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">{circuit.socketSwitchCount || 0}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">{circuit.zone}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">{circuit.voltage}V</td>
                      <td className="px-2 py-2 text-xs text-gray-900">{circuit.cable}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">{circuit.power}kW</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">{circuit.fuseType}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">{circuit.phase}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">{circuit.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        
        {/* Wymagane Komponenty */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Wymagane Komponenty</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-700">
                Wielkość rozdzielnicy (z zapasem 30%):
              </span>
              <span className="text-xs text-blue-600 font-semibold">
                {offer.components?.distributionBoardSize || 0} pól
              </span>
            </div>
            
            {/* Combined list: Fuse types from circuits + Manually added components */}
            {allRequiredComponents.length > 0 ? (
              <div className="space-y-2 mt-3">
                {allRequiredComponents.map((comp, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-gray-200 pb-1.5">
                    <div className="flex-1">
                      <span className="text-xs text-gray-700">
                        {comp.name}
                        {comp.fields !== undefined && comp.fields > 0 && (
                          <span className="text-gray-500 ml-1">({comp.fields} {comp.fields === 1 ? 'pole' : 'pola'})</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-medium text-gray-900">
                        {comp.quantity} szt.
                      </span>
                      {comp.price !== undefined && comp.price > 0 && (
                        <span className="text-xs text-gray-600">
                          ~{comp.price.toFixed(2)} zł
                        </span>
                      )}
                      {comp.totalPrice !== undefined && comp.totalPrice > 0 && (
                        <span className="text-xs font-semibold text-green-600">
                          {comp.totalPrice.toFixed(2)} zł
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {/* Total components cost */}
                {totalComponentsCost > 0 && (
                  <div className="mt-3 pt-3 border-t-2 border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">Suma komponentów:</span>
                      <span className="text-base font-bold text-green-600">{totalComponentsCost.toFixed(2)} zł netto</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Ceny przybliżone</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-500 mt-3">
                Brak wymaganych komponentów
              </div>
            )}
            
            {/* Additional components from backend calculation (if any) */}
            {offer.components?.components?.filter((comp: any) => {
              // Filter out fuses that are already shown in allRequiredComponents
              const fuseIds = ['fuse16A', 'fuse10A', 'fuse20A', 'fuse25A'];
              return !fuseIds.includes(comp.id);
            }).map((comp: any) => (
              <div key={comp.id} className="flex justify-between items-center border-b border-gray-200 pb-1.5">
                <span className="text-xs text-gray-700">
                  {comp.name} ({comp.modules} {comp.modules === 1 ? 'pole' : 'pola'})
                </span>
                <span className="text-xs font-medium text-gray-900">
                  {comp.quantity} {comp.unit || 'szt.'}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Wycena */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Wycena</h2>
            <div className="text-xs text-gray-600">
              Suma punktów: <span className="font-semibold text-gray-900">{totalPoints} pkt</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Cena za punkt */}
            <div className="flex justify-between items-center gap-4">
              <label className="text-xs text-gray-700 font-medium flex-shrink-0">Cena za punkt:</label>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <input
                  type="number"
                  value={pricePerPoint}
                  onChange={(e) => setPricePerPoint(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-xs border border-gray-300 rounded text-gray-900 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-600 whitespace-nowrap">zł netto</span>
              </div>
            </div>
            
            {/* Wartość punktów */}
            <div className="flex justify-between items-center gap-4">
              <label className="text-xs text-gray-700 font-medium flex-shrink-0">Wartość punktów:</label>
              <span className="text-sm font-semibold text-green-600 flex-shrink-0">
                {pointsValue.toFixed(2)} zł netto
              </span>
            </div>
            
            {/* Wartość przewodów */}
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-4">
                <label className="text-xs text-gray-700 font-medium flex-shrink-0">Wartość przewodów:</label>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-sm font-semibold text-green-600">
                    {effectiveWireValue.toFixed(2)} zł netto
                  </span>
                  {calculatedWireValue === 0 && (
                    <input
                      type="number"
                      value={wireValue}
                      onChange={(e) => setWireValue(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-xs border border-gray-300 rounded text-gray-900 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ręcznie"
                    />
                  )}
                </div>
              </div>
              
              {/* Wire value breakdown by type */}
              {Object.keys(wireTypeBreakdown).length > 0 && (
                <div className="ml-0 mt-3 space-y-3 border-l-2 border-gray-200 pl-4">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Podział według typu przewodu:</div>
                  {Object.entries(wireTypeBreakdown).map(([cableType, data]) => (
                    <div key={cableType} className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <span className="text-xs font-medium text-gray-700">
                            {cableType}
                          </span>
                          {data.totalLength > 0 && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({data.totalLength.toFixed(0)} m)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center gap-4">
                        <label className="text-xs text-gray-600 whitespace-nowrap flex-shrink-0">Cena za m:</label>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <input
                            type="number"
                            step="0.01"
                            value={data.pricePerMeter || ''}
                            onChange={(e) => handleWireTypePriceChange(cableType, parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 text-xs border border-gray-300 rounded text-gray-900 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                          <span className="text-xs text-gray-600 whitespace-nowrap">zł/m</span>
                          {data.value > 0 && (
                            <span className="text-xs font-semibold text-green-600 ml-2 whitespace-nowrap">
                              = {data.value.toFixed(2)} zł
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {calculatedWireValue > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-xs font-semibold text-gray-700">Suma przewodów:</span>
                        <span className="text-sm font-bold text-green-600">
                          {calculatedWireValue.toFixed(2)} zł netto
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Koszt podłączenia */}
            <div className="flex justify-between items-center gap-4">
              <label className="text-xs text-gray-700 font-medium flex-shrink-0">
                Koszt podłączenia ({totalPoints} zabezpieczeń):
              </label>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <input
                  type="number"
                  value={connectionCost}
                  onChange={(e) => setConnectionCost(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-xs border border-gray-300 rounded text-gray-900 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-600 whitespace-nowrap">zł netto</span>
              </div>
            </div>
            
            {/* Custom Items */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="text-xs font-medium text-gray-700 mb-2 block">
                + Dodaj pozycję:
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newCustomItem.name}
                  onChange={(e) => setNewCustomItem({ ...newCustomItem, name: e.target.value })}
                  placeholder="Np. Domofon"
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded text-gray-900 placeholder-gray-400"
                />
                <input
                  type="number"
                  value={newCustomItem.price}
                  onChange={(e) => setNewCustomItem({ ...newCustomItem, price: e.target.value })}
                  placeholder="Cena"
                  className="w-32 px-2 py-1 text-xs border border-gray-300 rounded text-gray-900 placeholder-gray-400"
                />
                <button
                  onClick={handleAddCustomItem}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Dodaj
                </button>
              </div>
              
              {customItems.map(item => (
                <div key={item.id} className="flex justify-between items-center mb-1 gap-4">
                  <span className="text-xs text-gray-700 flex-shrink-0">{item.name}</span>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="text-xs text-gray-900">{item.price.toFixed(2)} zł netto</span>
                    <button
                      onClick={() => handleDeleteCustomItem(item.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Totals */}
            <div className="mt-4 pt-4 border-t-2 border-gray-300 space-y-3">
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm font-semibold text-gray-900">Suma netto:</span>
                <span className="text-base font-bold text-green-600 flex-shrink-0">{netTotal.toFixed(2)} zł</span>
              </div>
              
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <span className="text-xs text-gray-700 font-medium">VAT:</span>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={vatRate === 8}
                      onChange={() => setVatRate(8)}
                      className="text-purple-600 cursor-pointer"
                    />
                    <span className="text-xs">8%</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={vatRate === 23}
                      onChange={() => setVatRate(23)}
                      className="text-purple-600 cursor-pointer"
                    />
                    <span className="text-xs">23%</span>
                  </label>
                </div>
                <span className="text-sm font-semibold text-green-600 flex-shrink-0">
                  {vatAmount.toFixed(2)} zł
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 gap-4">
                <span className="text-base font-semibold text-gray-900">Suma brutto:</span>
                <span className="text-lg font-bold text-green-600 flex-shrink-0">{grossTotal.toFixed(2)} zł</span>
              </div>
            </div>
          </div>
          
          {/* Akcje */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSaveOffer}
                className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Zapisz Ofertę
              </button>
              <button className="px-3 py-1.5 text-xs bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Szablon
              </button>
              <button className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                PDF
              </button>
              <Link
                href={`/offer/visualization?id=${offerId}`}
                className="px-3 py-1.5 text-xs bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                </svg>
                Wizualizacja
              </Link>
              <button className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OfferSummaryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Ładowanie...</div>
      </div>
    }>
      <OfferSummaryPageContent />
    </Suspense>
  );
}

