import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  Field,
  Input,
  Select,
  Banner,
  PrimaryButton,
} from '../components/FormField';

const ROLES = [
  { value: 'FleetManager', label: 'Fleet Manager' },
  { value: 'Driver', label: 'Driver' },
  { value: 'SafetyOfficer', label: 'Safety Officer' },
  { value: 'FinancialAnalyst', label: 'Financial Analyst' },
];

export default function Login() {
  const { login, register, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'FleetManager',
  });

  const update = (key) => (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: event.target.value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    const ok =
      mode === 'login'
        ? await login(form.email, form.password)
        : await register(form);

    if (ok) navigate('/');
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-base-950 px-4 py-6 sm:py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2 sm:mb-8">
          <Compass className="h-7 w-7 shrink-0 text-signal-500" strokeWidth={2.2} />

          <div className="min-w-0">
            <p className="font-display text-xl font-semibold text-base-100">
              TransitOps
            </p>
            <p className="mono text-[10px] uppercase tracking-widest text-base-400">
              Fleet Control Platform
            </p>
          </div>
        </div>

        <div className="rounded border border-base-700 bg-base-900 p-4 sm:p-6">
          <div className="mb-5 flex gap-1 rounded bg-base-800 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded px-2 py-2 text-sm ${
                mode === 'login'
                  ? 'bg-base-700 text-signal-500'
                  : 'text-base-400'
              }`}
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 rounded px-2 py-2 text-sm ${
                mode === 'register'
                  ? 'bg-base-700 text-signal-500'
                  : 'text-base-400'
              }`}
            >
              Create account
            </button>
          </div>

          {error && <Banner tone="danger">{error}</Banner>}

          <form onSubmit={submit}>
            {mode === 'register' && (
              <Field label="Full name" required>
                <Input
                  value={form.name}
                  onChange={update('name')}
                  required
                  placeholder="Jordan Blake"
                />
              </Field>
            )}

            <Field label="Email" required>
              <Input
                type="email"
                value={form.email}
                onChange={update('email')}
                required
                placeholder="you@company.com"
              />
            </Field>

            <Field label="Password" required>
              <Input
                type="password"
                value={form.password}
                onChange={update('password')}
                required
                minLength={6}
                placeholder="••••••••"
              />
            </Field>

            {mode === 'register' && (
              <Field label="Role" required>
                <Select value={form.role} onChange={update('role')}>
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            <PrimaryButton type="submit" disabled={loading} className="mt-2 w-full">
              {loading
                ? 'Please wait…'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}
            </PrimaryButton>
          </form>

          {mode === 'login' && (
            <div className="mt-5 border-t border-base-700 pt-4">
              <p className="mono text-[10px] uppercase tracking-widest text-base-400">
                Demo logins (password123)
              </p>

              <ul className="mt-2 space-y-1 text-xs text-base-400">
                <li className="break-all">
                  fleet.manager@transitops.demo — Fleet Manager
                </li>
                <li className="break-all">driver@transitops.demo — Driver</li>
                <li className="break-all">
                  safety.officer@transitops.demo — Safety Officer
                </li>
                <li className="break-all">
                  analyst@transitops.demo — Financial Analyst
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}