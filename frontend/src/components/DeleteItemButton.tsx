import type { CalendarItemDeleteKind } from "../types/calendar";

interface DeleteItemButtonProps {
  kind: CalendarItemDeleteKind;
  title: string;
  onDelete: (kind: CalendarItemDeleteKind, id: string, title: string) => void;
  id: string;
  className?: string;
}

export const DeleteItemButton = ({
  kind,
  title,
  id,
  onDelete,
  className = "",
}: DeleteItemButtonProps) => (
  <button
    type="button"
    aria-label={`Delete ${kind} ${title}`}
    title={`Delete ${title}`}
    onClick={(event) => {
      event.stopPropagation();
      onDelete(kind, id, title);
    }}
    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 transition hover:bg-red-100 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${className}`}
  >
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M4.5 6h11M8 6V4.5h4V6m-6 0 .6 9h6.8l.6-9M8.5 8.5v4.5m3-4.5v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </button>
);
