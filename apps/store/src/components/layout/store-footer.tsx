import Link from 'next/link';
import { MapPin, Phone, Clock, Instagram, Facebook } from 'lucide-react';

export default function StoreFooter() {
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Churrascaria Nordestina';
  return (
    <footer className="bg-dark-950 text-dark-200 mt-16">
      <div className="container-store py-12">
        <div className="grid sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-xs leading-none">CN</span>
              </div>
              <span className="font-black text-lg text-white">{storeName}</span>
            </div>
            <p className="text-sm text-dark-400 leading-relaxed">
              Comida boa, entrega rápida. Peça online e receba no conforto da sua casa.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-8 h-8 bg-dark-800 rounded-lg flex items-center justify-center hover:bg-brand-500 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-dark-800 rounded-lg flex items-center justify-center hover:bg-brand-500 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Links</h4>
            <div className="space-y-2">
              <Link href="/" className="block text-sm text-dark-400 hover:text-brand-400 transition-colors">Início</Link>
              <Link href="/cardapio" className="block text-sm text-dark-400 hover:text-brand-400 transition-colors">Cardápio</Link>
              <Link href="/meus-pedidos" className="block text-sm text-dark-400 hover:text-brand-400 transition-colors">Meus Pedidos</Link>
              <Link href="/perfil" className="block text-sm text-dark-400 hover:text-brand-400 transition-colors">Minha Conta</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Contato</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-dark-400">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-brand-500" />
                <span>Estrada Poço Redondo, SE230 Churrascaria Nordestina</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-dark-400">
                <Phone className="w-4 h-4 shrink-0 text-brand-500" />
                <span>(79) 99807-1169</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-dark-400">
                <Clock className="w-4 h-4 shrink-0 mt-0.5 text-brand-500" />
                <div>
                  <p>Ter–Dom: 07h–09h</p>
                  <p>Ter–Dom: 11h50–15h</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-dark-800 mt-10 pt-6 text-center text-xs text-dark-500">
          © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
