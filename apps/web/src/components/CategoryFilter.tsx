import { useEffect, useRef, useState } from 'react';

interface Props {
  options: string[];
  /** Currently selected categories (empty means "all"). */
  selected: string[];
  onChange: (next: string[]) => void;
}

/**
 * A compact multi-select for guest categories: a button that opens a checkbox
 * list, so several categories can be filtered at once (OR). Closes on outside
 * click or Escape.
 */
export default function CategoryFilter({ options, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (t: string) =>
    onChange(
      selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t],
    );

  const label =
    selected.length === 0
      ? 'All categories'
      : selected.length === 1
        ? selected[0]
        : `${selected.length} categories`;

  return (
    <div className="cat-filter" ref={ref}>
      <button
        type="button"
        className={`cat-filter-btn ${selected.length ? 'active' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="cat-filter-text">{label}</span>
        <span className="cat-filter-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="cat-filter-menu" role="listbox" aria-multiselectable>
          <div className="cat-filter-head">
            <span>
              {selected.length
                ? `${selected.length} selected`
                : 'Filter by category'}
            </span>
            <button
              type="button"
              className="cat-filter-clear"
              onClick={() => onChange([])}
              disabled={selected.length === 0}
            >
              Clear
            </button>
          </div>
          <div className="cat-filter-list">
            {options.length === 0 && (
              <p className="cat-filter-empty">No categories yet</p>
            )}
            {options.map((t) => (
              <label key={t} className="cat-filter-option">
                <input
                  type="checkbox"
                  checked={selected.includes(t)}
                  onChange={() => toggle(t)}
                />
                <span>{t}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
