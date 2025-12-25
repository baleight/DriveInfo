import React from 'react';
import { Database, Share2, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="pt-12 pb-8 px-6 lg:px-8 max-w-7xl mx-auto">
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
        
        {/* Quick Stats / Info pill */}
        <div className="hidden md:flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-3 border-r border-slate-100">
            <Share2 size={18} className="text-emerald-500" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400">Accesso</span>
              <span className="text-sm font-semibold text-slate-700">Pubblico</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2">
             <ShieldCheck size={18} className="text-blue-500" />
             <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
              <span className="text-sm font-semibold text-slate-700">Online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
    </header>
  );
};