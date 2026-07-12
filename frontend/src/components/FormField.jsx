export function Field({ label, children, required }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-base-400">
        {label} {required && <span className="text-danger-500">*</span>}
      </span>
      {children}
    </label>
  );
}

const baseInputClasses =
  'min-h-11 w-full rounded border border-base-600 bg-base-800 px-3 py-2 text-base text-base-100 placeholder:text-base-500 focus:border-signal-500 focus:outline-none sm:text-sm';

export function Input(props) {
  return (
    <input
      {...props}
      className={`${baseInputClasses} ${props.className || ''}`}
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className={`${baseInputClasses} ${props.className || ''}`}
    >
      {children}
    </select>
  );
}

export function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`${baseInputClasses} min-h-24 resize-y ${props.className || ''}`}
    />
  );
}

export function Banner({ tone = 'danger', children }) {
  const colorMap = {
    danger: 'border-danger-500 bg-danger-500/10 text-danger-500',
    ok: 'border-ok-500 bg-ok-500/10 text-ok-500',
    warn: 'border-warn-500 bg-warn-500/10 text-warn-500',
  };

  return (
    <div className={`mb-4 break-words rounded border px-3 py-2 text-sm ${colorMap[tone]}`}>
      {children}
    </div>
  );
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`min-h-11 rounded bg-signal-500 px-4 py-2 text-sm font-medium text-base-950 hover:bg-signal-600 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`min-h-11 rounded border border-base-600 px-4 py-2 text-sm font-medium text-base-100 hover:border-base-400 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}