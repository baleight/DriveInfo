
import React, { useState, useEffect } from 'react';
import { ResourceItem } from '../types';
import { Badge } from './Badge';
import { FileText, BookOpen, Download, Pencil, Trash2, User, Calendar, ImageOff, ExternalLink } from 'lucide-react';

interface ResourceGridProps {
  title: string;
  items: ResourceItem[];
  type: 'note' | 'book';
  onEdit: (item: ResourceItem) => void;
  onDelete: (id: string) => void;
}

// Helper to ensure Google Drive images render correctly
const getCoverUrl = (url: string | undefined) => {
    if (!url) return '';
    
    // 1. If Base64, return as is
    if (url.startsWith('data:')) return url;
    
    // 2. If Google Drive URL, normalize to export=view format
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
        // Already in correct format?
        if (url.includes('export=view')) return url;

        // Try to extract ID
        const idMatch = url.match(/[-\w]{25,}/);
        if (idMatch) {
             return `https://drive.google.com/uc?export=view&id=${idMatch[0]}`;
        }
    }
    
    // 3. Return original for others
    return url;
};

export const ResourceTable: React.FC<ResourceGridProps> = ({ title, items, type, onEdit, onDelete }) => {
  if (items.length === 0) return null;

  return (
    <section className="mb-12 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          {type === 'note' ? <FileText className="text-blue-500" /> : <BookOpen className="text-violet-500" />}
          {title}
        </h3>
        <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
          {items.length}
        </span>
      </div>
      
      {type === 'note' ? (
        // LIST VIEW FOR NOTES
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {items.map((item) => (
            <ResourceRow 
              key={item.id} 
              item={item} 
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item.id)}
            />
          ))}
        </div>
      ) : (
        // GRID VIEW FOR BOOKS
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {items.map((item) => (
            <ResourceCard 
              key={item.id} 
              item={item} 
              type={type} 
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

// --- COMPONENT: ROW (For Notes) ---
interface ActionProps {
    item: ResourceItem;
    onEdit: () => void;
    onDelete: () => void;
}

const ResourceRow: React.FC<ActionProps> = ({ item, onEdit, onDelete }) => {
  return (
    <div className="group relative bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-start p-3 gap-3 min-h-[70px]">
      
      {/* Icon - Aligned to top to handle multi-line titles */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 overflow-hidden mt-0.5">
         {item.icon ? (
            <img src={item.icon} alt="" className="w-5 h-5 object-contain" />
          ) : (
            <FileText size={16} />
          )}
      </div>

      {/* Main Info */}
      <div className="flex-grow min-w-0 flex flex-col gap-1 pr-14">
         {/* Title: Text only, no longer a link */}
         <h4 className="font-semibold text-slate-700 text-sm leading-snug break-words cursor-text select-text">
            {item.title}
         </h4>
         
         <div className="flex flex-wrap items-center gap-2 mt-auto">
             <div className="transform scale-90 origin-left">
                <Badge label={item.category} color={item.categoryColor} />
             </div>
             {item.year && (
                 <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap bg-slate-50 px-1 rounded">
                    {item.year}
                 </span>
             )}
         </div>
      </div>

      {/* Actions (Hover only) */}
      <div className="absolute top-2 right-2 z-10 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-sm rounded-md shadow-sm border border-slate-100 p-0.5 pointer-events-auto">
        {/* Redirection Button */}
        <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Apri Risorsa"
        >
            <ExternalLink size={13} strokeWidth={2.5} />
        </a>
        
        <button 
            onClick={(e) => { e.preventDefault(); onEdit(); }}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Modifica"
        >
            <Pencil size={13} strokeWidth={2.5} />
        </button>
        
        <button 
            onClick={(e) => { 
                e.preventDefault(); 
                if(confirm('Eliminare questa risorsa?')) onDelete(); 
            }}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Elimina"
        >
            <Trash2 size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

// --- COMPONENT: CARD (For Books) ---
interface CardProps {
    item: ResourceItem;
    type: 'note' | 'book';
    onEdit: () => void;
    onDelete: () => void;
}

const ResourceCard: React.FC<CardProps> = ({ item, type, onEdit, onDelete }) => {
  const [imgError, setImgError] = useState(false);

  // Reset error state if the image URL changes (e.g. after an edit)
  useEffect(() => {
    setImgError(false);
  }, [item.coverImage]);

  const displayUrl = getCoverUrl(item.coverImage);

  return (
    <div className="group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col h-full overflow-hidden">
      
      {/* Clickable Area for Link */}
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-0" />

      <div className="p-4 flex gap-3 h-full pointer-events-none">
        
        {/* Left Column: Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Main Content */}
          <div className="flex-grow">
            <h4 className="font-bold text-slate-800 group-hover:text-blue-600 leading-snug mb-1 transition-colors break-words text-sm sm:text-base">
              {item.title}
            </h4>
            
            <div className="mt-2 mb-2">
                 <Badge label={item.category} color={item.categoryColor} />
            </div>

            {item.description && (
              <p className="text-xs text-slate-500 line-clamp-2 mb-2 flex items-center gap-1">
                <User size={12} /> {item.description}
              </p>
            )}
          </div>

          {/* Footer Info & Download */}
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              {item.year && (
                <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded text-slate-500">
                  <Calendar size={10} /> {item.year}
                </span>
              )}
            </div>
            
            {/* Download Button + Actions */}
            {/* Added pointer-events-auto here to override the parent's pointer-events-none */}
            <div className="relative z-10 flex items-center gap-1 pointer-events-auto">
                <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-md transition-all border border-transparent hover:border-blue-100 shadow-sm mr-1"
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className="font-bold text-[10px] uppercase">Scarica</span>
                    <Download size={12} />
                </a>

                {/* Edit Button */}
                <button 
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit(); }}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    title="Modifica"
                >
                    <Pencil size={13} strokeWidth={2.5} />
                </button>

                {/* Delete Button */}
                <button 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        e.preventDefault(); 
                        if(confirm('Sei sicuro di voler eliminare questa risorsa?')) onDelete(); 
                    }}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    title="Elimina"
                >
                    <Trash2 size={13} strokeWidth={2.5} />
                </button>
            </div>
          </div>
        </div>

        {/* Right Column: Cover Image (Fixed Width) */}
        {type === 'book' && displayUrl && (
          <div className="w-20 sm:w-24 flex-shrink-0 flex flex-col">
             <div className="aspect-[2/3] w-full rounded-md overflow-hidden shadow-sm border border-slate-200 relative bg-slate-100 flex items-center justify-center group/cover">
                
                {/* Fallback Icon Layer (Visible if imgError is true OR image is loading) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 z-0">
                    {imgError ? (
                         <ImageOff size={20} className="text-slate-300" />
                    ) : (
                         <BookOpen size={20} />
                    )}
                </div>
                
                {/* The Image - Only render if no error */}
                {!imgError && (
                    <img 
                        src={displayUrl} 
                        alt={item.title} 
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 relative z-10"
                        onError={(e) => {
                            setImgError(true);
                        }}
                    />
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
