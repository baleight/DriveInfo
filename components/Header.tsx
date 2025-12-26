
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
  
  // Default values to prevent "Loading..." forever if API is slow but we know the limit
  const limit = storage ? storage.limit : 15 * 1024 * 1024 * 1024; // Default 15GB
  const used = storage ? storage.used : 0;

  const percentage = (used / limit) * 100;
  const remaining = limit - used;
  
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

          <div className="animate-fade-in">
              <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-bold text-slate-800">{formatBytes(used)}</span>
                  <span className="text-xs text-slate-400">su {formatBytes(limit)}</span>
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
                 <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                     {formatBytes(remaining)} Rimanenti
                 </span>
              </div>
              
              {!storage && (
                <div className="text-[10px] text-slate-300 mt-1 flex justify-end">
                    Aggiornamento...
                </div>
              )}
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
    </header>
  );
};
