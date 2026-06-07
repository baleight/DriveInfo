
import React, { useState, useEffect } from 'react';
import { ResourceItem } from '../types';
import { Badge } from './Badge';
import { FileText, BookOpen, Download, Pencil, Trash2, User, ImageOff, ExternalLink } from 'lucide-react';
import { splitCategories } from '../utils/categories';

interface ResourceGridProps {
  title: string;
  items: ResourceItem[];
  type: 'note' | 'book';
  onEdit: (item: ResourceItem) => void;
  onDelete: (id: string) => void;
}

const getCoverUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
        let id = '';
        const idParamMatch = url.match(/[?&]id=([-\w]{25,})/);
        if (idParamMatch) {
            id = idParamMatch[1];
        } else {
            const pathMatch = url.match(/\/d\/([-\w]{25,})/);
            if (pathMatch) {
                id = pathMatch[1];
            } else {
                const rawMatch = url.match(/[-\w]{25,}/);
                if (rawMatch && rawMatch[0].length > 20) id = rawMatch[0];
            }
        }
        if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`;
    }
    return url;
};

export const ResourceTable: React.FC<ResourceGridProps> = ({ title, items, type, onEdit, onDelete }) => {
  if (items.length === 0) return null;

  return (
    <section className="animate-fade-in">
      {/* Section Header — black bar */}
      <div className="flex items-center gap-3 mb-4 border-2 border-brut-border bg-brut-text px-4 py-2.5 shadow-brut">
        {type === 'note'
          ? <FileText size={16} className="text-brut-accent flex-shrink-0" strokeWidth={2.5} />
          : <BookOpen size={16} className="text-brut-accent flex-shrink-0" strokeWidth={2.5} />
        }
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex-1">
          {title}
        </h3>
        <span className="bg-brut-accent text-brut-text font-mono text-xs font-bold px-2 py-0.5 border border-brut-border">
          {items.length}
        </span>
      </div>

      {type === 'note' ? (
        // LIST VIEW — dense rows
        <div className="border-2 border-brut-border bg-white shadow-brut divide-y divide-brut-line">
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
        // GRID VIEW — brutal cards
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

// --- ROW (Notes) ---
interface ActionProps {
    item: ResourceItem;
    onEdit: () => void;
    onDelete: () => void;
}

const ResourceRow: React.FC<ActionProps> = ({ item, onEdit, onDelete }) => {
  return (
    <div className="group relative flex items-center gap-3 px-3 py-2.5 hover:bg-brut-accent/20 min-h-[52px]">

      {/* Category color bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getCategoryBarColor(item.categoryColor)}`} />

      {/* Icon — square */}
      <div className="flex-shrink-0 w-8 h-8 border border-brut-border bg-brut-bg flex items-center justify-center overflow-hidden ml-1">
        {item.icon ? (
          <img src={item.icon} alt="" className="w-5 h-5 object-contain" />
        ) : (
          <FileText size={14} className="text-brut-muted" />
        )}
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="font-semibold text-brut-text text-sm leading-snug break-words">
          {item.title}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {splitCategories(item.category).map(category => (
            <Badge key={category} label={category} color={item.categoryColor} />
          ))}
          {item.year && (
            <span className="font-mono text-[10px] text-brut-muted">
              {item.year}
            </span>
          )}
        </div>
      </div>

      {/* Actions (hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0 pointer-events-auto">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-7 h-7 flex items-center justify-center border border-brut-border bg-white hover:bg-brut-accent text-brut-muted hover:text-brut-text"
          title="Apri"
        >
          <ExternalLink size={12} strokeWidth={2.5} />
        </a>
        <button
          onClick={(e) => { e.preventDefault(); onEdit(); }}
          className="w-7 h-7 flex items-center justify-center border border-brut-border bg-white hover:bg-brut-accent text-brut-muted hover:text-brut-text"
          title="Modifica"
        >
          <Pencil size={12} strokeWidth={2.5} />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (confirm('Eliminare questa risorsa?')) onDelete();
          }}
          className="w-7 h-7 flex items-center justify-center border border-brut-border bg-white hover:bg-red-100 text-brut-muted hover:text-red-700"
          title="Elimina"
        >
          <Trash2 size={12} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

// --- CARD (Books) ---
interface CardProps {
    item: ResourceItem;
    type: 'note' | 'book';
    onEdit: () => void;
    onDelete: () => void;
}

const ResourceCard: React.FC<CardProps> = ({ item, type, onEdit, onDelete }) => {
  const [imgError, setImgError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const displayUrl = getCoverUrl(item.coverImage);

  useEffect(() => {
    setImgError(false);
    setIsLoaded(false);
  }, [displayUrl]);

  return (
    <div className="group relative border-2 border-brut-border bg-white shadow-brut hover:shadow-brut-lg hover:-translate-y-1 hover:-translate-x-0.5 flex flex-col overflow-hidden">

      {/* Invisible full-card link */}
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-0" />

      {/* Content */}
      <div className="p-3 flex flex-1 gap-3 pointer-events-none">
        {type === 'book' && displayUrl && (
          <div className="w-14 h-20 border-2 border-brut-border relative bg-brut-bg flex items-center justify-center overflow-hidden flex-shrink-0">
            <div className={`absolute inset-0 flex items-center justify-center text-brut-line z-0 ${isLoaded && !imgError ? 'opacity-0' : 'opacity-100'}`}>
              {imgError ? <ImageOff size={18} className="text-brut-line" /> : <BookOpen size={18} className="text-brut-line" />}
            </div>
            <img
              src={displayUrl}
              alt={item.title}
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover z-10 relative ${isLoaded && !imgError ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setIsLoaded(true)}
              onError={() => { setImgError(true); setIsLoaded(true); }}
            />
          </div>
        )}

        <div className="min-w-0 flex flex-col flex-1">
          <h4 className="font-black text-brut-text text-sm leading-tight mb-2 break-words">
            {item.title}
          </h4>

          <div className="mb-2 flex flex-wrap gap-1">
            {splitCategories(item.category).map(category => (
              <Badge key={category} label={category} color={item.categoryColor} />
            ))}
          </div>

          {item.description && (
            <p className="text-[11px] text-brut-muted line-clamp-2 mb-2 flex items-start gap-1">
              <User size={11} className="mt-0.5 flex-shrink-0" /> {item.description}
            </p>
          )}

          {item.year && (
            <p className="font-mono text-[10px] text-brut-muted mt-auto">{item.year}</p>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="border-t-2 border-brut-border flex items-center pointer-events-auto relative z-10">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold uppercase tracking-wider text-brut-text hover:bg-brut-accent border-r-2 border-brut-border"
        >
          <Download size={12} strokeWidth={2.5} /> Scarica
        </a>
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit(); }}
          className="w-10 flex items-center justify-center py-2 text-brut-muted hover:bg-brut-accent hover:text-brut-text border-r border-brut-line"
          title="Modifica"
        >
          <Pencil size={13} strokeWidth={2.5} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (confirm('Eliminare questa risorsa?')) onDelete();
          }}
          className="w-10 flex items-center justify-center py-2 text-brut-muted hover:bg-red-100 hover:text-red-700"
          title="Elimina"
        >
          <Trash2 size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

// Map categoryColor to a left-bar CSS class
function getCategoryBarColor(color: string): string {
  const map: Record<string, string> = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-400',
    brown: 'bg-orange-600',
    pink: 'bg-pink-500',
    green: 'bg-emerald-500',
    gray: 'bg-slate-400',
    default: 'bg-slate-400',
    purple: 'bg-violet-500',
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
  };
  return map[color] || 'bg-slate-400';
}
