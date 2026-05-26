import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Churrascaria Nordestina';
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-xl">S</span>
          </div>
          <span className="font-black text-2xl text-white">{storeName}</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
