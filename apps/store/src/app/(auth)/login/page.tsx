'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useStoreAuth } from '@/context/auth-context';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useStoreAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/cardapio';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Preencha todos os campos'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Bem-vindo(a)!');
      router.push(redirect);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'E-mail ou senha incorretos');
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
      <h1 className="text-2xl font-bold text-white mb-2">Entrar na conta</h1>
      <p className="text-dark-300 text-sm mb-6">Acesse seu histórico de pedidos e muito mais.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">E-mail</label>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">Senha</label>
          <div className="relative">
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-4 py-3 pr-11 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full btn-brand py-3.5 mt-2">
          <LogIn className="w-4 h-4" />
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-dark-400 text-sm">
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">Criar conta grátis</Link>
        </p>
      </div>
      <div className="mt-3 text-center">
        <Link href="/cardapio" className="text-dark-500 text-xs hover:text-dark-300 transition-colors">Continuar sem conta</Link>
      </div>
    </div>
  );
}
