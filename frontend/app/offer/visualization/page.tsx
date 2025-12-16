'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { MenuContextRightClick } from '@/components/RightClickMenu';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BoardComponent {
  id: string;
  name: string;
  modules: number;
  type: 'infrastructure' | 'circuit';
  row?: number;
  position?: number;
  roomName?: string;
  circuitNumber?: number;
  quantity?: number; // For infrastructure components - how many are available
  fuseType?: string; // For circuit components - fuse type (e.g., "10A", "16A")
}

function DistributionBoardVisualizationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const offerId = searchParams.get('id');
  
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [boardSize, setBoardSize] = useState(36); // Default 36 modules (3x12)
  const [boardRows, setBoardRows] = useState(3);
  const [modulesPerRow, setModulesPerRow] = useState(12);
  const [components, setComponents] = useState<BoardComponent[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [boardLayout, setBoardLayout] = useState<(BoardComponent | null)[][]>([]);
  const [activeTab, setActiveTab] = useState('editor');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: { top: number; left: number };
    component: BoardComponent | null;
  }>({
    visible: false,
    position: { top: 0, left: 0 },
    component: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const calculateBoardDimensions = (size: number) => {
    // Calculate rows and modules per row (always 12 modules per row)
    const rows = Math.ceil(size / 12);
    setBoardRows(rows);
    setModulesPerRow(12);
  };

  // Map component names/IDs to BoardComponent format (returns single component with quantity)
  const mapComponentToBoardComponent = (name: string, fields: number, quantity: number): BoardComponent | null => {
    if (quantity <= 0) return null;
    
    // Map component names to IDs and module counts
    const componentMap: Record<string, { id: string; modules: number }> = {
      'Rozłącznik izolacyjny': { id: 'main-switch', modules: 3 },
      'Wyłącznik główny': { id: 'main-switch', modules: 3 },
      'isolator': { id: 'main-switch', modules: 3 },
      'Złączka podziału PEN': { id: 'pen-connector', modules: 2 },
      'Złączka PEN': { id: 'pen-connector', modules: 2 },
      'pen_splitter': { id: 'pen-connector', modules: 2 },
      'Zabezpieczenie przepięciowe': { id: 'surge-protection', modules: 4 },
      'Ogranicznik przepięć': { id: 'surge-protection', modules: 4 },
      'surge_protection': { id: 'surge-protection', modules: 4 },
      'Blok rozdzielczy': { id: 'distribution-block', modules: 4 },
      'distribution_block': { id: 'distribution-block', modules: 4 },
      'Wyłącznik różnicowoprądowy 1F': { id: 'rcd-1f', modules: 2 },
      'RCD 1-fazowy': { id: 'rcd-1f', modules: 2 },
      'rcd_1f': { id: 'rcd-1f', modules: 2 },
      'Wyłącznik różnicowoprądowy 3F': { id: 'rcd-3f', modules: 4 },
      'RCD 3-fazowy': { id: 'rcd-3f', modules: 4 },
      'rcd_3f': { id: 'rcd-3f', modules: 4 },
    };

    // Check if it's a fuse type (Bezpiecznik XXA)
    const fuseMatch = name.match(/Bezpiecznik\s+(\d+A)/i);
    if (fuseMatch) {
      const fuseType = fuseMatch[1];
      return {
        id: `fuse-${fuseType}`,
        name: `B${fuseType}`,
        modules: 1,
        type: 'infrastructure',
        quantity: quantity,
      };
    }

    // Check component map
    const mapped = componentMap[name];
    if (mapped) {
      return {
        id: mapped.id,
        name: name,
        modules: mapped.modules,
        type: 'infrastructure',
        quantity: quantity,
      };
    }

    // Default: use fields as modules, or 1 if fields is 0
    const modules = fields > 0 ? fields : 1;
    return {
      id: `component-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name: name,
      modules: modules,
      type: 'infrastructure',
      quantity: quantity,
    };
  };

  const initializeBoard = useCallback(() => {
    if (!offer) return;

    // Initialize infrastructure components
    const infrastructureComponents: BoardComponent[] = [
      { id: 'main-switch', name: 'Wyłącznik główny', modules: 3, type: 'infrastructure' },
      { id: 'pen-connector', name: 'Złączka PEN', modules: 2, type: 'infrastructure' },
      { id: 'surge-protection', name: 'Ogranicznik przepięć', modules: 4, type: 'infrastructure' },
      { id: 'distribution-block', name: 'Blok rozdzielczy', modules: 4, type: 'infrastructure' },
      { id: 'rcd-1f', name: 'RCD 1-fazowy', modules: 2, type: 'infrastructure' },
    ];

    // Add RCD 3-fazowy only if there are 3-phase circuits
    const hasThreePhase = offer.rooms?.some((room: any) => 
      room.circuits?.some((circuit: any) => circuit.isThreePhase)
    ) || offer.circuits?.some((circuit: any) => circuit.type === '3φ' || circuit.phase === '3Φ');
    if (hasThreePhase) {
      infrastructureComponents.push({
        id: 'rcd-3f',
        name: 'RCD 3-fazowy',
        modules: 4,
        type: 'infrastructure',
      });
    }

    // Track which default components we've already added to avoid duplicates
    const addedComponentIds = new Set<string>(infrastructureComponents.map(c => c.id.split('-')[0]));

    // Add required components from summary page
    // Calculate fuse types from circuits
    const fuseTypeCounts: Record<string, number> = {};
    if (offer.circuits && Array.isArray(offer.circuits)) {
      offer.circuits.forEach((circuit: any) => {
        const fuseType = circuit.fuseType || '10A';
        fuseTypeCounts[fuseType] = (fuseTypeCounts[fuseType] || 0) + 1;
      });
    }

    // Track components by ID to merge quantities
    const componentMap = new Map<string, BoardComponent>();

    // Add fuse types as components
    Object.entries(fuseTypeCounts).forEach(([fuseType, count]) => {
      if (count > 0) {
        const fuseComponent = mapComponentToBoardComponent(`Bezpiecznik ${fuseType}`, 1, count);
        if (fuseComponent) {
          const existing = componentMap.get(fuseComponent.id);
          if (existing) {
            existing.quantity = (existing.quantity || 0) + count;
          } else {
            componentMap.set(fuseComponent.id, fuseComponent);
          }
        }
      }
    });

    // Add manually added required components from calculation page
    if (offer.requiredComponents && Array.isArray(offer.requiredComponents)) {
      offer.requiredComponents.forEach((comp: any) => {
        if (comp.quantity > 0) {
          const compName = comp.name || comp.id;
          const mappedComponent = mapComponentToBoardComponent(
            compName,
            comp.fields || 0,
            comp.quantity
          );
          
          if (mappedComponent) {
            const baseId = mappedComponent.id;
            
            // Only add if not already in default components
            if (!addedComponentIds.has(baseId)) {
              const existing = componentMap.get(baseId);
              if (existing) {
                existing.quantity = (existing.quantity || 0) + comp.quantity;
              } else {
                componentMap.set(baseId, mappedComponent);
              }
              addedComponentIds.add(baseId);
            }
          }
        }
      });
    }

    // Add merged components to infrastructure components
    componentMap.forEach((comp) => {
      infrastructureComponents.push(comp);
    });

    // Add circuit components from rooms or circuits array
    const circuitComponents: BoardComponent[] = [];
    
    // Handle circuits from calculation page (direct circuits array)
    if (offer.circuits && Array.isArray(offer.circuits)) {
      offer.circuits.forEach((circuit: any) => {
        const socketSwitchCount = circuit.socketSwitchCount || 1;
        const fuseType = circuit.fuseType || '10A';
        // Create multiple circuit components based on socketSwitchCount
        for (let i = 0; i < socketSwitchCount; i++) {
          circuitComponents.push({
            id: `circuit-${circuit.circuitNumber}-${i}`,
            name: `B${fuseType}`, // Fuse type as name (B10, B16, etc.)
            modules: 1,
            type: 'circuit',
            roomName: circuit.description || '',
            circuitNumber: circuit.circuitNumber,
            fuseType: fuseType,
          });
        }
      });
    }
    
    // Handle circuits from rooms (legacy format)
    offer.rooms?.forEach((room: any) => {
      room.circuits?.forEach((circuit: any) => {
        const circuitNumber = typeof circuit === 'number' ? circuit : circuit.circuitNumber;
        const socketSwitchCount = circuit.socketSwitchCount || 1;
        const fuseType = circuit.fuseType || '10A';
        // Create multiple circuit components based on socketSwitchCount
        for (let i = 0; i < socketSwitchCount; i++) {
          circuitComponents.push({
            id: `circuit-${room.id}-${circuitNumber}-${i}`,
            name: `B${fuseType}`, // Fuse type as name (B10, B16, etc.)
            modules: 1,
            type: 'circuit',
            roomName: room.name,
            circuitNumber: circuitNumber,
            fuseType: fuseType,
          });
        }
      });
    });

    // Ensure infrastructure components don't have row/position set (they should be in the list, not on board)
    const infrastructureComponentsWithoutPosition = infrastructureComponents.map(comp => ({
      ...comp,
      row: undefined,
      position: undefined,
    }));

    // Group circuit components by name, modules, fuseType, AND roomName to keep separate by description
    const circuitComponentsMap = new Map<string, BoardComponent>();
    
    circuitComponents.forEach(comp => {
      // Create a key based on name, modules, fuseType, AND roomName to group by circuit description
      const key = `${comp.name}-${comp.modules}-${comp.fuseType || ''}-${comp.roomName || ''}`;
      
      if (circuitComponentsMap.has(key)) {
        // Increment quantity for same circuit description
        const existing = circuitComponentsMap.get(key)!;
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        // Create new component with quantity 1 and consistent base ID
        const baseId = comp.type === 'circuit' 
          ? `circuit-${comp.name.toLowerCase()}-${comp.roomName?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}` 
          : comp.id;
        circuitComponentsMap.set(key, {
          ...comp,
          id: baseId, // Use consistent base ID for grouping
          row: undefined,
          position: undefined,
          quantity: 1,
        });
      }
    });

    // Convert map to array
    const consolidatedCircuitComponents = Array.from(circuitComponentsMap.values());

    setComponents([...infrastructureComponentsWithoutPosition, ...consolidatedCircuitComponents]);

    // Initialize empty board layout - all components should be manually dragged
    const layout: (BoardComponent | null)[][] = [];
    for (let row = 0; row < boardRows; row++) {
      layout[row] = Array(modulesPerRow).fill(null);
    }

    setBoardLayout(layout);
  }, [offer, boardRows, modulesPerRow]);

  useEffect(() => {
    if (offerId) {
      fetchOffer();
    }
  }, [offerId]);

  useEffect(() => {
    if (offer) {
      initializeBoard();
    }
  }, [offer, initializeBoard]);

  useEffect(() => {
    if (offer && boardSize) {
      calculateBoardDimensions(boardSize);
      // initializeBoard will be called automatically when boardRows/modulesPerRow change
    }
  }, [boardSize]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  const fetchOffer = async () => {
    try {
      const response = await api.offers.getById(offerId!);
      if (response.success) {
        setOffer(response.data);
        if (response.data.components?.distributionBoardSize) {
          setBoardSize(response.data.components.distributionBoardSize);
          calculateBoardDimensions(response.data.components.distributionBoardSize);
        }
      }
    } catch (err) {
      console.error('Error loading offer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOffer = async () => {
    if (!offerId || !offer) {
      setSaveMessage('Błąd: Brak danych oferty');
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Prepare board layout data
      const boardLayoutData = {
        boardSize,
        boardRows,
        modulesPerRow,
        components: components.map(comp => ({
          id: comp.id,
          name: comp.name,
          modules: comp.modules,
          type: comp.type,
          row: comp.row,
          position: comp.position,
          roomName: comp.roomName,
          circuitNumber: comp.circuitNumber,
        })),
        boardLayout: boardLayout.map(row => 
          row.map(cell => cell ? {
            id: cell.id,
            name: cell.name,
            modules: cell.modules,
            type: cell.type,
            row: cell.row,
            position: cell.position,
            roomName: cell.roomName,
            circuitNumber: cell.circuitNumber,
          } : null)
        ),
      };

      // Update offer with board layout
      const updatedOffer = {
        ...offer,
        boardLayout: boardLayoutData,
        updatedAt: new Date().toISOString(),
      };

      const response = await api.offers.update(offerId, updatedOffer);
      
      if (response.success) {
        setSaveMessage('Oferta została zapisana pomyślnie!');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage('Błąd podczas zapisywania oferty');
      }
    } catch (err) {
      console.error('Error saving offer:', err);
      setSaveMessage('Błąd podczas zapisywania oferty');
    } finally {
      setIsSaving(false);
    }
  };

  const boardSizeOptions = [
    {
      category: 'Rozdzielnice małe',
      options: [
        { size: 12, label: '12 modułów (1x12)', rows: 1 },
        { size: 24, label: '24 moduły (2x12)', rows: 2 },
        { size: 36, label: '36 modułów (3x12)', rows: 3 },
        { size: 48, label: '48 modułów (4x12)', rows: 4 },
      ],
    },
    {
      category: 'Rozdzielnice średnie',
      options: [
        { size: 54, label: '54 moduły (5x12)', rows: 5 },
        { size: 72, label: '72 moduły (6x12)', rows: 6 },
        { size: 96, label: '96 modułów (8x12)', rows: 8 },
        { size: 120, label: '120 modułów (10x12)', rows: 10 },
      ],
    },
    {
      category: 'Szafy rozdzielcze',
      options: [
        { size: 144, label: '144 moduły (12x12)', rows: 12 },
        { size: 180, label: '180 modułów (15x12)', rows: 15 },
        { size: 216, label: '216 modułów (18x12)', rows: 18 },
        { size: 252, label: '252 moduły (21x12)', rows: 21 },
        { size: 288, label: '288 modułów (24x12)', rows: 24 },
      ],
    },
  ];

  const getCurrentSizeLabel = () => {
    for (const category of boardSizeOptions) {
      const option = category.options.find(opt => opt.size === boardSize);
      if (option) return option.label;
    }
    return `${boardSize} modułów (${boardRows}x${modulesPerRow})`;
  };

  const handleRemoveComponent = (component: BoardComponent) => {
    // Create new layout
    const newLayout = boardLayout.map(r => [...r]);

    // Remove component from board
    if (component.row !== undefined && component.position !== undefined) {
      for (let i = 0; i < component.modules; i++) {
        const row = component.row;
        const pos = component.position + i;
        if (row < boardRows && pos < modulesPerRow) {
          if (newLayout[row][pos]?.id === component.id) {
            newLayout[row][pos] = null;
          }
        }
      }
    }

    // If it's an infrastructure or circuit component with quantity support, return it to the list
    if (component.type === 'infrastructure' || component.type === 'circuit') {
      // Extract base ID (remove timestamp suffix if present)
      // Board components have IDs like "fuse-16A-1234567890", infrastructure has "fuse-16A"
      // Circuit components: "circuit-b10a-1234567890" -> "circuit-b10a"
      const baseIdMatch = component.id.match(/^(.+?)(-\d{10,})?$/);
      const baseId = baseIdMatch ? baseIdMatch[1] : component.id;
      
      // Find existing component with matching name, modules, and base ID
      // First try to match by base ID
      let existingComponent = components.find(c => 
        (c.type === component.type) && 
        c.quantity !== undefined &&
        c.id === baseId &&
        c.row === undefined &&
        c.position === undefined
      );
      
      // If not found by ID, try to match by name, modules, fuseType, AND roomName
      if (!existingComponent) {
        existingComponent = components.find(c => 
          c.type === component.type && 
          c.name === component.name && 
          c.modules === component.modules &&
          c.fuseType === component.fuseType &&
          c.roomName === component.roomName &&
          c.quantity !== undefined &&
          c.row === undefined &&
          c.position === undefined
        );
      }

      if (existingComponent) {
        // Increment quantity of existing component
        const updatedComponent = {
          ...existingComponent,
          quantity: (existingComponent.quantity || 0) + 1,
        };
        
        // Remove board component and update component
        setComponents(components
          .filter(c => c.id !== component.id) // Remove board instance
          .map(c => c.id === existingComponent!.id ? updatedComponent : c)
        );
      } else {
        // Create new component with quantity 1
        const newComponent: BoardComponent = {
          id: baseId,
          name: component.name,
          modules: component.modules,
          type: component.type,
          quantity: 1,
          fuseType: component.fuseType,
          roomName: component.roomName,
        };
        
        // Remove board component and add component
        setComponents([
          ...components.filter(c => c.id !== component.id),
          newComponent,
        ]);
      }
    } else {
      // For other component types, just remove from board
      setComponents(components.filter(c => c.id !== component.id));
    }

    setBoardLayout(newLayout);
    setContextMenu({ visible: false, position: { top: 0, left: 0 }, component: null });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !active) {
      // If dropped outside, check if component was on board - if so, keep it there
      const activeId = active.id as string;
      const activeMatch = activeId.match(/^component-(.+)$/);
      if (activeMatch) {
        const componentId = activeMatch[1];
        const component = components.find(c => c.id === componentId);
        // If component was already on board, do nothing (keep it in place)
        if (component && component.row !== undefined && component.position !== undefined) {
          return;
        }
      }
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Parse the IDs - active can be component-{id} (from infrastructure list) or component-{id} (from board)
    const activeMatch = activeId.match(/^component-(.+)$/);
    const overMatch = overId.match(/^cell-(\d+)-(\d+)$/);

    // Only allow dropping on board cells
    if (!activeMatch || !overMatch) {
      // If component was already on board and dropped outside, keep it in place
      const componentId = activeMatch?.[1];
      if (componentId) {
        const component = components.find(c => c.id === componentId);
        if (component && component.row !== undefined && component.position !== undefined) {
          return; // Keep component in place
        }
      }
      return;
    }

    // If over is a cell that's part of the same component being dragged, adjust target position
    // to the start of that component
    const overRow = parseInt(overMatch[1]);
    const overCol = parseInt(overMatch[2]);
    const cellAtOver = boardLayout[overRow]?.[overCol];
    
    const componentId = activeMatch[1];
    
    // If the cell at over position is part of the component being dragged, use that component's start position
    let targetRow = overRow;
    let targetPos = overCol;
    
    if (cellAtOver && cellAtOver.id === componentId) {
      // This cell is part of the component being dragged, use the component's start position
      targetRow = cellAtOver.row ?? overRow;
      targetPos = cellAtOver.position ?? overCol;
    }

    // Find the component
    const sourceComponent = components.find(c => c.id === componentId);
    if (!sourceComponent) return;

    // Check if we're moving an existing component on the board
    const isMovingExisting = sourceComponent.row !== undefined && sourceComponent.position !== undefined;

    // If moving existing component to same position, do nothing
    if (isMovingExisting && sourceComponent.row === targetRow && sourceComponent.position === targetPos) {
      return;
    }

    // Create new layout
    const newLayout = boardLayout.map(r => [...r]);

    // Remove component from old position (if it exists)
    if (isMovingExisting) {
      for (let i = 0; i < sourceComponent.modules; i++) {
        const row = sourceComponent.row!;
        const pos = sourceComponent.position! + i;
        if (row < boardRows && pos < modulesPerRow) {
          if (newLayout[row][pos]?.id === sourceComponent.id) {
            newLayout[row][pos] = null;
          }
        }
      }
    }

    // Check if new position is valid
    if (targetRow >= boardRows || targetPos + sourceComponent.modules > modulesPerRow) {
      // If component was already on board, restore it to original position
      if (isMovingExisting) {
        const originalRow = sourceComponent.row!;
        const originalPos = sourceComponent.position!;
        for (let i = 0; i < sourceComponent.modules; i++) {
          newLayout[originalRow][originalPos + i] = sourceComponent;
        }
        setBoardLayout(newLayout);
      }
      return;
    }

    // Check if position is free (allow dropping on same position or overlapping with same component)
    for (let i = 0; i < sourceComponent.modules; i++) {
      const cell = newLayout[targetRow][targetPos + i];
      // Allow if cell is null or same component
      if (cell !== null && cell.id !== sourceComponent.id) {
        // If component was already on board, restore it to original position
        if (isMovingExisting) {
          const originalRow = sourceComponent.row!;
          const originalPos = sourceComponent.position!;
          for (let i = 0; i < sourceComponent.modules; i++) {
            newLayout[originalRow][originalPos + i] = sourceComponent;
          }
          setBoardLayout(newLayout);
        }
        return;
      }
    }

    // If dragging from infrastructure list (has quantity), create a new instance and decrement quantity
    if (!isMovingExisting && sourceComponent.quantity !== undefined && sourceComponent.quantity > 0) {
      // Create a new component instance for the board (without quantity)
      const boardComponent: BoardComponent = {
        ...sourceComponent,
        id: `${sourceComponent.id}-${Date.now()}`, // Unique ID for board instance
        row: targetRow,
        position: targetPos,
        quantity: undefined, // Remove quantity from board component
      };

      const updatedSourceComponent = {
        ...sourceComponent,
        quantity: sourceComponent.quantity - 1,
      };

      // Place new component on board
      for (let i = 0; i < boardComponent.modules; i++) {
        newLayout[targetRow][targetPos + i] = boardComponent;
      }

      // Update components array: update source component quantity and add board component
      // Don't remove component when quantity reaches 0 - keep it visible in light gray
      const updatedComponents = components
        .map(c => c.id === sourceComponent.id ? updatedSourceComponent : c);
      
      // Add board component
      updatedComponents.push(boardComponent);
      
      setComponents(updatedComponents);
      setBoardLayout(newLayout);
      return;
    }

    // Moving existing component on board
    const updatedComponent = { ...sourceComponent, row: targetRow, position: targetPos };
    for (let i = 0; i < sourceComponent.modules; i++) {
      newLayout[targetRow][targetPos + i] = updatedComponent;
    }

    // Update components array
    setComponents(components.map(c => 
      c.id === sourceComponent.id ? updatedComponent : c
    ));

    setBoardLayout(newLayout);
  };

  const calculateStats = () => {
    const totalModules = boardSize;
    const occupied = boardLayout.reduce((sum, row) => 
      sum + row.filter(cell => cell !== null).length, 0
    );
    const free = totalModules - occupied;
    return { totalModules, rows: boardRows, occupied, free };
  };

  const stats = calculateStats();

  const getComponentStatus = (component: BoardComponent) => {
    // Check if component is placed on board
    const isPlaced = component.row !== undefined && component.position !== undefined;
    return isPlaced ? 'complete' : 'missing';
  };

  // Helper function to get component image path
  const getComponentImage = (component: BoardComponent): string | null => {
    // Map component IDs/names to image paths from REQUIRED_COMPONENTS
    const imageMap: Record<string, string> = {
      'main-switch': '/pictures/electricComponents/isolator.jpg',
      'isolator': '/pictures/electricComponents/isolator.jpg',
      'pen-connector': '/pictures/electricComponents/pen_splitter.jpg',
      'pen_splitter': '/pictures/electricComponents/pen_splitter.jpg',
      'surge-protection': '/pictures/electricComponents/surge_protection.jpg',
      'surge_protection': '/pictures/electricComponents/surge_protection.jpg',
      'distribution-block': '/pictures/electricComponents/distribution_block.jpg',
      'distribution_block': '/pictures/electricComponents/distribution_block.jpg',
      'rcd-1f': '/pictures/electricComponents/rcd_1f.jpg',
      'rcd_1f': '/pictures/electricComponents/rcd_1f.jpg',
      'rcd-3f': '/pictures/electricComponents/rcd_3f.jpg',
      'rcd_3f': '/pictures/electricComponents/rcd_3f.jpg',
      // MCB fuse types
      'mcb_b6': '/pictures/electricComponents/mcb_b6.jpg',
      'mcb_b10': '/pictures/electricComponents/mcb_b10.jpg',
      'mcb_b13': '/pictures/electricComponents/mcb_b13.jpg',
      'mcb_b16': '/pictures/electricComponents/mcb_b16.jpg',
      'mcb_b20': '/pictures/electricComponents/mcb_b20.jpg',
      'mcb_b25': '/pictures/electricComponents/mcb_b25.jpg',
      'mcb_b32': '/pictures/electricComponents/mcb_b32.jpg',
      'mcb_b40': '/pictures/electricComponents/mcb_b40.jpg',
      'mcb_b50': '/pictures/electricComponents/mcb_b50.jpg',
      'mcb_b63': '/pictures/electricComponents/mcb_b63.jpg',
      'mcb_b80': '/pictures/electricComponents/mcb_b80.jpg',
      'mcb_b100': '/pictures/electricComponents/mcb_b100.jpg',
      'mcb_b125': '/pictures/electricComponents/mcb_b125.jpg',
    };

    // Try to find by ID first
    if (imageMap[component.id]) {
      return imageMap[component.id];
    }

    // Try to find by name (normalize by removing spaces and converting to lowercase)
    const normalizedId = component.id.replace(/-/g, '_').toLowerCase();
    if (imageMap[normalizedId]) {
      return imageMap[normalizedId];
    }

    // Try to match component name patterns
    const name = component.name?.toLowerCase() || '';
    
    // Check for circuit components (B10A, B16A, etc.) - case insensitive
    // Match patterns like "B10A", "b10a", "B16A", etc.
    const fuseMatch = name.match(/^b(\d+)a$/);
    if (fuseMatch) {
      const fuseType = fuseMatch[1];
      // Check if specific image exists, otherwise use mcb_b10.jpg as fallback
      // Currently only mcb_b10.jpg exists in the folder
      return '/pictures/electricComponents/mcb_b10.jpg';
    }
    
    // Also check if component ID matches MCB pattern (mcb_b10, mcb_b16, etc.)
    const mcbMatch = component.id.toLowerCase().match(/^mcb_b(\d+)$/);
    if (mcbMatch) {
      // Use mcb_b10.jpg as default since it's the only one available
      return '/pictures/electricComponents/mcb_b10.jpg';
    }
    
    // Check if component ID starts with "circuit-" and has fuseType
    if (component.id.startsWith('circuit-') && component.fuseType) {
      // Use mcb_b10.jpg as default for circuit components
      return '/pictures/electricComponents/mcb_b10.jpg';
    }
    
    // Infrastructure component patterns
    if (name.includes('rozłącznik izolacyjny') || name.includes('wyłącznik główny')) {
      return '/pictures/electricComponents/isolator.jpg';
    }
    if (name.includes('złączka pen') || name.includes('podziału pen')) {
      return '/pictures/electricComponents/pen_splitter.jpg';
    }
    if (name.includes('ogranicznik przepięć') || name.includes('spd')) {
      return '/pictures/electricComponents/surge_protection.jpg';
    }
    if (name.includes('blok rozdzielczy') || name.includes('rozdzielczy')) {
      return '/pictures/electricComponents/distribution_block.jpg';
    }
    if (name.includes('rcd') && (name.includes('1f') || name.includes('jednofazowy'))) {
      return '/pictures/electricComponents/rcd_1f.jpg';
    }
    if (name.includes('rcd') && (name.includes('3f') || name.includes('trójfazowy'))) {
      return '/pictures/electricComponents/rcd_3f.jpg';
    }

    return null;
  };

  const BoardCell = ({ 
    row, 
    col, 
    cell,
    isConnectedLeft = false,
    isConnectedRight = false,
    needsLeftMargin = false,
  }: { 
    row: number; 
    col: number; 
    cell: BoardComponent | null;
    isConnectedLeft?: boolean;
    isConnectedRight?: boolean;
    needsLeftMargin?: boolean;
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: `cell-${row}-${col}`,
    });

    const isStartOfComponent = cell && cell.position === col;
    const isEmpty = !cell;
    const isPartOfComponent = cell && cell.position !== undefined && col >= cell.position && col < cell.position + cell.modules;
    
    // Check if this component is being dragged
    const isComponentDragging = cell && activeId === `component-${cell.id}`;

    // Make cell draggable if it's the start of a component
    // Always call useSortable hook (React hooks rule), but only use it if it's the start of a component
    const sortableId = isStartOfComponent && cell ? `component-${cell.id}` : `non-draggable-${row}-${col}`;
    const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useSortable({
      id: sortableId,
      disabled: !isStartOfComponent || !cell,
    });

    const style = transform ? {
      transform: CSS.Transform.toString(transform),
    } : {};

    const cellRef = (node: HTMLDivElement | null) => {
      setNodeRef(node);
      if (isStartOfComponent && cell) {
        setDragRef(node);
      }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      if (cell && isPartOfComponent) {
        setContextMenu({
          visible: true,
          position: { top: e.clientY, left: e.clientX },
          component: cell,
        });
      }
    };

    // Determine border classes based on connections
    const getBorderClasses = () => {
      if (isEmpty) {
        return 'border-2 border-dashed border-gray-300';
      }
      
      const baseBorder = 'border-2';
      let borderClasses = baseBorder;
      
      // Remove left border if connected to previous cell of same component
      if (isConnectedLeft) {
        borderClasses += ' border-l-0';
      }
      
      // Remove right border if connected to next cell of same component
      if (isConnectedRight) {
        borderClasses += ' border-r-0';
      }
      
      // Add border color
      if (!isEmpty && cell) {
        // Check if component name starts with 'B' (circuit components like B10A, B16A)
        const isCircuitComponent = cell.name && cell.name.startsWith('B') && cell.name.match(/^B\d+A/);
        
        if (isCircuitComponent) {
          // Dark gray for B components (B10A, B16A, etc.)
          borderClasses += ' border-gray-600';
        } else if (cell.type === 'infrastructure') {
          if (cell.id === 'main-switch' || cell.name === 'Wyłącznik główny') {
            borderClasses += ' border-red-300';
          } else if (cell.id === 'pen-connector' || cell.name === 'Złączka PEN' || cell.name === 'Złączka podziału PEN') {
            borderClasses += ' border-yellow-400';
          } else if (cell.id === 'surge-protection' || cell.name === 'Ogranicznik przepięć' || cell.name === 'Zabezpieczenie przepięciowe') {
            borderClasses += ' border-orange-400';
          } else if (cell.id === 'distribution-block' || cell.name === 'Blok rozdzielczy') {
            borderClasses += ' border-blue-600';
          } else {
            borderClasses += ' border-green-300';
          }
        } else {
          borderClasses += ' border-gray-600';
        }
      }
      
      return borderClasses;
    };
    
    // Determine rounded corners
    const getRoundedClasses = () => {
      if (isEmpty) return 'rounded';
      
      let rounded = '';
      if (isStartOfComponent && !isConnectedRight) {
        // Start of component, not connected right - round left corners
        rounded = 'rounded-l';
      } else if (!isStartOfComponent && isConnectedLeft && !isConnectedRight) {
        // Middle of component - no rounding
        rounded = '';
      } else if (!isStartOfComponent && isConnectedLeft && isConnectedRight) {
        // Middle of component - no rounding
        rounded = '';
      } else if (cell && col === (cell.position || 0) + (cell.modules || 1) - 1 && !isConnectedLeft) {
        // End of component, not connected left - round right corners
        rounded = 'rounded-r';
      } else if (!isConnectedLeft && !isConnectedRight) {
        // Single cell component
        rounded = 'rounded';
      }
      
      return rounded;
    };
    
    // Add margin between different components
    const getMarginClasses = () => {
      return needsLeftMargin ? 'ml-1' : '';
    };

    return (
      <div
        ref={cellRef}
        style={style}
        {...(isStartOfComponent && cell ? { ...attributes, ...listeners } : {})}
        onContextMenu={handleContextMenu}
        className={`flex-1 aspect-[1/2] min-h-[160px] ${getBorderClasses()} ${getRoundedClasses()} ${getMarginClasses()} relative z-20 ${
          isEmpty
            ? 'bg-gray-50/80 backdrop-blur-sm'
            : (() => {
                // Check if component name starts with 'B' (circuit components like B10A, B16A)
                const isCircuitComponent = cell.name && cell.name.startsWith('B') && cell.name.match(/^B\d+A/);
                
                if (isCircuitComponent) {
                  // Dark gray for B components (B10A, B16A, etc.)
                  return 'bg-gray-700 text-white';
                } else if (cell.type === 'infrastructure') {
                  if (cell.id === 'main-switch' || cell.name === 'Wyłącznik główny') {
                    return 'bg-red-100';
                  } else if (cell.id === 'pen-connector' || cell.name === 'Złączka PEN' || cell.name === 'Złączka podziału PEN') {
                    return 'bg-yellow-100';
                  } else if (cell.id === 'surge-protection' || cell.name === 'Ogranicznik przepięć' || cell.name === 'Zabezpieczenie przepięciowe') {
                    return 'bg-orange-100';
                  } else if (cell.id === 'distribution-block' || cell.name === 'Blok rozdzielczy') {
                    return 'bg-blue-700 text-white';
                  } else {
                    return 'bg-green-100';
                  }
                } else {
                  return 'bg-gray-700 text-white';
                }
              })()
        } flex items-center justify-center text-xs font-medium transition-colors ${
          isEmpty 
            ? `cursor-pointer hover:bg-gray-100 ${isOver ? 'bg-blue-100 border-blue-400' : ''}` 
            : isStartOfComponent 
            ? 'cursor-grab active:cursor-grabbing hover:opacity-80' 
            : 'cursor-pointer'
        } ${isDragging || isComponentDragging ? 'opacity-50' : ''}`}
      >
        {isPartOfComponent && cell && (
          <div className="flex flex-col h-full w-full px-1">
            {/* Top half - Title and info */}
            <div className="flex-1 flex flex-col justify-start items-center pt-1">
              <div className={`font-bold text-[10px] leading-tight ${
                isStartOfComponent 
                  ? (cell.name && cell.name.startsWith('B') && cell.name.match(/^B\d+A/))
                    ? 'text-white'
                    : (cell.id === 'distribution-block' || cell.name === 'Blok rozdzielczy')
                    ? 'text-white'
                    : 'text-gray-900'
                  : (cell.name && cell.name.startsWith('B') && cell.name.match(/^B\d+A/))
                  ? 'text-gray-300'
                  : 'text-gray-500'
              }`}>
                {cell.type === 'circuit' 
                  ? cell.name // Already formatted as B10, B16, etc.
                  : cell.name === 'Wyłącznik główny' 
                  ? 'WYŁ. GŁ.'
                  : cell.name === 'Złączka PEN'
                  ? 'PEN'
                  : cell.name === 'Ogranicznik przepięć'
                  ? 'OGR.PRZEP.'
                  : cell.name === 'Blok rozdzielczy'
                  ? 'BLOK ROZD.'
                  : cell.name.toUpperCase()}
              </div>
              {cell.type === 'circuit' && cell.roomName && isStartOfComponent && (
                <div className={`text-[9px] opacity-75 mt-0.5 leading-tight ${
                  cell.name && cell.name.startsWith('B') && cell.name.match(/^B\d+A/) 
                    ? 'text-gray-200' 
                    : 'text-gray-900'
                }`}>{cell.roomName}</div>
              )}
              {cell.type !== 'circuit' && cell.roomName && isStartOfComponent && (
                <div className={`text-[9px] opacity-75 mt-0.5 ${
                  cell.name && cell.name.startsWith('B') && cell.name.match(/^B\d+A/) 
                    ? 'text-gray-200' 
                    : 'text-gray-900'
                }`}>{cell.roomName}</div>
              )}
              {cell.modules > 1 && isStartOfComponent && cell.type !== 'circuit' && (
                <div className="text-[9px] opacity-75 text-gray-900">({cell.modules} mod)</div>
              )}
            </div>
            
            {/* Bottom half - Image (only show on start of component) */}
            {isStartOfComponent && (
              <div className="flex-1 w-full relative mt-1 pb-1">
                {(() => {
                  const cellImage = getComponentImage(cell);
                  return cellImage ? (
                    <Image
                      src={cellImage}
                      alt={cell.name}
                      fill
                      className="object-contain p-0.5"
                      onError={(e) => {
                        // Try .jpeg if .jpg fails
                        const img = e.target as HTMLImageElement;
                        const currentSrc = img.src;
                        if (currentSrc.endsWith('.jpg')) {
                          const jpegSrc = currentSrc.replace('.jpg', '.jpeg');
                          img.src = jpegSrc;
                        } else {
                          // Hide image if both fail
                          img.style.display = 'none';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-[8px]">
                      Brak obrazu
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Helper component for draggable component cards
  const ComponentCard = ({ component }: { component: BoardComponent }) => {
    // Check if component is actually placed on board (has row and position set)
    const isPlaced = component.row !== undefined && component.position !== undefined;
    
    // For infrastructure components with quantity, show quantity instead of count/required
    const hasQuantity = component.quantity !== undefined;
    const quantity = component.quantity || 0;
    
    // Component is disabled only if:
    // 1. It's actually placed on the board (for components without quantity), OR
    // 2. Quantity is 0 (for components with quantity)
    // Components showing "0/1" should NOT be disabled - they're available to drag
    const isDisabled = (hasQuantity ? quantity === 0 : isPlaced);
    
    // Calculate total modules (modules × quantity for components with quantity, or just modules)
    const totalModules = hasQuantity ? component.modules * quantity : component.modules;

    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
      id: `component-${component.id}`,
      disabled: isDisabled,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      opacity: isDragging ? 0.5 : (isDisabled ? 0.5 : 1),
    };

    // Determine background and border colors based on component type
    const getComponentColors = () => {
      // If quantity is 0 (all used), show light gray
      if (hasQuantity && quantity === 0) {
        return 'border-gray-300 bg-gray-200';
      }
      
      if (isDisabled && !hasQuantity) {
        return 'border-gray-300 bg-gray-100';
      }
      
      // Check if component name starts with 'B' (circuit components like B10A, B16A)
      const isCircuitComponent = component.name && component.name.startsWith('B') && component.name.match(/^B\d+A/);
      
      if (isCircuitComponent) {
        return 'border-gray-600 bg-gray-700 text-white';
      } else if (component.type === 'infrastructure') {
        if (component.id === 'main-switch' || component.name === 'Wyłącznik główny') {
          return 'border-red-300 bg-red-100';
        } else if (component.id === 'pen-connector' || component.name === 'Złączka PEN' || component.name === 'Złączka podziału PEN') {
          return 'border-yellow-400 bg-yellow-100';
        } else if (component.id === 'surge-protection' || component.name === 'Ogranicznik przepięć' || component.name === 'Zabezpieczenie przepięciowe') {
          return 'border-orange-400 bg-orange-100';
        } else if (component.id === 'distribution-block' || component.name === 'Blok rozdzielczy') {
          return 'border-blue-600 bg-blue-700 text-white';
        } else {
          return 'border-green-300 bg-green-100';
        }
      } else {
        return 'border-gray-600 bg-gray-700 text-white';
      }
    };

    const colorClasses = getComponentColors();
    const isDarkBackground = colorClasses.includes('bg-gray-700') || colorClasses.includes('bg-blue-700');
    const isUsedUp = hasQuantity && quantity === 0;
    const textColorClass = isUsedUp ? 'text-gray-500' : (isDarkBackground ? 'text-white' : 'text-gray-900');
    const textSecondaryClass = isUsedUp ? 'text-gray-400' : (isDarkBackground ? 'text-gray-200' : 'text-gray-600');
    const textTertiaryClass = isUsedUp ? 'text-gray-400' : (isDarkBackground ? 'text-gray-300' : 'text-gray-500');

    const componentImage = getComponentImage(component);

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`flex flex-col border-2 rounded-lg ${colorClasses} ${
          isDisabled
            ? 'cursor-default opacity-60'
            : 'cursor-move hover:shadow-md'
        } transition-shadow`}
      >
        {/* Top part - Content */}
        <div className="p-4 flex-1 flex flex-col">
          <div className={`text-sm font-medium mb-1 ${isDisabled ? textTertiaryClass : textColorClass}`}>
            {component.name}
          </div>
          <div className={`text-xs mb-1 ${isDisabled ? textTertiaryClass : textSecondaryClass}`}>
            {totalModules} mod {hasQuantity && quantity > 1 ? `(${component.modules} mod × ${quantity})` : ''}
          </div>
          {component.roomName && (
            <div className={`text-xs mb-2 ${isDisabled ? textTertiaryClass : textSecondaryClass} line-clamp-2`}>
              {component.roomName}
            </div>
          )}
          {hasQuantity ? (
            <div className={`text-xs font-medium ${isUsedUp ? textTertiaryClass : (isDarkBackground ? 'text-gray-200' : 'text-orange-700')}`}>
              {quantity} {quantity === 1 ? 'dostępny' : 'dostępne'}
            </div>
          ) : (
            <div className={`text-xs font-medium ${isDisabled ? textTertiaryClass : (isDarkBackground ? 'text-gray-200' : 'text-orange-700')}`}>
              {isPlaced ? '1/1' : '0/1'}
            </div>
          )}
        </div>

        {/* Bottom part - Image */}
        <div className="h-20 w-full relative bg-white rounded-b-lg overflow-hidden border-t border-gray-300">
          {componentImage ? (
            <Image
              src={componentImage}
              alt={component.name}
              fill
              className="object-contain p-1"
              onError={(e) => {
                // Try .jpeg if .jpg fails
                const img = e.target as HTMLImageElement;
                const currentSrc = img.src;
                if (currentSrc.endsWith('.jpg')) {
                  const jpegSrc = currentSrc.replace('.jpg', '.jpeg');
                  img.src = jpegSrc;
                } else {
                  // Show placeholder if image fails to load
                  const parent = img.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">Brak obrazu</div>';
                  }
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              Brak obrazu
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <Link href={`/offer/summary?id=${offerId}`} className="text-gray-600 hover:text-gray-900 flex items-center">
              <span className="text-xl mr-2">←</span>
              <span>Powrót do generatora</span>
            </Link>
            <div className="flex flex-col items-end">
              <button
                onClick={handleSaveOffer}
                disabled={isSaving || !offerId}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Zapisywanie...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Zapisz ofertę</span>
                  </>
                )}
              </button>
              {saveMessage && (
                <p className={`mt-2 text-sm ${saveMessage.includes('Błąd') ? 'text-red-600' : 'text-green-600'}`}>
                  {saveMessage}
                </p>
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wizualizacja Rozdzielnicy</h1>
          <p className="text-gray-600">Przeciągnij i upuść komponenty na rozdzielnicę</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
              activeTab === 'editor'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Edytor rozdzielnicy
          </button>
          <button
            onClick={() => setActiveTab('labels')}
            className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
              activeTab === 'labels'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Generator etykiet
          </button>
          <button
            onClick={() => setActiveTab('description')}
            className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
              activeTab === 'description'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Opis rozdzielnicy
          </button>
          <button
            onClick={() => setActiveTab('components')}
            className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
              activeTab === 'components'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Komponenty
          </button>
        </div>

        {activeTab === 'editor' && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <>
              {/* Board Configuration */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center space-x-4 mb-4 relative">
                  <label className="text-sm font-medium text-gray-700">Wielkość:</label>
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white min-w-[200px] text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span>{getCurrentSizeLabel()}</span>
                      <svg
                        className={`w-4 h-4 ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setIsDropdownOpen(false)}
                        ></div>
                        <div className="absolute z-20 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg min-w-[250px] max-h-[400px] overflow-y-auto">
                          {boardSizeOptions.map((category, categoryIndex) => (
                            <div key={categoryIndex}>
                              <div className="px-4 py-2 font-semibold text-gray-900 bg-gray-50 sticky top-0">
                                {category.category}
                              </div>
                              {category.options.map((option) => (
                                <button
                                  key={option.size}
                                  type="button"
                                  onClick={() => {
                                    setBoardSize(option.size);
                                    calculateBoardDimensions(option.size);
                                    setIsDropdownOpen(false);
                                  }}
                                  className={`w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-blue-50 ${
                                    boardSize === option.size
                                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                                      : ''
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.totalModules}</p>
                    <p className="text-sm text-gray-600">MODUŁÓW</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.rows}</p>
                    <p className="text-sm text-gray-600">RZĘDÓW</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.occupied}</p>
                    <p className="text-sm text-gray-600">ZAJĘTYCH</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.free}</p>
                    <p className="text-sm text-gray-600">WOLNYCH</p>
                  </div>
                </div>

                {/* Distribution Board Grid */}
                <div className="border-2 border-gray-400 rounded-lg p-3 bg-gray-50 shadow-inner">
                  {boardLayout.map((row, rowIndex) => (
                    <div key={rowIndex} className="mb-3 last:mb-0">
                      {/* Row container with DIN rail representation */}
                      <div className="flex items-center bg-white rounded border border-gray-300 shadow-sm p-2">
                        {/* Row number */}
                        <div className="w-8 text-sm font-medium text-gray-600 mr-3 flex-shrink-0">
                          {rowIndex + 1}
                        </div>
                        
                        {/* DIN Rail (listwa TH35) visual representation */}
                        <div className="flex-1 relative min-h-[160px]">
                          {/* DIN Rail line - horizontal metallic line (listwa TH35) */}
                          <div 
                            className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 z-0"
                            style={{
                              height: '3px',
                              background: 'linear-gradient(to right, #e2e8f0 0%, #cbd5e1 20%, #94a3b8 50%, #cbd5e1 80%, #e2e8f0 100%)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.5)',
                              borderTop: '1px solid rgba(148, 163, 184, 0.3)',
                              borderBottom: '1px solid rgba(148, 163, 184, 0.5)'
                            }}
                          />
                          
                          {/* Components row */}
                          <div className="relative flex z-10">
                            {row.map((cell, cellIndex) => {
                              // Check if this cell is connected to previous cell (same component)
                              const isConnectedLeft: boolean = !!(cell && cell.position !== undefined && 
                                cellIndex > cell.position);
                              
                              // Check if this cell is connected to next cell (same component)
                              const isConnectedRight: boolean = !!(cell && cell.position !== undefined && 
                                cellIndex < cell.position + cell.modules - 1);
                              
                              // Check if there's a gap needed before this cell
                              const prevCell = cellIndex > 0 ? row[cellIndex - 1] : null;
                              const isEmpty = !cell;
                              const needsLeftMargin = !isConnectedLeft && (
                                isEmpty || 
                                !prevCell || 
                                (cell && prevCell && cell.id !== prevCell.id)
                              );
                              
                              return (
                                <BoardCell
                                  key={cellIndex}
                                  row={rowIndex}
                                  col={cellIndex}
                                  cell={cell}
                                  isConnectedLeft={isConnectedLeft}
                                  isConnectedRight={isConnectedRight}
                                  needsLeftMargin={needsLeftMargin}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <DragOverlay>
                  {activeId ? (
                    (() => {
                      const componentId = activeId.replace('component-', '');
                      const component = components.find(c => c.id === componentId);
                      if (!component) return null;
                      return (
                        <div className="p-4 border-2 rounded-lg border-orange-300 bg-orange-50 opacity-90">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {component.name}
                          </div>
                          <div className="text-xs text-gray-600 mb-2">
                            {component.modules} mod
                          </div>
                        </div>
                      );
                    })()
                  ) : null}
                </DragOverlay>
              </div>

              {/* Infrastructure Components */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  KOMPONENTY INFRASTRUKTURALNE
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Przeciągnij komponenty na rozdzielnicę powyżej
                </p>

                {/* Legend */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">Użyte</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Brakuje</span>
                  </div>
                </div>

                {/* Component Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {components
                    .filter(c => 
                      (c.type === 'infrastructure' || c.type === 'circuit') && 
                      c.row === undefined && 
                      c.position === undefined
                    )
                    .sort((a, b) => {
                      // Sort alphabetically by name (A to Z)
                      const nameA = a.name.toLowerCase();
                      const nameB = b.name.toLowerCase();
                      if (nameA < nameB) return -1;
                      if (nameA > nameB) return 1;
                      // If names are equal, sort by roomName if available
                      if (a.roomName && b.roomName) {
                        const roomA = a.roomName.toLowerCase();
                        const roomB = b.roomName.toLowerCase();
                        if (roomA < roomB) return -1;
                        if (roomA > roomB) return 1;
                      }
                      return 0;
                    })
                    .map((component) => (
                      <ComponentCard key={component.id} component={component} />
                    ))}
                  {/* Additional/Dodatkowy component */}
                  <div className="p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      Dodatkowy
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      1 mod
                    </div>
                    <div className="text-xs font-medium text-gray-500">
                      ∞
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div className="mt-6 p-3 bg-gray-100 rounded text-sm text-gray-600">
                  Bezpieczniki są automatycznie generowane z obwodów w generatorze ofert.
                </div>
              </div>
            </>
          </DndContext>
        )}

        {activeTab === 'labels' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Generator etykiet</h2>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 print:hidden"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Drukuj etykiety</span>
              </button>
            </div>

            {/* Label Grid */}
            <div className="border-2 border-gray-900 rounded-lg p-4 bg-white print:border-2 print:border-black">
              {boardLayout.map((row, rowIndex) => {
                // Group consecutive cells that belong to the same component
                const mergedCells: Array<{
                  component: BoardComponent | null;
                  span: number;
                }> = [];
                
                let i = 0;
                while (i < row.length) {
                  const cell = row[i];
                  const isStartOfComponent = cell && cell.position === i;
                  
                  if (isStartOfComponent && cell) {
                    // This is the start of a component - merge all its modules
                    mergedCells.push({
                      component: cell,
                      span: cell.modules,
                    });
                    i += cell.modules; // Skip the rest of the component's modules
                  } else {
                    // Empty cell - count consecutive empty cells
                    let emptySpan = 0;
                    while (i < row.length && !row[i]) {
                      emptySpan++;
                      i++;
                    }
                    if (emptySpan > 0) {
                      mergedCells.push({
                        component: null,
                        span: emptySpan,
                      });
                    }
                  }
                }
                
                return (
                  <div key={rowIndex} className="flex items-center mb-1 print:mb-0">
                    <div className="w-8 text-sm font-medium text-gray-600 mr-2 print:text-xs">
                      {rowIndex + 1}
                    </div>
                    <div className="flex-1 flex gap-1 print:gap-0">
                      {mergedCells.map((merged, idx) => {
                        if (!merged.component) {
                          // Empty cell(s)
                          return (
                            <div
                              key={`empty-${idx}`}
                              className="h-16 border border-gray-300 rounded bg-gray-50 print:h-20 print:border-black"
                              style={{ flex: merged.span }}
                            />
                          );
                        }
                        
                        // Component cell - merge all modules
                        const cell = merged.component;
                        let labelText = '';
                        let subText = '';
                        let circuitNumber = '';

                        if (cell.type === 'circuit') {
                          circuitNumber = cell.circuitNumber?.toString() || '';
                          labelText = cell.name || '';
                          subText = cell.roomName || '';
                        } else {
                          // Infrastructure components
                          labelText = cell.name === 'Wyłącznik główny'
                            ? 'WYŁ. GŁ.'
                            : cell.name === 'Złączka PEN'
                            ? 'PEN'
                            : cell.name === 'Ogranicznik przepięć'
                            ? 'OGR.PRZEP.'
                            : cell.name === 'Blok rozdzielczy'
                            ? 'BLOK ROZD.'
                            : cell.name.toUpperCase();
                        }

                        return (
                          <div
                            key={`component-${idx}`}
                            className="h-16 border-2 border-gray-900 rounded flex flex-col items-center justify-center p-1 print:h-20 print:border-black"
                            style={{
                              flex: merged.span,
                              backgroundColor: cell.type === 'infrastructure'
                                ? cell.id === 'main-switch'
                                  ? '#fee2e2'
                                  : cell.id === 'pen-connector'
                                  ? '#fed7aa'
                                  : cell.id === 'surge-protection'
                                  ? '#e9d5ff'
                                  : cell.id === 'distribution-block'
                                  ? '#cffafe'
                                  : '#dcfce7'
                                : '#e9d5ff'
                            }}
                          >
                            {circuitNumber && (
                              <div className="text-xs font-bold text-gray-900 print:text-sm">
                                {circuitNumber}
                              </div>
                            )}
                            <div className="text-[10px] font-bold text-gray-900 text-center leading-tight print:text-xs">
                              {labelText}
                            </div>
                            {subText && (
                              <div className="text-[9px] text-gray-700 text-center mt-0.5 print:text-xs">
                                {subText}
                              </div>
                            )}
                            {merged.span > 1 && (
                              <div className="text-[8px] text-gray-500 mt-0.5 print:text-xs">
                                ({merged.span} mod)
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'description' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Opis rozdzielnicy elektrycznej</h2>
            
            {/* Board Details */}
            <div className="mb-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">Wielkość rozdzielnicy:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {boardSize} modułów ({boardRows} x {modulesPerRow})
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Typ:</span>
                  <span className="ml-2 font-semibold text-gray-900">natynkowa</span>
                </div>
                <div>
                  <span className="text-gray-600">Wymiary (szer. x wys.):</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {Math.round(modulesPerRow * 17.8 * 10) / 10} x {Math.round(boardRows * 200 / 3)} mm
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Zajęte moduły:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {stats.occupied}/{boardSize}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Wolne moduły:</span>
                  <span className="ml-2 font-semibold text-green-600">
                    {stats.free}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Liczba obwodów:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {components.filter(c => c.type === 'circuit').length}
                  </span>
                </div>
              </div>
            </div>

            {/* List of Circuits */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Lista obwodów</h3>
              <div className="space-y-3">
                {offer?.rooms?.flatMap((room: any) => 
                  (room.circuits || []).map((circuit: any) => {
                    // Circuits are stored as objects with properties
                    const circuitNumber = typeof circuit === 'number' ? circuit : circuit.circuitNumber;
                    const fuseType = circuit.fuseType || '16A';
                    const isThreePhase = circuit.isThreePhase || false;
                    const deviceName = circuit.deviceName || '';
                    
                    return (
                      <div
                        key={`${room.id}-${circuitNumber}`}
                        className="bg-purple-50 rounded-lg p-4 border border-purple-200"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {circuitNumber}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-1">
                              {room.name}
                            </div>
                            <div className="text-sm text-gray-700 mb-2">
                              {deviceName || 'Brak opisu'}
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-gray-600">
                                <span className="font-medium">Bezpiecznik:</span> B{fuseType}
                              </span>
                              <span className="text-gray-600">
                                <span className="font-medium">Faza:</span> {isThreePhase ? '3F' : '1F'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Generate PDF Button */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  // TODO: Implement PDF generation
                  window.print();
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>Generuj PDF</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'components' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Komponenty rozdzielnicy</h2>
            
            {/* Infrastructure Components */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Komponenty infrastrukturalne:</h3>
              <div className="space-y-2">
                {[
                  { id: 'main-switch', name: 'Wyłącznik główny', modules: 3, color: 'bg-red-500', required: 1 },
                  { id: 'pen-connector', name: 'Złączka PEN', modules: 2, color: 'bg-orange-500', required: 1 },
                  { id: 'surge-protection', name: 'Ogranicznik przepięć', modules: 4, color: 'bg-purple-500', required: 1 },
                  { id: 'distribution-block', name: 'Blok rozdzielczy', modules: 4, color: 'bg-cyan-500', required: 1 },
                  { id: 'rcd-1f', name: 'RCD 1-fazowy', modules: 2, color: 'bg-green-500', required: 1 },
                  { id: 'rcd-3f', name: 'RCD 3-fazowy', modules: 4, color: 'bg-green-500', required: 0 },
                  { id: 'additional', name: 'Dodatkowy', modules: 1, color: 'bg-gray-500', required: 0 },
                ].map((infra) => {
                  const placedCount = infra.id === 'additional' 
                    ? 0 // Additional components are not tracked
                    : components.filter(c => 
                        c.type === 'infrastructure' && 
                        c.id === infra.id && 
                        c.row !== undefined && 
                        c.position !== undefined
                      ).length;
                  const required = infra.id === 'rcd-3f' 
                    ? (offer?.rooms?.some((room: any) => 
                        room.circuits?.some((circuit: any) => circuit.isThreePhase)
                      ) ? 1 : 0)
                    : infra.required;
                  
                  return (
                    <div
                      key={infra.id}
                      className="bg-green-50 rounded-lg p-3 border border-green-200 flex items-center space-x-3"
                    >
                      <div className={`w-4 h-4 ${infra.color} rounded`}></div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{infra.name}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {placedCount}/{required} ({infra.modules} mod)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 1-Phase Fuses */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bezpieczniki 1-fazowe:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['10A', '16A', '20A', '25A'].map((fuseType) => {
                  const count = offer?.rooms?.reduce((total: number, room: any) => {
                    return total + (room.circuits || []).filter((circuit: any) => {
                      const circuitFuseType = typeof circuit === 'object' ? circuit.fuseType : '16A';
                      const isThreePhase = typeof circuit === 'object' ? circuit.isThreePhase : false;
                      return circuitFuseType === fuseType && !isThreePhase;
                    }).length;
                  }, 0) || 0;
                  
                  return (
                    <div
                      key={fuseType}
                      className={`rounded-lg p-3 border ${
                        count > 0 
                          ? 'bg-purple-50 border-purple-200' 
                          : 'bg-gray-50 border-gray-200'
                      } flex items-center justify-between`}
                    >
                      <span className="font-medium text-gray-900">B{fuseType}</span>
                      <span className="text-sm text-gray-600">{count} szt.</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3-Phase Fuses */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bezpieczniki 3-fazowe:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['10A', '16A', '20A', '25A'].map((fuseType) => {
                  const count = offer?.rooms?.reduce((total: number, room: any) => {
                    return total + (room.circuits || []).filter((circuit: any) => {
                      const circuitFuseType = typeof circuit === 'object' ? circuit.fuseType : '16A';
                      const isThreePhase = typeof circuit === 'object' ? circuit.isThreePhase : false;
                      return circuitFuseType === fuseType && isThreePhase;
                    }).length;
                  }, 0) || 0;
                  
                  return (
                    <div
                      key={`${fuseType}-3F`}
                      className={`rounded-lg p-3 border ${
                        count > 0 
                          ? 'bg-purple-50 border-purple-200' 
                          : 'bg-gray-50 border-gray-200'
                      } flex items-center justify-between`}
                    >
                      <span className="font-medium text-gray-900">B{fuseType} 3F</span>
                      <span className="text-sm text-gray-600">{count} szt.</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="mb-8">
              <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    Łącznie modułów na rozdzielnicy:
                  </span>
                  <span className="font-bold text-gray-900 text-lg">
                    {stats.occupied}/{boardSize}
                  </span>
                </div>
              </div>
            </div>

            {/* Generate PDF Button */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  // TODO: Implement PDF generation
                  window.print();
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Generuj PDF</span>
              </button>
            </div>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu.visible && contextMenu.component && (
          <MenuContextRightClick
            options={[
              {
                label: `Usuń ${contextMenu.component.name}`,
                onClick: () => handleRemoveComponent(contextMenu.component!),
                action: true,
              },
            ]}
            position={contextMenu.position}
            onClose={() => setContextMenu({ visible: false, position: { top: 0, left: 0 }, component: null })}
          />
        )}
      </div>
    </div>
  );
}

export default function DistributionBoardVisualization() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Ładowanie...</div>
      </div>
    }>
      <DistributionBoardVisualizationContent />
    </Suspense>
  );
}

