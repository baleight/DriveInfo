import React, { useEffect, useState, useMemo } from 'react';
import { Header } from './components/Header';
import { ResourceTable } from './components/ResourceTable';
import { AddResourceModal } from './components/AddResourceModal';
import { ResourceItem } from './types';
import { getResources, addResource, updateResource, deleteResource } from './services/resourceService';
import { Plus, Search, Loader2, X, Github, Mail } from 'lucide-react';

const App: React.FC = () => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
          const data = await getResources();
          setResources(data);
      } catch (e) {
          console.error("Error loading resources", e);
      } finally {
          setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleCreateOrUpdate = async (
    formData: Omit<ResourceItem, 'id'>, 
    onProgress?: (percentage: number) => void
  ) => {
    if (editingItem) {
        // UPDATE MODE
        const updatedResource = { ...formData, id: editingItem.id } as ResourceItem;
        setResources(prev => prev.map(r => r.id === editingItem.id ? updatedResource : r));
        await updateResource(updatedResource);
    } else {
        // CREATE MODE
        // We pass the onProgress callback down to the service
        const addedItem = await addResource(formData, onProgress);
        setResources(prev => [addedItem, ...prev]);
    }
    setEditingItem(null);
  };

  const handleEditClick = (item: ResourceItem) => {
      setEditingItem(item);
      setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
      setResources(prev => prev.filter(r => r.id !== id)); // Optimistic delete
      await deleteResource(id);
  };

  const handleModalClose = () => {
      setIsModalOpen(false);
      setEditingItem(null);
  };

  // Get unique categories from data
  const availableCategories = useMemo(() => {
      const cats = new Set(resources.map(r => r.category).filter(c => c && c.trim() !== ''));
      return Array.from(cats).sort();
  }, [resources]);

  // Filter Logic
  const filteredResources = useMemo(() => {
    let result = resources;

    // 1. Filter by Category
    if (selectedCategory) {
        result = result.filter(r => r.category === selectedCategory);
    }

    // 2. Filter by Search Term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.title.toLowerCase().includes(lowerTerm) || 
        (r.category && r.category.toLowerCase().includes(lowerTerm)) ||
        (r.description && r.description.toLowerCase().includes(lowerTerm))
      );
    }

    return result;
  }, [resources, searchTerm, selectedCategory]);

  // Robust splitting: If it's explicitly a book, it goes to books. Everything else goes to notes.
  // This ensures items with missing or malformed 'type' fields still appear in the main list.
  const books = filteredResources.filter(r => r.type === 'book');
  const notes = filteredResources.filter(r => r.type !== 'book');

  return (
    <div className="min-h-screen selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      <Header />

      <main className="w-full px-6 lg:px-12 flex-1 pb-12">
        
        {/* Search & Filter Section - Kept centered for UX but slightly wider */}
        <div className="max-w-5xl mx-auto mb-12">
            
            {/* Search Bar */}
            <div className="relative group mb-6">
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
                 {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
                    >
                        <X size={16} />
                    </button>
                 )}
            </div>

            {/* Category Filters (Chips) */}
            {!isLoading && resources.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center animate-fade-in">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                            selectedCategory === null 
                            ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                        Tutti
                    </button>
                    {availableCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border whitespace-nowrap ${
                                selectedCategory === cat
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
            <Loader2 className="animate-spin text-blue-500" size={40} />
            <p className="font-medium animate-pulse">Caricamento risorse in corso...</p>
          </div>
        ) : (
          <div className="space-y-16">
            {filteredResources.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 max-w-4xl mx-auto">
                {resources.length === 0 ? (
                     <>
                        <p className="text-xl text-slate-500 font-medium mb-2">La raccolta è vuota</p>
                        <p className="text-slate-400 text-sm mb-6">Non ci sono ancora risorse condivise. Inizia tu!</p>
                        <button 
                          onClick={() => setIsModalOpen(true)}
                          className="text-white font-bold bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-full shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                        >
                          Aggiungi la prima risorsa
                        </button>
                     </>
                ) : (
                     <>
                        <p className="text-xl text-slate-500 font-medium mb-2">Nessuna risorsa trovata</p>
                        <p className="text-slate-400 text-sm mb-6">Non ci sono risultati per i filtri selezionati.</p>
                        <button 
                          onClick={() => { setSearchTerm(''); setSelectedCategory(null); }}
                          className="text-blue-600 font-bold hover:underline bg-blue-50 px-6 py-2 rounded-full"
                        >
                          Rimuovi tutti i filtri
                        </button>
                     </>
                )}
              </div>
            ) : (
              <>
                {notes.length > 0 && (
                    <ResourceTable 
                        title={selectedCategory ? `Appunti di ${selectedCategory}` : "Appunti & Risorse Web"}
                        items={notes} 
                        type="note" 
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                    />
                )}
                {books.length > 0 && (
                    <ResourceTable 
                        title={selectedCategory ? `Libri di ${selectedCategory}` : "Libreria Digitale (PDF)"}
                        items={books} 
                        type="book" 
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                    />
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        <div className="w-full px-6 lg:px-12 flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
                <Mail size={16} className="text-slate-400" />
                <span>
                    Per info: <a href="mailto:giancatastrofe@gmail.com" className="text-blue-600 font-medium hover:underline transition-colors">giancatastrofe@gmail.com</a>
                </span>
            </div>
            <div className="hidden md:block w-1 h-1 bg-slate-300 rounded-full"></div>
            <a 
                href="https://github.com/giancatastrofe" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-slate-800 transition-colors group"
            >
                <Github size={16} className="group-hover:text-black transition-colors" />
                <span>Scarica il sorgente su GitHub</span>
            </a>
        </div>
      </footer>

      {/* Floating Actions */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-40">
        <button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          title="Aggiungi nuova risorsa"
        >
          <Plus size={28} />
        </button>
      </div>

      <AddResourceModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        onSubmit={handleCreateOrUpdate}
        initialData={editingItem}
      />
    </div>
  );
};

export default App;