import { Layout } from '@/components/layout/Layout';

export default function CookiePolicyPage() {
    return (
        <Layout>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
                    <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
                    <p className="text-muted-foreground mb-8">Last Updated: February 5, 2025</p>

                    <section className="mb-8">
                        <h2>What are Cookies?</h2>
                        <p>
                            Cookies are small text files stored on your device when you visit our website. They help us remember your preferences and improve your experience.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2>How We Use Cookies</h2>
                        <ul>
                            <li><strong>Essential Cookies:</strong> Necessary for the website to function (e.g., login sessions, secure transaction processing).</li>
                            <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site to improve performance.</li>
                            <li><strong>Preference Cookies:</strong> Remember your settings like language or currency.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2>Managing Cookies</h2>
                        <p>
                            You can control or delete cookies through your browser settings. However, disabling essential cookies may limit your ability to use critical features of the platform like Trading and Vault access.
                        </p>
                    </section>
                </div>
            </div>
        </Layout>
    );
}
