import React from 'react';
import { ResourceItem } from '../types';
import { Badge } from './Badge';
import { FileText, BookOpen, ExternalLink, Calendar, User, Pencil, Trash2, ChevronRight, Download, ImageOff } from 'lucide-react';

interface ResourceGridProps {
  title: string;
  items: ResourceItem[];
  type: 'note' | 'book';
  onEdit: (item: ResourceItem) => void;
  onDelete: (id: string) => void;
}

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
    <div className="group relative bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex items-center p-3 gap-3">
      
      {/* Clickable Link Layer */}
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-0" />

      {/* Icon */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 overflow-hidden">
         {item.icon ? (
            <img src={item.icon} alt="" className="w-5 h-5 object-contain" />
          ) : (
            <FileText size={16} />
          )}
      </div>

      {/* Main Info */}
      <div className="flex-grow min-w-0 flex flex-col gap-0.5 pointer-events-none">
         <h4 className="font-semibold text-slate-700 truncate group-hover:text-blue-600 transition-colors text-sm">
            {item.title}
         </h4>
         
         <div className="flex items-center gap-2">
             <div className="transform scale-90 origin-left">
                <Badge label={item.category} color={item.categoryColor} />
             </div>
             {item.year && (
                 <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                    {item.year}
                 </span>
             )}
         </div>
      </div>

      {/* Actions (Hover only) */}
      <div className="relative z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2 bg-white/80 backdrop-blur-sm rounded-l-lg ml-auto">
        <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
            title="Scarica"
            onClick={(e) => e.stopPropagation()}
        >
            <Download size={14} />
        </a>
        <button 
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit(); }}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Modifica"
        >
            <Pencil size={14} />
        </button>
        <button 
            onClick={(e) => { 
                e.stopPropagation(); 
                e.preventDefault(); 
                if(confirm('Eliminare questa risorsa?')) onDelete(); 
            }}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Elimina"
        >
            <Trash2 size={14} />
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
  return (
    <div className="group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col h-full overflow-hidden">
      
      {/* Clickable Area for Link */}
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-0" />

      {/* Action Buttons (Top Right - Admin) */}
      <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit(); }}
            className="p-1.5 bg-white text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 border border-slate-200 shadow-sm"
            title="Modifica"
        >
            <Pencil size={14} />
        </button>
        <button 
            onClick={(e) => { 
                e.stopPropagation(); 
                e.preventDefault(); 
                if(confirm('Sei sicuro di voler eliminare questa risorsa?')) onDelete(); 
            }}
            className="p-1.5 bg-white text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 border border-slate-200 shadow-sm"
            title="Elimina"
        >
            <Trash2 size={14} />
        </button>
      </div>

      <div className="p-5 flex gap-4 h-full pointer-events-none">
        {/* Left Column: Main Info */}
        <div className="flex-1 flex flex-col min-w-0">
           {/* Top Row: Icon & Badge - ONLY SHOW IF NO COVER IMAGE */}
           {!item.coverImage && (
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-lg ${type === 'note' ? 'bg-blue-50' : 'bg-violet-50'}`}>
                  {item.icon ? (
                    <img src={item.icon} alt="" className="w-5 h-5 object-contain" />
                  ) : (
                    type === 'note' ? <FileText size={20} className="text-blue-600" /> : <BookOpen size={20} className="text-violet-600" />
                  )}
                </div>
                 <Badge label={item.category} color={item.categoryColor} />
              </div>
           )}

          {/* Main Content */}
          <div className="flex-grow">
            <h4 className="font-bold text-slate-800 group-hover:text-blue-600 leading-snug mb-1 transition-colors break-words">
              {item.title}
            </h4>
            
            {type === 'book' && item.description && (
              <p className="text-sm text-slate-500 line-clamp-2 mb-2 flex items-center gap-1">
                <User size={12} /> {item.description}
              </p>
            )}
            
            {item.coverImage && (
                <div className="mt-2">
                     <Badge label={item.category} color={item.categoryColor} />
                </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-3">
              {item.year && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {item.year}
                </span>
              )}
              {item.dateAdded && type === 'book' && (
                <span className="flex items-center gap-1">
                <Calendar size={12} /> {item.dateAdded}
              </span>
              )}
            </div>
            
            {/* Download Button (Visible on Hover/Always) */}
            <div className="relative z-10">
                <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-md transition-all border border-transparent hover:border-blue-100 shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className="font-bold">Scarica</span>
                    <Download size={14} />
                </a>
            </div>
          </div>
        </div>

        {/* Right Column: Cover Image (Only for books) */}
        {type === 'book' && item.coverImage && (
          <div className="w-24 sm:w-28 flex-shrink-0">
             <div className="aspect-[2/3] w-full rounded-md overflow-hidden shadow-sm border border-slate-200 relative bg-slate-100 flex items-center justify-center group/cover">
                {/* Fallback Icon (Visible if image fails or loading) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 z-0">
                    <BookOpen size={24} />
                    <span className="text-[10px] mt-1 font-medium">Cover</span>
                </div>
                
                {/* The Image */}
                <img 
                    src={item.coverImage} 
                    alt={item.title} 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 relative z-10"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none'; // Hide broken image, revealing fallback
                    }}
                />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
