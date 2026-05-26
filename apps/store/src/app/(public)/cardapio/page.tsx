'use client';

import { useEffect, useRef, useState } from 'react';
import { ShoppingCart, Search, UtensilsCrossed, X } from 'lucide-react';
import { storeApi } from '@/lib/api';
import { useCart } from '@/context/cart-context';
import type { Category, Product } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function ProductCard({ product, categoryName, onAdd }: {
  product: Product;
  categoryName?: string;
  onAdd: () => void;
}) {
  return (
    <div className="group bg-[#2a160f] border border-[#4d2d20] rounded-2xl overflow-hidden flex flex-col hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-900/20 transition-all duration-200">
      {/* Imagem */}
      {product.image ? (
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-44 object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-44 bg-[#3b2418] flex items-center justify-center">
          <UtensilsCrossed className="w-10 h-10 text-[#6d4c3d]" />
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        {/* Tag de categoria (visível só na busca) */}
        {categoryName && (
          <span className="text-xs font-semibold text-orange-400/80 uppercase tracking-wide mb-1">
            {categoryName}
          </span>
        )}

        <h3 className="text-base font-bold text-white leading-snug">{product.name}</h3>

        {product.description && (
          <p className="text-sm text-gray-400 mt-1 leading-relaxed flex-1 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-lg font-black text-orange-400">
            {formatPrice(product.price)}
          </span>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 active:scale-95 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-all duration-150 shrink-0"
          >
            <ShoppingCart className="w-4 h-4" />
            Pedir
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function CardapioPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const { addItem }                 = useCart();
  const searchRef                   = useRef<HTMLInputElement>(null);

  // Refs para navegação rápida por ancora
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    storeApi.get('/menu/store')
      .then(({ data }) => setCategories(data.categories ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Busca ──────────────────────────────────────────────────────────────────

  const query = search.trim().toLowerCase();

  // Produtos que batem com a busca (com nome da categoria)
  const searchResults = query
    ? categories.flatMap(cat =>
        (cat.products ?? [])
          .filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query),
          )
          .map(p => ({ product: p, categoryName: cat.name })),
      )
    : [];

  // ── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1f0f08]">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
          {[...Array(3)].map((_, s) => (
            <div key={s}>
              <div className="h-8 w-48 bg-[#3b2418] rounded-lg mb-6 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-64 bg-[#2a160f] rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#1f0f08] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black leading-tight">
            Churrascaria{' '}
            <span className="text-orange-400">Nordestina</span>
          </h1>
          <p className="text-gray-400 mt-2 text-base">
            Cardápio completo · Self-service por KG · Delivery
          </p>
        </div>

        {/* ── Busca ────────────────────────────────────────────────────────── */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar no cardápio..."
            className="w-full bg-[#3b2418] border border-[#6d4c3d] rounded-xl pl-12 pr-10 py-3.5 text-white placeholder-gray-500 outline-none focus:border-orange-500/60 transition-colors text-base"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Navegação rápida por categoria (só sem busca) ────────────────── */}
        {!query && categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
            {categories
              .filter(cat => (cat.products?.length ?? 0) > 0)
              .map(cat => (
                <button
                  key={cat.id}
                  onClick={() => sectionRefs.current[cat.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="shrink-0 px-4 py-2 rounded-full bg-[#3b2418] border border-[#6d4c3d] text-sm font-semibold text-gray-300 hover:border-orange-500 hover:text-orange-400 transition-all"
                >
                  {cat.name}
                </button>
              ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MODO BUSCA — flat list com tag de categoria                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {query ? (
          searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <UtensilsCrossed className="w-14 h-14 text-[#4d2d20] mb-4" />
              <p className="text-lg font-semibold text-gray-400">Nenhum produto encontrado</p>
              <p className="text-sm text-gray-600 mt-1">Tente outro termo ou{' '}
                <button onClick={() => setSearch('')} className="text-orange-400 hover:underline">limpe a busca</button>
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-5">
                {searchResults.length} produto{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''} para &quot;{search}&quot;
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {searchResults.map(({ product, categoryName }) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categoryName={categoryName}
                    onAdd={() => addItem(product, 1, [])}
                  />
                ))}
              </div>
            </>
          )
        ) : (

        /* ══════════════════════════════════════════════════════════════════ */
        /* MODO NORMAL — seções por categoria                                  */
        /* ══════════════════════════════════════════════════════════════════ */
          <div className="space-y-14">
            {categories
              .filter(cat => (cat.products?.length ?? 0) > 0)
              .map((cat, idx) => (
                <section
                  key={cat.id}
                  ref={el => { sectionRefs.current[cat.id] = el; }}
                  className="scroll-mt-24"
                >
                  {/* Título da categoria */}
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-1 h-8 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color ?? '#f97316' }}
                    />
                    <h2 className="text-2xl sm:text-3xl font-black text-white">
                      {cat.name}
                    </h2>
                    <span className="text-sm text-gray-600 font-medium">
                      ({cat.products!.length})
                    </span>
                    {idx < categories.filter(c => (c.products?.length ?? 0) > 0).length - 1 && (
                      <div className="hidden sm:block flex-1 h-px bg-[#3b2418] ml-2" />
                    )}
                  </div>

                  {cat.description && (
                    <p className="text-gray-500 text-sm mb-5 -mt-2 pl-4">{cat.description}</p>
                  )}

                  {/* Grid de produtos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {cat.products!.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAdd={() => addItem(product, 1, [])}
                      />
                    ))}
                  </div>
                </section>
              ))}

            {categories.filter(cat => (cat.products?.length ?? 0) > 0).length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <UtensilsCrossed className="w-14 h-14 text-[#4d2d20] mb-4" />
                <p className="text-lg font-semibold text-gray-400">Cardápio indisponível no momento</p>
                <p className="text-sm text-gray-600 mt-1">Volte em breve!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
