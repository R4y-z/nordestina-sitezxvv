'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { storeApi, setStoreToken } from '@/lib/api';
import { useStoreAuth } from '@/context/auth-context';
import toast from 'react-hot-toast';

export default function CadastroPage() {
  const { refreshCustomer } = useStoreAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('Preencha todos os campos obrigatórios'); return; }
    if (form.password.length < 6) { toast.error('Senha deve ter ao menos 6 caracteres'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Senhas não coincidem'); return; }
    setLoading(true);
    try {
      const { data } = await storeApi.post('/customers/register', { name: form.name, email: form.email, phone: form.phone, password: form.password });
      setStoreToken(data.accessToken);
      await refreshCustomer();
      toast.success('Conta criada com sucesso!');
      router.push('/cardapio');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao criar conta');
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
      <h1 className="text-2xl font-bold text-white mb-2">Criar conta</h1>
      <p className="text-dark-300 text-sm mb-6">Cadastre-se para acompanhar seus pedidos.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: 'name', label: 'Nome *', type: 'text', placeholder: 'Seu nome completo' },
          { key: 'email', label: 'E-mail *', type: 'email', placeholder: 'seu@email.com' },
          { key: 'phone', label: 'Telefone', type: 'tel', placeholder: '(11) 99999-9999' },
        ].map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">{field.label}</label>
            <input
              value={(form as any)[field.key]}
              onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
              type={field.type}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">Senha *</label>
          <div className="relative">
            <input
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              type={showPw ? 'text' : 'password'}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-4 py-3 pr-11 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">Confirmar senha *</label>
          <input
            value={form.confirmPassword}
            onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
            type="password"
            placeholder="Repita a senha"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button type="submit" disabled={loading} className="w-full btn-brand py-3.5 mt-2">
          <UserPlus className="w-4 h-4" />
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-dark-400 text-sm">
          Já tem conta?{' '}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
