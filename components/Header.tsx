
import React from 'react';
import { Database } from 'lucide-react';

export const Header: React.FC = () => {
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
              Hub open-source per studenti di informatica: appunti, libri e guide della community. 
              Tutti possono modificare: aggiungi e aggiorna risorse con buon senso (niente spam o cancellazioni). 
              Miglioriamo insieme ciò che c’è e facciamolo crescere.
            </p>
        </div>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
    </header>
  );
};
