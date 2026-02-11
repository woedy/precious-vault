import { Layout } from '@/components/layout/Layout';
import DeliveryWizard from '@/components/delivery/DeliveryWizard';

export default function DeliveryPage() {
    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-2">Request Physical Delivery</h1>
                <p className="text-muted-foreground mb-8">Securely transfer your vault holdings to your personal possession.</p>
                <DeliveryWizard />
            </div>
        </Layout>
    );
}
