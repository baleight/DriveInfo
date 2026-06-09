
import React, { useState, useRef, useEffect } from 'react';
import { ResourceItem } from '../types';
import { X, Loader2, FileText, BookOpen, Plus, UploadCloud, Image as ImageIcon, Trash2, Save, Link as LinkIcon, FileUp, Check, AlertCircle } from 'lucide-react';
import { joinCategories, splitCategories } from '../utils/categories';
import { normalizeResourceIcon, RESOURCE_ICONS } from '../utils/resourceIcons';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ResourceFormData, onProgress?: (percentage: number) => void) => Promise<void>;
  initialData?: ResourceItem | null;
  subjectOptions?: string[];
}

type ResourceFormData = Omit<ResourceItem, 'id'> & { fileData?: string };

const PRESET_ICONS = [
  { id: 'doc',    url: RESOURCE_ICONS.document, label: 'Documento' },
  { id: 'book',   url: RESOURCE_ICONS.book,     label: 'Libro' },
  { id: 'code',   url: RESOURCE_ICONS.code,     label: 'Codice' },
  { id: 'video',  url: RESOURCE_ICONS.video,    label: 'Video' },
  { id: 'web',    url: RESOURCE_ICONS.web,      label: 'Web' },
  { id: 'folder', url: RESOURCE_ICONS.folder,   label: 'Archivio' },
];

const inputClass = "w-full bg-white border-2 border-brut-border p-2.5 text-brut-text font-medium focus:outline-none focus:border-brut-accent focus:shadow-brut-accent";
const labelClass = "block text-[10px] uppercase tracking-widest text-brut-muted font-bold mb-1.5";

export const AddResourceModal: React.FC<AddResourceModalProps> = ({ isOpen, onClose, onSubmit, initialData, subjectOptions = [] }) => {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const defaultState = {
    type: 'note' as 'note' | 'book',
    title: '',
    url: '',
    description: '',
    year: '',
    category: '',
    coverImage: '',
    fileData: '',
    icon: PRESET_ICONS[0].url
  };

  const [formData, setFormData] = useState(defaultState);
  const [sourceType, setSourceType] = useState<'url' | 'file'>('url');

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
                coverImage: initialData.coverImage || '',
                fileData: '',
                icon: normalizeResourceIcon(initialData.icon) || PRESET_ICONS[0].url
            });
            setSourceType('url');
        } else {
            setFormData(defaultState);
            setSourceType('url');
        }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 120;
                const MAX_HEIGHT = 180;
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
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.5));
                } else {
                    resolve(event.target?.result as string);
                }
            };
        };
    });
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError("Seleziona un file immagine valido."); return; }
    try {
        const resizedBase64 = await resizeImage(file);
        setFormData({ ...formData, coverImage: resizedBase64 });
    } catch {
        setError("Errore durante l'elaborazione dell'immagine.");
    }
  };

  const removeImage = () => {
      setFormData({ ...formData, coverImage: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const file = e.target.files?.[0];
      if (!file) return;
      const MAX_SIZE = 50 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
          setError("File troppo grande (Max 50MB). Caricalo manualmente su Drive e usa 'Link Esterno'.");
          if (pdfInputRef.current) pdfInputRef.current.value = '';
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, fileData: reader.result as string, url: '' });
      reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploadProgress(0);
    if (sourceType === 'url' && !formData.url) { setError("Inserisci un URL valido."); return; }
    if (sourceType === 'file' && !formData.fileData && !isEditMode) { setError("Seleziona un file PDF da caricare."); return; }
    setLoading(true);
    const resourceData: ResourceFormData = {
        ...formData,
        dateAdded: initialData?.dateAdded || new Date().toLocaleDateString('en-GB'),
    };
    if (sourceType === 'url') { resourceData.fileData = ''; }
    else { resourceData.url = ''; }
    try {
        await onSubmit(resourceData, (progress) => setUploadProgress(progress));
        setLoading(false);
        onClose();
    } catch (err: unknown) {
        setLoading(false);
        setError(err instanceof Error ? err.message : "Errore durante il salvataggio. Riprova.");
    }
  };

  const isEditMode = !!initialData;
  const isMultiCategoryMode = isEditMode || sourceType === 'url';
  const catalogSubjectOptions = Array.from(
    new Set(subjectOptions.map(subject => subject.trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
  const selectedCategories = splitCategories(formData.category);
  const legacySelectedCategories = selectedCategories.filter(cat => !catalogSubjectOptions.includes(cat));
  const categoryOptions = catalogSubjectOptions;

  const toggleCategory = (category: string) => {
    const nextCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(item => item !== category)
      : [...selectedCategories, category];

    setFormData({ ...formData, category: joinCategories(nextCategories) });
  };

  return (
    <div className="fixed inset-0 bg-brut-text/80 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border-2 border-brut-border shadow-brut-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Modal Header — yellow bar */}
        <div className="flex justify-between items-center px-5 py-3 border-b-2 border-brut-border bg-brut-accent sticky top-0 z-10">
          <h2 className="text-sm font-black uppercase tracking-widest text-brut-text">
            {isEditMode ? '// MODIFICA RISORSA' : '// NUOVA RISORSA'}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 border-2 border-brut-border bg-white flex items-center justify-center hover:bg-red-100 hover:text-red-700 text-brut-text"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Type + Icon row */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Type Toggle */}
            <div className="flex-1 border-2 border-brut-border flex overflow-hidden">
              <button
                type="button"
                onClick={() => setFormData({...formData, type: 'note'})}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-black uppercase tracking-wider transition-colors ${formData.type === 'note' ? 'bg-brut-text text-brut-accent' : 'bg-white text-brut-muted hover:bg-brut-bg border-r-2 border-brut-border'}`}
              >
                <FileText size={16} /> Appunto
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, type: 'book'})}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-black uppercase tracking-wider transition-colors ${formData.type === 'book' ? 'bg-brut-text text-brut-accent' : 'bg-white text-brut-muted hover:bg-brut-bg'}`}
              >
                <BookOpen size={16} /> Libro
              </button>
            </div>

            {/* Icon Grid */}
            <div className="flex-1">
              <label className={labelClass}>Icona</label>
              <div className="grid grid-cols-6 gap-1.5">
                {PRESET_ICONS.map((iconItem) => (
                  <button
                    key={iconItem.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: iconItem.url })}
                    className={`aspect-square border-2 flex items-center justify-center transition-all ${
                      formData.icon === iconItem.url
                      ? 'border-brut-border bg-brut-accent shadow-brut scale-95'
                      : 'border-brut-line bg-brut-bg hover:border-brut-border hover:bg-white'
                    }`}
                    title={iconItem.label}
                  >
                    <img src={normalizeResourceIcon(iconItem.url)} alt={iconItem.label} className="w-5 h-5 object-contain" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={labelClass}>Titolo Risorsa</label>
            <input
              required
              type="text"
              className={inputClass}
              placeholder={formData.type === 'note' ? "Es. Appunti Fisica" : "Es. Computer Organization"}
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          {/* Source Toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Origine</label>
              <div className="flex border-2 border-brut-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setSourceType('url'); setFormData({...formData, fileData: ''}); setError(null); }}
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${sourceType === 'url' ? 'bg-brut-text text-white' : 'bg-white text-brut-muted hover:bg-brut-bg border-r border-brut-line'}`}
                >
                  Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSourceType('file');
                    setFormData({
                      ...formData,
                      url: '',
                      category: splitCategories(formData.category)[0] || ''
                    });
                    setError(null);
                  }}
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${sourceType === 'file' ? 'bg-brut-text text-white' : 'bg-white text-brut-muted hover:bg-brut-bg'}`}
                >
                  File
                </button>
              </div>
            </div>

            {sourceType === 'url' ? (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brut-muted">
                  <LinkIcon size={14} />
                </div>
                <input
                  required={sourceType === 'url'}
                  type="url"
                  className={inputClass + ' pl-9'}
                  placeholder="https://drive.google.com/..."
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                />
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-3 p-3 bg-red-50 border-2 border-red-700 flex items-start gap-3 text-red-700 text-xs font-bold animate-fade-in">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <p className="flex-1">{error}</p>
                    <button type="button" onClick={() => setError(null)}>
                      <X size={14} />
                    </button>
                  </div>
                )}
                <div className={`relative border-2 border-dashed p-4 flex flex-col items-center justify-center gap-2 cursor-pointer ${error ? 'border-red-700 bg-red-50' : 'border-brut-border bg-brut-bg hover:bg-white hover:border-brut-text'}`}
                  onClick={() => !formData.fileData && pdfInputRef.current?.click()}
                >
                  {formData.fileData ? (
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                      <FileText size={18} />
                      <span>File pronto per l'invio!</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFormData({...formData, fileData: ''}); if (pdfInputRef.current) pdfInputRef.current.value = ''; }}
                        className="ml-2 border border-red-700 text-red-700 bg-red-100 p-0.5 hover:bg-red-200"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="border-2 border-brut-border p-2 bg-white">
                        <FileUp size={20} className="text-brut-muted" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider text-brut-text">Clicca per selezionare PDF</p>
                      <p className="font-mono text-[10px] text-brut-muted">Max 50MB</p>
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

          {/* Cover Image (books only) */}
          {formData.type === 'book' && (
            <div className="animate-fade-in">
              <label className={labelClass + ' flex items-center gap-1'}>
                <ImageIcon size={11} /> Copertina
              </label>
              {!formData.coverImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-brut-border p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-brut-text hover:bg-brut-bg"
                >
                  <div className="border-2 border-brut-border p-2 bg-white">
                    <UploadCloud size={20} className="text-brut-muted" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brut-text">Carica immagine</p>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                </div>
              ) : (
                <div className="relative w-20 h-28 border-2 border-brut-border overflow-hidden mx-auto sm:mx-0">
                  <img src={formData.coverImage} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-brut-text/60 opacity-0 hover:opacity-100">
                    <button type="button" onClick={removeImage} className="border-2 border-white bg-red-600 text-white p-1.5">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
              <p className="font-mono text-[10px] text-brut-muted mt-1">Verrà ridimensionata automaticamente.</p>
            </div>
          )}

          {/* Category */}
          <div>
              <label className={labelClass}>{isMultiCategoryMode ? 'Materie' : 'Materia'}</label>
              {isMultiCategoryMode ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {categoryOptions.map(cat => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`inline-flex items-center gap-1.5 border-2 px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                            isSelected
                              ? 'border-brut-border bg-brut-text text-brut-accent shadow-brut'
                              : 'border-brut-border bg-white text-brut-text hover:bg-brut-accent'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  {legacySelectedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 border-t-2 border-dashed border-brut-line pt-2">
                      {legacySelectedCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className="inline-flex items-center gap-1.5 border-2 border-brut-line bg-brut-bg px-2 py-1 text-[10px] font-black uppercase tracking-wider text-brut-muted hover:border-red-700 hover:bg-red-50 hover:text-red-700"
                          title="Rimuovi materia non presente nel foglio Materie"
                        >
                          <X size={12} strokeWidth={3} />
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedCategories.length > 0 && (
                    <p className="font-mono text-[10px] text-brut-muted">
                      Selezionate: {selectedCategories.join(', ')}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="relative">
                    <select
                      className={inputClass + ' appearance-none pr-8'}
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="">Nessuna materia</option>
                      {categoryOptions.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-brut-muted">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                  </div>
                </>
              )}
          </div>

          {/* Year / Author */}
          <div>
            {formData.type === 'note' ? (
              <div>
                <label className={labelClass}>Note / Anno</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Es. 23/24, Marongiu..."
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                />
              </div>
            ) : (
              <div>
                <label className={labelClass}>Autore</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Nome Autore"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {loading && sourceType === 'file' && uploadProgress > 0 && (
            <div className="animate-fade-in">
              <div className="flex justify-between font-mono text-[10px] text-brut-muted mb-1">
                <span>CARICAMENTO PDF...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-brut-bg border-2 border-brut-border h-3 overflow-hidden">
                <div
                  className="bg-brut-accent h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error message (non-file errors) */}
          {error && sourceType === 'url' && (
            <div className="p-3 bg-red-50 border-2 border-red-700 flex items-center gap-3 text-red-700 text-xs font-bold animate-fade-in">
              <AlertCircle size={16} className="flex-shrink-0" />
              <p className="flex-1">{error}</p>
              <button type="button" onClick={() => setError(null)}><X size={14} /></button>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full font-black py-3 uppercase tracking-widest text-sm border-2 border-brut-border shadow-brut flex justify-center items-center gap-2 hover:shadow-brut-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-brut disabled:opacity-50 disabled:cursor-not-allowed ${
              isEditMode
              ? 'bg-brut-text text-white hover:bg-brut-accent hover:text-brut-text'
              : 'bg-brut-accent text-brut-text hover:bg-brut-text hover:text-white'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>{formData.fileData && uploadProgress < 100 ? 'Invio in corso...' : 'Elaborazione...'}</span>
              </>
            ) : (
              <>
                {isEditMode ? <Save size={18} /> : <Plus size={18} />}
                {isEditMode ? 'Salva Modifiche' : 'Aggiungi alla raccolta'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
