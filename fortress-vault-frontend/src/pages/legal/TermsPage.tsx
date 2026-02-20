import { Layout } from '@/components/layout/Layout';

export default function TermsPage() {
    return (
        <Layout>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
                    <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
                    <p className="text-muted-foreground mb-8">Effective Date: January 1, 2025</p>

                    <section className="mb-8">
                        <h2>1. Agreement to Terms</h2>
                        <p>
                            By accessing Fortress Vault, you agree to be bound by these Terms of Service. If you do not agree, you must cease using the platform immediately.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2>2. Services Provided</h2>
                        <p>
                            Fortress Vault provides a platform for buying, selling, and storing physical precious metals. We act as a dealer and storage facilitator, not as a financial advisor.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2>3. Account Registration</h2>
                        <p>
                            You must provide accurate information and maintain the security of your account credentials. You are responsible for all activity under your account.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2>4. Storage and Ownership</h2>
                        <p>
                            <strong>Allocated Storage:</strong> Metals purchased for allocated storage are physically segregated and titled in your name. They are not part of Fortress Vault's balance sheet and are protected against our insolvency.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2>5. Fees and Payments</h2>
                        <p>
                            Fees for storage, shipping, and transactions are transparently displayed at checkout. Storage fees are billed quarterly. Failure to pay storage fees may result in lien on stored assets.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2>6. Limitation of Liability</h2>
                        <p>
                            Fortress Vault is not liable for losses due to market volatility. Our liability for storage is limited to the insurance coverage provided by our vault partners.
                        </p>
                    </section>
                </div>
            </div>
        </Layout>
    );
}
