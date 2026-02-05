import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, MessageSquare, Phone } from 'lucide-react';

export default function ContactPage() {
    return (
        <Layout>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">

                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
                            <p className="text-xl text-muted-foreground">
                                We're here to help. Reach out to our team for support, sales, or partnerships.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                                <Mail className="w-6 h-6 text-primary mt-1" />
                                <div>
                                    <h3 className="font-semibold">Email Support</h3>
                                    <p className="text-sm text-muted-foreground mb-1">24/7 Priority Support for Clients</p>
                                    <a href="mailto:support@preciousvault.com" className="text-primary font-medium hover:underline">support@preciousvault.com</a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                                <Phone className="w-6 h-6 text-primary mt-1" />
                                <div>
                                    <h3 className="font-semibold">Phone Inquiries</h3>
                                    <p className="text-sm text-muted-foreground mb-1">Mon-Fri 9am-6pm CET</p>
                                    <a href="tel:+41441234567" className="text-primary font-medium hover:underline">+41 44 123 45 67</a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                                <MessageSquare className="w-6 h-6 text-primary mt-1" />
                                <div>
                                    <h3 className="font-semibold">Live Chat</h3>
                                    <p className="text-sm text-muted-foreground mb-1">Available in Dashboard</p>
                                    <span className="text-sm text-muted-foreground">Typical reply time: 2 mins</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border rounded-2xl p-8 shadow-sm">
                        <h2 className="text-2xl font-semibold mb-6">Send us a message</h2>
                        <form className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input id="firstName" placeholder="John" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input id="lastName" placeholder="Doe" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" placeholder="john@example.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input id="subject" placeholder="How can we help?" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea id="message" placeholder="Type your message here..." className="min-h-[150px]" />
                            </div>
                            <Button className="w-full" size="lg">Send Message</Button>
                        </form>
                    </div>

                </div>
            </div>
        </Layout>
    );
}
