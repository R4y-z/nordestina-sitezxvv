'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, Tag, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Product, Category } from '@/types';
import { cn } from '@/lib/utils';

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  price: '',
  costPrice: '',
  description: '',
  preparationTime: '15',
  image: '',
  isKgProduct: false,
  active: true,
  available: true,
  showOnStore: true,
};

export default function ProdutosPage() {
  const [products,   setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState<Product | null>(null);
  const [form,       setForm]       = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([api.get('/menu/products'), api.get('/menu/categories')]);
      const prods = Array.isArray(p.data) ? p.data : (p.data?.items ?? []);
      const cats  = Array.isArray(c.data) ? c.data : (c.data?.items ?? []);
      setProducts(prods);
      setCategories(cats);
    } catch { toast.error('Erro ao carregar produtos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const save = async () => {
    if (!form.name || !form.categoryId || !form.price) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    try {
      const payload = {
        ...form,
        price:           parseFloat(form.price),
        costPrice:       parseFloat(form.costPrice) || 0,
        preparationTime: parseInt(form.preparationTime) || 15,
        image:           form.image.trim() || null,
        slug: form.name.toLowerCase()
          .normalize('NFD').replace(/[̀-ͯ]/g, '')
          .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now(),
      };
      if (editing) {
        await api.put(`/menu/products/${editing.id}`, payload);
        toast.success('Produto atualizado!');
      } else {
        await api.post('/menu/products', payload);
        toast.success('Produto criado!');
      }
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      loadData();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Erro ao salvar'); }
  };

  const toggleAvailable = async (id: string) => {
    try {
      await api.patch(`/menu/products/${id}/availability`);
      setProducts(p => p.map(x => x.id === id ? { ...x, available: !x.available } : x));
    } catch { toast.error('Erro ao alterar disponibilidade'); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Remover este produto?')) return;
    try {
      await api.delete(`/menu/products/${id}`);
      toast.success('Produto removido');
      loadData();
    } catch { toast.error('Erro ao remover produto'); }
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name:            p.name,
      categoryId:      p.categoryId,
      price:           String(p.price),
      costPrice:       String(p.costPrice),
      description:     p.description || '',
      preparationTime: String(p.preparationTime),
      image:           p.image || '',
      isKgProduct:     p.isKgProduct ?? false,
      active:          p.active,
      available:       p.available,
      showOnStore:     p.showOnStore,
    });
    setShowForm(true);
  };

  const filtered = products.filter(p =>
    (!search    || p.name.toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || p.categoryId === catFilter),
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Produtos</h1>
          <p className="page-subtitle">{filtered.length} produto{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); setForm(EMPTY_FORM); }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Novo Produto
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..." className="input pl-9" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input w-48">
          <option value="">Todas as categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Custo</th>
                <th>Margem</th>
                <th>Disponível</th>
                <th>Loja</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>{[...Array(8)].map((_, j) => <td key={j}><div className="h-4 bg-stone-100 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-stone-400 py-12">Nenhum produto encontrado</td></tr>
              ) : filtered.map(p => {
                const margin = p.price > 0 ? ((p.price - p.costPrice) / p.price * 100).toFixed(0) : 0;
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {/* Thumbnail */}
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-stone-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                            <ImageOff className="w-4 h-4 text-stone-300" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-stone-900">{p.name}</p>
                          {p.description && <p className="text-xs text-stone-400 truncate max-w-[200px]">{p.description}</p>}
                          {p.isKgProduct && <span className="text-xs text-amber-600 font-medium">Por KG</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      {(p as any).category && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: (p as any).category.color || '#666' }}>
                          <Tag className="w-3 h-3" />{(p as any).category.name}
                        </span>
                      )}
                    </td>
                    <td><span className="font-semibold text-stone-900">{formatCurrency(p.price)}</span></td>
                    <td><span className="text-stone-500">{formatCurrency(p.costPrice)}</span></td>
                    <td>
                      <span className={cn('text-sm font-medium', Number(margin) > 50 ? 'text-emerald-600' : Number(margin) > 30 ? 'text-amber-600' : 'text-red-500')}>
                        {margin}%
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleAvailable(p.id)}
                        className={cn('w-8 h-8 flex items-center justify-center rounded-lg transition-colors', p.available ? 'text-emerald-600 hover:bg-emerald-50' : 'text-stone-300 hover:bg-stone-100')}
                      >
                        {p.available ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                    </td>
                    <td>
                      <span className={cn('w-2 h-2 rounded-full inline-block', p.showOnStore ? 'bg-emerald-400' : 'bg-stone-200')} />
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(p)} className="btn-sm btn-ghost px-2"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteProduct(p.id)} className="btn-sm text-red-500 hover:bg-red-50 px-2 rounded-lg h-8"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in max-h-[92vh] overflow-auto">
            <div className="p-6">
              <h3 className="font-bold text-xl text-stone-900 mb-5">{editing ? 'Editar Produto' : 'Novo Produto'}</h3>
              <div className="space-y-4">

                {/* Nome */}
                <div>
                  <label className="label">Nome *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="Ex: Picanha na brasa" />
                </div>

                {/* Categoria */}
                <div>
                  <label className="label">Categoria *</label>
                  <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className="input">
                    <option value="">Selecione...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Preços */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Preço de Venda *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">R$</span>
                      <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} type="number" step="0.01" className="input pl-9" placeholder="0,00" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Preço de Custo</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">R$</span>
                      <input value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} type="number" step="0.01" className="input pl-9" placeholder="0,00" />
                    </div>
                  </div>
                </div>

                {/* Imagem */}
                <div>
                  <label className="label">URL da Imagem</label>
                  <input
                    value={form.image}
                    onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                    className="input"
                    placeholder="https://exemplo.com/imagem.jpg"
                    type="url"
                  />
                  {/* Preview */}
                  {form.image && (
                    <div className="mt-2 flex items-center gap-3">
                      <img
                        src={form.image}
                        alt="Preview"
                        className="w-16 h-16 rounded-lg object-cover border border-stone-200"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <p className="text-xs text-stone-400">Preview da imagem</p>
                    </div>
                  )}
                </div>

                {/* Descrição */}
                <div>
                  <label className="label">Descrição</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input h-20 resize-none py-2" placeholder="Ingredientes, detalhes..." />
                </div>

                {/* Tempo de preparo */}
                <div>
                  <label className="label">Tempo de Preparo (min)</label>
                  <input value={form.preparationTime} onChange={e => setForm(f => ({ ...f, preparationTime: e.target.value }))} type="number" className="input" />
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: 'active',       label: 'Ativo' },
                    { key: 'available',    label: 'Disponível' },
                    { key: 'showOnStore',  label: 'Mostrar na Loja' },
                    { key: 'isKgProduct',  label: 'Cobrado por KG' },
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(form as any)[item.key]}
                        onChange={e => setForm(f => ({ ...f, [item.key]: e.target.checked }))}
                        className="w-4 h-4 accent-amber-500"
                      />
                      <span className="text-sm text-stone-700">{item.label}</span>
                    </label>
                  ))}
                </div>

                {/* Margem ao vivo */}
                {form.price && form.costPrice && parseFloat(form.price) > 0 && (
                  <div className="bg-stone-50 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-stone-500">Margem estimada</span>
                    <span className={cn('font-bold', ((parseFloat(form.price) - parseFloat(form.costPrice || '0')) / parseFloat(form.price) * 100) > 50 ? 'text-emerald-600' : 'text-amber-600')}>
                      {(((parseFloat(form.price) - parseFloat(form.costPrice || '0')) / parseFloat(form.price)) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
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
