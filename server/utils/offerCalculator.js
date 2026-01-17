import electricalComponents from '../data/electricalComponents.js';

// Calculate required components based on offer data
function calculateRequiredComponents(offerData) {
  const { rooms, circuits, requiredComponents: userRequiredComponents } = offerData || {};
  
  // Count circuits and their types
  let totalCircuits = 0;
  let circuits16A = 0;
  let circuits10A = 0;
  let circuits20A = 0;
  let circuits25A = 0;
  let threePhaseCircuits = 0;
  
  // If circuits array exists (from calculation page), use it
  if (circuits && Array.isArray(circuits) && circuits.length > 0) {
    circuits.forEach(circuit => {
      totalCircuits++;
      if (circuit.fuseType === '16A') {
        circuits16A++;
      } else if (circuit.fuseType === '10A') {
        circuits10A++;
      } else if (circuit.fuseType === '20A') {
        circuits20A++;
      } else if (circuit.fuseType === '25A') {
        circuits25A++;
      }
      if (circuit.type === '3φ' || circuit.phase === '3Φ') {
        threePhaseCircuits++;
      }
    });
  } else if (rooms && Array.isArray(rooms) && rooms.length > 0) {
    // Fallback to rooms data if circuits not available
    rooms.forEach(room => {
      if (room.circuits && Array.isArray(room.circuits)) {
        room.circuits.forEach(circuit => {
          totalCircuits++;
          if (circuit.fuseType === '16A') {
            circuits16A++;
          } else if (circuit.fuseType === '10A') {
            circuits10A++;
          } else if (circuit.fuseType === '20A') {
            circuits20A++;
          } else if (circuit.fuseType === '25A') {
            circuits25A++;
          }
          if (circuit.isThreePhase) {
            threePhaseCircuits++;
          }
        });
      }
    });
  }
  
  // Handle empty or missing data
  if (totalCircuits === 0 && (!userRequiredComponents || userRequiredComponents.length === 0)) {
    return {
      distributionBoardSize: 0,
      components: [],
      totalCircuits: 0,
      circuits16A: 0,
      circuits10A: 0,
      circuits20A: 0,
      circuits25A: 0,
      threePhaseCircuits: 0,
    };
  }
  
  // Calculate distribution board size
  let totalModules = 0;
  
  // Required components - use user-selected components if available, otherwise use defaults
  let requiredComponents = [];
  if (userRequiredComponents && Array.isArray(userRequiredComponents) && userRequiredComponents.length > 0) {
    // Map user-selected components to internal IDs
    const componentIdMap = {
      'isolator': 'isolatingSwitch',
      'pen_splitter': 'penSplitConnector',
      'surge_protection': 'surgeProtection',
      'distribution_block': 'distributionBlock',
      'rcd_1f': 'rcd1F',
      'rcd_3f': 'rcd3F',
    };
    
    requiredComponents = userRequiredComponents.map(comp => ({
      id: componentIdMap[comp.id] || comp.id,
      quantity: comp.quantity,
    }));
  } else {
    // Default required components (always needed)
    requiredComponents = [
      { id: 'isolatingSwitch', quantity: 1 },
      { id: 'penSplitConnector', quantity: 1 },
      { id: 'surgeProtection', quantity: 1 },
      { id: 'distributionBlock', quantity: 1 },
      { id: 'rcd1F', quantity: 1 },
      { id: 'rcd3F', quantity: threePhaseCircuits > 0 ? 1 : 0 },
    ];
  }
  
  // Add modules for required components
  requiredComponents.forEach(comp => {
    const component = electricalComponents.components.find(c => c.id === comp.id);
    if (component && comp.quantity > 0) {
      totalModules += component.modules * comp.quantity;
    }
  });
  
  // Add modules for fuses
  totalModules += circuits16A; // 16A fuses
  totalModules += circuits10A; // 10A fuses
  totalModules += circuits20A; // 20A fuses
  totalModules += circuits25A; // 25A fuses
  
  // Add 30% reserve
  const distributionBoardSize = Math.ceil(totalModules * (1 + electricalComponents.distributionBoard.reservePercentage / 100));
  
  // Build component list
  const componentList = requiredComponents.map(comp => {
    const component = electricalComponents.components.find(c => c.id === comp.id);
    return {
      ...component,
      quantity: comp.quantity,
      totalPrice: component ? component.price * comp.quantity : 0,
    };
  }).filter(comp => comp.quantity > 0);
  
  // Add fuses
  if (circuits16A > 0) {
    const fuse16A = electricalComponents.components.find(c => c.id === 'fuse16A');
    componentList.push({
      ...fuse16A,
      quantity: circuits16A,
      totalPrice: fuse16A.price * circuits16A,
    });
  }
  
  if (circuits10A > 0) {
    const fuse10A = electricalComponents.components.find(c => c.id === 'fuse10A');
    componentList.push({
      ...fuse10A,
      quantity: circuits10A,
      totalPrice: fuse10A.price * circuits10A,
    });
  }
  
  if (circuits20A > 0) {
    const fuse20A = electricalComponents.components.find(c => c.id === 'fuse20A');
    componentList.push({
      ...fuse20A,
      quantity: circuits20A,
      totalPrice: fuse20A.price * circuits20A,
    });
  }
  
  if (circuits25A > 0) {
    const fuse25A = electricalComponents.components.find(c => c.id === 'fuse25A');
    componentList.push({
      ...fuse25A,
      quantity: circuits25A,
      totalPrice: fuse25A.price * circuits25A,
    });
  }
  
  return {
    distributionBoardSize,
    components: componentList,
    totalCircuits,
    circuits16A,
    circuits10A,
    circuits20A,
    circuits25A,
    threePhaseCircuits,
  };
}

// Calculate pricing summary
function calculatePricing(offerData, componentData, customItems = []) {
  const { pricing } = electricalComponents;
  
  // Calculate points (simplified - you can adjust this logic)
  const totalPoints = componentData.totalCircuits || 0;
  const pricePerPoint = pricing.pricePerPoint;
  const pointsValue = totalPoints * pricePerPoint;
  
  // Calculate wire value (can be from offer data or default)
  const wireValue = offerData.property?.wireValue || 0;
  
  // Calculate connection cost (per protection device/fuse)
  const connectionCost = componentData.totalCircuits * pricing.connectionCostPerProtection;
  
  // Calculate component costs
  const componentCost = componentData.components.reduce((sum, comp) => sum + comp.totalPrice, 0);
  
  // Custom items total
  const customItemsTotal = customItems.reduce((sum, item) => sum + (item.price || 0), 0);
  
  // Net total
  const netTotal = pointsValue + wireValue + connectionCost + componentCost + customItemsTotal;
  
  // VAT (default 8%)
  const vatRate = offerData.vatRate || pricing.defaultVAT;
  const vatAmount = netTotal * (vatRate / 100);
  
  // Gross total
  const grossTotal = netTotal + vatAmount;
  
  return {
    totalPoints,
    pricePerPoint,
    pointsValue,
    wireValue,
    connectionCost,
    componentCost,
    customItemsTotal,
    netTotal,
    vatRate,
    vatAmount,
    grossTotal,
  };
}

export {
  calculateRequiredComponents,
  calculatePricing,
  electricalComponents,
};

