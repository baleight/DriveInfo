
import React from 'react';
import { Database, Cloud, AlertCircle } from 'lucide-react';
import { StorageInfo } from '../types';

interface HeaderProps {
    storage: StorageInfo | null;
}

const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const Header: React.FC<HeaderProps> = ({ storage }) => {
  
  // Calculate percentage and remaining
  const percentage = storage && storage.limit > 0 ? (storage.used / storage.limit) * 100 : 0;
  const remaining = storage ? storage.limit - storage.used : 0;
  
  // Color logic for progress bar
  const barColor = percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-blue-600';

  return (
    <header className="pt-12 pb-8 px-6 lg:px-12 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <Database size={24} />
            </div>
            <span className="text-sm font-bold tracking-wider text-blue-600 uppercase">Drive Informatica</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Hub Risorse Condivise
          </h1>
          <p className="mt-2 text-slate-600 max-w-xl text-lg">
            La piattaforma open-source per gli studenti di informatica. 
            Appunti, libri e guide curati dalla community.
          </p>
        </div>
        
        {/* Drive Storage Widget */}
        <div className="w-full md:w-auto bg-white p-4 rounded-2xl border border-slate-200 shadow-sm min-w-[280px]">
          <div className="flex items-center gap-2 mb-3">
             <Cloud size={20} className="text-slate-400" />
             <span className="text-xs font-bold uppercase text-slate-500 tracking-wide">Spazio Google Drive</span>
          </div>

          {storage ? (
              <div className="animate-fade-in">
                  <div className="flex justify-between items-end mb-1">
                      <span className="text-sm font-bold text-slate-800">{formatBytes(storage.used)}</span>
                      <span className="text-xs text-slate-400">di {formatBytes(storage.limit)}</span>
                  </div>
                  
                  {/* Progress Bar Track */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`} 
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                     <span className={`${percentage > 90 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                         {percentage.toFixed(1)}% usato
                     </span>
                     <span className="text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                         {formatBytes(remaining)} liberi
                     </span>
                  </div>
              </div>
          ) : (
              // Loading State or Error
              <div className="flex flex-col gap-2 py-1">
                 <div className="w-full h-2.5 bg-slate-100 rounded-full animate-pulse"></div>
                 <div className="flex justify-between">
                     <div className="w-16 h-2 bg-slate-100 rounded animate-pulse"></div>
                     <div className="w-10 h-2 bg-slate-100 rounded animate-pulse"></div>
                 </div>
                 <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> Sincronizzazione quota...
                 </div>
              </div>
          )}
        </div>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
    </header>
  );
};
