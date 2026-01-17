"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import GlobalPopup from "@/components/GlobalPopup";
import { SearchComponent } from "@/components/SearchComponent";
import api from "@/lib/api";
import { getButtonClass } from "@/lib/theme";

interface Circuit {
  id: number;
  circuitNumber: number;
  description: string;
  socketSwitchCount: number; // Ilość gniazd lub włączników
  zone: "Parter" | "Piętro";
  voltage: number;
  cable: string;
  length: number; // Długość przewodu w metrach
  power: number;
  fuseType: string; // Typ bezpiecznika: 10A, 16A, 20A, 25A, 32A, 40A, 50A, 63A, etc.
  phase: "L1" | "L2" | "L3" | "3Φ";
  type: "1φ" | "3φ";
}

interface CircuitTemplate {
  description: string;
  zone: "Parter" | "Piętro";
  voltage: number;
  cable: string;
  power: number;
  phase: "L1" | "L2" | "L3" | "3Φ";
  type: "1φ" | "3φ";
}

interface RequiredComponent {
  id: string;
  name: string;
  fields: number; // Liczba pól zajmowanych przez komponent
  quantity: number;
  description?: string; // Opis elementu wyświetlany w tooltipie
  price?: number; // Cena przybliżona w PLN
  image?: string; // Ścieżka do obrazu komponentu
  category?: string; // Kategoria główna
  subcategory?: string; // Podkategoria
}

interface ComponentCategory {
  id: string;
  name: string;
  subcategories?: ComponentSubcategory[];
  components?: string[]; // IDs of components directly in this category
}

interface ComponentSubcategory {
  id: string;
  name: string;
  components: string[]; // IDs of components in this subcategory
}

// Helper function to get human-readable category names
const getCategoryDisplayName = (categoryId: string): string => {
  const categoryNames: { [key: string]: string } = {
    basic_protection: "Zabezpieczenia podstawowe",
    overcurrent_protection: "Zabezpieczenia nadprądowe",
    surge_protection_detailed: "Zabezpieczenia przepięciowe",
    control_automation: "Sterowanie i automatyka",
    measurement_control: "Pomiary i kontrola",
    emergency_special: "Zasilanie awaryjne i specjalne",
    pv_ev: "PV, EV i nowoczesne instalacje",
    organization: "Organizacja i estetyka",
    connection_elements: "Elementy łączeniowe i rozdział",
    additional_protection: "Ochrona i bezpieczeństwo - dodatkowe",
    additional_automation: "Automatyka i sterowanie - dodatkowe",
    auxiliary_power: "Zasilanie pomocnicze - dodatkowe",
    required: "Rzeczy obowiązkowe",
    cables: "Kable instalacyjne",
    other: "Inne",
  };

  return categoryNames[categoryId] || categoryId;
};

// Build component categories dynamically from API data
const buildComponentCategories = (
  components: Omit<RequiredComponent, "quantity">[]
): ComponentCategory[] => {
  const categories: { [key: string]: ComponentCategory } = {};

  console.log('[DEBUG] Building categories from', components.length, 'components');

  components.forEach((component) => {
    const category = component.category || "other";
    console.log('[DEBUG] Component', component.id, '-> category:', category);

    if (!categories[category]) {
      categories[category] = {
        id: category,
        name: getCategoryDisplayName(category),
        components: [],
      };
    }

    categories[category].components!.push(component.id);
  });

  console.log('[DEBUG] Final categories:', Object.keys(categories));

  return Object.values(categories);
};

// Fuse types for single phase (1φ) - now using API data
// const FUSE_TYPES_1PHASE = [
//   "6A",
//   "10A",
//   "13A",
//   "16A",
//   "20A",
//   "25A",
//   "32A",
//   "40A",
//   "50A",
//   "63A",
// ];

// Fuse types for three phase (3φ) - now using API data
// const FUSE_TYPES_3PHASE = [
//   "16A",
//   "20A",
//   "25A",
//   "32A",
//   "40A",
//   "50A",
//   "63A",
//   "80A",
//   "100A",
//   "125A",
// ];

const CIRCUIT_TEMPLATES: CircuitTemplate[] = [
  {
    description: "Gniazda kuchnia piekarnik",
    zone: "Parter",
    voltage: 230,
    cable: "YDYpżo 3x2,5",
    power: 2,
    phase: "L1",
    type: "1φ",
  },
  {
    description: "Gniazda kuchnia zmywarka",
    zone: "Parter",
    voltage: 230,
    cable: "YDYpżo 3x2,5",
    power: 2,
    phase: "L1",
    type: "1φ",
  },
  {
    description: "Gniazda kuchnia lodówka",
    zone: "Parter",
    voltage: 230,
    cable: "YDYpżo 3x2,5",
    power: 2,
    phase: "L2",
    type: "1φ",
  },
  {
    description: "Zasilenie płyta indukcyjna",
    zone: "Parter",
    voltage: 230,
    cable: "YDYpżo 5x4",
    power: 7.5,
    phase: "3Φ",
    type: "3φ",
  },
  {
    description: "Gniazda garaż",
    zone: "Parter",
    voltage: 230,
    cable: "YDYpżo 3x2,5",
    power: 2,
    phase: "L3",
    type: "1φ",
  },
  {
    description: "Gniazda kotłownia",
    zone: "Parter",
    voltage: 230,
    cable: "YDYpżo 3x2,5",
    power: 2,
    phase: "L1",
    type: "1φ",
  },
  {
    description: "Kotłownia – bojler",
    zone: "Parter",
    voltage: 230,
    cable: "YDYpżo 3x2,5",
    power: 2,
    phase: "L2",
    type: "1φ",
  },
  {
    description: "Oświetlenie zewnętrzne",
    zone: "Parter",
    voltage: 230,
    cable: "YDYpżo 3x1,5",
    power: 0.5,
    phase: "L3",
    type: "1φ",
  },
  {
    description: "Brama wjazdowa",
    zone: "Parter",
    voltage: 230,
    cable: "YDYpżo 3x2,5",
    power: 1,
    phase: "L1",
    type: "1φ",
  },

  {
    description: "Gniazda hol / strych",
    zone: "Piętro",
    voltage: 230,
    cable: "YDYpżo 3x2,5",
    power: 2,
    phase: "L1",
    type: "1φ",
  },
  {
    description: "Gniazda strych",
    zone: "Piętro",
    voltage: 230,
    cable: "YDYpżo 3x2,5",
    power: 2,
    phase: "L2",
    type: "1φ",
  },
  {
    description: "Rekuperator",
    zone: "Piętro",
    voltage: 230,
    cable: "YDYpżo 3x2,5",
    power: 1.5,
    phase: "L3",
    type: "1φ",
  },
  {
    description: "Zasilanie alarm",
    zone: "Piętro",
    voltage: 230,
    cable: "YDYpżo 3x1,5",
    power: 0.5,
    phase: "L1",
    type: "1φ",
  },
  {
    description: "Zasilanie tablica multimedialna",
    zone: "Piętro",
    voltage: 230,
    cable: "YDYpżo 3x2,5",
    power: 1,
    phase: "L2",
    type: "1φ",
  },
  {
    description: "Gniazdo 400V",
    zone: "Parter",
    voltage: 400,
    cable: "YDYpżo 5x4",
    power: 5,
    phase: "3Φ",
    type: "3φ",
  },
  {
    description: "Rolety parter",
    zone: "Parter",
    voltage: 230,
    cable: "YDYpżo 3x1,5",
    power: 0.5,
    phase: "L3",
    type: "1φ",
  },

  // Przewody instalacyjne OMY, OMYp
  {
    description: "Oświetlenie LED",
    zone: "Parter",
    voltage: 230,
    cable: "OMY 2x0,5",
    power: 0.1,
    phase: "L1",
    type: "1φ",
  },
  {
    description: "Oświetlenie LED",
    zone: "Piętro",
    voltage: 230,
    cable: "OMY 2x0,5",
    power: 0.1,
    phase: "L2",
    type: "1φ",
  },
  {
    description: "Oświetlenie punktowe",
    zone: "Parter",
    voltage: 230,
    cable: "OMY 2x0,75",
    power: 0.2,
    phase: "L1",
    type: "1φ",
  },
  {
    description: "Oświetlenie punktowe",
    zone: "Piętro",
    voltage: 230,
    cable: "OMY 2x0,75",
    power: 0.2,
    phase: "L2",
    type: "1φ",
  },
  {
    description: "Włącznik światła",
    zone: "Parter",
    voltage: 230,
    cable: "OMY 2x1",
    power: 0.1,
    phase: "L1",
    type: "1φ",
  },
  {
    description: "Włącznik światła",
    zone: "Piętro",
    voltage: 230,
    cable: "OMY 2x1",
    power: 0.1,
    phase: "L2",
    type: "1φ",
  },
  {
    description: "Gniazdo słabe prądy",
    zone: "Parter",
    voltage: 230,
    cable: "OMY 3x1",
    power: 0.5,
    phase: "L1",
    type: "1φ",
  },
  {
    description: "Gniazdo słabe prądy",
    zone: "Piętro",
    voltage: 230,
    cable: "OMY 3x1",
    power: 0.5,
    phase: "L2",
    type: "1φ",
  },
  {
    description: "Zasilanie czujniki",
    zone: "Parter",
    voltage: 230,
    cable: "OMY 2x0,5",
    power: 0.05,
    phase: "L3",
    type: "1φ",
  },
  {
    description: "Zasilanie czujniki",
    zone: "Piętro",
    voltage: 230,
    cable: "OMY 2x0,5",
    power: 0.05,
    phase: "L1",
    type: "1φ",
  },
  {
    description: "Instalacja alarmowa",
    zone: "Parter",
    voltage: 230,
    cable: "OMY 4x0,75",
    power: 0.3,
    phase: "L1",
    type: "1φ",
  },
  {
    description: "Instalacja alarmowa",
    zone: "Piętro",
    voltage: 230,
    cable: "OMY 4x0,75",
    power: 0.3,
    phase: "L2",
    type: "1φ",
  },
  {
    description: "Sterowanie roletami",
    zone: "Parter",
    voltage: 230,
    cable: "OMYp 3x0,75",
    power: 0.2,
    phase: "L3",
    type: "1φ",
  },
  {
    description: "Sterowanie roletami",
    zone: "Piętro",
    voltage: 230,
    cable: "OMYp 3x0,75",
    power: 0.2,
    phase: "L1",
    type: "1φ",
  },
  {
    description: "Gniazdo słabe prądy 1,5mm²",
    zone: "Parter",
    voltage: 230,
    cable: "OMY 3x1,5",
    power: 1,
    phase: "L1",
    type: "1φ",
  },
  {
    description: "Gniazdo słabe prądy 1,5mm²",
    zone: "Piętro",
    voltage: 230,
    cable: "OMY 3x1,5",
    power: 1,
    phase: "L2",
    type: "1φ",
  },
  {
    description: "Instalacja multimedialna",
    zone: "Parter",
    voltage: 230,
    cable: "OMYp 4x0,75",
    power: 0.2,
    phase: "L2",
    type: "1φ",
  },
  {
    description: "Instalacja multimedialna",
    zone: "Piętro",
    voltage: 230,
    cable: "OMYp 4x0,75",
    power: 0.2,
    phase: "L3",
    type: "1φ",
  },
];

// Component Item with Image Upload
function ComponentItem({
  component,
  componentTemplate,
  onQuantityChange,
}: {
  component: RequiredComponent;
  componentTemplate: Omit<RequiredComponent, "quantity"> | undefined;
  onQuantityChange: (id: string, quantity: number) => void;
}) {
  // Helper function to get image path, trying both .jpg and .jpeg
  const getImagePath = (basePath: string | undefined): string | undefined => {
    if (!basePath) return undefined;
    // If path already has extension, use it as is
    if (basePath.includes(".")) {
      return basePath;
    }
    // Otherwise, try .jpg first, fallback to .jpeg
    return basePath.endsWith(".jpg") || basePath.endsWith(".jpeg")
      ? basePath
      : `${basePath}.jpg`;
  };

  // Helper function to get saved image from localStorage
  const getSavedImagePath = (componentId: string): string | undefined => {
    if (typeof window === "undefined") return undefined;
    try {
      const saved = localStorage.getItem(`component_image_${componentId}`);
      return saved || undefined;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return undefined;
    }
  };

  // Helper function to save image path to localStorage
  const saveImagePath = (componentId: string, imagePath: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`component_image_${componentId}`, imagePath);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  // Helper function to generate Google search URL
  const getGoogleSearchUrl = (name: string, description?: string): string => {
    const searchQuery = description || name;
    const encodedQuery = encodeURIComponent(searchQuery);
    return `https://www.google.com/search?q=${encodedQuery}`;
  };

  // Initialize image state: check localStorage first, then fallback to template
  const [image, setImage] = useState(() => {
    const savedImage = getSavedImagePath(component.id);
    return savedImage || getImagePath(componentTemplate?.image);
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync image with localStorage when component changes
  useEffect(() => {
    const savedImage = getSavedImagePath(component.id);
    if (savedImage) {
      setImage(savedImage);
    } else {
      setImage(getImagePath(componentTemplate?.image));
    }
  }, [component.id, componentTemplate?.image]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      alert("Proszę wybrać plik obrazu (JPEG, PNG, GIF lub WebP)");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Plik jest zbyt duży. Maksymalny rozmiar to 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const response = await api.upload.componentImage(component.id, file);
      if (response.success) {
        setImage(response.filePath);
        // Save image path to localStorage to persist across page refreshes
        saveImagePath(component.id, response.filePath);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(
        "Błąd podczas przesyłania obrazu: " +
          (error instanceof Error ? error.message : "Nieznany błąd")
      );
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const description = componentTemplate?.description || "";
  const price = componentTemplate?.price || 0;
  const totalPrice = price * component.quantity;

  return (
    <div className="flex items-stretch gap-1 md:gap-2 border border-gray-200 rounded-lg p-1.5 md:p-2 bg-gray-50">
      {/* Component Image - Left Side */}
      <div className="flex-shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <div
          className={`w-12 md:w-16 h-full relative bg-white rounded border border-gray-200 overflow-hidden cursor-pointer active:border-blue-400 transition-colors touch-manipulation ${
            isUploading ? "opacity-50" : ""
          }`}
          onClick={handleImageClick}
          title="Kliknij, aby zmienić obraz"
        >
          {image ? (
            <Image
              src={image}
              alt={component.name}
              className="object-contain p-1 w-full h-full"
              width={200}
              height={200}
              onError={(e) => {
                // Try .jpeg if .jpg fails
                const img = e.target as HTMLImageElement;
                const currentSrc = img.src;
                if (currentSrc.endsWith(".jpg")) {
                  const jpegSrc = currentSrc.replace(".jpg", ".jpeg");
                  img.src = jpegSrc;
                } else {
                  // Hide image if both fail
                  img.style.display = "none";
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-1">
              Kliknij, aby dodać obraz
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-gray-200 bg-opacity-75 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>

      {/* Content - Right Side */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Component Title - Clickable Google Search Link */}
        <a
          href={getGoogleSearchUrl(component.name, description)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs md:text-sm font-medium text-blue-600 active:text-blue-800 active:underline touch-manipulation"
          title={`Szukaj w Google: ${description || component.name}`}
          onClick={(e) => e.stopPropagation()}
        >
          {component.name}
        </a>

        {/* Fields and Price Info */}
        <div className="flex items-center gap-1 md:gap-2 text-xs text-gray-500 flex-wrap">
          {component.fields > 0 && (
            <span>
              ({component.fields} {component.fields === 1 ? "pole" : "pola"})
            </span>
          )}
          {price > 0 && <span>~{price.toFixed(2)} zł</span>}
          {description && (
            <div className="relative group flex-shrink-0">
              <span className="text-blue-600 cursor-help text-xs font-bold active:text-blue-800">
                ?
              </span>
              <div className="absolute left-0 bottom-full mb-2 w-48 md:w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity pointer-events-none z-50">
                {description}
              </div>
            </div>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-1 md:gap-2 mt-1">
          <button
            onClick={() => {
              const newQuantity = Math.max(0, component.quantity - 1);
              onQuantityChange(component.id, newQuantity);
            }}
            className="px-2 md:px-2 py-1.5 md:py-1 text-xs md:text-sm border border-gray-300 rounded active:bg-gray-200 bg-white text-black font-bold min-w-[32px] md:min-w-[28px] touch-manipulation"
            title="Zmniejsz ilość"
          >
            −
          </button>
          <span className="text-xs md:text-sm font-medium text-gray-900 min-w-[24px] text-center">
            {component.quantity}
          </span>
          <button
            onClick={() => {
              const newQuantity = Math.min(10, component.quantity + 1);
              onQuantityChange(component.id, newQuantity);
            }}
            className="px-2 md:px-2 py-1.5 md:py-1 text-xs md:text-sm border border-gray-300 rounded active:bg-gray-200 bg-white text-black font-bold min-w-[32px] md:min-w-[28px] touch-manipulation"
            title="Zwiększ ilość"
          >
            +
          </button>
          {totalPrice > 0 && (
            <span className="text-xs font-semibold text-green-600 ml-auto">
              {totalPrice.toFixed(2)} zł
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Force dynamic rendering to avoid static export issues with useSearchParams
export const dynamic = "force-dynamic";

function CalculationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // API Components - fetched from PostgreSQL database
  const [apiComponents, setApiComponents] = useState<
    Omit<RequiredComponent, "quantity">[]
  >([]);


  console.log('apiComponents', apiComponents);
  const [componentsLoading, setComponentsLoading] = useState(true);
  const [componentsError, setComponentsError] = useState<string | null>(null);

  // API Fuse Types - fetched from PostgreSQL database
  const [apiFuseTypes1Phase, setApiFuseTypes1Phase] = useState<string[]>([]);
  const [apiFuseTypes3Phase, setApiFuseTypes3Phase] = useState<string[]>([]);
  const [fuseTypesLoading, setFuseTypesLoading] = useState(true);

  // Fetch components from API on component mount
  useEffect(() => {
    const fetchComponents = async () => {
      try {
        setComponentsLoading(true);
        setComponentsError(null);

        const response = await fetch("/api/proxy/components");
        const data = await response.json();

        if (data.success && data.data) {
          console.log(
            `[FRONTEND] Fetched ${data.data.length} components from API`
          );
          setApiComponents(data.data);
        } else {
          throw new Error(data.error || "Failed to fetch components");
        }
      } catch (error) {
        console.error("[FRONTEND] Error fetching components:", error);
        setComponentsError(
          error instanceof Error ? error.message : "Failed to fetch components"
        );
        // Fallback to empty array
        setApiComponents([]);
      } finally {
        setComponentsLoading(false);
      }
    };

    fetchComponents();
  }, []);

  // Fetch fuse types from API on component mount
  useEffect(() => {
    const fetchFuseTypes = async () => {
      try {
        setFuseTypesLoading(true);

        const response = await fetch("/api/proxy/components/fuse-types");
        const data = await response.json();

        console.log('data fuse types', data.data);

        if (data.success && data.data) {
          console.log(
            `[FRONTEND] Fetched ${data.data.length} fuse types from API`
          );

          // Group by phase type
          const fuseTypes1Phase = data.data
            .filter((fuse: any) => fuse.phase_type === '1φ')
            .map((fuse: any) => fuse.fuse_type)
            .sort((a: string, b: string) => parseInt(a.replace('A', '')) - parseInt(b.replace('A', '')));

          const fuseTypes3Phase = data.data
            .filter((fuse: any) => fuse.phase_type === '3φ')
            .map((fuse: any) => fuse.fuse_type)
            .sort((a: string, b: string) => parseInt(a.replace('A', '')) - parseInt(b.replace('A', '')));

          setApiFuseTypes1Phase(fuseTypes1Phase);
          setApiFuseTypes3Phase(fuseTypes3Phase);
        } else {
          console.warn("[FRONTEND] Failed to fetch fuse types, using defaults");
          // Fallback to hardcoded values if API fails
          setApiFuseTypes1Phase(["6A", "10A", "13A", "16A", "20A", "25A", "32A", "40A", "50A", "63A"]);
          setApiFuseTypes3Phase(["16A", "20A", "25A", "32A", "40A", "50A", "63A", "80A", "100A", "125A"]);
        }
      } catch (error) {
        console.error("[FRONTEND] Error fetching fuse types:", error);
        // Fallback to hardcoded values if API fails
        setApiFuseTypes1Phase(["6A", "10A", "13A", "16A", "20A", "25A", "32A", "40A", "50A", "63A"]);
        setApiFuseTypes3Phase(["16A", "20A", "25A", "32A", "40A", "50A", "63A", "80A", "100A", "125A"]);
      } finally {
        setFuseTypesLoading(false);
      }
    };

    fetchFuseTypes();
  }, []);

  // Use API components as fallback for REQUIRED_COMPONENTS
  const REQUIRED_COMPONENTS: Omit<RequiredComponent, "quantity">[] =
    apiComponents;

  // Sort components alphabetically by name
  const SORTED_REQUIRED_COMPONENTS: Omit<RequiredComponent, "quantity">[] = [
    ...REQUIRED_COMPONENTS,
  ].sort((a, b) => a.name.localeCompare(b.name, "pl", { sensitivity: "base" }));

  // Use API components to build categories dynamically
  const COMPONENT_CATEGORIES: ComponentCategory[] = useMemo(() => {
    const categories = buildComponentCategories(apiComponents || []);
    console.log('[DEBUG] apiComponents:', apiComponents?.length || 0, 'items');
    console.log('[DEBUG] COMPONENT_CATEGORIES:', categories);
    return categories;
  }, [apiComponents]);
  const offerIdFromUrl = searchParams.get("offerId");
  const [circuits, setCircuits] = useState<Circuit[]>([
    {
      id: 1,
      circuitNumber: 1,
      description: "Oświetlenie parter kuchnia 1",
      socketSwitchCount: 1,
      zone: "Parter",
      voltage: 230,
      cable: "YDYpżo 3x1,5",
      length: 10,
      power: 0.5,
      fuseType: "10A",
      phase: "L1",
      type: "1φ",
    },
    {
      id: 2,
      circuitNumber: 2,
      description: "Oświetlenie parter kuchnia 2",
      socketSwitchCount: 1,
      zone: "Parter",
      voltage: 230,
      cable: "YDYpżo 3x1,5",
      length: 10,
      power: 0.5,
      fuseType: "10A",
      phase: "L2",
      type: "1φ",
    },
    {
      id: 3,
      circuitNumber: 3,
      description: "Oświetlenie parter salon",
      socketSwitchCount: 2,
      zone: "Parter",
      voltage: 230,
      cable: "YDYpżo 3x1,5",
      length: 10,
      power: 0.5,
      fuseType: "10A",
      phase: "L3",
      type: "1φ",
    },
    {
      id: 4,
      circuitNumber: 4,
      description: "Oświetlenie piętro sypialnia",
      socketSwitchCount: 1,
      zone: "Piętro",
      voltage: 230,
      cable: "YDYpżo 3x1,5",
      length: 10,
      power: 0.5,
      fuseType: "10A",
      phase: "L1",
      type: "1φ",
    },
    {
      id: 5,
      circuitNumber: 5,
      description: "Oświetlenie piętro korytarz",
      socketSwitchCount: 1,
      zone: "Piętro",
      voltage: 230,
      cable: "YDYpżo 3x1,5",
      length: 10,
      power: 0.5,
      fuseType: "10A",
      phase: "L2",
      type: "1φ",
    },
    {
      id: 6,
      circuitNumber: 6,
      description: "Gniazda parter salon",
      socketSwitchCount: 4,
      zone: "Parter",
      voltage: 230,
      cable: "YDYpżo 3x2,5",
      length: 15,
      power: 2,
      fuseType: "16A",
      phase: "L3",
      type: "1φ",
    },
    {
      id: 7,
      circuitNumber: 7,
      description: "Klimatyzacja kuchnia",
      socketSwitchCount: 0,
      zone: "Parter",
      voltage: 230,
      cable: "YDYpżo 3x2,5",
      length: 15,
      power: 2,
      fuseType: "16A",
      phase: "L1",
      type: "1φ",
    },
    {
      id: 8,
      circuitNumber: 8,
      description: "Gniazda parter kuchnia",
      socketSwitchCount: 6,
      zone: "Parter",
      voltage: 230,
      cable: "YDYpżo 3x2,5",
      length: 15,
      power: 2,
      fuseType: "16A",
      phase: "L2",
      type: "1φ",
    },
    {
      id: 9,
      circuitNumber: 9,
      description: "Gniazda parter tv/skrętka/antena",
      socketSwitchCount: 3,
      zone: "Parter",
      voltage: 230,
      cable: "YDYpżo 3x2,5",
      length: 15,
      power: 2,
      fuseType: "16A",
      phase: "L3",
      type: "1φ",
    },
    {
      id: 10,
      circuitNumber: 10,
      description: "Gniazda parter łazienka biuro",
      socketSwitchCount: 2,
      zone: "Parter",
      voltage: 230,
      cable: "YDYpżo 3x2,5",
      length: 15,
      power: 2,
      fuseType: "16A",
      phase: "L1",
      type: "1φ",
    },
    {
      id: 11,
      circuitNumber: 11,
      description: "Gniazda parter łazienka grzejnik",
      socketSwitchCount: 1,
      zone: "Parter",
      voltage: 230,
      cable: "YDYpżo 3x2,5",
      length: 15,
      power: 2,
      fuseType: "16A",
      phase: "L2",
      type: "1φ",
    },
    {
      id: 12,
      circuitNumber: 12,
      description: "Gniazda piętro łazienka",
      socketSwitchCount: 2,
      zone: "Piętro",
      voltage: 230,
      cable: "YDYpżo 5x4",
      length: 20,
      power: 0.5,
      fuseType: "16A",
      phase: "3Φ",
      type: "3φ",
    },
    {
      id: 13,
      circuitNumber: 13,
      description: "Oświetlenie parter korytarz, schody",
      socketSwitchCount: 3,
      zone: "Piętro",
      voltage: 230,
      cable: "YDYpżo 3x1,5",
      length: 10,
      power: 0.5,
      fuseType: "10A",
      phase: "L3",
      type: "1φ",
    },
    {
      id: 14,
      circuitNumber: 14,
      description: "Oświetlenie parter łazienka biuro",
      socketSwitchCount: 1,
      zone: "Piętro",
      voltage: 230,
      cable: "YDYpżo 3x1,5",
      length: 10,
      power: 0.5,
      fuseType: "10A",
      phase: "L1",
      type: "1φ",
    },
    {
      id: 15,
      circuitNumber: 15,
      description: "Oświetlenie piętro łazienka, salon",
      socketSwitchCount: 2,
      zone: "Parter",
      voltage: 230,
      cable: "YDYpżo 3x1,5",
      length: 10,
      power: 0.5,
      fuseType: "10A",
      phase: "L2",
      type: "1φ",
    },
    {
      id: 16,
      circuitNumber: 16,
      description: "Oświetlenie piętro sypialnia, łazienka",
      socketSwitchCount: 2,
      zone: "Parter",
      voltage: 230,
      cable: "YDYpżo 3x1,5",
      length: 10,
      power: 0.5,
      fuseType: "10A",
      phase: "L3",
      type: "1φ",
    },
    {
      id: 17,
      circuitNumber: 17,
      description: "Gniazda piętro sypialnia",
      socketSwitchCount: 4,
      zone: "Piętro",
      voltage: 230,
      cable: "YDYpżo 3x2,5",
      length: 15,
      power: 2,
      fuseType: "16A",
      phase: "L1",
      type: "1φ",
    },
    {
      id: 18,
      circuitNumber: 18,
      description: "Gniazda piętro salon",
      socketSwitchCount: 5,
      zone: "Piętro",
      voltage: 230,
      cable: "YDYpżo 3x2,5",
      length: 15,
      power: 2,
      fuseType: "16A",
      phase: "L2",
      type: "1φ",
    },
    {
      id: 19,
      circuitNumber: 19,
      description: "Gniazda piętro łazienka pralka",
      socketSwitchCount: 1,
      zone: "Piętro",
      voltage: 230,
      cable: "YDYpżo 3x2,5",
      length: 15,
      power: 2,
      fuseType: "16A",
      phase: "L3",
      type: "1φ",
    },
    {
      id: 20,
      circuitNumber: 20,
      description: "Gniazda piętro łazienka suszarka",
      socketSwitchCount: 1,
      zone: "Piętro",
      voltage: 230,
      cable: "YDYpżo 3x2,5",
      length: 15,
      power: 2,
      fuseType: "16A",
      phase: "L1",
      type: "1φ",
    },
  ]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCircuit, setEditingCircuit] = useState<Circuit | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<"L1" | "L2" | "L3" | null>(
    null
  );
  const [highlightTotalPower, setHighlightTotalPower] = useState(false);
  const [highlightMaxPower, setHighlightMaxPower] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const [showMissingDescriptionPopup, setShowMissingDescriptionPopup] =
    useState(false);
  const [sortColumn, setSortColumn] = useState<keyof Circuit | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [activeFilter, setActiveFilter] = useState<keyof Circuit | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [filters, setFilters] = useState<Partial<Record<keyof Circuit, any>>>({
    circuitNumber: null,
    description: "",
    socketSwitchCount: null,
    zone: "",
    voltage: null,
    cable: "",
    length: null,
    power: null,
    phase: "",
    type: "",
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set([
      "basic_protection",
      "overcurrent_protection",
      "cables",
      "organization",
    ])
  ); // Default expanded categories
  const [expandedSubcategories, setExpandedSubcategories] = useState<
    Set<string>
  >(new Set(["mcb_b", "ydypzo", "yky"])); // Default expanded subcategories

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const toggleSubcategory = (subcategoryId: string) => {
    setExpandedSubcategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subcategoryId)) {
        newSet.delete(subcategoryId);
      } else {
        newSet.add(subcategoryId);
      }
      return newSet;
    });
  };

  const [requiredComponents, setRequiredComponents] = useState<RequiredComponent[]>([]);

  // Initialize requiredComponents when apiComponents are loaded
  useEffect(() => {
    if (apiComponents && apiComponents.length > 0) {
      const sorted = [...apiComponents].sort((a, b) =>
        a.name.localeCompare(b.name, "pl", { sensitivity: "base" })
      );
      setRequiredComponents(sorted.map(comp => ({ ...comp, quantity: 0 })));
    }
  }, [apiComponents]);
  const [componentSearchQuery, setComponentSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Generate fuse type components from circuits
  useEffect(() => {
    // Count fuse types from circuits
    const fuseTypeCounts: Record<string, number> = {};
    circuits.forEach((circuit) => {
      const fuseType = circuit.fuseType || "10A";
      // Count based on socketSwitchCount (each socket/switch needs a fuse)
      const count = circuit.socketSwitchCount || 1;
      fuseTypeCounts[fuseType] = (fuseTypeCounts[fuseType] || 0) + count;
    });

    // Map fuse types to component IDs (assuming B characteristic for most)
    const fuseTypeToComponentId: Record<string, string> = {
      "6A": "mcb_b6",
      "10A": "mcb_b10",
      "13A": "mcb_b13",
      "16A": "mcb_b16",
      "20A": "mcb_b20",
      "25A": "mcb_b25",
      "32A": "mcb_b32",
      "40A": "mcb_b40",
      "50A": "mcb_b50",
      "63A": "mcb_b63",
      "80A": "mcb_b80",
      "100A": "mcb_b100",
      "125A": "mcb_b125",
    };

    // Update required components: keep manually added ones and add/update fuse components
    setRequiredComponents((prev) => {
      // Filter out old fuse components (those with IDs starting with 'mcb_b' or names like 'B10A', 'B16A')
      const nonFuseComponents = prev.filter(
        (comp) => !comp.id.startsWith("mcb_b") && !comp.name.match(/^B\d+A$/)
      );

      // Create fuse components from circuits
      const fuseComponents: RequiredComponent[] = [];
      Object.entries(fuseTypeCounts).forEach(([fuseType, count]) => {
        const componentId =
          fuseTypeToComponentId[fuseType] || `mcb_b${fuseType.toLowerCase()}`;
        const componentName = `B${fuseType}`;

        // Check if component exists in REQUIRED_COMPONENTS
        const existingComponent = REQUIRED_COMPONENTS.find(
          (c) => c.id === componentId
        );

        if (existingComponent) {
          fuseComponents.push({
            id: componentId,
            name: componentName,
            fields: existingComponent.fields,
            quantity: count,
            description: existingComponent.description,
            price: existingComponent.price,
            image: existingComponent.image,
          });
        } else {
          // Create new component if not in REQUIRED_COMPONENTS
          const fusePrices: Record<string, number> = {
            "6A": 25,
            "10A": 28,
            "13A": 30,
            "16A": 32,
            "20A": 35,
            "25A": 38,
            "32A": 42,
            "40A": 48,
            "50A": 55,
            "63A": 65,
            "80A": 85,
            "100A": 120,
            "125A": 145,
          };
          fuseComponents.push({
            id: componentId,
            name: componentName,
            fields: 1,
            quantity: count,
            description: `Wyłącznik nadprądowy modułowy MCB B${fuseType} ${fuseType} - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej`,
            price: fusePrices[fuseType] || 30,
            image: `/pictures/electricComponents/mcb_b${fuseType.toLowerCase()}.jpg`,
          });
        }
      });

      // Merge fuse components with non-fuse components
      const mergedComponents = [...nonFuseComponents];
      fuseComponents.forEach((fuseComp) => {
        const existingIndex = mergedComponents.findIndex(
          (c) => c.id === fuseComp.id
        );
        if (existingIndex >= 0) {
          // Update existing fuse component quantity
          mergedComponents[existingIndex].quantity = fuseComp.quantity;
        } else {
          // Add new fuse component
          mergedComponents.push(fuseComp);
        }
      });

      // Ensure all REQUIRED_COMPONENTS are present (with quantity 0 if not used and not a fuse)
      SORTED_REQUIRED_COMPONENTS.forEach((template) => {
        // Skip fuse components that are already handled above
        if (template.id.startsWith("mcb_b")) return;

        const exists = mergedComponents.find((c) => c.id === template.id);
        if (!exists) {
          mergedComponents.push({ ...template, quantity: 0 });
        }
      });

      return mergedComponents;
    });
  }, [circuits]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setActiveFilter(null);
      }
    };

    if (activeFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeFilter]);

  const handleEdit = (circuit: Circuit) => {
    // Save current editing if any
    if (editingCircuit && editingId !== null && editingId !== circuit.id) {
      setCircuits(
        circuits.map((c) => (c.id === editingId ? editingCircuit : c))
      );
    }
    setEditingId(circuit.id);
    setEditingCircuit({ ...circuit });
  };

  const handleSave = () => {
    if (editingCircuit) {
      setCircuits(
        circuits.map((c) => (c.id === editingCircuit.id ? editingCircuit : c))
      );
      setEditingId(null);
      setEditingCircuit(null);
    }
  };

  const handleAutoSave = () => {
    if (editingCircuit) {
      // Validate description before saving
      if (
        !editingCircuit.description ||
        editingCircuit.description.trim() === ""
      ) {
        // Don't save if description is empty, but keep editing mode
        return;
      }
      setCircuits(
        circuits.map((c) => (c.id === editingCircuit.id ? editingCircuit : c))
      );
      // Keep editing mode open for continuous editing
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingCircuit(null);
  };

  const handleAdd = () => {
    // Check if there's an editing circuit without description
    if (editingCircuit && editingId !== null) {
      if (
        !editingCircuit.description ||
        editingCircuit.description.trim() === ""
      ) {
        setShowMissingDescriptionPopup(true);
        return;
      }
      // Save current editing before adding new
      setCircuits(
        circuits.map((c) => (c.id === editingId ? editingCircuit : c))
      );
      setEditingId(null);
      setEditingCircuit(null);
    }

    // Add new circuit - it will be in edit mode, user must fill description before it can be saved
    const newCircuit: Circuit = {
      id: Math.max(...circuits.map((c) => c.id), 0) + 1,
      circuitNumber: circuits.length + 1,
      description: "",
      socketSwitchCount: 0,
      zone: "Parter",
      voltage: 230,
      cable: "YDYpżo 3x1,5",
      length: 10,
      power: 0.5,
      fuseType: "10A",
      phase: "L1",
      type: "1φ",
    };
    setCircuits([...circuits, newCircuit]);
    setEditingId(newCircuit.id);
    setEditingCircuit({ ...newCircuit });
  };

  const handleDelete = (id: number) => {
    setCircuits(circuits.filter((c) => c.id !== id));
  };

  // Handle clicks outside the table to save and exit edit mode
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        editingId !== null &&
        tableRef.current &&
        !tableRef.current.contains(event.target as Node)
      ) {
        // Click outside table - save and exit edit mode
        if (editingCircuit) {
          setCircuits(
            circuits.map((c) => (c.id === editingId ? editingCircuit : c))
          );
        }
        setEditingId(null);
        setEditingCircuit(null);
      }
    };

    if (editingId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [editingId, editingCircuit, circuits]);

  const handleAddFromTemplate = (template: CircuitTemplate) => {
    const newCircuit: Circuit = {
      id: Math.max(...circuits.map((c) => c.id), 0) + 1,
      circuitNumber: circuits.length + 1,
      description: template.description,
      socketSwitchCount: 0,
      zone: template.zone,
      voltage: template.voltage,
      cable: template.cable,
      length: 10, // Default length
      power: template.power,
      phase: template.phase,
      type: template.type,
      fuseType: template.type === "3φ" ? "16A" : "10A", // Default fuse type based on phase type
    };
    setCircuits([...circuits, newCircuit]);
  };

  const isTemplateUsed = (templateDescription: string): boolean => {
    return circuits.some((c) => c.description === templateDescription);
  };

  const getCircuitUsingTemplate = (
    templateDescription: string
  ): Circuit | undefined => {
    return circuits.find((c) => c.description === templateDescription);
  };

  const handleTemplateClick = (template: CircuitTemplate) => {
    const isUsed = isTemplateUsed(template.description);
    if (isUsed) {
      // Remove the circuit that uses this template to make it available again
      const circuitToRemove = getCircuitUsingTemplate(template.description);
      if (circuitToRemove) {
        handleDelete(circuitToRemove.id);
      }
    } else {
      // Add new circuit from template
      handleAddFromTemplate(template);
    }
  };

  const getHighlightedRows = () => {
    // Highlight rows 7-12 (circuits 7-12)
    return circuits
      .filter((c) => c.circuitNumber >= 7 && c.circuitNumber <= 12)
      .map((c) => c.id);
  };

  const highlightedIds = getHighlightedRows();

  // Filter circuits based on active filters
  const filteredCircuits = useMemo(() => {
    return circuits.filter((circuit) => {
      // Filter by circuitNumber
      if (
        filters.circuitNumber !== null &&
        circuit.circuitNumber !== filters.circuitNumber
      ) {
        return false;
      }

      // Filter by description (case-insensitive partial match)
      if (
        filters.description &&
        !circuit.description
          .toLowerCase()
          .includes(filters.description.toLowerCase())
      ) {
        return false;
      }

      // Filter by socketSwitchCount
      if (
        filters.socketSwitchCount !== null &&
        circuit.socketSwitchCount !== filters.socketSwitchCount
      ) {
        return false;
      }

      // Filter by zone (case-insensitive partial match)
      if (
        filters.zone &&
        !circuit.zone.toLowerCase().includes(filters.zone.toLowerCase())
      ) {
        return false;
      }

      // Filter by voltage
      if (filters.voltage !== null && circuit.voltage !== filters.voltage) {
        return false;
      }

      // Filter by cable (case-insensitive partial match)
      if (
        filters.cable &&
        !circuit.cable.toLowerCase().includes(filters.cable.toLowerCase())
      ) {
        return false;
      }

      // Filter by length
      if (filters.length !== null && circuit.length !== filters.length) {
        return false;
      }

      // Filter by power (exact match or range)
      if (filters.power !== null && circuit.power !== filters.power) {
        return false;
      }

      // Filter by phase (exact match)
      if (filters.phase && circuit.phase !== filters.phase) {
        return false;
      }

      // Filter by type (exact match)
      if (filters.type && circuit.type !== filters.type) {
        return false;
      }

      return true;
    });
  }, [circuits, filters]);

  // Sort circuits based on selected column
  const sortedCircuits = useMemo(() => {
    const circuitsToSort = filteredCircuits;
    if (!sortColumn) return circuitsToSort;

    const sorted = [...circuitsToSort].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue);
      const bStr = String(bValue);
      const comparison = aStr.localeCompare(bStr, "pl");
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [filteredCircuits, sortColumn, sortDirection]);

  const handleSort = (column: keyof Circuit, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleFilterClick = (column: keyof Circuit, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveFilter(activeFilter === column ? null : column);
  };

  const handleFilterChange = (column: keyof Circuit, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [column]: value === "" ? null : value,
    }));
  };

  const clearFilter = (column: keyof Circuit, e: React.MouseEvent) => {
    e.stopPropagation();
    setFilters((prev) => ({
      ...prev,
      [column]:
        column === "circuitNumber" ||
        column === "voltage" ||
        column === "power" ||
        column === "length"
          ? null
          : "",
    }));
    if (activeFilter === column) {
      setActiveFilter(null);
    }
  };

  const resetAllFiltersAndSorting = () => {
    setFilters({
      circuitNumber: null,
      description: "",
      zone: "",
      voltage: null,
      cable: "",
      length: null,
      power: null,
      phase: "",
      type: "",
    });
    setSortColumn(null);
    setSortDirection("asc");
    setActiveFilter(null);
  };

  const exportToCSV = () => {
    // Create CSV content - only table columns
    const csvRows: string[] = [];

    // Escape CSV value function
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      // Always quote if contains semicolon, comma, quote, or newline
      if (
        str.includes(";") ||
        str.includes(",") ||
        str.includes('"') ||
        str.includes("\n")
      ) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Use semicolon as separator for better Excel compatibility (Polish locale)
    const separator = ";";

    // Add table header - exactly 11 columns matching the table
    const headerRow = [
      "Nr",
      "Opis obwodu",
      "Ilość gniazd/włączników",
      "Strefa",
      "Napięcie",
      "Przewód",
      "Długość [m]",
      "Moc [kW]",
      "Typ bezpiecznika",
      "Faza",
      "Typ",
    ].join(separator);
    csvRows.push(headerRow);

    // Add table data - exactly 11 columns, properly escaped
    sortedCircuits.forEach((circuit) => {
      const row = [
        escapeCSV(circuit.circuitNumber),
        escapeCSV(circuit.description),
        escapeCSV(circuit.socketSwitchCount || 0),
        escapeCSV(circuit.zone),
        escapeCSV(circuit.voltage),
        escapeCSV(circuit.cable),
        escapeCSV(circuit.length || 0),
        escapeCSV(circuit.power),
        escapeCSV(circuit.fuseType || "10A"),
        escapeCSV(circuit.phase),
        escapeCSV(circuit.type),
      ].join(separator);
      csvRows.push(row);
    });

    // Create blob and download
    const csvContent = csvRows.join("\r\n"); // Use \r\n for Windows compatibility
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `kalkulacja_obwodow_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length === 0) {
          alert("Plik CSV jest pusty.");
          return;
        }

        // Detect separator
        const firstLine = lines[0];
        const separator = firstLine.includes(";") ? ";" : ",";

        // First line should be header - expect exactly 9 columns
        const expectedColumns = [
          "Nr",
          "Opis obwodu",
          "Ilość gniazd/włączników",
          "Strefa",
          "Napięcie",
          "Przewód",
          "Długość [m]",
          "Moc [kW]",
          "Typ bezpiecznika",
          "Faza",
          "Typ",
        ];
        const headerColumns = firstLine
          .split(separator)
          .map((col) => col.trim());

        if (headerColumns.length !== 11) {
          alert(
            `Nieprawidłowy format pliku CSV. Oczekiwano 11 kolumn, znaleziono ${headerColumns.length}.`
          );
          return;
        }

        // Parse CSV data starting from second line
        const importedCircuits: Circuit[] = [];
        let idCounter = Math.max(...circuits.map((c) => c.id), 0) + 1;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue; // Skip empty lines

          // Parse CSV line (handle quoted values)
          const values: string[] = [];
          let currentValue = "";
          let inQuotes = false;

          // Try semicolon first (Polish locale), then comma
          const separator = line.includes(";") ? ";" : ",";

          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === separator && !inQuotes) {
              values.push(currentValue.trim());
              currentValue = "";
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim());

          // Must have exactly 11 columns
          if (values.length === 11) {
            const circuit: Circuit = {
              id: idCounter++,
              circuitNumber: parseInt(values[0]) || importedCircuits.length + 1,
              description: values[1].replace(/^"|"$/g, "") || "",
              socketSwitchCount: parseInt(values[2]) || 0,
              zone: (values[3] as "Parter" | "Piętro") || "Parter",
              voltage: parseFloat(values[4]) || 230,
              cable: values[5].replace(/^"|"$/g, "") || "YDYpżo 3x1,5",
              length: parseFloat(values[6]) || 10,
              power: parseFloat(values[7]) || 0.5,
              fuseType: values[8].replace(/^"|"$/g, "") || "10A",
              phase: (values[9] as "L1" | "L2" | "L3" | "3Φ") || "L1",
              type: (values[10] as "1φ" | "3φ") || "1φ",
            };

            // Only add if description is not empty
            if (circuit.description.trim()) {
              importedCircuits.push(circuit);
            }
          } else if (values.length > 0) {
            // Skip rows with wrong number of columns
            console.warn(
              `Pominięto wiersz ${i + 1}: nieprawidłowa liczba kolumn (${
                values.length
              } zamiast 11)`
            );
          }
        }

        if (importedCircuits.length > 0) {
          setCircuits([...circuits, ...importedCircuits]);
          alert(`Zaimportowano ${importedCircuits.length} obwodów.`);
        } else {
          alert("Nie znaleziono żadnych obwodów do zaimportowania.");
        }
      };
      reader.readAsText(file, "UTF-8");
    };
    input.click();
  };

  const getUniqueValues = (column: keyof Circuit): any[] => {
    const values = new Set(circuits.map((c) => c[column]));
    return Array.from(values).sort((a, b) => {
      if (typeof a === "number" && typeof b === "number") {
        return a - b;
      }
      return String(a).localeCompare(String(b), "pl");
    });
  };

  const hasActiveFilter = (column: keyof Circuit): boolean => {
    const filterValue = filters[column];
    if (
      filterValue === null ||
      filterValue === undefined ||
      filterValue === ""
    ) {
      return false;
    }
    return true;
  };

  // Calculate summary values
  const summary = useMemo(() => {
    // Sum power values directly from Moc column based on Faza column
    // Power values are already in kW, so no conversion needed

    let sumL1 = 0;
    let sumL2 = 0;
    let sumL3 = 0;
    let sum3Phase = 0;

    circuits.forEach((circuit) => {
      // Power is already in kW
      if (circuit.phase === "L1") {
        sumL1 += circuit.power;
      } else if (circuit.phase === "L2") {
        sumL2 += circuit.power;
      } else if (circuit.phase === "L3") {
        sumL3 += circuit.power;
      } else if (circuit.phase === "3Φ") {
        // For 3-phase circuits, add to separate sum (not distributed to L1/L2/L3)
        sum3Phase += circuit.power;
      }
    });

    // Total power is sum of all power values from Moc column (in kW)
    const totalPower = circuits.reduce(
      (sum, circuit) => sum + circuit.power,
      0
    );

    // Maximum phase power - maximum value from Moc column (in kW)
    const maxPhasePower =
      circuits.length > 0 ? Math.max(...circuits.map((c) => c.power)) : 0;

    // Calculate phase current: I = P / U (assuming cos φ = 1)
    // Convert kW to W for current calculation: P in W = P in kW * 1000
    const voltage = 230; // Standard voltage
    const iReq = (maxPhasePower * 1000) / voltage;

    // Power with simultaneity factor 0.6 (in kW)
    const calculatedPower = totalPower * 0.6;

    // Count phase types based on Faza column
    const count1Phase = circuits.filter(
      (c) => c.phase === "L1" || c.phase === "L2" || c.phase === "L3"
    ).length;
    const count3Phase = circuits.filter((c) => c.phase === "3Φ").length;

    // Calculate recommended protection (simplified lookup)
    // Based on calculated power: I = P / U for single phase
    // Convert kW to W: P in W = P in kW * 1000
    const recommendedProtection = Math.ceil((calculatedPower * 1000) / voltage);

    // Suggested protection lookup (standard values: 6, 10, 16, 20, 25, 32, 40, 50, 63)
    const standardProtections = [6, 10, 16, 20, 25, 32, 40, 50, 63];
    const suggestedProtection =
      standardProtections.find((p) => p >= recommendedProtection) || 63;

    // Suggested cable size based on protection (simplified)
    const getCableSize = (protection: number): number => {
      if (protection <= 10) return 1.5;
      if (protection <= 16) return 2.5;
      if (protection <= 25) return 4;
      if (protection <= 32) return 6;
      if (protection <= 40) return 10;
      return 16;
    };

    const suggestedCable = getCableSize(suggestedProtection);

    // Pre-meter protection (typically 32A or higher)
    const preMeterProtection = Math.max(32, suggestedProtection);

    return {
      sumL1,
      sumL2,
      sumL3,
      totalPower,
      maxPhasePower,
      iReq,
      calculatedPower,
      count1Phase,
      count3Phase,
      recommendedProtection,
      suggestedProtection,
      suggestedCable,
      preMeterProtection,
    };
  }, [circuits]);

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalPopup
        isOpen={showMissingDescriptionPopup}
        onClose={() => setShowMissingDescriptionPopup(false)}
        title="Brak opisu obwodu"
      >
        <p className="text-gray-700">
          Zapomniałeś dodać tytuł obwodu. Proszę uzupełnić pole &quot;Opis
          obwodu&quot; przed dodaniem wiersza.
        </p>
      </GlobalPopup>
      <div className="flex flex-col md:flex-row relative">
        {/* Toggle Button - Always visible at top */}
        <button
          onClick={() => setSidebarVisible(!sidebarVisible)}
          className={`fixed md:absolute top-4 z-50 bg-white border border-gray-300 rounded-r-lg p-2 md:p-2 shadow-lg hover:bg-gray-50 active:bg-gray-100 transition-all duration-300 touch-manipulation ${
            sidebarVisible ? "left-[176px] md:left-[176px]" : "left-0"
          }`}
          title={sidebarVisible ? "Ukryj szablony" : "Pokaż szablony"}
        >
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
              sidebarVisible ? "" : "rotate-180"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Left Sidebar - Templates */}
        <div
          className={`bg-white border-r border-gray-200 min-h-screen p-2 md:p-4 sticky top-0 overflow-y-auto max-h-screen transition-all duration-300 ease-in-out ${
            sidebarVisible
              ? "w-44 md:w-44 translate-x-0 opacity-100 z-40"
              : "-translate-x-full md:-translate-x-full w-0 opacity-0 pointer-events-none"
          }`}
        >
          <h2 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-4 sticky top-0 bg-white pb-2">
            Szablony obwodów
          </h2>
          <div className="space-y-1">
            {[...CIRCUIT_TEMPLATES]
              .sort((a, b) => a.description.localeCompare(b.description, "pl"))
              .map((template, index) => {
                const isUsed = isTemplateUsed(template.description);
                return (
                  <button
                    key={index}
                    onClick={() => handleTemplateClick(template)}
                    className={`w-full text-left px-2 md:px-3 py-2 md:py-2 rounded-lg text-xs md:text-sm transition-colors touch-manipulation ${
                      isUsed
                        ? "bg-gray-100 text-gray-400 active:bg-red-100 active:text-red-600 cursor-pointer line-through"
                        : "bg-gray-50 text-gray-700 active:bg-blue-50 active:text-blue-700 cursor-pointer"
                    }`}
                    title={
                      isUsed
                        ? "Kliknij aby usunąć obwód i przywrócić szablon"
                        : "Kliknij aby dodać"
                    }
                  >
                    {template.description}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Middle Content - Table */}
        <div
          className={`px-2 md:px-4 py-2 md:py-4 border-r border-gray-200 relative transition-all duration-300 flex-1 min-w-0 ${
            rightSidebarVisible ? "md:w-2/3" : "w-full"
          }`}
        >
          {/* Header - Sticky */}
          <div className="sticky top-0 bg-gray-50 z-40 pb-1 pt-2 border-b border-gray-200">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 active:text-gray-900 flex items-center mb-1 text-xs md:text-sm touch-manipulation"
            >
              <span className="text-base md:text-lg mr-1">←</span>
              <span>Powrót</span>
            </Link>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0">
              <h1 className="text-base md:text-xl font-bold text-gray-900">
                Kalkulacja Obwodów
              </h1>
              <div className="flex flex-wrap gap-1 md:gap-2 w-full md:w-auto">
                <button
                  onClick={resetAllFiltersAndSorting}
                  className={`${getButtonClass(
                    "neutral"
                  )} text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 touch-manipulation`}
                  title="Resetuj wszystkie filtry i sortowanie"
                >
                  Reset
                </button>
                <button
                  onClick={exportToCSV}
                  className={`${getButtonClass(
                    "neutral"
                  )} text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 touch-manipulation`}
                  title="Eksportuj do CSV"
                >
                  Export
                </button>
                <button
                  onClick={handleImportCSV}
                  className={`${getButtonClass(
                    "neutral"
                  )} text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 touch-manipulation`}
                  title="Importuj z CSV"
                >
                  Import
                </button>
                <button
                  onClick={handleAdd}
                  className={`${getButtonClass(
                    "neutral"
                  )} text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 touch-manipulation`}
                >
                  + Dodaj
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto -mx-2 md:mx-0">
              <table
                ref={tableRef}
                className="min-w-full divide-y divide-gray-200 text-xs md:text-sm"
              >
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-2 md:px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative"
                      style={{ width: "25px", minWidth: "25px" }}
                    >
                      <div className="flex items-center justify-center relative">
                        <span
                          className="cursor-pointer hover:bg-gray-100 px-1 py-1 rounded"
                          onClick={() => handleSort("circuitNumber")}
                        >
                          Nr
                        </span>
                        <div className="flex items-center gap-1 absolute right-0">
                          {sortColumn === "circuitNumber" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                          <button
                            onClick={(e) =>
                              handleFilterClick("circuitNumber", e)
                            }
                            className={`p-1 rounded hover:bg-gray-200 ${
                              hasActiveFilter("circuitNumber")
                                ? "text-blue-600"
                                : "text-gray-400"
                            }`}
                            title="Filtruj"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {activeFilter === "circuitNumber" && (
                        <div
                          ref={filterRef}
                          className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold">
                              Filtruj: Nr obwodu
                            </span>
                            <button
                              onClick={(e) => clearFilter("circuitNumber", e)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          <input
                            type="number"
                            value={filters.circuitNumber || ""}
                            onChange={(e) =>
                              handleFilterChange(
                                "circuitNumber",
                                e.target.value ? parseInt(e.target.value) : null
                              )
                            }
                            placeholder="Wpisz numer..."
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </th>
                    <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative min-w-[120px]">
                      <div className="flex items-center justify-between">
                        <span
                          className="cursor-pointer hover:bg-gray-100 px-1 py-1 rounded flex-1"
                          onClick={() => handleSort("description")}
                        >
                          Opis obwodu
                        </span>
                        <div className="flex items-center gap-1">
                          {sortColumn === "description" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                          <button
                            onClick={(e) => handleFilterClick("description", e)}
                            className={`p-1 rounded hover:bg-gray-200 ${
                              hasActiveFilter("description")
                                ? "text-blue-600"
                                : "text-gray-400"
                            }`}
                            title="Filtruj"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {activeFilter === "description" && (
                        <div
                          ref={filterRef}
                          className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold">
                              Filtruj: Opis
                            </span>
                            <button
                              onClick={(e) => clearFilter("description", e)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          <input
                            type="text"
                            value={filters.description}
                            onChange={(e) =>
                              handleFilterChange("description", e.target.value)
                            }
                            placeholder="Wpisz tekst..."
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </th>
                    <th
                      className="px-2 md:px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative"
                      style={{ width: "26px", minWidth: "26px" }}
                    >
                      <div className="flex items-center justify-center">
                        <span
                          className="cursor-pointer hover:bg-gray-100 px-1 py-1 rounded truncate"
                          onClick={() => handleSort("socketSwitchCount")}
                          title="Ilość gniazd"
                        >
                          Gniazda
                        </span>
                        <div className="flex items-center gap-1 absolute right-2">
                          {sortColumn === "socketSwitchCount" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                          <button
                            onClick={(e) =>
                              handleFilterClick("socketSwitchCount", e)
                            }
                            className={`p-1 rounded hover:bg-gray-200 ${
                              hasActiveFilter("socketSwitchCount")
                                ? "text-blue-600"
                                : "text-gray-400"
                            }`}
                            title="Filtruj"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {activeFilter === "socketSwitchCount" && (
                        <div
                          ref={filterRef}
                          className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold">
                              Filtruj: Ilość
                            </span>
                            <button
                              onClick={(e) =>
                                clearFilter("socketSwitchCount", e)
                              }
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          <input
                            type="number"
                            value={filters.socketSwitchCount || ""}
                            onChange={(e) =>
                              handleFilterChange(
                                "socketSwitchCount",
                                e.target.value ? parseInt(e.target.value) : null
                              )
                            }
                            placeholder="Wpisz liczbę..."
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </th>
                    <th
                      className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative"
                      style={{ width: "50px", minWidth: "50px" }}
                    >
                      <div className="flex items-center justify-center relative">
                        <span
                          className="cursor-pointer active:bg-gray-100 px-1 py-1 rounded touch-manipulation"
                          onClick={() => handleSort("zone")}
                        >
                          Strefa
                        </span>
                        <div className="flex items-center gap-1 absolute right-0">
                          {sortColumn === "zone" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                          <button
                            onClick={(e) => handleFilterClick("zone", e)}
                            className={`p-1 rounded hover:bg-gray-200 ${
                              hasActiveFilter("zone")
                                ? "text-blue-600"
                                : "text-gray-400"
                            }`}
                            title="Filtruj"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {activeFilter === "zone" && (
                        <div
                          ref={filterRef}
                          className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold">
                              Filtruj: Strefa
                            </span>
                            <button
                              onClick={(e) => clearFilter("zone", e)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          <select
                            value={filters.zone}
                            onChange={(e) =>
                              handleFilterChange("zone", e.target.value)
                            }
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">Wszystkie</option>
                            {getUniqueValues("zone").map((val) => (
                              <option key={val} value={val}>
                                {val}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </th>
                    <th
                      className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative"
                      style={{ width: "50px", minWidth: "50px" }}
                    >
                      <div className="flex items-center justify-center relative">
                        <span
                          className="cursor-pointer active:bg-gray-100 px-1 py-1 rounded touch-manipulation"
                          onClick={() => handleSort("voltage")}
                        >
                          Napięcie
                        </span>
                        <div className="flex items-center gap-1 absolute right-0">
                          {sortColumn === "voltage" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                          <button
                            onClick={(e) => handleFilterClick("voltage", e)}
                            className={`p-1 rounded hover:bg-gray-200 ${
                              hasActiveFilter("voltage")
                                ? "text-blue-600"
                                : "text-gray-400"
                            }`}
                            title="Filtruj"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {activeFilter === "voltage" && (
                        <div
                          ref={filterRef}
                          className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold">
                              Filtruj: Napięcie
                            </span>
                            <button
                              onClick={(e) => clearFilter("voltage", e)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          <select
                            value={filters.voltage || ""}
                            onChange={(e) =>
                              handleFilterChange(
                                "voltage",
                                e.target.value ? parseInt(e.target.value) : null
                              )
                            }
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">Wszystkie</option>
                            {getUniqueValues("voltage").map((val) => (
                              <option key={val} value={val}>
                                {val}V
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </th>
                    <th className="px-2 md:px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative min-w-[100px]">
                      <div className="flex items-center justify-center relative">
                        <span
                          className="cursor-pointer active:bg-gray-100 px-1 py-1 rounded touch-manipulation"
                          onClick={() => handleSort("cable")}
                        >
                          Przewód
                        </span>
                        <div className="flex items-center gap-1 absolute right-0">
                          {sortColumn === "cable" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                          <button
                            onClick={(e) => handleFilterClick("cable", e)}
                            className={`p-1 rounded hover:bg-gray-200 ${
                              hasActiveFilter("cable")
                                ? "text-blue-600"
                                : "text-gray-400"
                            }`}
                            title="Filtruj"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {activeFilter === "cable" && (
                        <div
                          ref={filterRef}
                          className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold">
                              Filtruj: Przewód
                            </span>
                            <button
                              onClick={(e) => clearFilter("cable", e)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          <select
                            value={filters.cable || ""}
                            onChange={(e) =>
                              handleFilterChange("cable", e.target.value)
                            }
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">Wszystkie</option>
                            {getUniqueValues("cable").map((val) => (
                              <option key={val} value={val}>
                                {val}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </th>
                    <th
                      className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative"
                      style={{ width: "70px", minWidth: "70px" }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="cursor-pointer active:bg-gray-100 px-1 py-1 rounded flex-1 touch-manipulation"
                          onClick={() => handleSort("length")}
                        >
                          Długość [m]
                        </span>
                        <div className="flex items-center gap-1">
                          {sortColumn === "length" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                          <button
                            onClick={(e) => handleFilterClick("length", e)}
                            className={`p-1 rounded hover:bg-gray-200 ${
                              hasActiveFilter("length")
                                ? "text-blue-600"
                                : "text-gray-400"
                            }`}
                            title="Filtruj"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {activeFilter === "length" && (
                        <div
                          ref={filterRef}
                          className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold">
                              Filtruj: Długość
                            </span>
                            <button
                              onClick={(e) => clearFilter("length", e)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          <input
                            type="number"
                            value={filters.length || ""}
                            onChange={(e) =>
                              handleFilterChange(
                                "length",
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : null
                              )
                            }
                            placeholder="Wpisz długość..."
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </th>
                    <th
                      className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative"
                      style={{ width: "50px", minWidth: "50px" }}
                    >
                      <div className="flex items-center justify-center relative">
                        <span
                          className="cursor-pointer active:bg-gray-100 px-1 py-1 rounded touch-manipulation"
                          onClick={() => handleSort("power")}
                        >
                          Moc [W]
                        </span>
                        <div className="flex items-center gap-1 absolute right-0">
                          {sortColumn === "power" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                          <button
                            onClick={(e) => handleFilterClick("power", e)}
                            className={`p-1 rounded hover:bg-gray-200 ${
                              hasActiveFilter("power")
                                ? "text-blue-600"
                                : "text-gray-400"
                            }`}
                            title="Filtruj"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {activeFilter === "power" && (
                        <div
                          ref={filterRef}
                          className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold">
                              Filtruj: Moc
                            </span>
                            <button
                              onClick={(e) => clearFilter("power", e)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          <select
                            value={
                              filters.power !== null &&
                              filters.power !== undefined
                                ? filters.power
                                : ""
                            }
                            onChange={(e) =>
                              handleFilterChange(
                                "power",
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : null
                              )
                            }
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">Wszystkie</option>
                            {getUniqueValues("power").map((val) => (
                              <option key={val} value={val}>
                                {val} kW
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </th>
                    <th
                      className="px-2 md:px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative"
                      style={{ width: "80px", minWidth: "80px" }}
                    >
                      <div className="flex items-center justify-center">
                        <span>Typ bezpiecznika</span>
                      </div>
                    </th>
                    <th
                      className="px-2 md:px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative"
                      style={{ width: "50px", minWidth: "50px" }}
                    >
                      <div className="flex items-center justify-center relative">
                        <span
                          className="cursor-pointer active:bg-gray-100 px-1 py-1 rounded touch-manipulation"
                          onClick={() => handleSort("phase")}
                        >
                          Faza
                        </span>
                        <div className="flex items-center gap-1 absolute right-0">
                          {sortColumn === "phase" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                          <button
                            onClick={(e) => handleFilterClick("phase", e)}
                            className={`p-1 rounded hover:bg-gray-200 ${
                              hasActiveFilter("phase")
                                ? "text-blue-600"
                                : "text-gray-400"
                            }`}
                            title="Filtruj"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {activeFilter === "phase" && (
                        <div
                          ref={filterRef}
                          className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold">
                              Filtruj: Faza
                            </span>
                            <button
                              onClick={(e) => clearFilter("phase", e)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          <select
                            value={filters.phase}
                            onChange={(e) =>
                              handleFilterChange("phase", e.target.value)
                            }
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">Wszystkie</option>
                            <option value="L1">L1</option>
                            <option value="L2">L2</option>
                            <option value="L3">L3</option>
                            <option value="3Φ">3Φ</option>
                          </select>
                        </div>
                      )}
                    </th>
                    <th
                      className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider select-none relative"
                      style={{ width: "50px", minWidth: "50px" }}
                    >
                      <div className="flex items-center justify-center relative">
                        <span
                          className="cursor-pointer active:bg-gray-100 px-1 py-1 rounded touch-manipulation"
                          onClick={() => handleSort("type")}
                        >
                          Typ
                        </span>
                        <div className="flex items-center gap-1 absolute right-0">
                          {sortColumn === "type" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                          <button
                            onClick={(e) => handleFilterClick("type", e)}
                            className={`p-1 rounded hover:bg-gray-200 ${
                              hasActiveFilter("type")
                                ? "text-blue-600"
                                : "text-gray-400"
                            }`}
                            title="Filtruj"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {activeFilter === "type" && (
                        <div
                          ref={filterRef}
                          className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold">
                              Filtruj: Typ
                            </span>
                            <button
                              onClick={(e) => clearFilter("type", e)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          <select
                            value={filters.type}
                            onChange={(e) =>
                              handleFilterChange("type", e.target.value)
                            }
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">Wszystkie</option>
                            <option value="1φ">1φ</option>
                            <option value="3φ">3φ</option>
                          </select>
                        </div>
                      )}
                    </th>
                    <th
                      className="px-2 md:px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ width: "60px", minWidth: "60px" }}
                    >
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedCircuits.map((circuit) => {
                    const isHighlighted = highlightedIds.includes(circuit.id);
                    const isEditing = editingId === circuit.id;
                    const isPhaseSelected = selectedPhase !== null;
                    const matchesSelectedPhase =
                      selectedPhase === circuit.phase;
                    const shouldHighlight =
                      isPhaseSelected && matchesSelectedPhase;
                    const shouldGrayOut =
                      isPhaseSelected && !matchesSelectedPhase;

                    // Check if this circuit should be highlighted for total power (all L1, L2, L3)
                    const shouldHighlightTotalPower =
                      highlightTotalPower &&
                      (circuit.phase === "L1" ||
                        circuit.phase === "L2" ||
                        circuit.phase === "L3");

                    // Check if this circuit has maximum power value
                    const maxPower =
                      circuits.length > 0
                        ? Math.max(...circuits.map((c) => c.power))
                        : 0;
                    const shouldHighlightMaxPower =
                      highlightMaxPower && circuit.power === maxPower;

                    return (
                      <tr
                        key={circuit.id}
                        onDoubleClick={() => {
                          if (!isEditing) {
                            handleEdit(circuit);
                          }
                        }}
                        onClick={(e) => {
                          // Set selected row
                          setSelectedRowId(circuit.id);

                          // Single click on another row - validate and save current editing, then start editing new row
                          if (
                            editingId !== null &&
                            editingId !== circuit.id &&
                            !isEditing
                          ) {
                            if (editingCircuit) {
                              // Validate description before saving
                              if (
                                !editingCircuit.description ||
                                editingCircuit.description.trim() === ""
                              ) {
                                setShowMissingDescriptionPopup(true);
                                return;
                              }
                              setCircuits(
                                circuits.map((c) =>
                                  c.id === editingId ? editingCircuit : c
                                )
                              );
                            }
                            handleEdit(circuit);
                          }
                        }}
                        className={`${
                          selectedRowId === circuit.id
                            ? "bg-gray-100"
                            : "bg-white"
                        } ${
                          isEditing ? "cursor-default" : "cursor-pointer"
                        } transition-colors`}
                      >
                        <td
                          className="px-2 md:px-4 py-2 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900 border-r border-gray-200 text-center"
                          style={{ width: "25px", minWidth: "25px" }}
                        >
                          {isEditing ? (
                            <input
                              type="number"
                              value={
                                editingCircuit?.circuitNumber ||
                                circuit.circuitNumber
                              }
                              onChange={(e) => {
                                const updated = editingCircuit
                                  ? {
                                      ...editingCircuit,
                                      circuitNumber:
                                        parseInt(e.target.value) || 0,
                                    }
                                  : null;
                                setEditingCircuit(updated);
                                if (updated) {
                                  setCircuits(
                                    circuits.map((c) =>
                                      c.id === updated.id ? updated : c
                                    )
                                  );
                                }
                              }}
                              className="w-16 px-2 py-1 border border-gray-300 rounded"
                            />
                          ) : (
                            circuit.circuitNumber
                          )}
                        </td>
                        <td className="px-2 md:px-4 py-2 text-xs md:text-sm text-gray-900 border-r border-gray-200">
                          {isEditing ? (
                            <div className="relative">
                              <input
                                type="text"
                                list={`circuit-templates-${circuit.id}`}
                                value={
                                  editingCircuit?.description ||
                                  circuit.description
                                }
                                onChange={(e) => {
                                  const newDescription = e.target.value;
                                  // Check if the entered value matches a template
                                  const matchingTemplate =
                                    CIRCUIT_TEMPLATES.find(
                                      (t) => t.description === newDescription
                                    );
                                  let updated: Circuit | null = null;
                                  if (matchingTemplate && editingCircuit) {
                                    // Auto-fill all fields from template
                                    updated = {
                                      ...editingCircuit,
                                      description: matchingTemplate.description,
                                      zone: matchingTemplate.zone,
                                      voltage: matchingTemplate.voltage,
                                      cable: matchingTemplate.cable,
                                      power: matchingTemplate.power,
                                      phase: matchingTemplate.phase,
                                      type: matchingTemplate.type,
                                    };
                                  } else {
                                    // Just update description for custom text
                                    updated = editingCircuit
                                      ? {
                                          ...editingCircuit,
                                          description: newDescription,
                                        }
                                      : null;
                                  }
                                  setEditingCircuit(updated);
                                  if (updated) {
                                    setCircuits(
                                      circuits.map((c) =>
                                        c.id === updated.id ? updated : c
                                      )
                                    );
                                  }
                                }}
                                onInput={(e) => {
                                  // Handle selection from datalist
                                  const target = e.target as HTMLInputElement;
                                  const newDescription = target.value;
                                  const matchingTemplate =
                                    CIRCUIT_TEMPLATES.find(
                                      (t) => t.description === newDescription
                                    );
                                  if (matchingTemplate && editingCircuit) {
                                    const updated = {
                                      ...editingCircuit,
                                      description: matchingTemplate.description,
                                      zone: matchingTemplate.zone,
                                      voltage: matchingTemplate.voltage,
                                      cable: matchingTemplate.cable,
                                      power: matchingTemplate.power,
                                      phase: matchingTemplate.phase,
                                      type: matchingTemplate.type,
                                    };
                                    setEditingCircuit(updated);
                                    setCircuits(
                                      circuits.map((c) =>
                                        c.id === updated.id ? updated : c
                                      )
                                    );
                                  }
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                placeholder="Wybierz szablon lub wpisz własny"
                              />
                              <datalist id={`circuit-templates-${circuit.id}`}>
                                {CIRCUIT_TEMPLATES.map((template, idx) => (
                                  <option
                                    key={idx}
                                    value={template.description}
                                  />
                                ))}
                              </datalist>
                            </div>
                          ) : (
                            circuit.description
                          )}
                        </td>
                        <td
                          className="px-2 md:px-4 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 border-r border-gray-200 text-center"
                          style={{ width: "26px", minWidth: "26px" }}
                        >
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={
                                editingCircuit?.socketSwitchCount ??
                                circuit.socketSwitchCount ??
                                0
                              }
                              onChange={(e) => {
                                const updated = editingCircuit
                                  ? {
                                      ...editingCircuit,
                                      socketSwitchCount:
                                        parseInt(e.target.value) || 0,
                                    }
                                  : null;
                                setEditingCircuit(updated);
                                if (updated) {
                                  setCircuits(
                                    circuits.map((c) =>
                                      c.id === updated.id ? updated : c
                                    )
                                  );
                                }
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                          ) : (
                            circuit.socketSwitchCount ?? 0
                          )}
                        </td>
                        <td
                          className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 text-center"
                          style={{ width: "50px" }}
                        >
                          {isEditing ? (
                            <select
                              value={editingCircuit?.zone || circuit.zone}
                              onChange={(e) => {
                                const updated = editingCircuit
                                  ? {
                                      ...editingCircuit,
                                      zone: e.target.value as
                                        | "Parter"
                                        | "Piętro",
                                    }
                                  : null;
                                setEditingCircuit(updated);
                                if (updated) {
                                  setCircuits(
                                    circuits.map((c) =>
                                      c.id === updated.id ? updated : c
                                    )
                                  );
                                }
                              }}
                              className="px-2 py-1 border border-gray-300 rounded"
                            >
                              <option value="Parter">Parter</option>
                              <option value="Piętro">Piętro</option>
                            </select>
                          ) : (
                            circuit.zone
                          )}
                        </td>
                        <td
                          className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 text-center"
                          style={{ width: "50px" }}
                        >
                          {isEditing ? (
                            <input
                              type="number"
                              value={editingCircuit?.voltage || circuit.voltage}
                              onChange={(e) => {
                                const updated = editingCircuit
                                  ? {
                                      ...editingCircuit,
                                      voltage: parseInt(e.target.value) || 0,
                                    }
                                  : null;
                                setEditingCircuit(updated);
                                if (updated) {
                                  setCircuits(
                                    circuits.map((c) =>
                                      c.id === updated.id ? updated : c
                                    )
                                  );
                                }
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded"
                            />
                          ) : (
                            circuit.voltage
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 text-center">
                          {isEditing ? (
                            <select
                              value={editingCircuit?.cable || circuit.cable}
                              onChange={(e) => {
                                const updated = editingCircuit
                                  ? { ...editingCircuit, cable: e.target.value }
                                  : null;
                                setEditingCircuit(updated);
                                if (updated) {
                                  setCircuits(
                                    circuits.map((c) =>
                                      c.id === updated.id ? updated : c
                                    )
                                  );
                                }
                              }}
                              className="px-2 py-1 border border-gray-300 rounded"
                            >
                              <option value="YDYpżo 3x1,5">YDYpżo 3x1,5</option>
                              <option value="YDYpżo 3x2,5">YDYpżo 3x2,5</option>
                              <option value="YDYpżo 5x4">YDYpżo 5x4</option>
                            </select>
                          ) : (
                            circuit.cable
                          )}
                        </td>
                        <td
                          className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 text-center"
                          style={{ width: "70px" }}
                        >
                          {isEditing ? (
                            <input
                              type="number"
                              step="1"
                              value={
                                editingCircuit?.length || circuit.length || 0
                              }
                              onChange={(e) => {
                                const updated = editingCircuit
                                  ? {
                                      ...editingCircuit,
                                      length: parseFloat(e.target.value) || 0,
                                    }
                                  : null;
                                setEditingCircuit(updated);
                                if (updated) {
                                  setCircuits(
                                    circuits.map((c) =>
                                      c.id === updated.id ? updated : c
                                    )
                                  );
                                }
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded"
                            />
                          ) : (
                            circuit.length || 0
                          )}
                        </td>
                        <td
                          className="px-2 md:px-4 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 border-r border-gray-200 text-center"
                          style={{ width: "30px", minWidth: "30px" }}
                        >
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.1"
                              value={editingCircuit?.power || circuit.power}
                              onChange={(e) => {
                                const updated = editingCircuit
                                  ? {
                                      ...editingCircuit,
                                      power: parseFloat(e.target.value) || 0,
                                    }
                                  : null;
                                setEditingCircuit(updated);
                                if (updated) {
                                  setCircuits(
                                    circuits.map((c) =>
                                      c.id === updated.id ? updated : c
                                    )
                                  );
                                }
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded"
                            />
                          ) : (
                            circuit.power
                          )}
                        </td>
                        <td
                          className="px-2 md:px-4 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 border-r border-gray-200 text-center"
                          style={{ width: "80px", minWidth: "80px" }}
                        >
                          {isEditing ? (
                            <select
                              value={
                                editingCircuit?.fuseType ||
                                circuit.fuseType ||
                                "10A"
                              }
                              onChange={(e) => {
                                const updated = editingCircuit
                                  ? {
                                      ...editingCircuit,
                                      fuseType: e.target.value,
                                    }
                                  : null;
                                setEditingCircuit(updated);
                                if (updated) {
                                  setCircuits(
                                    circuits.map((c) =>
                                      c.id === updated.id ? updated : c
                                    )
                                  );
                                }
                              }}
                              className="px-2 py-1 border border-gray-300 rounded text-xs w-full"
                            >
                              {((editingCircuit?.phase || circuit.phase) ===
                              "3Φ"
                                ? apiFuseTypes3Phase
                                : apiFuseTypes1Phase
                              ).map((fuseType) => (
                                <option key={fuseType} value={fuseType}>
                                  {fuseType}
                                </option>
                              ))}
                            </select>
                          ) : (
                            circuit.fuseType || "10A"
                          )}
                        </td>
                        <td
                          className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 text-center"
                          style={{ width: "50px" }}
                        >
                          {isEditing ? (
                            <select
                              value={editingCircuit?.phase || circuit.phase}
                              onChange={(e) => {
                                const newPhase = e.target.value as
                                  | "L1"
                                  | "L2"
                                  | "L3"
                                  | "3Φ";
                                const newType: "1φ" | "3φ" =
                                  newPhase === "3Φ" ? "3φ" : "1φ";
                                // Reset fuse type if switching between 1-phase and 3-phase
                                const currentFuseType =
                                  editingCircuit?.fuseType ||
                                  circuit.fuseType ||
                                  "10A";
                                const availableFuses =
                                  newPhase === "3Φ"
                                    ? apiFuseTypes3Phase
                                    : apiFuseTypes1Phase;
                                const newFuseType = availableFuses.includes(
                                  currentFuseType
                                )
                                  ? currentFuseType
                                  : newPhase === "3Φ"
                                  ? "16A"
                                  : "10A";

                                const updated = editingCircuit
                                  ? {
                                      ...editingCircuit,
                                      phase: newPhase,
                                      type: newType,
                                      fuseType: newFuseType,
                                    }
                                  : null;
                                setEditingCircuit(updated);
                                if (updated) {
                                  setCircuits(
                                    circuits.map((c) =>
                                      c.id === updated.id ? updated : c
                                    )
                                  );
                                }
                              }}
                              className="px-2 py-1 border border-gray-300 rounded"
                            >
                              <option value="L1">L1</option>
                              <option value="L2">L2</option>
                              <option value="L3">L3</option>
                              <option value="3Φ">3Φ</option>
                            </select>
                          ) : (
                            circuit.phase
                          )}
                        </td>
                        <td
                          className="px-2 md:px-4 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 text-center"
                          style={{ width: "50px", minWidth: "50px" }}
                        >
                          {circuit.type}
                        </td>
                        <td className="px-2 md:px-4 py-2 whitespace-nowrap text-xs md:text-sm font-medium text-center">
                          {isEditing ? (
                            <div className="flex space-x-2 items-center">
                              <button
                                onClick={() => {
                                  // If description is empty, remove the row instead of canceling
                                  if (
                                    editingCircuit &&
                                    (!editingCircuit.description ||
                                      editingCircuit.description.trim() === "")
                                  ) {
                                    handleDelete(circuit.id);
                                  } else {
                                    handleCancel();
                                  }
                                }}
                                className="text-gray-600 active:text-gray-900 p-1.5 md:p-1 rounded active:bg-gray-100 transition-colors touch-manipulation"
                                title="Anuluj"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-2 items-center">
                              <button
                                onClick={() => handleDelete(circuit.id)}
                                className="text-gray-600 active:text-gray-900 p-1.5 md:p-1 rounded active:bg-red-50 transition-colors touch-manipulation"
                                title="Usuń"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td
                      colSpan={10}
                      className="px-2 md:px-4 py-3 md:py-4 bg-gray-50 border-t border-gray-200"
                    >
                      <button
                        onClick={handleAdd}
                        className={`w-full ${getButtonClass(
                          "neutral"
                        )} flex items-center justify-center space-x-2 text-sm md:text-base py-2 md:py-2 touch-manipulation`}
                      >
                        <span>+</span>
                        <span>Dodaj obwód</span>
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Summary */}
        <div
          className={`relative transition-all duration-300 ${
            rightSidebarVisible ? "flex-1 w-full md:w-auto" : "w-0"
          }`}
        >
          {/* Toggle Button - Always visible at top */}
          <button
            onClick={() => setRightSidebarVisible(!rightSidebarVisible)}
            className={`fixed md:absolute top-4 z-50 bg-white border border-gray-300 rounded-l-lg p-2 shadow-lg hover:bg-gray-50 active:bg-gray-100 transition-all duration-300 touch-manipulation ${
              rightSidebarVisible
                ? "right-[calc(100%-1rem)] md:right-[calc(100%-1rem)]"
                : "right-0"
            }`}
            title={
              rightSidebarVisible ? "Ukryj podsumowanie" : "Pokaż podsumowanie"
            }
          >
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
                rightSidebarVisible ? "" : "rotate-180"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <div
            className={`bg-white p-2 md:p-4 overflow-y-auto max-h-screen sticky top-0 transition-all duration-300 ease-in-out ${
              rightSidebarVisible
                ? "translate-x-0 opacity-100 z-40"
                : "translate-x-full md:translate-x-full opacity-0 pointer-events-none"
            }`}
          >
            {/* Wymagane Komponenty */}
            <div className="mb-4 md:mb-6">
              <div className="bg-blue-50 px-2 md:px-4 py-2 md:py-3 border-b border-blue-200 mb-2 md:mb-4 rounded-t-lg">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
                  <div className="flex-1">
                    <SearchComponent
                      value={componentSearchQuery}
                      onChange={setComponentSearchQuery}
                      placeholder="Szukaj po nazwie lub opisie..."
                    />
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-gray-900 whitespace-nowrap">
                    Wymagane Komponenty
                  </h2>
                </div>
              </div>
              <div className="h-[60vh] md:h-[75vh] overflow-y-auto">
                {/* Loading state */}
                {componentsLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">
                        Ładowanie komponentów...
                      </p>
                    </div>
                  </div>
                )}
                {/* Error state */}
                {componentsError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <div className="text-red-600 mr-2">⚠️</div>
                      <div>
                        <h3 className="text-sm font-medium text-red-800">
                          Błąd ładowania komponentów
                        </h3>
                        <p className="text-sm text-red-700 mt-1">
                          {componentsError}
                        </p>
                        <button
                          onClick={() => window.location.reload()}
                          className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          Spróbuj ponownie
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Components list */}
                {!componentsLoading &&
                  !componentsError &&
                  (() => {
                    // Helper function to check if component matches search
                    const matchesSearch = (componentId: string): boolean => {
                      if (!componentSearchQuery.trim()) return true;
                      const query = componentSearchQuery.toLowerCase();
                      const componentTemplate = REQUIRED_COMPONENTS.find(
                        (c) => c.id === componentId
                      );
                      const component = requiredComponents.find(
                        (c) => c.id === componentId
                      );
                      if (!componentTemplate && !component) return false;
                      const nameMatch = (
                        component?.name ||
                        componentTemplate?.name ||
                        ""
                      )
                        .toLowerCase()
                        .includes(query);
                      const descriptionMatch = (
                        componentTemplate?.description || ""
                      )
                        .toLowerCase()
                        .includes(query);
                      return nameMatch || descriptionMatch;
                    };

                    // Helper function to check if category/subcategory should be shown
                    const shouldShowCategory = (
                      category: ComponentCategory
                    ): boolean => {
                      if (!componentSearchQuery.trim()) return true;
                      // Check if any component in this category matches
                      const allComponentIds: string[] = [];
                      if (category.components)
                        allComponentIds.push(...category.components);
                      if (category.subcategories) {
                        category.subcategories.forEach((sub) => {
                          allComponentIds.push(...sub.components);
                        });
                      }
                      return allComponentIds.some((id) => matchesSearch(id));
                    };

                    const shouldShowSubcategory = (
                      subcategory: ComponentSubcategory
                    ): boolean => {
                      if (!componentSearchQuery.trim()) return true;
                      return subcategory.components.some((id) =>
                        matchesSearch(id)
                      );
                    };

                    return COMPONENT_CATEGORIES.filter((category) =>
                      shouldShowCategory(category)
                    ).map((category) => {
                      const isExpanded = expandedCategories.has(category.id);
                      const hasSubcategories =
                        category.subcategories &&
                        category.subcategories.length > 0;
                      const hasDirectComponents =
                        category.components && category.components.length > 0;

                      return (
                        <div
                          key={category.id}
                          className="mb-2 border border-gray-200 rounded-lg overflow-hidden"
                        >
                          {/* Category Header */}
                          <button
                            onClick={() => toggleCategory(category.id)}
                            className="w-full px-2 md:px-3 py-2 bg-gray-100 active:bg-gray-200 flex items-center justify-between text-left transition-colors touch-manipulation"
                          >
                            <span className="font-semibold text-xs md:text-sm text-gray-900">
                              {category.name}
                            </span>
                            <svg
                              className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>

                          {/* Category Content */}
                          {isExpanded && (
                            <div className="bg-white">
                              {/* Direct components in category */}
                              {hasDirectComponents && (
                                <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {category
                                    .components!.filter((componentId) => {
                                      const component = requiredComponents.find(
                                        (c) => c.id === componentId
                                      );
                                      return (
                                        component && matchesSearch(componentId)
                                      );
                                    })
                                    .map((componentId) => {
                                      const component = requiredComponents.find(
                                        (c) => c.id === componentId
                                      );
                                      const componentTemplate =
                                        REQUIRED_COMPONENTS.find(
                                          (c) => c.id === componentId
                                        );
                                      if (!component) return null;
                                      return (
                                        <div
                                          key={componentId}
                                          className="self-start w-full"
                                        >
                                          <ComponentItem
                                            component={component}
                                            componentTemplate={
                                              componentTemplate
                                            }
                                            onQuantityChange={(
                                              id,
                                              quantity
                                            ) => {
                                              setRequiredComponents((prev) =>
                                                prev.map((comp) =>
                                                  comp.id === id
                                                    ? { ...comp, quantity }
                                                    : comp
                                                )
                                              );
                                            }}
                                          />
                                        </div>
                                      );
                                    })}
                                </div>
                              )}

                              {/* Subcategories */}
                              {hasSubcategories && (
                                <div className="space-y-1">
                                  {category
                                    .subcategories!.filter((subcategory) =>
                                      shouldShowSubcategory(subcategory)
                                    )
                                    .map((subcategory) => {
                                      const isSubExpanded =
                                        expandedSubcategories.has(
                                          subcategory.id
                                        );
                                      return (
                                        <div
                                          key={subcategory.id}
                                          className="border-t border-gray-100"
                                        >
                                          {/* Subcategory Header */}
                                          <button
                                            onClick={() =>
                                              toggleSubcategory(subcategory.id)
                                            }
                                            className="w-full px-2 md:px-4 py-2 bg-gray-50 active:bg-gray-100 flex items-center justify-between text-left transition-colors touch-manipulation"
                                          >
                                            <span className="font-medium text-xs text-gray-700">
                                              {subcategory.name}
                                            </span>
                                            <svg
                                              className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${
                                                isSubExpanded ? "rotate-90" : ""
                                              }`}
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                              />
                                            </svg>
                                          </button>

                                          {/* Subcategory Components */}
                                          {isSubExpanded && (
                                            <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                              {subcategory.components
                                                .filter((componentId) => {
                                                  const component =
                                                    requiredComponents.find(
                                                      (c) =>
                                                        c.id === componentId
                                                    );
                                                  return (
                                                    component &&
                                                    matchesSearch(componentId)
                                                  );
                                                })
                                                .map((componentId) => {
                                                  const component =
                                                    requiredComponents.find(
                                                      (c) =>
                                                        c.id === componentId
                                                    );
                                                  const componentTemplate =
                                                    REQUIRED_COMPONENTS.find(
                                                      (c) =>
                                                        c.id === componentId
                                                    );
                                                  if (!component) return null;
                                                  return (
                                                    <div
                                                      key={componentId}
                                                      className="self-start w-full"
                                                    >
                                                      <ComponentItem
                                                        component={component}
                                                        componentTemplate={
                                                          componentTemplate
                                                        }
                                                        onQuantityChange={(
                                                          id,
                                                          quantity
                                                        ) => {
                                                          setRequiredComponents(
                                                            (prev) =>
                                                              prev.map((comp) =>
                                                                comp.id === id
                                                                  ? {
                                                                      ...comp,
                                                                      quantity,
                                                                    }
                                                                  : comp
                                                              )
                                                          );
                                                        }}
                                                      />
                                                    </div>
                                                  );
                                                })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                )
              </div>
              {/* Total components cost */}
              {(() => {
                const totalComponentsCost = requiredComponents.reduce(
                  (sum, comp) => {
                    const componentTemplate = REQUIRED_COMPONENTS.find(
                      (c) => c.id === comp.id
                    );
                    const price = componentTemplate?.price || 0;
                    return sum + price * comp.quantity;
                  },
                  0
                );

                if (totalComponentsCost > 0) {
                  return (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">
                          Suma komponentów:
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          {totalComponentsCost.toFixed(2)} zł
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="bg-orange-50 px-2 md:px-4 py-2 md:py-3 border-b border-orange-200 mb-2 md:mb-4 rounded-t-lg">
              <h2 className="text-base md:text-lg font-bold text-gray-900">
                Podsumowanie i Obliczenia
              </h2>
            </div>

            <div className="space-y-2 md:space-y-4">
              {/* Podsumowanie fazowe */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Podsumowanie fazowe
                </h3>

                <div
                  className={`flex justify-between items-center py-2 md:py-1.5 border-b border-gray-200 cursor-pointer transition-colors text-xs touch-manipulation ${
                    selectedPhase === "L1"
                      ? "bg-blue-100 rounded px-2"
                      : "active:bg-gray-50 rounded px-2"
                  }`}
                  onClick={() => {
                    setSelectedPhase(selectedPhase === "L1" ? null : "L1");
                    setHighlightTotalPower(false);
                    setHighlightMaxPower(false);
                  }}
                >
                  <span
                    className={`font-medium ${
                      selectedPhase === "L1" ? "text-blue-700" : "text-gray-700"
                    }`}
                  >
                    Suma L1 [kW]:
                  </span>
                  <span
                    className={`font-bold ${
                      selectedPhase === "L1" ? "text-blue-900" : "text-gray-900"
                    }`}
                  >
                    {summary.sumL1.toFixed(1)}
                  </span>
                </div>

                <div
                  className={`flex justify-between items-center py-2 md:py-1.5 border-b border-gray-200 cursor-pointer transition-colors text-xs touch-manipulation ${
                    selectedPhase === "L2"
                      ? "bg-blue-100 rounded px-2"
                      : "active:bg-gray-50 rounded px-2"
                  }`}
                  onClick={() => {
                    setSelectedPhase(selectedPhase === "L2" ? null : "L2");
                    setHighlightTotalPower(false);
                    setHighlightMaxPower(false);
                  }}
                >
                  <span
                    className={`font-medium ${
                      selectedPhase === "L2" ? "text-blue-700" : "text-gray-700"
                    }`}
                  >
                    Suma L2 [kW]:
                  </span>
                  <span
                    className={`font-bold ${
                      selectedPhase === "L2" ? "text-blue-900" : "text-gray-900"
                    }`}
                  >
                    {summary.sumL2.toFixed(1)}
                  </span>
                </div>

                <div
                  className={`flex justify-between items-center py-2 md:py-1.5 border-b border-gray-200 cursor-pointer transition-colors text-xs touch-manipulation ${
                    selectedPhase === "L3"
                      ? "bg-blue-100 rounded px-2"
                      : "active:bg-gray-50 rounded px-2"
                  }`}
                  onClick={() => {
                    setSelectedPhase(selectedPhase === "L3" ? null : "L3");
                    setHighlightTotalPower(false);
                    setHighlightMaxPower(false);
                  }}
                >
                  <span
                    className={`font-medium ${
                      selectedPhase === "L3" ? "text-blue-700" : "text-gray-700"
                    }`}
                  >
                    Suma L3 [kW]:
                  </span>
                  <span
                    className={`font-bold ${
                      selectedPhase === "L3" ? "text-blue-900" : "text-gray-900"
                    }`}
                  >
                    {summary.sumL3.toFixed(1)}
                  </span>
                </div>

                <div
                  className={`flex justify-between items-center py-2 md:py-1.5 border-b border-gray-200 cursor-pointer transition-colors text-xs touch-manipulation ${
                    highlightTotalPower
                      ? "bg-green-100 rounded px-2"
                      : "active:bg-gray-50 rounded px-2"
                  }`}
                  onClick={() => {
                    setHighlightTotalPower(!highlightTotalPower);
                    setHighlightMaxPower(false);
                    setSelectedPhase(null);
                  }}
                >
                  <span
                    className={`font-medium ${
                      highlightTotalPower ? "text-green-700" : "text-gray-700"
                    }`}
                  >
                    Moc całkowita [kW]:
                  </span>
                  <span
                    className={`font-bold ${
                      highlightTotalPower ? "text-green-900" : "text-gray-900"
                    }`}
                  >
                    {summary.totalPower.toFixed(1)}
                  </span>
                </div>

                <div
                  className={`flex justify-between items-center py-2 md:py-1.5 border-b border-gray-200 cursor-pointer transition-colors text-xs touch-manipulation ${
                    highlightMaxPower
                      ? "bg-purple-100 rounded px-2"
                      : "active:bg-gray-50 rounded px-2"
                  }`}
                  onClick={() => {
                    setHighlightMaxPower(!highlightMaxPower);
                    setHighlightTotalPower(false);
                    setSelectedPhase(null);
                  }}
                >
                  <span
                    className={`font-medium ${
                      highlightMaxPower ? "text-purple-700" : "text-gray-700"
                    }`}
                  >
                    Maksymalna faza [kW]:
                  </span>
                  <span
                    className={`font-bold ${
                      highlightMaxPower ? "text-purple-900" : "text-gray-900"
                    }`}
                  >
                    {summary.maxPhasePower.toFixed(1)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-gray-200 text-xs">
                  <span className="font-medium text-gray-700">
                    I_req (prąd fazowy) [A]:
                  </span>
                  <span className="font-bold text-gray-900">
                    {summary.iReq.toFixed(9)}
                  </span>
                </div>
              </div>

              {/* Obliczenia i Zabezpieczenia */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Obliczenia i Zabezpieczenia
                </h3>

                <div className="flex justify-between items-center py-1.5 border-b border-gray-200 text-xs">
                  <span className="font-medium text-gray-700">
                    Moc przy psp 0.6 [kW]:
                  </span>
                  <span className="font-bold text-gray-900">
                    {summary.calculatedPower.toFixed(1)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-gray-200 text-xs">
                  <span className="font-medium text-gray-700">
                    Zabezpieczenie Przedlicznikowe:
                  </span>
                  <span className="font-bold text-gray-900">
                    {summary.preMeterProtection} A
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-gray-200 text-xs">
                  <span className="font-medium text-gray-700">
                    Zalecane zabezpieczenie [A]:
                  </span>
                  <span className="font-bold text-gray-900">
                    {summary.recommendedProtection}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-gray-200 text-xs">
                  <span className="font-medium text-gray-700">
                    Sugerowane zabezpieczenie [A]:
                  </span>
                  <span className="font-bold text-gray-900">
                    {summary.suggestedProtection}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-gray-200 text-xs">
                  <span className="font-medium text-gray-700">
                    Sugerowany kabel [mm²]:
                  </span>
                  <span className="font-bold text-gray-900">
                    {summary.suggestedCable}
                  </span>
                </div>
              </div>

              {/* Sumy Faz */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Sumy Faz
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between items-center py-1.5 px-3 bg-gray-50 rounded-lg text-xs">
                    <span className="font-medium text-gray-700">
                      Suma 1 faz:
                    </span>
                    <span className="font-bold text-gray-900">
                      {summary.count1Phase}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 px-3 bg-gray-50 rounded-lg text-xs">
                    <span className="font-medium text-gray-700">
                      Suma 3 faz:
                    </span>
                    <span className="font-bold text-gray-900">
                      {summary.count3Phase}
                    </span>
                  </div>
                </div>
              </div>

              {/* Suma Długości Przewodów */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Suma Długości Przewodów
                </h3>
                <div className="space-y-2">
                  {(() => {
                    // Calculate total length for each cable type
                    const cableLengths: Record<string, number> = {};
                    circuits.forEach((circuit) => {
                      const cable = circuit.cable;
                      const length = circuit.length || 0;
                      cableLengths[cable] = (cableLengths[cable] || 0) + length;
                    });

                    return Object.entries(cableLengths).map(
                      ([cable, totalLength]) => (
                        <div
                          key={cable}
                          className="flex justify-between items-center py-1.5 px-3 bg-gray-50 rounded-lg text-xs"
                        >
                          <span className="font-medium text-gray-700">
                            {cable}:
                          </span>
                          <span className="font-bold text-gray-900">
                            {totalLength.toFixed(1)} m
                          </span>
                        </div>
                      )
                    );
                  })()}
                </div>
              </div>

              {/* Generuj Ofertę Button */}
              <div className="pt-4 md:pt-6 border-t border-gray-200 mt-4 md:mt-6">
                {submitError && (
                  <div className="mb-3 md:mb-4 p-2 md:p-3 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
                    {submitError}
                  </div>
                )}
                <button
                  onClick={async () => {
                    setIsSubmitting(true);
                    setSubmitError(null);

                    try {
                      // Try to get offerId from URL or localStorage
                      const STORAGE_KEY = "volt_offer_draft";
                      const offerId =
                        offerIdFromUrl ||
                        (() => {
                          try {
                            const savedData = localStorage.getItem(STORAGE_KEY);
                            if (savedData) {
                              const parsed = JSON.parse(savedData);
                              return parsed.offerId;
                            }
                          } catch (e) {
                            // Ignore errors
                          }
                          return null;
                        })();

                      let clientData: any = null;
                      let propertyData: any = null;
                      let additionalItemsOnly = false;
                      let roomsData: any[] = [];

                      // If offerId exists, load data from server
                      if (offerId) {
                        try {
                          const offerResponse = await api.offers.getById(
                            offerId
                          );
                          if (offerResponse.success && offerResponse.data) {
                            const offer = offerResponse.data;
                            clientData = offer.clientData;
                            propertyData = offer.property;
                            additionalItemsOnly =
                              offer.additionalItemsOnly || false;
                            roomsData = offer.rooms || [];
                          }
                        } catch (error) {
                          console.error("Error loading offer:", error);
                          // Fall back to localStorage if server load fails
                        }
                      }

                      // Fall back to localStorage if no offerId or server load failed
                      if (!clientData) {
                        const savedData = localStorage.getItem(STORAGE_KEY);

                        if (!savedData) {
                          setSubmitError(
                            "Brak danych klienta. Wypełnij najpierw formularz oferty."
                          );
                          setIsSubmitting(false);
                          return;
                        }

                        const parsed = JSON.parse(savedData);
                        clientData = {
                          investmentName: parsed.investmentName,
                          email: parsed.email,
                          phone: parsed.phone,
                        };
                        propertyData = {
                          info: parsed.propertyInfo,
                          area: parsed.area,
                        };
                        additionalItemsOnly =
                          parsed.additionalItemsOnly || false;
                        roomsData = parsed.rooms || [];
                      }

                      // Validate required fields
                      if (
                        !clientData?.email?.trim() ||
                        !clientData?.investmentName?.trim()
                      ) {
                        setSubmitError(
                          "Wypełnij dane klienta (nazwa inwestycji i email)."
                        );
                        setIsSubmitting(false);
                        return;
                      }

                      if (
                        !propertyData?.area ||
                        (typeof propertyData.area === "string" &&
                          !propertyData.area.trim())
                      ) {
                        setSubmitError(
                          "Wypełnij informacje o nieruchomości (powierzchnia)."
                        );
                        setIsSubmitting(false);
                        return;
                      }

                      // Prepare circuits data from calculation page
                      const circuitsData = circuits.map((circuit) => ({
                        circuitNumber: circuit.circuitNumber,
                        description: circuit.description,
                        socketSwitchCount: circuit.socketSwitchCount || 0,
                        zone: circuit.zone,
                        voltage: circuit.voltage,
                        cable: circuit.cable,
                        length: circuit.length || 0,
                        power: circuit.power,
                        fuseType: circuit.fuseType,
                        phase: circuit.phase,
                        type: circuit.type,
                      }));

                      // Prepare required components data
                      const componentsData = requiredComponents
                        .filter((comp) => comp.quantity > 0)
                        .map((comp) => {
                          const componentTemplate = REQUIRED_COMPONENTS.find(
                            (c) => c.id === comp.id
                          );
                          return {
                            id: comp.id,
                            name: comp.name,
                            fields: comp.fields,
                            quantity: comp.quantity,
                            price: componentTemplate?.price || 0,
                          };
                        });

                      // Prepare offer data
                      const offerData = {
                        additionalItemsOnly: additionalItemsOnly,
                        clientData: {
                          investmentName: clientData.investmentName.trim(),
                          email: clientData.email.trim(),
                          phone: clientData.phone?.trim() || "",
                        },
                        property: {
                          info: propertyData.info?.trim() || "",
                          area:
                            typeof propertyData.area === "string"
                              ? parseFloat(propertyData.area)
                              : propertyData.area || 0,
                        },
                        rooms: roomsData,
                        circuits: circuitsData,
                        requiredComponents: componentsData,
                      };

                      // If offerId exists, update the offer; otherwise create a new one
                      const response = offerId
                        ? await api.offers.update(offerId, offerData)
                        : await api.offers.create(offerData);

                      if (response.success) {
                        const finalOfferId = offerId || response.data.id;

                        // Update localStorage with offerId for future reference
                        try {
                          const currentData = localStorage.getItem(STORAGE_KEY);
                          const parsed = currentData
                            ? JSON.parse(currentData)
                            : {};
                          parsed.offerId = finalOfferId;
                          localStorage.setItem(
                            STORAGE_KEY,
                            JSON.stringify(parsed)
                          );
                        } catch (e) {
                          // Ignore localStorage errors
                        }

                        // Redirect to summary page
                        router.push(`/offer/summary?id=${finalOfferId}`);
                      } else {
                        setSubmitError(
                          response.error || "Błąd podczas zapisywania oferty"
                        );
                        setIsSubmitting(false);
                      }
                    } catch (error) {
                      console.error("Error submitting offer:", error);
                      setSubmitError(
                        error instanceof Error
                          ? error.message
                          : "Błąd podczas zapisywania oferty"
                      );
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className={`w-full ${getButtonClass(
                    "neutral",
                    "disabled:bg-gray-400 disabled:cursor-not-allowed px-4 md:px-6 py-3 md:py-4 text-sm md:text-lg font-semibold"
                  )} flex items-center justify-center touch-manipulation`}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Zapisywanie...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-6 h-6 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Generuj Ofertę
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalculationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Ładowanie...</p>
          </div>
        </div>
      }
    >
      <CalculationPageContent />
    </Suspense>
  );
}
