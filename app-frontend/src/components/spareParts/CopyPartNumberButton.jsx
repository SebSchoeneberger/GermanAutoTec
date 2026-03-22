import { useState } from 'react';
import { toast } from 'react-toastify';

/**
 * One-click copy of a part number to the clipboard. Stops propagation so it can sit inside clickable cards.
 */
const CopyPartNumberButton = ({ partNumber, className = '' }) => {
  const [justCopied, setJustCopied] = useState(false);

  const copy = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(partNumber);
      setJustCopied(true);
      toast.success('Part number copied');
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={justCopied ? 'Copied!' : 'Copy part number'}
      className={`inline-flex items-center justify-center p-1 rounded-md text-gray-400 hover:text-brand-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-brand-dark/30 ${className}`}
      aria-label="Copy part number"
    >
      {justCopied ? <CheckIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> : <ClipboardIcon className="w-3.5 h-3.5" />}
    </button>
  );
};

const ClipboardIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
  </svg>
);

export default CopyPartNumberButton;
