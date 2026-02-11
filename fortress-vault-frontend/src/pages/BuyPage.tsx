import { Layout } from '@/components/layout/Layout';
import BuyWizard from '@/components/buy/BuyWizard';

export default function BuyPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Purchase Precious Metals</h1>
          <p className="text-muted-foreground">Institutional grade execution. Physical allocation.</p>
        </div>
        <BuyWizard />
      </div>
    </Layout>
  );
}
