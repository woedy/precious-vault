import { useState } from 'react';
import { useMockApp } from '@/context/MockAppContext';
import { Layout } from '@/components/layout/Layout';
import { VaultCard } from '@/components/cards/VaultCard';
import { vaults } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Shield, Building2, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VaultsPage() {
  const [selectedVault, setSelectedVault] = useState<string | null>(null);
  const { toast } = useToast();
  const { portfolio } = useMockApp();

  const vaultedItems = portfolio.filter(item => item.location.startsWith('vault_'));

  const handleSelectVault = (vaultId: string) => {
    setSelectedVault(vaultId);
    toast({
      title: "Vault Selected",
      description: `${vaults.find(v => v.id === vaultId)?.city} vault has been set as your preferred storage location.`,
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Vault Storage</h1>
          <p className="text-muted-foreground">
            Choose from our network of secure, insured vault locations worldwide.
          </p>
        </div>

        {/* My Vaulted Holdings */}
        <div className="mb-10 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">My Vaulted Assets</h2>
            {vaultedItems.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/delivery'}>
                <Truck className="w-4 h-4 mr-2" /> Request Delivery
              </Button>
            )}
          </div>

          <div className="card-premium">
            {vaultedItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pb-3 text-left">Asset</th>
                      <th className="pb-3 text-left">Form</th>
                      <th className="pb-3 text-right">Weight</th>
                      <th className="pb-3 text-right">Location</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaultedItems.map(item => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-4 font-medium capitalize">{item.metal}</td>
                        <td className="py-4 capitalize text-muted-foreground">{item.form}</td>
                        <td className="py-4 text-right">{item.weightOz} oz</td>
                        <td className="py-4 text-right capitalize text-primary text-xs">
                          <span className="bg-primary/10 px-2 py-1 rounded-full">
                            {item.location.replace('vault_', '')}
                          </span>
                        </td>
                        <td className="py-4 text-right text-green-500 flex items-center justify-end gap-1">
                          <Shield className="w-3 h-3" /> Allocated
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Your Vault is Empty</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Purchase precious metals and select "Secure Vault" storage to see them here.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => window.location.href = '/buy'}>
                    Buy Gold & Silver
                  </Button>
                  <Button variant="ghost" onClick={() => window.location.href = '/delivery'}>
                    Open Delivery Wizard
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Storage Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="card-premium border-2 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Allocated Storage</h3>
                <p className="text-sm text-muted-foreground">Your metals stored separately</p>
              </div>
            </div>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Individual bar/coin identification
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Physical segregation guaranteed
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Full ownership rights
              </li>
            </ul>
            <div className="text-sm font-medium text-primary">Starting at 0.08% annually</div>
          </div>

          <div className="card-premium border-2 border-success/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Insured Storage</h3>
                <p className="text-sm text-muted-foreground">Full coverage protection</p>
              </div>
            </div>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" />
                All-risk insurance coverage
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Lloyd's of London underwritten
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" />
                No deductibles or limits
              </li>
            </ul>
            <div className="text-sm font-medium text-success">Included with all storage</div>
          </div>
        </div>

        {/* Vault Locations */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Global Vault Locations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {vaults.map((vault) => (
              <VaultCard
                key={vault.id}
                {...vault}
                onSelect={() => handleSelectVault(vault.id)}
              />
            ))}
          </div>
        </div>

        {/* Security Info */}
        <div className="card-premium bg-secondary text-secondary-foreground">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold mb-2">World-Class Security</h3>
              <p className="text-slate-light text-sm">
                All our vaults feature 24/7 armed security, biometric access controls, seismic detectors,
                and are fully audited quarterly. Your metals are stored in the same facilities used by
                central banks and major financial institutions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
