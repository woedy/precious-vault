import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function CareersPage() {
    const positions = [
        { title: 'Senior Full Stack Engineer', dept: 'Engineering', loc: 'Remote / Zurich' },
        { title: 'Security Operations Lead', dept: 'Operations', loc: 'Singapore' },
        { title: 'Client Success Manager', dept: 'Sales', loc: 'New York' },
        { title: 'Compliance Officer', dept: 'Legal', loc: 'London' },
    ];

    return (
        <Layout>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <span className="text-primary font-medium tracking-wider text-sm uppercase">Join Our Team</span>
                        <h1 className="text-4xl font-bold">Build the Future of Asset Security</h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            We're looking for passionate individuals who value security, innovation, and financial freedom.
                        </p>
                    </div>

                    <div className="space-y-8">
                        <h2 className="text-2xl font-semibold">Open Positions</h2>
                        <div className="grid gap-4">
                            {positions.map((pos) => (
                                <div key={pos.title} className="p-6 border rounded-xl flex items-center justify-between hover:border-primary transition-colors group">
                                    <div>
                                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{pos.title}</h3>
                                        <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                            <span>{pos.dept}</span>
                                            <span>•</span>
                                            <span>{pos.loc}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        Apply <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 bg-muted/30 p-8 rounded-2xl text-center space-y-4">
                            <h3 className="font-semibold text-xl">Don't see your role?</h3>
                            <p className="text-muted-foreground">
                                We are always looking for exceptional talent. Send your resume to careers@preciousvault.com
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
