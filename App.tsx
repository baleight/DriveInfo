import React, { useEffect, useState, useMemo } from 'react';
import { Header } from './components/Header';
import { ResourceTable } from './components/ResourceTable';
import { AddResourceModal } from './components/AddResourceModal';
import { ResourceItem } from './types';
import { getResources, addResource } from './services/resourceService';
import { Plus, Search, Loader2, Github } from 'lucide-react';

const App: React.FC = () => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      const data = await getResources();
      setResources(data);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleAddResource = async (newResourceData: Omit<ResourceItem, 'id'>) => {
    const addedItem = await addResource(newResourceData);
    setResources(prev => [addedItem, ...prev]);
  };

  // Filter Logic
  const filteredResources = useMemo(() => {
    if (!searchTerm) return resources;
    const lowerTerm = searchTerm.toLowerCase();
    return resources.filter(r => 
      r.title.toLowerCase().includes(lowerTerm) || 
      r.category.toLowerCase().includes(lowerTerm) ||
      (r.description && r.description.toLowerCase().includes(lowerTerm))
    );
  }, [resources, searchTerm]);

  const notes = filteredResources.filter(r => r.type === 'note');
  const books = filteredResources.filter(r => r.type === 'book');

  return (
    <div className="min-h-screen pb-32 selection:bg-blue-100 selection:text-blue-900">
      <Header />

      <main className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-12 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
            <Search size={20} />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            placeholder="Cerca appunti, libri, corsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
            <Loader2 className="animate-spin text-blue-500" size={40} />
            <p className="font-medium animate-pulse">Caricamento risorse in corso...</p>
          </div>
        ) : (
          <div className="space-y-16">
            {filteredResources.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-slate-500">Nessuna risorsa trovata per "{searchTerm}"</p>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-blue-600 font-semibold hover:underline"
                >
                  Rimuovi filtri
                </button>
              </div>
            ) : (
              <>
                {notes.length > 0 && <ResourceTable title="Appunti & Risorse Web" items={notes} type="note" />}
                {books.length > 0 && <ResourceTable title="Libreria Digitale (PDF)" items={books} type="book" />}
              </>
            )}
          </div>
        )}
      </main>

      {/* Floating Actions */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-40">
         {/* GitHub Link (Optional flair) */}
         <a 
            href="https://github.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-white text-slate-700 rounded-full shadow-lg hover:shadow-xl border border-slate-100 flex items-center justify-center transition-all hover:scale-110 hidden md:flex"
            title="Visualizza codice sorgente"
         >
            <Github size={20} />
         </a>

         {/* Main CTA */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          title="Aggiungi nuova risorsa"
        >
          <Plus size={28} />
        </button>
      </div>

      <AddResourceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleAddResource}
      />
    </div>
  );
};

export default App;