import React from 'react';
import { ResourceItem } from '../types';
import { Badge } from './Badge';
import { FileText, BookOpen, ExternalLink, Calendar, User } from 'lucide-react';

interface ResourceGridProps {
  title: string;
  items: ResourceItem[];
  type: 'note' | 'book';
}

export const ResourceTable: React.FC<ResourceGridProps> = ({ title, items, type }) => {
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <ResourceCard key={item.id} item={item} type={type} />
        ))}
      </div>
    </section>
  );
};

const ResourceCard: React.FC<{ item: ResourceItem; type: 'note' | 'book' }> = ({ item, type }) => {
  return (
    <a 
      href={item.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-1 relative overflow-hidden h-full flex flex-col"
    >
      <div className="flex gap-4 h-full">
        {/* Left Column: Main Info */}
        <div className="flex-1 flex flex-col">
           {/* Top Row: Icon & Badge */}
          <div className="flex justify-between items-start mb-3">
            <div className={`p-2 rounded-lg ${type === 'note' ? 'bg-blue-50' : 'bg-violet-50'}`}>
              {item.icon && !item.icon.includes('svg') ? (
                <img src={item.icon} alt="" className="w-5 h-5 object-contain" />
              ) : (
                type === 'note' ? <FileText size={20} className="text-blue-600" /> : <BookOpen size={20} className="text-violet-600" />
              )}
            </div>
            {/* If there is an image, we might hide the badge on small cards or keep it. Let's keep it. */}
             {!item.coverImage && <Badge label={item.category} color={item.categoryColor} />}
          </div>

          {/* Main Content */}
          <div className="flex-grow">
            <h4 className="font-bold text-slate-800 group-hover:text-blue-600 leading-snug mb-1">
              {item.title}
            </h4>
            
            {type === 'book' && item.description && (
              <p className="text-sm text-slate-500 line-clamp-2 mb-2 flex items-center gap-1">
                <User size={12} /> {item.description}
              </p>
            )}
            
            {type === 'note' && (
              <p className="text-xs text-slate-400 truncate mb-2">{item.url}</p>
            )}

            {/* If we have a cover image, show the badge here inside the text flow for better mobile layout */}
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
            
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 flex items-center gap-1">
              <ExternalLink size={12} />
            </div>
          </div>
        </div>

        {/* Right Column: Cover Image (Only for books) */}
        {type === 'book' && item.coverImage && (
          <div className="w-24 flex-shrink-0">
             <div className="aspect-[2/3] w-full rounded-md overflow-hidden shadow-sm border border-slate-100">
                <img 
                    src={item.coverImage} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
             </div>
          </div>
        )}
      </div>
    </a>
  );
};