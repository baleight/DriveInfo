import React from 'react';
import { Database } from 'lucide-react';

interface HeaderProps {
  noteCount?: number;
  bookCount?: number;
  subjectCount?: number;
  onManageSubjects?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ noteCount = 0, bookCount = 0, subjectCount = 0, onManageSubjects }) => {
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
            {(noteCount > 0 || bookCount > 0 || subjectCount > 0) && (
              <button
                type="button"
                onClick={onManageSubjects}
                className="mt-3 inline-flex items-center gap-2 font-mono text-xs text-brut-muted border-2 border-brut-border px-3 py-1.5 bg-white shadow-brut hover:bg-brut-accent hover:-translate-y-0.5 hover:shadow-brut-lg"
                title="Gestisci materie"
              >
                <span className="text-brut-text font-bold">{noteCount}</span>
                <span>appunti</span>
                <span className="text-brut-line">|</span>
                <span className="text-brut-text font-bold">{bookCount}</span>
                <span>libri</span>
                <span className="text-brut-line">|</span>
                <span className="text-brut-text font-bold">{subjectCount}</span>
                <span>materie</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
