/** Small inline spinner for primary buttons (white ring on brand-dark bg). */
const ButtonSpinner = ({ className = '' }) => (
  <span
    className={`inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0 ${className}`}
    aria-hidden
  />
);

export default ButtonSpinner;
