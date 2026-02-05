import { Layout } from '@/components/layout/Layout';
import { Building2, Globe, Shield, Users } from 'lucide-react';

export default function AboutPage() {
    return (
        <Layout>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto space-y-12">
                    {/* Hero */}
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight">About Precious Vault</h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            We are democratizing access to institutional-grade precious metals storage and trading.
                        </p>
                    </div>

                    {/* Mission */}
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold">Our Mission</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Founded in Zurich with a vision to make secure asset preservation accessible to everyone,
                                Precious Vault combines centuries-old Swiss banking traditions with modern digital convenience.
                                We believe that true financial sovereignty comes from direct ownership of tangible assets,
                                securely stored and easily accessible.
                            </p>
                        </div>
                        <div className="bg-muted/30 p-8 rounded-2xl grid grid-cols-2 gap-6">
                            <div className="text-center space-y-2">
                                <Shield className="w-8 h-8 mx-auto text-primary" />
                                <div className="font-bold text-2xl">100%</div>
                                <div className="text-xs text-muted-foreground">Insured</div>
                            </div>
                            <div className="text-center space-y-2">
                                <Globe className="w-8 h-8 mx-auto text-primary" />
                                <div className="font-bold text-2xl">4</div>
                                <div className="text-xs text-muted-foreground">Global Vaults</div>
                            </div>
                            <div className="text-center space-y-2">
                                <Users className="w-8 h-8 mx-auto text-primary" />
                                <div className="font-bold text-2xl">12k+</div>
                                <div className="text-xs text-muted-foreground">Investors</div>
                            </div>
                            <div className="text-center space-y-2">
                                <Building2 className="w-8 h-8 mx-auto text-primary" />
                                <div className="font-bold text-2xl">$2B+</div>
                                <div className="text-xs text-muted-foreground">Assets Secured</div>
                            </div>
                        </div>
                    </div>

                    {/* Values */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold">Our Core Values</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="p-6 border rounded-xl space-y-3">
                                <h3 className="font-semibold text-lg">Integrity First</h3>
                                <p className="text-sm text-muted-foreground">
                                    We operate with radical transparency. Every ounce you buy is physically allocated and auditable.
                                </p>
                            </div>
                            <div className="p-6 border rounded-xl space-y-3">
                                <h3 className="font-semibold text-lg">Security Absolute</h3>
                                <p className="text-sm text-muted-foreground">
                                    We partner only with the world's most secure non-bank vault operators like Brinks and Malca-Amit.
                                </p>
                            </div>
                            <div className="p-6 border rounded-xl space-y-3">
                                <h3 className="font-semibold text-lg">Client Sovereignty</h3>
                                <p className="text-sm text-muted-foreground">
                                    Your assets are your property. We facilitate ownership, we don't encumber it.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
