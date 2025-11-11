import './globals.css';
import './styles/hero.css';
export const metadata = { title: 'RAID Online v1', description: 'Heroes & Gear' };
export default function RootLayout({ children }:{children:React.ReactNode}){
  return (<html lang="pl"><body>{children}</body></html>);
}
