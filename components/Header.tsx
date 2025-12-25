import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="group relative mb-8">
      {/* Cover Image */}
      <div className="h-[30vh] w-full overflow-hidden">
        <img 
          src="https://picsum.photos/1200/400?grayscale" 
          alt="Cover" 
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Content Container (Standard Notion Width) */}
      <div className="max-w-[900px] mx-auto px-12 sm:px-24 relative">
        {/* Icon (Overlapping Cover) */}
        <div className="-mt-10 mb-4 select-none">
          <span className="text-[78px] leading-none">🚸</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-[#37352f] mb-4">
          DRIVE INFORMATICA TRIENNALE
        </h1>

        {/* Intro Text / Callouts */}
        <div className="space-y-2 text-[#37352f] text-base leading-6">
          <p>Qui sotto trovi i link dei materiali creati dagli studenti.</p>
          <p>
            <strong>Tutti avete i permessi per modificarli</strong>: l’obiettivo è{' '}
            <strong>espandere e aggiornare appunti e link</strong>.
          </p>
          <p>
            Usiamoli con buon senso: <strong>niente spam, niente cancellazioni inutili</strong>{' '}
            e, se possibile, <strong>miglioriamo ciò che già c’è</strong>.
          </p>
          
          <div className="mt-4 p-4 rounded bg-red-50 border border-red-100 text-red-900">
            Gli studenti degli altri corsi ci invidiano perché noi abbiamo l’open source nel sangue:{' '}
            <strong>non scordatelo mai.</strong>
          </div>
        </div>
        
        <hr className="mt-8 border-[#e9e9e7]" />
      </div>
    </header>
  );
};
