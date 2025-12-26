import React, { useState, useRef, useEffect } from 'react';
import { ResourceCategory, TagColor, ResourceItem } from '../types';
import { X, Loader2, FileText, BookOpen, Plus, UploadCloud, Image as ImageIcon, Trash2, Save, PenTool, Link as LinkIcon, FileUp, Check, AlertCircle } from 'lucide-react';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Updated signature to accept progress callback
  onSubmit: (data: Omit<ResourceItem, 'id'>, onProgress?: (percentage: number) => void) => Promise<void>;
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

// 6 Predefined Icons
const PRESET_ICONS = [
  { id: 'doc', url: 'https://www.notion.so/icons/document_blue.svg', label: 'Documento' },
  { id: 'book', url: 'https://www.notion.so/icons/book_purple.svg', label: 'Libro' },
  { id: 'code', url: 'https://www.notion.so/icons/code_red.svg', label: 'Codice' },
  { id: 'video', url: 'https://www.notion.so/icons/play_pink.svg', label: 'Video' },
  { id: 'web', url: 'https://www.notion.so/icons/globe_green.svg', label: 'Web' },
  { id: 'folder', url: 'https://www.notion.so/icons/folder_orange.svg', label: 'Archivio' },
];

export const AddResourceModal: React.FC<AddResourceModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Track progress
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
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
    icon: PRESET_ICONS[0].url
  };

  const [formData, setFormData] = useState(defaultState);
  const [sourceType, setSourceType] = useState<'url' | 'file'>('url');

  // Sync state when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
        setError(null);
        setUploadProgress(0);
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
                icon: initialData.icon || PRESET_ICONS[0].url
            });
            setSourceType('url'); 
        } else {
            setFormData(defaultState);
            setSourceType('url');
        }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // --- IMAGE COMPRESSION LOGIC ---
  // Resizes image to be small enough for Google Sheet Cell (< 50k chars)
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Target dimensions: Max width 150px (Thumbnail size)
                const MAX_WIDTH = 150;
                const MAX_HEIGHT = 220;
                
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if(ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    // Export as JPEG with 0.6 quality to save space
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    resolve(dataUrl);
                } else {
                    resolve(event.target?.result as string); // Fallback
                }
            }
        };
    });
  };

  // Handle Cover Image (For Books)
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    
    // We try to process even larger images by resizing them
    if (!file.type.startsWith('image/')) {
        setError("Per favore seleziona un file immagine valido.");
        return;
    }

    try {
        const resizedBase64 = await resizeImage(file);
        setFormData({ ...formData, coverImage: resizedBase64 });
    } catch (err) {
        console.error("Error resizing image", err);
        setError("Errore durante l'elaborazione dell'immagine.");
    }
  };

  const removeImage = () => {
      setFormData({ ...formData, coverImage: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle PDF Upload
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      // GAS memory limit is strict. 50MB is approaching the limit but feasible with chunking.
      const MAX_SIZE = 50 * 1024 * 1024; // 50MB

      if (file.size > MAX_SIZE) {
          setError("Il file è troppo grande (Max 50MB). Per file più grandi, caricali manualmente su Google Drive e usa il 'Link Esterno'.");
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
    setError(null);
    setUploadProgress(0);
    
    // Validation
    if (sourceType === 'url' && !formData.url) {
        setError("Inserisci un URL valido.");
        return;
    }
    if (sourceType === 'file' && !formData.fileData && !isEditMode) {
        setError("Seleziona un file PDF da caricare.");
        return;
    }

    setLoading(true);

    // Prepare payload
    const resourceData: any = { 
        ...formData,
        dateAdded: initialData?.dateAdded || new Date().toLocaleDateString('en-GB'),
    };

    // STRICT CLEANUP based on source type
    if (sourceType === 'url') {
        resourceData.fileData = ''; // Ensure no file data is sent
    } else {
        resourceData.url = ''; // Ensure no url is sent (backend will generate one from file)
    }

    try {
        await onSubmit(resourceData, (progress) => {
            setUploadProgress(progress);
        });
        setLoading(false);
        onClose();
    } catch (err: any) {
        setLoading(false);
        setError(err.message || "Errore durante il salvataggio. Riprova.");
    }
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
          
          <div className="flex flex-col sm:flex-row gap-4">
              {/* Type Selector */}
              <div className="flex-1 grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl h-24 sm:h-auto">
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
                    <BookOpen size={18} /> Libro
                </button>
              </div>

              {/* Icon Selector Grid */}
              <div className="flex-1">
                 <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Scegli Icona</label>
                 <div className="grid grid-cols-3 gap-3">
                    {PRESET_ICONS.map((iconItem) => (
                        <button
                            key={iconItem.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, icon: iconItem.url })}
                            className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-300 ${
                                formData.icon === iconItem.url 
                                ? 'bg-white border-2 border-blue-600 shadow-md shadow-blue-200 scale-105 opacity-100 ring-2 ring-blue-50' 
                                : 'bg-slate-50 border border-slate-200 hover:bg-white hover:border-blue-300 hover:shadow-sm opacity-60 hover:opacity-100 grayscale hover:grayscale-0'
                            }`}
                            title={iconItem.label}
                        >
                            <img src={iconItem.url} alt={iconItem.label} className="w-6 h-6 object-contain" />
                        </button>
                    ))}
                 </div>
              </div>
          </div>

          <div className="space-y-4">
            <div className="group">
              <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">Titolo Risorsa</label>
              <input 
                required
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                placeholder={formData.type === 'note' ? "Es. Appunti Fisica" : "Es. Computer Organization"}
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
                            onClick={() => { setSourceType('url'); setFormData({...formData, fileData: ''}); setError(null); }}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${sourceType === 'url' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Link Esterno
                        </button>
                        <button
                            type="button"
                            onClick={() => { setSourceType('file'); setFormData({...formData, url: ''}); setError(null); }}
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
                    <>
                        {error && (
                            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 text-sm font-medium animate-fade-in">
                                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p>{error}</p>
                                </div>
                                <button type="button" onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-full transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                        <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all bg-slate-50 ${error ? 'border-red-300 bg-red-50/30' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}`}>
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
                                        <p className="text-xs text-slate-400 mt-1">Max 50MB</p>
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
                    </>
                )}
            </div>

            {/* Cover Image (Only for books) */}
            {formData.type === 'book' && (
              <div className="group animate-fade-in">
                <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5 flex items-center gap-1">
                  <ImageIcon size={12} /> Copertina (Miniatura)
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
                    <div className="relative w-24 h-32 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 mx-auto sm:mx-0">
                        <img src={formData.coverImage} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                            <button 
                                type="button"
                                onClick={removeImage}
                                className="bg-white text-red-500 p-2 rounded-full shadow-sm hover:scale-110 transition-transform"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1">L'immagine verrà ridimensionata automaticamente.</p>
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

          {/* Progress Bar Display (Only when loading and uploading a file) */}
          {loading && sourceType === 'file' && uploadProgress > 0 && (
            <div className="animate-fade-in">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                    <span>Caricamento PDF...</span>
                    <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                        style={{ width: `${uploadProgress}%` }}
                    ></div>
                </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 mt-2 ${isEditMode ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'}`}
          >
            {loading ? (
                <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>{formData.fileData && uploadProgress < 100 ? 'Invio in corso...' : 'Elaborazione...'}</span>
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