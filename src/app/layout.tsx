import "./globals.css"; 
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body style={{ backgroundColor: '#020617', minHeight: '100vh', margin: 0 }}>
        {children}
        {/* Komponen untuk merender notifikasi toast */}
        <Toaster position="bottom-right" reverseOrder={false} />
      </body>
    </html>
  )
}