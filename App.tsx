import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { ResourceTable } from './components/ResourceTable';
import { AddResourceModal } from './components/AddResourceModal';
import { ResourceItem } from './types';
import { getResources, addResource } from './services/resourceService';
import { Plus } from 'lucide-react';

const App: React.FC = () => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      const data = await getResources();
      setResources(data);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Filter lists based on type
  const notes = resources.filter(r => r.type === 'note');
  const books = resources.filter(r => r.type === 'book');

  const handleAddResource = async (newResourceData: Omit<ResourceItem, 'id'>) => {
    // Add to backend (mock)
    const addedItem = await addResource(newResourceData);
    // Update local state to reflect change instantly
    setResources(prev => [addedItem, ...prev]);
  };

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <main className="max-w-[900px] mx-auto px-6 sm:px-24">
        {isLoading ? (
          <div className="flex justify-center py-20 text-gray-400">Loading resources...</div>
        ) : (
          <>
            <section className="mb-16">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                LINK APPUNTI
              </h2>
              <ResourceTable title="" items={notes} type="note" />
            </section>

            <section className="mb-16">
              <h1 className="text-3xl font-bold mb-8 mt-12 pt-8 border-t border-gray-100">
                LIBRERIA DIGITALE
              </h1>
              <ResourceTable title="- BOOKS 1.0" items={books} type="book" />
            </section>
          </>
        )}
      </main>

      {/* Floating Action Button (Mobile-friendly add) */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#2eaadc] hover:bg-[#238bb5] text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-40"
        title="Aggiungi Risorsa"
      >
        <Plus size={28} />
      </button>

      {/* Modal */}
      <AddResourceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleAddResource}
      />
    </div>
  );
};

export default App;
