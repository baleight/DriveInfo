
import React, { useEffect, useState, useMemo } from 'react';
import { Header } from './components/Header';
import { ResourceTable } from './components/ResourceTable';
import { AddResourceModal } from './components/AddResourceModal';
import { ResourceItem, SubjectItem } from './types';
import { getResources, addResource, updateResource, deleteResource } from './services/resourceService';
import { Plus, Loader2, Github, Mail } from 'lucide-react';
import { splitCategories } from './utils/categories';

const App: React.FC = () => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
          const result = await getResources();
          setResources(result.resources);
          setSubjects(result.subjects || []);
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
        const previousResources = resources;
        const optimisticResource = { ...formData, id: editingItem.id } as ResourceItem;
        setResources(prev => prev.map(r => r.id === editingItem.id ? optimisticResource : r));
        try {
          const result = await updateResource(optimisticResource);
          if (result.item) {
               setResources(prev => prev.map(r => r.id === result.item.id ? result.item : r));
          }
          if (result.subjects) setSubjects(result.subjects);
        } catch (error) {
          setResources(previousResources);
          throw error;
        }
    } else {
        const result = await addResource(formData, onProgress);
        setResources(prev => [result.item, ...prev]);
        if (result.subjects) setSubjects(result.subjects);
    }
    setEditingItem(null);
  };

  const handleEditClick = (item: ResourceItem) => {
      setEditingItem(item);
      setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
      const previousResources = resources;
      setResources(prev => prev.filter(r => r.id !== id));
      const result = await deleteResource(id);
      if (!result.success) {
        setResources(previousResources);
      }
  };

  const handleModalClose = () => {
      setIsModalOpen(false);
      setEditingItem(null);
  };

  const availableCategories = useMemo(() => {
      const cats = new Set([
        ...subjects.map(subject => subject.name).filter(Boolean),
        ...resources.flatMap(r => splitCategories(r.category))
      ]);
      return Array.from(cats).sort();
  }, [resources, subjects]);

  const filteredResources = useMemo(() => {
    let result = resources;
    if (selectedCategory) {
        result = result.filter(r => splitCategories(r.category).includes(selectedCategory));
    }
    return result;
  }, [resources, selectedCategory]);

  const books = filteredResources.filter(r => r.type === 'book');
  const notes = filteredResources.filter(r => r.type !== 'book');

  const allNotes = resources.filter(r => r.type !== 'book');
  const allBooks = resources.filter(r => r.type === 'book');

  return (
    <div className="min-h-screen flex flex-col bg-brut-bg">
      <Header noteCount={allNotes.length} bookCount={allBooks.length} />

      <main className="w-full px-6 lg:px-12 flex-1 pb-16 pt-8">

        {/* Subject Filter */}
        <div className="max-w-5xl mx-auto mb-8">
          {!isLoading && resources.length > 0 && (
            <div className="flex flex-wrap gap-2 animate-fade-in">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 border-brut-border transition-transform hover:-translate-y-0.5 hover:shadow-brut ${
                  selectedCategory === null
                  ? 'bg-brut-text text-white shadow-brut'
                  : 'bg-white text-brut-text hover:bg-brut-accent'
                }`}
              >
                Tutti
              </button>
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 border-brut-border transition-transform hover:-translate-y-0.5 hover:shadow-brut whitespace-nowrap ${
                    selectedCategory === cat
                    ? 'bg-brut-text text-white shadow-brut'
                    : 'bg-white text-brut-text hover:bg-brut-accent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="animate-spin text-brut-text" size={36} />
            <p className="font-mono text-sm text-brut-muted">CARICAMENTO IN CORSO...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredResources.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-brut-border max-w-4xl mx-auto bg-white">
                {resources.length === 0 ? (
                  <>
                    <p className="text-xl font-black text-brut-text mb-2">RACCOLTA VUOTA</p>
                    <p className="text-brut-muted text-sm mb-6 font-mono">Nessuna risorsa ancora. Inizia tu!</p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="font-bold bg-brut-accent text-brut-text border-2 border-brut-border px-8 py-3 shadow-brut hover:shadow-brut-lg hover:-translate-y-0.5 uppercase tracking-wider text-sm"
                    >
                      + Aggiungi la prima risorsa
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-black text-brut-text mb-2">NESSUN RISULTATO</p>
                    <p className="text-brut-muted text-sm mb-6 font-mono">Nessuna risorsa corrisponde ai filtri.</p>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="font-bold border-2 border-brut-border px-6 py-2 bg-white hover:bg-brut-accent uppercase tracking-wider text-sm shadow-brut hover:-translate-y-0.5"
                    >
                      Rimuovi filtri
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                {notes.length > 0 && (
                  <ResourceTable
                    title={selectedCategory ? `Appunti — ${selectedCategory}` : "Appunti & Risorse Web"}
                    items={notes}
                    type="note"
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                )}
                {books.length > 0 && (
                  <ResourceTable
                    title={selectedCategory ? `Libri — ${selectedCategory}` : "Libreria Digitale (PDF)"}
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
      <footer className="mt-auto py-6 border-t-2 border-brut-border bg-white">
        <div className="w-full px-6 lg:px-12 flex flex-col md:flex-row items-center justify-center gap-4 text-xs font-mono text-brut-muted">
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-brut-text" />
            <a href="mailto:driveunimoreinfo@gmail.com" className="text-brut-text font-bold hover:underline">
              driveunimoreinfo@gmail.com
            </a>
          </div>
          <span className="hidden md:inline text-brut-line">|</span>
          <a
            href="https://github.com/baleight/DriveInfo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-brut-text font-bold hover:underline"
          >
            <Github size={14} />
            GitHub Sorgente
          </a>
        </div>
      </footer>

      {/* FAB — quadrato giallo */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="w-12 h-12 bg-brut-accent text-brut-text border-2 border-brut-border shadow-brut flex items-center justify-center hover:shadow-brut-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-brut"
          title="Aggiungi nuova risorsa"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      <AddResourceModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleCreateOrUpdate}
        initialData={editingItem}
        subjectOptions={subjects.map(subject => subject.name)}
      />
    </div>
  );
};

export default App;
