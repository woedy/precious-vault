import { Layout } from '@/components/layout/Layout';

export default function PrivacyPage() {
    return (
        <Layout>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
                    <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
                    <p className="text-muted-foreground mb-8">Last Updated: February 5, 2025</p>

                    <section className="mb-8">
                        <h2>1. Information We Collect</h2>
                        <p>
                            Fortress Vault collects information to provide secure and compliant bullion services. This includes:
                        </p>
                        <ul>
                            <li><strong>Personal Identity Information (PII):</strong> Name, address, date of birth, and tax ID as required for KYC/AML compliance.</li>
                            <li><strong>Financial Information:</strong> Bank account details and transaction history.</li>
                            <li><strong>Device Information:</strong> IP address, browser type, and device identifiers for security fraud prevention.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2>2. How We Use Information</h2>
                        <p>Your data is used strictly for:</p>
                        <ul>
                            <li>Processing transactions and vault storage allocations.</li>
                            <li>Verifying identity in compliance with Swiss financial regulations.</li>
                            <li>Providing customer support and service updates.</li>
                            <li>Enhancing platform security and preventing unauthorized access.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2>3. Data Protection</h2>
                        <p>
                            We employ military-grade encryption for data at rest and in transit. Your personal data is stored in Swiss data centers compliant with GDPR and Swiss DPA.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2>4. Information Sharing</h2>
                        <p>
                            We do not sell your data. We share data only with:
                        </p>
                        <ul>
                            <li><strong>Logistics Partners:</strong> (e.g., Brinks, FedEx) solely for the purpose of physical delivery.</li>
                            <li><strong>Regulatory Bodies:</strong> When legally compelled by court order or applicable financial law.</li>
                        </ul>
                    </section>

                    <section>
                        <h2>5. Contact Us</h2>
                        <p>
                            For privacy-related inquiries, please contact our Data Protection Officer at privacy@preciousvault.com.
                        </p>
                    </section>
                </div>
            </div>
        </Layout>
    );
}
