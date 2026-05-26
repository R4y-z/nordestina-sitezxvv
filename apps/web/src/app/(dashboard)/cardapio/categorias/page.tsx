'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, GripVertical, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const PRESET_COLORS = ['#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EC4899', '#14B8A6', '#6366F1', '#84CC16'];

export default function CategoriasPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#F59E0B', active: true, order: 0 });

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await api.get('/menu/categories');
      setCategories(data);
    } catch { toast.error('Erro ao carregar categorias'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const save = async () => {
    if (!form.name) { toast.error('Informe o nome da categoria'); return; }
    try {
      if (editing) {
        await api.put(`/menu/categories/${editing.id}`, form);
        toast.success('Categoria atualizada!');
      } else {
        await api.post('/menu/categories', form);
        toast.success('Categoria criada!');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', description: '', color: '#F59E0B', active: true, order: 0 });
      loadCategories();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Erro ao salvar'); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Remover esta categoria? Os produtos ficarão sem categoria.')) return;
    try {
      await api.delete(`/menu/categories/${id}`);
      toast.success('Categoria removida');
      loadCategories();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Erro ao remover'); }
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || '', color: c.color || '#F59E0B', active: c.active, order: c.order || 0 });
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categorias</h1>
          <p className="page-subtitle">{categories.length} categoria{categories.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); setForm({ name: '', description: '', color: '#F59E0B', active: true, order: 0 }); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

      {/* Categories grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => <div key={i} className="h-24 bg-stone-100 rounded-xl animate-pulse" />)
        ) : categories.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3 card p-12 text-center">
            <Tag className="w-12 h-12 mx-auto mb-3 text-stone-200" />
            <p className="text-stone-400">Nenhuma categoria cadastrada</p>
          </div>
        ) : categories.map(c => (
          <div key={c.id} className={cn('card p-4 flex items-center gap-4', !c.active && 'opacity-50')}>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${c.color}20`, color: c.color }}
            >
              <Tag className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-stone-900">{c.name}</p>
                {!c.active && <span className="badge bg-stone-100 text-stone-500 text-xs">Inativo</span>}
              </div>
              {c.description && <p className="text-xs text-stone-400 truncate mt-0.5">{c.description}</p>}
              <p className="text-xs text-stone-400 mt-0.5">{c._count?.products || 0} produto{c._count?.products !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => openEdit(c)} className="btn-sm btn-ghost px-2"><Edit className="w-3.5 h-3.5" /></button>
              {(c._count?.products || 0) === 0 && (
                <button onClick={() => deleteCategory(c.id)} className="btn-sm text-red-500 hover:bg-red-50 px-2 rounded-lg h-8"><Trash2 className="w-3.5 h-3.5" /></button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="p-6">
              <h3 className="font-bold text-xl text-stone-900 mb-5">{editing ? 'Editar Categoria' : 'Nova Categoria'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Nome *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="Ex: Lanches, Bebidas..." />
                </div>
                <div>
                  <label className="label">Descrição</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input" placeholder="Opcional" />
                </div>
                <div>
                  <label className="label">Cor</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setForm(f => ({ ...f, color }))}
                        className={cn('w-8 h-8 rounded-full transition-transform hover:scale-110', form.color === color && 'ring-2 ring-offset-2 ring-stone-400 scale-110')}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input
                      type="color"
                      value={form.color}
                      onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                      className="w-8 h-8 rounded-full cursor-pointer border-0 p-0"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Ordem de exibição</label>
                  <input value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} type="number" className="input" placeholder="0" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 accent-amber-500" />
                  <span className="text-sm text-stone-700">Categoria ativa</span>
                </label>
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
