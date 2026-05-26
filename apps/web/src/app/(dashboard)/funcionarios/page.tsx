'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, ToggleLeft, ToggleRight, UserCheck, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { getRoleLabel, formatDate } from '@/lib/utils';
import type { User } from '@/types';
import { cn } from '@/lib/utils';

const ROLES = ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER', 'KITCHEN', 'DELIVERY'];
const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700', MANAGER: 'bg-purple-100 text-purple-700',
  CASHIER: 'bg-blue-100 text-blue-700', WAITER: 'bg-amber-100 text-amber-700',
  KITCHEN: 'bg-orange-100 text-orange-700', DELIVERY: 'bg-emerald-100 text-emerald-700',
};

export default function FuncionariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'WAITER', pin: '', active: true });

  const loadUsers = useCallback(async () => {
    try {
      const params = roleFilter ? `?role=${roleFilter}` : '';
      const { data } = await api.get(`/users${params}`);
      setUsers(data);
    } catch { toast.error('Erro ao carregar funcionários'); }
    finally { setLoading(false); }
  }, [roleFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const save = async () => {
    if (!form.name || !form.email || (!editing && !form.password)) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    try {
      if (editing) {
        const data: any = { name: form.name, phone: form.phone, role: form.role, pin: form.pin };
        if (form.password) data.password = form.password;
        await api.put(`/users/${editing.id}`, data);
        toast.success('Funcionário atualizado!');
      } else {
        await api.post('/users', form);
        toast.success('Funcionário criado!');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', email: '', phone: '', password: '', role: 'WAITER', pin: '', active: true });
      loadUsers();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Erro ao salvar'); }
  };

  const toggleActive = async (id: string) => {
    try {
      await api.patch(`/users/${id}/toggle`);
      loadUsers();
    } catch { toast.error('Erro'); }
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, phone: u.phone || '', password: '', role: u.role, pin: '', active: u.active });
    setShowForm(true);
  };

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Funcionários</h1>
          <p className="page-subtitle">{filtered.length} funcionário{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); setForm({ name: '', email: '', phone: '', password: '', role: 'WAITER', pin: '', active: true }); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Novo Funcionário
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar funcionário..." className="input pl-9" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input w-44">
          <option value="">Todos os cargos</option>
          {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Funcionário</th><th>Cargo</th><th>Contato</th><th>Status</th><th>Desde</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i}>{[...Array(6)].map((_, j) => <td key={j}><div className="h-4 bg-stone-100 rounded animate-pulse" /></td>)}</tr>)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-stone-400 py-12">Nenhum funcionário encontrado</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brown-700 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{u.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-stone-900">{u.name}</p>
                        <p className="text-xs text-stone-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className={cn('badge', ROLE_COLORS[u.role] || 'bg-stone-100 text-stone-600')}>{getRoleLabel(u.role)}</span></td>
                  <td><span className="text-sm text-stone-500">{u.phone || '—'}</span></td>
                  <td>
                    <button onClick={() => toggleActive(u.id)} className={cn('flex items-center gap-1.5 text-sm font-medium', u.active ? 'text-emerald-600' : 'text-stone-400')}>
                      {u.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      {u.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td><span className="text-sm text-stone-400">{formatDate(u.createdAt, 'date')}</span></td>
                  <td>
                    <button onClick={() => openEdit(u)} className="btn-sm btn-ghost px-2"><Edit className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in">
            <div className="p-6">
              <h3 className="font-bold text-xl text-stone-900 mb-5">{editing ? 'Editar Funcionário' : 'Novo Funcionário'}</h3>
              <div className="space-y-3">
                <div>
                  <label className="label">Nome *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" />
                </div>
                {!editing && (
                  <div>
                    <label className="label">E-mail *</label>
                    <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" className="input" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">{editing ? 'Nova Senha' : 'Senha *'}</label>
                    <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} type="password" placeholder={editing ? '(manter atual)' : ''} className="input" />
                  </div>
                  <div>
                    <label className="label">PIN (4 dígitos)</label>
                    <input value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value }))} maxLength={4} placeholder="1234" className="input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Cargo *</label>
                    <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input">
                      {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Telefone</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" className="input" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 btn-outline">Cancelar</button>
                <button onClick={save} className="flex-1 btn-primary">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
