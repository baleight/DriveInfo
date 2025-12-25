import React, { useState, useRef } from 'react';
import { ResourceCategory, TagColor, ResourceItem } from '../types';
import { X, Loader2, FileText, BookOpen, Plus, UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ResourceItem, 'id'>) => Promise<void>;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    type: 'note' as 'note' | 'book',
    title: '',
    url: '',
    description: '',
    year: '',
    category: ResourceCategory.GENERAL,
    coverImage: '', // This will hold the Base64 string temporarily
  });

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: Max 1MB
    if (file.size > 1024 * 1024) {
        alert("L'immagine è troppo grande! Il limite è 1MB.");
        return;
    }

    // Convert to Base64
    const reader = new FileReader();
    reader.onloadend = () => {
        setFormData({ ...formData, coverImage: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
      setFormData({ ...formData, coverImage: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
    setFormData({
        type: 'note',
        title: '',
        url: '',
        description: '',
        year: '',
        category: ResourceCategory.GENERAL,
        coverImage: '',
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden ring-1 ring-slate-900/5 max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">Condividi una risorsa</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Custom Radio Group */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setFormData({...formData, type: 'note'})}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${formData.type === 'note' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FileText size={16} /> Appunto / Link
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, type: 'book'})}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${formData.type === 'book' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <BookOpen size={16} /> Libro / PDF
            </button>
          </div>

          <div className="space-y-4">
            <div className="group">
              <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">Titolo Risorsa</label>
              <input 
                required
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                placeholder={formData.type === 'note' ? "Es. Appunti Fisica Singh" : "Es. Computer Organization"}
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="group">
              <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">URL / Link Drive</label>
              <input 
                required
                type="url" 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                placeholder="https://..."
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
              />
            </div>

            {/* File Upload Area - Only for Books */}
            {formData.type === 'book' && (
              <div className="group animate-fade-in">
                <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5 flex items-center gap-1">
                  <ImageIcon size={12} /> Copertina (Max 1MB)
                </label>
                
                {!formData.coverImage ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-slate-50 transition-all group/upload"
                    >
                        <div className="p-3 bg-slate-100 rounded-full group-hover/upload:bg-blue-100 text-slate-400 group-hover/upload:text-blue-500 transition-colors">
                            <UploadCloud size={24} />
                        </div>
                        <p className="text-sm font-medium text-slate-500">Clicca per caricare immagine</p>
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                ) : (
                    <div className="relative w-full h-32 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                        <img src={formData.coverImage} alt="Preview" className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <button 
                                type="button"
                                onClick={removeImage}
                                className="bg-white text-red-500 px-4 py-2 rounded-full font-bold shadow-sm hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                            >
                                <Trash2 size={16} /> Rimuovi
                            </button>
                        </div>
                    </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">Materia</label>
                  <div className="relative">
                    <select 
                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value as ResourceCategory})}
                    >
                        {Object.values(ResourceCategory).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    {/* Custom Arrow */}
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                  </div>
               </div>
               
               {formData.type === 'note' ? (
                  <div>
                      <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">Anno Accademico</label>
                      <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                      placeholder="es. 23/24"
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: e.target.value})}
                      />
                  </div>
               ) : (
                  <div>
                      <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">Autore</label>
                      <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                      placeholder="Nome Autore"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                  </div>
               )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                    <Plus size={20} />
                    Aggiungi alla raccolta
                </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};