import React, { useState, useRef, useEffect } from 'react';
import { ResourceCategory, TagColor, ResourceItem } from '../types';
import { X, Loader2, FileText, BookOpen, Plus, UploadCloud, Image as ImageIcon, Trash2, Save, PenTool, Link as LinkIcon, FileUp, Check, RefreshCw } from 'lucide-react';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ResourceItem, 'id'>) => Promise<void>;
  initialData?: ResourceItem | null;
}

// Map colors to visual classes for the picker (matching Badge.tsx style)
const COLOR_OPTIONS: { value: TagColor; class: string }[] = [
  { value: TagColor.GRAY, class: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: TagColor.RED, class: 'bg-red-50 text-red-600 border-red-100' },
  { value: TagColor.BROWN, class: 'bg-orange-50 text-orange-700 border-orange-100' },
  { value: TagColor.YELLOW, class: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
  { value: TagColor.GREEN, class: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { value: TagColor.BLUE, class: 'bg-blue-50 text-blue-600 border-blue-100' },
  { value: TagColor.PURPLE, class: 'bg-violet-50 text-violet-600 border-violet-100' },
  { value: TagColor.PINK, class: 'bg-pink-50 text-pink-600 border-pink-100' },
];

const DEFAULT_NOTE_ICON = 'https://www.notion.so/icons/document_red.svg';
const DEFAULT_BOOK_ICON = 'https://www.notion.so/icons/book_gray.svg';

export const AddResourceModal: React.FC<AddResourceModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  
  const defaultState = {
    type: 'note' as 'note' | 'book',
    title: '',
    url: '',
    description: '',
    year: '',
    category: ResourceCategory.GENERAL as string,
    categoryColor: TagColor.GRAY,
    coverImage: '',
    fileData: '',
    icon: DEFAULT_NOTE_ICON
  };

  const [formData, setFormData] = useState(defaultState);
  const [sourceType, setSourceType] = useState<'url' | 'file'>('url');

  // Sync state when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setFormData({
                type: initialData.type,
                title: initialData.title,
                url: initialData.url,
                description: initialData.description || '',
                year: initialData.year || '',
                category: initialData.category,
                categoryColor: initialData.categoryColor || TagColor.GRAY,
                coverImage: initialData.coverImage || '',
                fileData: '',
                icon: initialData.icon || (initialData.type === 'note' ? DEFAULT_NOTE_ICON : DEFAULT_BOOK_ICON)
            });
            setSourceType('url'); 
        } else {
            setFormData(defaultState);
            setSourceType('url');
        }
    }
  }, [isOpen, initialData]);

  // When changing type, update icon to default IF user hasn't set a custom one (simple heuristic: matches other default)
  useEffect(() => {
    if (initialData) return; // Don't auto-change on edit mode
    
    if (formData.type === 'note' && formData.icon === DEFAULT_BOOK_ICON) {
        setFormData(prev => ({ ...prev, icon: DEFAULT_NOTE_ICON }));
    } else if (formData.type === 'book' && formData.icon === DEFAULT_NOTE_ICON) {
        setFormData(prev => ({ ...prev, icon: DEFAULT_BOOK_ICON }));
    }
  }, [formData.type]);

  if (!isOpen) return null;

  // Handle Cover Image
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) { 
        alert("L'immagine di copertina è troppo grande! Il limite è 5MB.");
        return;
    }
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

  // Handle Custom Icon Upload
  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
          alert("L'icona è troppo grande! Il limite è 2MB.");
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
          setFormData({ ...formData, icon: reader.result as string });
      };
      reader.readAsDataURL(file);
  };

  const resetIcon = () => {
      setFormData({ 
          ...formData, 
          icon: formData.type === 'note' ? DEFAULT_NOTE_ICON : DEFAULT_BOOK_ICON 
      });
      if (iconInputRef.current) iconInputRef.current.value = '';
  };

  // Handle PDF Upload
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const MAX_SIZE = 100 * 1024 * 1024; 

      if (file.size > MAX_SIZE) {
          alert("Il file è troppo grande! Il limite massimo è 100MB.");
          if (pdfInputRef.current) pdfInputRef.current.value = '';
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
          setFormData({ ...formData, fileData: reader.result as string, url: '' });
      };
      reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (sourceType === 'url' && !formData.url) {
        alert("Inserisci un URL valido.");
        return;
    }
    if (sourceType === 'file' && !formData.fileData && !isEditMode) {
        alert("Seleziona un file PDF da caricare.");
        return;
    }

    setLoading(true);

    const resourceData: any = { 
        ...formData,
        dateAdded: initialData?.dateAdded || new Date().toLocaleDateString('en-GB'),
        // Note: Icon is already in formData
    };

    if (sourceType === 'url') {
        resourceData.fileData = '';
    }

    await onSubmit(resourceData);
    setLoading(false);
    onClose();
  };

  const isEditMode = !!initialData;
  const isCustomCategory = !Object.values(ResourceCategory).includes(formData.category as ResourceCategory);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden ring-1 ring-slate-900/5 max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">
            {isEditMode ? 'Modifica Risorsa' : 'Condividi Risorsa'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="flex gap-4">
              {/* Icon Picker */}
              <div className="flex-shrink-0">
                   <div 
                      className="group relative w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 flex items-center justify-center cursor-pointer bg-slate-50 transition-colors overflow-hidden"
                      onClick={() => iconInputRef.current?.click()}
                      title="Cambia icona"
                   >
                        {formData.icon ? (
                            <img src={formData.icon} alt="icon" className="w-8 h-8 object-contain" />
                        ) : (
                            <div className="text-slate-300">
                                <ImageIcon size={20} />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <PenTool size={16} className="text-white" />
                        </div>
                   </div>
                   <input 
                       ref={iconInputRef}
                       type="file" 
                       accept="image/*" 
                       className="hidden" 
                       onChange={handleIconChange} 
                   />
                   {formData.icon && (formData.icon !== DEFAULT_NOTE_ICON && formData.icon !== DEFAULT_BOOK_ICON) && (
                       <button 
                         type="button" 
                         onClick={resetIcon}
                         className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1 mt-1 mx-auto"
                       >
                           <RefreshCw size={10} /> Reset
                       </button>
                   )}
              </div>

              {/* Type Selector (Expanded) */}
              <div className="flex-grow grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl h-16">
                <button
                type="button"
                onClick={() => setFormData({...formData, type: 'note'})}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg text-xs font-bold transition-all ${formData.type === 'note' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                <FileText size={18} /> Appunto
                </button>
                <button
                type="button"
                onClick={() => setFormData({...formData, type: 'book'})}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg text-xs font-bold transition-all ${formData.type === 'book' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                <BookOpen size={18} /> Libro / PDF
                </button>
              </div>
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

            {/* Source Toggle: URL vs File */}
            <div className="group">
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold">Origine</label>
                    <div className="flex bg-slate-100 rounded-lg p-0.5">
                        <button
                            type="button"
                            onClick={() => { setSourceType('url'); setFormData({...formData, fileData: ''}); }}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${sourceType === 'url' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Link Esterno
                        </button>
                        <button
                            type="button"
                            onClick={() => { setSourceType('file'); setFormData({...formData, url: ''}); }}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${sourceType === 'file' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Carica File
                        </button>
                    </div>
                </div>

                {sourceType === 'url' ? (
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <LinkIcon size={16} />
                        </div>
                        <input 
                            required={sourceType === 'url'}
                            type="url" 
                            className="w-full pl-10 bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            placeholder="https://drive.google.com/..."
                            value={formData.url}
                            onChange={(e) => setFormData({...formData, url: e.target.value})}
                        />
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-slate-50 transition-all bg-slate-50">
                        {formData.fileData ? (
                            <div className="flex items-center gap-2 text-green-600 font-bold">
                                <FileText size={20} />
                                <span>File pronto per l'invio!</span>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setFormData({...formData, fileData: ''});
                                        if (pdfInputRef.current) pdfInputRef.current.value = '';
                                    }}
                                    className="ml-2 p-1 bg-red-100 text-red-500 rounded-full hover:bg-red-200"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                                    <FileUp size={24} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-slate-700">Clicca per selezionare PDF</p>
                                    <p className="text-xs text-slate-400 mt-1">Max 100MB</p>
                                </div>
                            </>
                        )}
                        <input 
                            ref={pdfInputRef}
                            type="file" 
                            accept="application/pdf"
                            className={`absolute inset-0 opacity-0 cursor-pointer ${formData.fileData ? 'pointer-events-none' : ''}`}
                            onChange={handlePdfChange}
                        />
                    </div>
                )}
            </div>

            {/* Cover Image (Only for books) */}
            {formData.type === 'book' && (
              <div className="group animate-fade-in">
                <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5 flex items-center gap-1">
                  <ImageIcon size={12} /> Copertina (Max 5MB)
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
                            onChange={handleCoverChange}
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
                        value={isCustomCategory ? 'CUSTOM' : formData.category}
                        onChange={(e) => {
                            if (e.target.value === 'CUSTOM') {
                                setFormData({...formData, category: ''});
                            } else {
                                setFormData({...formData, category: e.target.value});
                            }
                        }}
                    >
                        {Object.values(ResourceCategory).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="CUSTOM">Altro... (Inserisci nuova)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                  </div>
                  
                  {/* Custom Category Input */}
                  {isCustomCategory && (
                      <div className="mt-2 animate-fade-in relative">
                          <input 
                             autoFocus
                             type="text"
                             className="w-full bg-white border border-blue-300 rounded-lg p-3 pl-10 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium shadow-sm"
                             placeholder="Nome della nuova materia..."
                             value={formData.category}
                             onChange={(e) => setFormData({...formData, category: e.target.value})}
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                             <PenTool size={16} />
                          </div>
                      </div>
                  )}
               </div>
               
               {/* Color Picker */}
               <div>
                 <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">Colore Etichetta</label>
                 <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setFormData({...formData, categoryColor: opt.value})}
                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${opt.class} ${
                                formData.categoryColor === opt.value 
                                ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 shadow-sm' 
                                : 'hover:scale-105 hover:shadow-sm opacity-80 hover:opacity-100'
                            }`}
                            title={opt.value}
                        >
                            {formData.categoryColor === opt.value && <Check size={14} strokeWidth={3} />}
                        </button>
                    ))}
                 </div>
               </div>
            </div>
            
            {/* Year / Author Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 mt-2 ${isEditMode ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'}`}
          >
            {loading ? (
                <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Caricamento {formData.fileData ? 'File...' : '...'}</span>
                </>
            ) : (
                <>
                    {isEditMode ? <Save size={20} /> : <Plus size={20} />}
                    {isEditMode ? 'Salva Modifiche' : 'Aggiungi alla raccolta'}
                </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};