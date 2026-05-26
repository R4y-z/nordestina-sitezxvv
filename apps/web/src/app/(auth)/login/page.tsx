'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('admin@restaurante.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      const { data } = await api.post('/auth/login', {
        email,
        password,
      });

      Cookies.set('sz_token', data.accessToken, { expires: 7 });
      Cookies.set('sz_refresh', data.refreshToken, { expires: 30 });
      Cookies.set('sz_user', JSON.stringify(data.user), { expires: 7 });

      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error('Erro no login:', err);
      setError(err?.response?.data?.message || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#241006] px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl border border-[#765848] bg-[#3a2519] p-8 shadow-xl"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f59e0b] text-3xl">
            🍴
          </div>

          <h1 className="text-3xl font-bold text-white">
            Nordestina Sistema
          </h1>

          <p className="mt-2 text-sm text-[#fbbf24]">
            Gestão de Restaurante
          </p>
        </div>

        <h2 className="mb-6 text-xl font-semibold text-white">
          Entrar no sistema
        </h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-600 px-4 py-3 text-sm text-white">
            {error}
          </div>
        )}

        <label className="mb-2 block text-sm font-medium text-[#f5d7a1]">
          E-mail
        </label>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-5 w-full rounded-xl border border-[#8b7466] bg-[#6b5b52] px-4 py-3 text-white outline-none placeholder:text-gray-300"
          placeholder="admin@restaurante.com"
          required
        />

        <label className="mb-2 block text-sm font-medium text-[#f5d7a1]">
          Senha
        </label>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-xl border border-[#8b7466] bg-[#6b5b52] px-4 py-3 text-white outline-none placeholder:text-gray-300"
          placeholder="admin123"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#f59e0b] px-4 py-3 font-semibold text-black transition hover:bg-[#fbbf24] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="mt-6 text-center text-xs text-[#fbbf24]">
          Acesso restrito aos funcionários do restaurante
        </p>
      </form>
    </main>
  );
}