'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Save, Store, Bell, Truck, Percent, Clock, Printer,
  CheckCircle, AlertCircle, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ConfigMap = Record<string, string>;

interface FieldDef {
  key:         string;
  label:       string;
  type?:       'text' | 'boolean' | 'number' | 'password' | 'select' | 'textarea';
  placeholder?: string;
  options?:    { value: string; label: string }[];
  hint?:       string;
}

interface Section {
  id:     string;
  label:  string;
  icon:   React.ElementType;
  fields: FieldDef[];
}

// ─── Definição das seções e campos ───────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: 'store', label: 'Estabelecimento', icon: Store,
    fields: [
      { key: 'STORE_NAME',    label: 'Nome do estabelecimento', placeholder: 'Churrascaria Nordestina' },
      { key: 'STORE_PHONE',   label: 'Telefone / WhatsApp',     placeholder: '(79) 99807-1169' },
      { key: 'STORE_EMAIL',   label: 'E-mail',                  placeholder: 'contato@restaurante.com', type: 'text' },
      { key: 'STORE_CNPJ',    label: 'CNPJ',                    placeholder: '00.000.000/0001-00' },
      { key: 'STORE_ADDRESS', label: 'Endereço completo',       placeholder: 'Rua, nº, bairro, cidade/UF', type: 'textarea' },
    ],
  },
  {
    id: 'orders', label: 'Pedidos', icon: Clock,
    fields: [
      { key: 'ORDER_ACCEPT_ONLINE',   label: 'Aceitar pedidos online',         type: 'boolean' },
      { key: 'ORDER_MIN_VALUE',        label: 'Valor mínimo do pedido (R$)',    type: 'number', placeholder: '0,00', hint: 'Use 0 para sem mínimo' },
      { key: 'ORDER_SERVICE_FEE',      label: 'Taxa de serviço (%)',            type: 'number', placeholder: '10', hint: 'Ex: 10 = 10%. Use 0 para isentar.' },
      { key: 'KITCHEN_ALERT_MINUTES',  label: 'Alerta de atraso na cozinha (min)', type: 'number', placeholder: '10' },
    ],
  },
  {
    id: 'delivery', label: 'Delivery', icon: Truck,
    fields: [
      { key: 'DELIVERY_ENABLED',          label: 'Delivery ativo',              type: 'boolean' },
      { key: 'DELIVERY_MIN_VALUE',         label: 'Pedido mínimo para delivery (R$)', type: 'number', placeholder: '20,00' },
      { key: 'DELIVERY_FEE_DEFAULT',       label: 'Taxa de entrega padrão (R$)', type: 'number', placeholder: '5,00', hint: 'Usado quando não há bairro cadastrado' },
      { key: 'DELIVERY_ESTIMATE_MINUTES',  label: 'Tempo estimado padrão (min)', type: 'number', placeholder: '45' },
      { key: 'DELIVERY_RADIUS_KM',         label: 'Raio de entrega (km)',        type: 'number', placeholder: '10' },
    ],
  },
  {
    id: 'notifications', label: 'Notificações', icon: Bell,
    fields: [
      { key: 'WHATSAPP_ENABLED',   label: 'Notificações via WhatsApp', type: 'boolean' },
      { key: 'WHATSAPP_API_URL',   label: 'URL da API WhatsApp',       placeholder: 'https://api.whatsapp.com/...', hint: 'URL da API de envio de mensagens' },
      { key: 'NOTIFY_NEW_ORDER',   label: 'Notificar novo pedido',     type: 'boolean' },
      { key: 'NOTIFY_ORDER_READY', label: 'Notificar pedido pronto',   type: 'boolean' },
    ],
  },
  {
    id: 'fiscal', label: 'Fiscal / NFe', icon: Printer,
    fields: [
      { key: 'NFE_ENABLED',       label: 'Emissão de NFe ativa',      type: 'boolean' },
      {
        key: 'NFE_ENVIRONMENT', label: 'Ambiente', type: 'select',
        options: [
          { value: 'homologacao', label: 'Homologação (testes)' },
          { value: 'producao',    label: 'Produção' },
        ],
      },
      { key: 'FOCUS_NFE_TOKEN',   label: 'Token Focus NFe',           type: 'password', placeholder: 'Token da API Focus NFe' },
      { key: 'NFE_SERIE',         label: 'Série da nota fiscal',      type: 'number',   placeholder: '1' },
    ],
  },
  {
    id: 'horarios', label: 'Horários', icon: Percent,
    fields: [
      { key: 'STORE_HOURS_MON', label: 'Segunda-feira',  placeholder: 'Fechado ou HH:MM-HH:MM' },
      { key: 'STORE_HOURS_TUE', label: 'Terça-feira',    placeholder: '07:00-09:00, 11:50-15:00' },
      { key: 'STORE_HOURS_WED', label: 'Quarta-feira',   placeholder: '07:00-09:00, 11:50-15:00' },
      { key: 'STORE_HOURS_THU', label: 'Quinta-feira',   placeholder: '07:00-09:00, 11:50-15:00' },
      { key: 'STORE_HOURS_FRI', label: 'Sexta-feira',    placeholder: '07:00-09:00, 11:50-15:00' },
      { key: 'STORE_HOURS_SAT', label: 'Sábado',         placeholder: '07:00-09:00, 11:50-15:00' },
      { key: 'STORE_HOURS_SUN', label: 'Domingo',        placeholder: 'Fechado' },
    ],
  },
];

// ─── Componente de campo ──────────────────────────────────────────────────────

function ConfigField({ field, value, onChange }: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.type === 'boolean') {
    const active = value === 'true';
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(active ? 'false' : 'true')}
          className={cn(
            'relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1',
            active ? 'bg-amber-500' : 'bg-stone-200',
          )}
          aria-checked={active}
          role="switch"
        >
          <span className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
            active && 'translate-x-5',
          )} />
        </button>
        <span className={cn('text-sm font-medium', active ? 'text-amber-700' : 'text-stone-500')}>
          {active ? 'Ativado' : 'Desativado'}
        </span>
      </div>
    );
  }

  if (field.type === 'select' && field.options) {
    return (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input"
      >
        {field.options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="input h-20 resize-none py-2"
      />
    );
  }

  return (
    <input
      type={field.type === 'password' ? 'password' : field.type === 'number' ? 'text' : 'text'}
      inputMode={field.type === 'number' ? 'decimal' : undefined}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder}
      className="input"
      autoComplete={field.type === 'password' ? 'off' : undefined}
    />
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const [configs,        setConfigs]        = useState<ConfigMap>({});
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [activeSection,  setActiveSection]  = useState('store');
  const [savedSections,  setSavedSections]  = useState<string[]>([]);

  // ── Carregar todas as configs do backend ────────────────────────────────────
  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/config');
      const arr: { key: string; value: string }[] = Array.isArray(data) ? data : [];
      const map: ConfigMap = {};
      arr.forEach(c => { map[c.key] = c.value; });
      setConfigs(map);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erro ao carregar configurações';
      toast.error(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfigs(); }, [loadConfigs]);

  // ── Salvar seção ativa ──────────────────────────────────────────────────────
  const saveSection = async () => {
    const section = SECTIONS.find(s => s.id === activeSection);
    if (!section) return;

    setSaving(true);
    try {
      const updates = section.fields.map(f => ({
        key:   f.key,
        value: configs[f.key] ?? '',
      }));

      await api.patch('/config', { configs: updates });

      toast.success(`${section.label} salvo com sucesso!`);
      setSavedSections(prev => [...new Set([...prev, activeSection])]);
    } catch (e: any) {
      const raw = e?.response?.data?.message || e?.message || 'Erro ao salvar';
      const msg = Array.isArray(raw) ? raw.join('\n') : String(raw);
      toast.error(msg, { duration: 5000 });
    } finally {
      setSaving(false);
    }
  };

  const section = SECTIONS.find(s => s.id === activeSection)!;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Personalize o sistema do estabelecimento</p>
        </div>
        <button onClick={loadConfigs} disabled={loading} className="btn-outline px-3" title="Recarregar">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">

        {/* ── Nav lateral ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <nav className="card overflow-hidden divide-y divide-stone-100">
            {SECTIONS.map(s => {
              const saved  = savedSections.includes(s.id);
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
                    active ? 'bg-amber-50 text-amber-700' : 'hover:bg-stone-50 text-stone-600',
                  )}
                >
                  <s.icon className={cn('w-4 h-4 shrink-0', active ? 'text-amber-600' : 'text-stone-400')} />
                  <span className="text-sm font-medium flex-1">{s.label}</span>
                  {saved && !active && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                </button>
              );
            })}
          </nav>

          <div className="mt-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <p className="text-xs text-stone-500 leading-relaxed">
                As configurações são salvas por seção. Clique em <strong>"Salvar"</strong> após editar cada aba.
              </p>
            </div>
          </div>
        </div>

        {/* ── Formulário ────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="card p-6">

            {/* Título da seção */}
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-stone-100">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <section.icon className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-900">{section.label}</h2>
                <p className="text-xs text-stone-400 mt-0.5">{section.fields.length} configurações</p>
              </div>
            </div>

            {/* Campos */}
            {loading ? (
              <div className="space-y-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <div className="h-3.5 bg-stone-100 rounded animate-pulse w-40 mb-2" />
                    <div className="h-10 bg-stone-100 rounded-lg animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-5">
                {section.fields.map(field => (
                  <div key={field.key}>
                    <label className="label">{field.label}</label>
                    <ConfigField
                      field={field}
                      value={configs[field.key] ?? ''}
                      onChange={v => setConfigs(c => ({ ...c, [field.key]: v }))}
                    />
                    {field.hint && (
                      <p className="text-xs text-stone-400 mt-1">{field.hint}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Footer com botão salvar */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-100">
              <p className="text-xs text-stone-400">
                Chave do sistema: <code className="font-mono bg-stone-100 px-1 rounded">{section.fields[0]?.key.split('_')[0]}_*</code>
              </p>
              <button
                onClick={saveSection}
                disabled={saving || loading}
                className="btn-primary disabled:opacity-50"
              >
                {saving
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Salvando...</>
                  : <><Save className="w-4 h-4" /> Salvar {section.label}</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
