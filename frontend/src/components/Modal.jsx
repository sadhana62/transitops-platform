import { X } from 'lucide-react';

export default function Modal({ open, title, onClose, children, width = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className={`w-full ${width} rounded border border-base-600 bg-base-900 shadow-xl`}>
        <div className="flex items-center justify-between border-b border-base-700 px-5 py-4">
          <h3 className="font-display text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="text-base-400 hover:text-base-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-5 scrollbar-thin">{children}</div>
      </div>
    </div>
  );
}
