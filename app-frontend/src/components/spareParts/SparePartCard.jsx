import { CATEGORY_COLORS, getStockStatus, OWNER_DOT_COLORS, formatETB } from '../../utils/sparePartsUtils';
import { cardHeroUrl } from '../../utils/imageUtils';
import CopyPartNumberButton from './CopyPartNumberButton';
import { PartImagePlaceholderCard } from './PartImagePlaceholder';

const SparePartCard = ({ part, onClick }) => {
  const stock = getStockStatus(part.quantity);
  const categoryColor = CATEGORY_COLORS[part.category] ?? CATEGORY_COLORS.Other;
  const ownerDot = part.ownerType && part.ownerType !== 'Company'
    ? OWNER_DOT_COLORS[part.ownerType]
    : null;

  const openCard = () => onClick();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openCard}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openCard();
        }
      }}
      className="group w-full text-left rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] shadow-sm overflow-hidden
        transition-all duration-200 ease-out
        hover:-translate-y-0.5 hover:shadow-lg hover:border-brand-dark/25 dark:hover:border-white/20
        active:translate-y-0 active:scale-[0.99]
        focus:outline-none focus:ring-2 focus:ring-brand-dark/40 dark:focus:ring-white/20 cursor-pointer"
    >
      {part.imageUrl ? (
        <div className="aspect-[2/1] relative bg-gray-100 dark:bg-white/5 overflow-hidden">
          <img
            src={cardHeroUrl(part.imageUrl)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        <PartImagePlaceholderCard />
      )}

      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate leading-snug">{part.name}</h3>
            <div className="flex items-center gap-0.5 mt-1 min-w-0">
              <p className="text-xs font-mono text-gray-400 dark:text-gray-500 truncate">{part.partNumber}</p>
              <CopyPartNumberButton partNumber={part.partNumber} className="shrink-0" />
            </div>
          </div>
          {part.category && (
            <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${categoryColor}`}>
              {part.category}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 min-w-0">
          {part.brand && <span className="truncate">{part.brand}</span>}
          {part.brand && part.price != null && <span className="text-gray-300 dark:text-gray-600 shrink-0">·</span>}
          {part.price != null && (
            <span className="font-medium text-gray-700 dark:text-gray-300 shrink-0">
              {formatETB(part.price)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100 dark:border-white/5">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stock.className}`}>
            {stock.label}
          </span>
          <div className="flex items-center gap-2">
            {ownerDot && (
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${ownerDot}`}
                title={`${part.ownerType}: ${part.ownerName}`}
              />
            )}
            <span className="text-base font-bold tabular-nums text-gray-900 dark:text-white">
              {part.quantity} <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">pcs</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SparePartCard;
