import React, { useState } from 'react';
import { ResourceCategory, TagColor, ResourceItem } from '../types';
import { X, Loader2 } from 'lucide-react';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ResourceItem, 'id'>) => Promise<void>;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'note' as 'note' | 'book',
    title: '',
    url: '',
    description: '',
    year: '',
    category: ResourceCategory.GENERAL,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const colorMap: Record<ResourceCategory, TagColor> = {
        [ResourceCategory.GENERAL]: TagColor.RED,
        [ResourceCategory.CALCULUS]: TagColor.YELLOW,
        [ResourceCategory.LANGUAGES]: TagColor.BROWN,
        [ResourceCategory.PHYSICS]: TagColor.PINK,
        [ResourceCategory.SOFTWARE_ENG]: TagColor.GREEN,
        [ResourceCategory.NETWORKS]: TagColor.DEFAULT,
        [ResourceCategory.INFO_MGMT]: TagColor.GRAY,
        [ResourceCategory.OPERATIONS]: TagColor.PURPLE,
        [ResourceCategory.ARCHITECTURE]: TagColor.YELLOW,
    };

    const newResource: Omit<ResourceItem, 'id'> = {
        ...formData,
        categoryColor: colorMap[formData.category],
        dateAdded: new Date().toLocaleDateString('en-GB'),
        icon: formData.type === 'note' ? 'https://www.notion.so/icons/document_red.svg' : 'https://www.notion.so/icons/book_gray.svg'
    };

    await onSubmit(newResource);
    setLoading(false);
    onClose();
    // Reset form
    setFormData({
        type: 'note',
        title: '',
        url: '',
        description: '',
        year: '',
        category: ResourceCategory.GENERAL,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#37352f]">Nuova Risorsa</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Type Selection */}
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
                <input 
                    type="radio" 
                    name="type" 
                    checked={formData.type === 'note'} 
                    onChange={() => setFormData({...formData, type: 'note'})}
                    className="accent-[#37352f]"
                />
                <span className="text-sm">Appunto/Link</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
                <input 
                    type="radio" 
                    name="type" 
                    checked={formData.type === 'book'} 
                    onChange={() => setFormData({...formData, type: 'book'})}
                    className="accent-[#37352f]"
                />
                <span className="text-sm">Libro/PDF</span>
            </label>
          </div>

          <div>
            <label className="block text-xs uppercase text-gray-400 font-semibold mb-1">Titolo</label>
            <input 
              required
              type="text" 
              className="w-full border border-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
              placeholder={formData.type === 'note' ? "Es. Appunti Fisica Singh" : "Es. Computer Organization"}
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-gray-400 font-semibold mb-1">URL / Link File</label>
            <input 
              required
              type="url" 
              className="w-full border border-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
              placeholder="https://..."
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs uppercase text-gray-400 font-semibold mb-1">Corso</label>
                <select 
                    className="w-full border border-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm bg-white"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as ResourceCategory})}
                >
                    {Object.values(ResourceCategory).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
             </div>
             
             {formData.type === 'note' ? (
                <div>
                    <label className="block text-xs uppercase text-gray-400 font-semibold mb-1">Anno (Opzionale)</label>
                    <input 
                    type="text" 
                    className="w-full border border-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                    placeholder="23/24"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    />
                </div>
             ) : (
                <div>
                    <label className="block text-xs uppercase text-gray-400 font-semibold mb-1">Autore</label>
                    <input 
                    type="text" 
                    className="w-full border border-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                    placeholder="Nome Autore"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                </div>
             )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#2eaadc] hover:bg-[#238bb5] text-white font-medium py-2 rounded shadow-sm transition-colors flex justify-center items-center mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Aggiungi Risorsa'}
          </button>
        </form>
      </div>
    </div>
  );
};
