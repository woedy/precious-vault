import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Newspaper, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PressPage() {
    const news = [
        { source: 'Financial Times', date: 'Oct 12, 2024', title: 'Precious Vault Reports Record Inflows as Investors Seek Safe Havens', excerpt: 'Digital gold platform sees 200% growth in quarterly vault deposits...' },
        { source: 'TechCrunch', date: 'Aug 28, 2024', title: 'The Fintech Startups Revolutionizing Asset Ownership', excerpt: 'How Precious Vault is using technology to make gold bars as liquid as cash...' },
        { source: 'Bloomberg', date: 'May 15, 2024', title: 'Interview: CEO of Precious Vault on the Future of Digital Assets', excerpt: 'We are bridging the gap between physical security and digital speed...' },
    ];

    return (
        <Layout>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-12 flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-bold mb-4">Press & News</h1>
                            <p className="text-muted-foreground">Latest updates, media coverage, and resources for journalists.</p>
                        </div>
                        <Button variant="outline">
                            <Download className="mr-2 w-4 h-4" /> Media Kit
                        </Button>
                    </div>

                    <div className="grid gap-6">
                        {news.map((item, i) => (
                            <Card key={i} className="card-premium hover:bg-muted/30 transition-colors cursor-pointer">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 text-sm text-primary mb-2 font-medium">
                                        <Newspaper className="w-4 h-4" />
                                        {item.source} • {item.date}
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                    <p className="text-muted-foreground">{item.excerpt}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="mt-16 border-t pt-12">
                        <h2 className="text-2xl font-bold mb-6">Press Contacts</h2>
                        <div className="p-6 bg-muted/20 rounded-xl">
                            <p className="font-semibold">Media Inquiries</p>
                            <a href="mailto:press@preciousvault.com" className="text-primary hover:underline">press@preciousvault.com</a>
                            <p className="text-sm text-muted-foreground mt-2">
                                Please note that this email address is for media inquiries only.
                                For customer support, please visit our Help Center.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
