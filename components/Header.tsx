import React from 'react';
import { Database } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full border-b-2 border-brut-border bg-brut-bg px-6 lg:px-12 py-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

        {/* Left: Logo + Title */}
        <div className="flex items-start gap-4">
          <div className="bg-brut-accent border-2 border-brut-border shadow-brut p-2 flex-shrink-0">
            <Database size={22} className="text-brut-text" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brut-muted leading-none mb-1">
              Drive Informatica Triennale
            </p>
            <h1 className="text-2xl md:text-3xl font-black text-brut-text leading-none tracking-tight">
              HUB RISORSE
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
};
