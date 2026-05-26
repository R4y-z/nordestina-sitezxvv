'use client';

import { useState } from 'react';
import { Save, Plus, MapPin, Trash2 } from 'lucide-react';
import { useStoreAuth } from '@/context/auth-context';
import { storeApi } from '@/lib/api';
import type { CustomerAddress } from '@/types';
import toast from 'react-hot-toast';

export default function PerfilPage() {
  const { customer, refreshCustomer } = useStoreAuth();
  const [profileForm, setProfileForm] = useState({ name: customer?.name || '', phone: customer?.phone || '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ street: '', number: '', complement: '', neighborhood: '', city: '', state: 'SP', zipCode: '' });

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await storeApi.patch('/customers/me', profileForm);
      await refreshCustomer();
      toast.success('Perfil atualizado!');
    } catch { toast.error('Erro ao atualizar perfil'); }
    finally { setSavingProfile(false); }
  };

  const addAddress = async () => {
    if (!addressForm.street || !addressForm.number || !addressForm.neighborhood) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    try {
      await storeApi.post('/customers/me/addresses', addressForm);
      await refreshCustomer();
      setShowAddressForm(false);
      setAddressForm({ street: '', number: '', complement: '', neighborhood: '', city: '', state: 'SP', zipCode: '' });
      toast.success('Endereço adicionado!');
    } catch { toast.error('Erro ao adicionar endereço'); }
  };

  const setDefault = async (addressId: string) => {
    try {
      await storeApi.patch(`/customers/me/addresses/${addressId}/default`);
      await refreshCustomer();
      toast.success('Endereço principal definido');
    } catch { toast.error('Erro'); }
  };

  const removeAddress = async (addressId: string) => {
    try {
      await storeApi.delete(`/customers/me/addresses/${addressId}`);
      await refreshCustomer();
      toast.success('Endereço removido');
    } catch { toast.error('Erro'); }
  };

  if (!customer) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-stone-900">Meu Perfil</h1>

      {/* Profile data */}
      <div className="card p-5">
        <h2 className="font-semibold text-stone-900 mb-4">Dados pessoais</h2>
        <div className="space-y-3 mb-5">
          <div>
            <label className="label">Nome</label>
            <input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input value={customer.email} disabled className="input opacity-60 cursor-not-allowed" />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="(11) 99999-9999" />
          </div>
        </div>
        <button onClick={saveProfile} disabled={savingProfile} className="btn-brand">
          <Save className="w-4 h-4" /> {savingProfile ? 'Salvando...' : 'Salvar dados'}
        </button>
      </div>

      {/* Addresses */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-stone-900">Meus endereços</h2>
          <button onClick={() => setShowAddressForm(!showAddressForm)} className="btn-outline text-sm">
            <Plus className="w-3.5 h-3.5" /> Novo endereço
          </button>
        </div>

        {showAddressForm && (
          <div className="bg-stone-50 rounded-xl p-4 mb-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="label">Rua *</label>
                <input value={addressForm.street} onChange={e => setAddressForm(f => ({ ...f, street: e.target.value }))} className="input text-sm" />
              </div>
              <div>
                <label className="label">Número *</label>
                <input value={addressForm.number} onChange={e => setAddressForm(f => ({ ...f, number: e.target.value }))} className="input text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Bairro *</label>
                <input value={addressForm.neighborhood} onChange={e => setAddressForm(f => ({ ...f, neighborhood: e.target.value }))} className="input text-sm" />
              </div>
              <div>
                <label className="label">Complemento</label>
                <input value={addressForm.complement} onChange={e => setAddressForm(f => ({ ...f, complement: e.target.value }))} className="input text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Cidade</label>
                <input value={addressForm.city} onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))} className="input text-sm" />
              </div>
              <div>
                <label className="label">CEP</label>
                <input value={addressForm.zipCode} onChange={e => setAddressForm(f => ({ ...f, zipCode: e.target.value }))} className="input text-sm" placeholder="00000-000" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddressForm(false)} className="btn-ghost text-sm flex-1">Cancelar</button>
              <button onClick={addAddress} className="btn-brand text-sm flex-1">Salvar endereço</button>
            </div>
          </div>
        )}

        {!customer.addresses || customer.addresses.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum endereço cadastrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customer.addresses.map((addr: CustomerAddress) => (
              <div key={addr.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 ${addr.isDefault ? 'border-brand-500 bg-brand-50' : 'border-stone-200'}`}>
                <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${addr.isDefault ? 'text-brand-500' : 'text-stone-300'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-900">
                    {addr.street}, {addr.number}
                    {addr.complement && ` — ${addr.complement}`}
                  </p>
                  <p className="text-xs text-stone-400">{addr.neighborhood}{addr.city && `, ${addr.city}`}</p>
                  {addr.isDefault && <span className="text-xs text-brand-600 font-medium mt-0.5 block">Principal</span>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!addr.isDefault && (
                    <button onClick={() => setDefault(addr.id)} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Definir como principal</button>
                  )}
                  {!addr.isDefault && (
                    <button onClick={() => removeAddress(addr.id)} className="p-1 text-stone-300 hover:text-red-500 transition-colors ml-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
