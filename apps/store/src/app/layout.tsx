import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/cart-context';
import { StoreAuthProvider } from '@/context/auth-context';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: { default: 'Churrascaria Nordestina', template: '%s | Churrascaria Nordestina' },
  description: 'Peça online com facilidade. Delivery e retirada no balcão.',
  keywords: ['delivery', 'lanchonete', 'restaurante', 'pedido online'],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Churrascaria Nordestina',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <StoreAuthProvider>
          <CartProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: { borderRadius: '12px', background: '#1C0F07', color: '#fff', fontSize: '14px' },
                success: { iconTheme: { primary: '#F59E0B', secondary: '#fff' } },
              }}
            />
          </CartProvider>
        </StoreAuthProvider>
      </body>
    </html>
  );
}
