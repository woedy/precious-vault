import { Link } from 'react-router-dom';

const footerLinks = {
  product: [
    { name: 'Buy Metals', path: '/buy' },
    { name: 'Sell Metals', path: '/sell' },
    { name: 'Vault Storage', path: '/vaults' },
    { name: 'Cash Conversion', path: '/convert' },
  ],
  company: [
    { name: 'About Us', path: '/about' },
    { name: 'Careers', path: '/careers' },
    { name: 'Press', path: '/press' },
    { name: 'Contact', path: '/contact' },
  ],
  legal: [
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Terms of Service', path: '/terms' },
    { name: 'Cookie Policy', path: '/cookies' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-gold flex items-center justify-center">
                <span className="text-lg font-bold text-slate-dark">G</span>
              </div>
              <span className="text-xl font-bold text-white">Precious Vault</span>
            </div>
            <p className="text-slate-light text-sm">
              Secure precious metals investment platform. Buy, store, and convert gold, silver, and more.
            </p>
            <p className="text-slate-light/60 text-xs">
              The world's most trusted platform for secure gold and silver investment.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-slate-light hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-slate-light hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-slate-light hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-light/60 text-sm">
            © 2024 Precious Vault. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-light/40">🔒 256-bit SSL Encryption</span>
            <span className="text-xs text-slate-light/40">🏛️ Insured Storage</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
