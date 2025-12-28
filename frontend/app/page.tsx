import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 via-purple-100 to-purple-300 relative overflow-hidden">
      {/* Gradient overlay for darker edges */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-purple-400/20 pointer-events-none"></div>
      {/* Header */}
      <header className="bg-purple-600 text-white px-6 py-4 shadow-lg relative z-20">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold">
              ELGEN GENERATOR OFERT
            </div>
            <div className="text-sm opacity-90">
              Instalacje Elektryczne
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">maciejkruszyniak@gmail.com</span>
            <button className="px-4 py-2 bg-purple-700 hover:bg-purple-800 rounded transition-colors">
              Wyloguj
            </button>
          </div>
        </div>
      </header>

    

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Witaj w Generatorze Ofert
          </h1>
          <p className="text-xl text-gray-600">
            Wybierz akcję aby rozpocząć
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Card 1: Nowa Oferta */}
          <Link href="/offer/new" className="group">
            <div className="bg-green-500 hover:bg-green-600 rounded-xl p-8 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl text-white h-full flex flex-col items-center justify-center text-center min-h-[250px]">
              <div className="relative mb-4">
                <div className="text-7xl">📄</div>
                <div className="absolute -top-2 -right-2 text-4xl font-bold">+</div>
              </div>
              <h2 className="text-2xl font-bold mb-3">Nowa Oferta</h2>
              <p className="text-green-50 text-sm">Utwórz nową ofertę dla klienta</p>
            </div>
          </Link>

          {/* Card 2: Lista Ofert */}
          <Link href="/orders" className="group">
            <div className="bg-blue-500 hover:bg-blue-600 rounded-xl p-8 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl text-white h-full flex flex-col items-center justify-center text-center min-h-[250px]">
              <div className="mb-4 text-7xl">📚</div>
              <h2 className="text-2xl font-bold mb-3">Lista Ofert</h2>
              <p className="text-blue-50 text-sm">Przeglądaj zapisane oferty</p>
            </div>
          </Link>

          {/* Card 3: Dashboard */}
          <Link href="#" className="group">
            <div className="bg-cyan-400 hover:bg-cyan-500 rounded-xl p-8 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl text-white h-full flex flex-col items-center justify-center text-center min-h-[250px]">
              <div className="mb-4 text-7xl">📊</div>
              <h2 className="text-2xl font-bold mb-3">Dashboard</h2>
              <p className="text-cyan-50 text-sm">Statystyki i analizy</p>
            </div>
          </Link>

          {/* Card 4: Szablony */}
          <Link href="#" className="group">
            <div className="bg-purple-500 hover:bg-purple-600 rounded-xl p-8 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl text-white h-full flex flex-col items-center justify-center text-center min-h-[250px]">
              <div className="mb-4 text-7xl">📑</div>
              <h2 className="text-2xl font-bold mb-3">Szablony</h2>
              <p className="text-purple-50 text-sm">Gotowe szablony ofert</p>
            </div>
          </Link>

          {/* Card 5: Kalkulacja */}
          <Link href="/calculation" className="group">
            <div className="bg-orange-500 hover:bg-orange-600 rounded-xl p-8 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl text-white h-full flex flex-col items-center justify-center text-center min-h-[250px]">
              <div className="mb-4 text-7xl">🔢</div>
              <h2 className="text-2xl font-bold mb-3">Kalkulacja</h2>
              <p className="text-orange-50 text-sm">Obliczenia obwodów elektrycznych</p>
            </div>
          </Link>

          {/* Card 6: EleQuicz */}
          <Link href="/elequicz" className="group">
            <div className="bg-indigo-500 hover:bg-indigo-600 rounded-xl p-8 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl text-white h-full flex flex-col items-center justify-center text-center min-h-[250px]">
              <div className="mb-4 text-7xl">❓</div>
              <h2 className="text-2xl font-bold mb-3">EleQuicz</h2>
              <p className="text-indigo-50 text-sm">Pytania i odpowiedzi o instalacje elektryczne</p>
            </div>
          </Link>

          {/* Card 7: Dobór Kabli */}
          <Link href="/dobor-kabli" className="group">
            <div className="bg-teal-500 hover:bg-teal-600 rounded-xl p-8 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl text-white h-full flex flex-col items-center justify-center text-center min-h-[250px]">
              <div className="mb-4 text-7xl">🔌</div>
              <h2 className="text-2xl font-bold mb-3">Dobór Kabli</h2>
              <p className="text-teal-50 text-sm">Precyzyjny wybór przewodów - przekrój, obciążalność i więcej</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
