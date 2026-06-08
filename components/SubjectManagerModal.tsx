import React, { useState } from 'react';
import { Check, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { SubjectItem, TagColor } from '../types';

interface SubjectManagerModalProps {
  isOpen: boolean;
  subjects: SubjectItem[];
  onClose: () => void;
  onCreate: (name: string, color: TagColor) => Promise<void>;
  onUpdate: (originalName: string, name: string, color: TagColor) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
}

const COLOR_OPTIONS: { value: TagColor; dot: string }[] = [
  { value: TagColor.GRAY, dot: 'bg-slate-400' },
  { value: TagColor.RED, dot: 'bg-red-500' },
  { value: TagColor.BROWN, dot: 'bg-orange-600' },
  { value: TagColor.YELLOW, dot: 'bg-yellow-400' },
  { value: TagColor.GREEN, dot: 'bg-emerald-500' },
  { value: TagColor.BLUE, dot: 'bg-blue-500' },
  { value: TagColor.PURPLE, dot: 'bg-violet-500' },
  { value: TagColor.PINK, dot: 'bg-pink-500' },
];

const inputClass = "w-full bg-white border-2 border-brut-border p-2 text-brut-text font-medium focus:outline-none focus:border-brut-accent focus:shadow-brut-accent";

export const SubjectManagerModal: React.FC<SubjectManagerModalProps> = ({
  isOpen,
  subjects,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<TagColor>(TagColor.GRAY);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftColor, setDraftColor] = useState<TagColor>(TagColor.GRAY);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const sortedSubjects = [...subjects].sort((a, b) => a.name.localeCompare(b.name));

  const startEdit = (subject: SubjectItem) => {
    setEditingName(subject.name);
    setDraftName(subject.name);
    setDraftColor(subject.color || TagColor.GRAY);
    setError(null);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setLoadingKey('create');
    setError(null);
    try {
      await onCreate(name, newColor);
      setNewName('');
      setNewColor(TagColor.GRAY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio.');
    } finally {
      setLoadingKey(null);
    }
  };

  const handleUpdate = async (originalName: string) => {
    const name = draftName.trim();
    if (!name) return;
    setLoadingKey(`update:${originalName}`);
    setError(null);
    try {
      await onUpdate(originalName, name, draftColor);
      setEditingName(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio.');
    } finally {
      setLoadingKey(null);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Disattivare la materia "${name}"?`)) return;
    setLoadingKey(`delete:${name}`);
    setError(null);
    try {
      await onDelete(name);
      if (editingName === name) setEditingName(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio.');
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-brut-text/80 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border-2 border-brut-border shadow-brut-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-5 py-3 border-b-2 border-brut-border bg-brut-accent sticky top-0 z-10">
          <h2 className="text-sm font-black uppercase tracking-widest text-brut-text">
            // MATERIE
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 border-2 border-brut-border bg-white flex items-center justify-center hover:bg-red-100 hover:text-red-700 text-brut-text"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
            <input
              type="text"
              className={inputClass}
              placeholder="Nuova materia"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleCreate();
                }
              }}
            />
            <div className="flex items-center gap-2">
              <ColorPicker value={newColor} onChange={setNewColor} />
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim() || loadingKey === 'create'}
                className="h-10 px-3 border-2 border-brut-border bg-brut-accent text-brut-text font-black uppercase tracking-wider text-xs shadow-brut hover:shadow-brut-lg hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loadingKey === 'create' ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} strokeWidth={3} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="border-2 border-red-700 bg-red-50 text-red-700 text-xs font-bold p-3">
              {error}
            </div>
          )}

          <div className="border-2 border-brut-border bg-white shadow-brut divide-y divide-brut-line">
            {sortedSubjects.map((subject) => {
              const isEditing = editingName === subject.name;
              const isBusy = loadingKey?.endsWith(subject.name);

              return (
                <div key={subject.name} className="grid grid-cols-[1fr_auto] gap-3 p-3 items-center">
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 min-w-0">
                      <input
                        type="text"
                        className={inputClass}
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                      />
                      <ColorPicker value={draftColor} onChange={setDraftColor} />
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 border border-brut-border ${getColorDot(subject.color || TagColor.GRAY)}`} />
                        <span className="font-bold text-sm text-brut-text break-words">{subject.name}</span>
                      </div>
                      {subject.dateAdded && (
                        <p className="font-mono text-[10px] text-brut-muted mt-1">{String(subject.dateAdded)}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdate(subject.name)}
                          disabled={!draftName.trim() || isBusy}
                          className="w-8 h-8 border border-brut-border bg-white hover:bg-brut-accent flex items-center justify-center disabled:opacity-40"
                          title="Salva"
                        >
                          {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} strokeWidth={2.5} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingName(null)}
                          className="w-8 h-8 border border-brut-border bg-white hover:bg-brut-bg flex items-center justify-center"
                          title="Annulla"
                        >
                          <X size={13} strokeWidth={2.5} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(subject)}
                          className="w-8 h-8 border border-brut-border bg-white hover:bg-brut-accent flex items-center justify-center"
                          title="Modifica"
                        >
                          <Pencil size={13} strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(subject.name)}
                          disabled={isBusy}
                          className="w-8 h-8 border border-brut-border bg-white hover:bg-red-100 hover:text-red-700 flex items-center justify-center disabled:opacity-40"
                          title="Disattiva"
                        >
                          {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} strokeWidth={2.5} />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ColorPickerProps {
  value: TagColor;
  onChange: (value: TagColor) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => (
  <div className="flex flex-wrap gap-1">
    {COLOR_OPTIONS.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={`w-7 h-7 border-2 flex items-center justify-center ${option.dot} ${
          value === option.value ? 'border-brut-border shadow-brut scale-105' : 'border-brut-line hover:border-brut-border'
        }`}
        title={option.value}
      >
        {value === option.value && <Check size={12} strokeWidth={3} className="text-white drop-shadow" />}
      </button>
    ))}
  </div>
);

function getColorDot(color: TagColor): string {
  return COLOR_OPTIONS.find(option => option.value === color)?.dot || 'bg-slate-400';
}
