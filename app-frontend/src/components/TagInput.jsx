import { useState, useRef } from 'react';

// Tags are uppercased automatically (engine codes: M271, OM651, etc.)
const TagInput = ({ values = [], onChange, placeholder = 'e.g. M271' }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const addTag = (raw) => {
    const tag = raw.trim().toUpperCase();
    if (tag && !values.includes(tag)) onChange([...values, tag]);
    setInput('');
  };

  const removeTag = (tag) => onChange(values.filter((t) => t !== tag));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && values.length > 0) {
      removeTag(values[values.length - 1]);
    }
  };

  return (
    <div>
      <div
        className="flex flex-wrap items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 focus-within:ring-2 focus-within:ring-brand-dark/40 dark:focus-within:ring-white/20 transition min-h-[2.5rem] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {values.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-brand-dark text-white dark:bg-white/15 dark:text-gray-200 shrink-0"
          >
            {tag}
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="opacity-50 hover:opacity-100 transition"
            >
              <XIcon />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => input.trim() && addTag(input)}
          placeholder={values.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
        />
      </div>
    </div>
  );
};

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
    <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
  </svg>
);

export default TagInput;
