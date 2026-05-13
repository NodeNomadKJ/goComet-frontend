import type { AxiosError } from 'axios';

interface ApiErr { message?: string | string[]; error?: string }

export function ErrorAlert({ error }: { error: unknown }) {
  if (!error) return null;
  const e = error as AxiosError<ApiErr>;
  const raw = e.response?.data?.message ?? e.message ?? 'Something went wrong';
  const text = Array.isArray(raw) ? raw.join(', ') : raw;
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
      {text}
    </div>
  );
}
