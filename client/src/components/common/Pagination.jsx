import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

/**
 * Universal Golden Pagination Bar for DormSafe.
 * Enforces unified visual standards, windowed page navigation, and mobile-safe responsiveness.
 *
 * @param {number} page - Current page (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {number} [totalCount] - Total count of matching records
 * @param {string} [itemLabel='matching records'] - Descriptive label for the items being paginated
 * @param {function} onPageChange - Callback when a new page is clicked (receives page number)
 * @param {string} [className=''] - Optional additional classes
 */
export function Pagination({
  page,
  totalPages,
  totalCount,
  itemLabel = 'matching records',
  onPageChange,
  className = '',
}) {
  if (!totalPages || totalPages <= 1) return null;

  // Windowing calculation: show at most 7 pill slots
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    pages.push(1);

    if (page > 3) {
      pages.push('ellipsis-start');
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (page < totalPages - 2) {
      pages.push('ellipsis-end');
    }

    pages.push(totalPages);
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/80 pt-4 text-xs text-slate-500 ${className}`.trim()}
    >
      <div>
        Showing page <strong className="font-semibold text-slate-800">{page}</strong> of{' '}
        <strong className="font-semibold text-slate-800">{totalPages}</strong>
        {typeof totalCount === 'number' && (
          <span>
            {' '}({totalCount} {itemLabel})
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          radius="full"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          startContent={<ChevronLeft size={14} />}
          className="h-8 px-2.5 text-xs"
        >
          Previous
        </Button>

        {pages.map((item, idx) => {
          if (typeof item === 'string') {
            return (
              <span
                key={`${item}-${idx}`}
                className="flex h-8 w-6 items-center justify-center text-xs text-slate-400 font-medium select-none"
              >
                …
              </span>
            );
          }

          const isCurrent = item === page;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={isCurrent ? 'page' : undefined}
              className={`h-8 w-8 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-ateneo-blue text-white shadow-xs font-bold'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item}
            </button>
          );
        })}

        <Button
          size="sm"
          radius="full"
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          endContent={<ChevronRight size={14} />}
          className="h-8 px-2.5 text-xs"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
