import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Nativa • Bem viver começa aqui',description:'Descubra sabores, monte sua sacola e faça seu pedido na Nativa.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
