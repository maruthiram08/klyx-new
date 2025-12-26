import React, { useRef } from 'react';
import Link from 'next/link';
import { Container } from '../ui/Container';
import { Typography } from '../ui/Typography';
import { NewsletterForm } from '../molecules/NewsletterForm';
import { Twitter, Instagram, Linkedin, UploadCloud } from 'lucide-react';

export const SiteFooter: React.FC = () => {
    // We can't easily trigger the header upload from here without global state context,
    // so for now "Start Analysis" will just link to top or be a simple anchor. 
    // Given the constraints, a simple scroll to top or just "Home" is safest.

    return (
        <footer className="bg-black text-white py-20 rounded-t-[3rem] mt-20">
            <Container>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 mb-16">
                    {/* Brand Column */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-6 h-6 rounded-full bg-[#ccf32f]"></div>
                            <span className="text-2xl font-bold tracking-tight text-white">Pro Finance</span>
                        </div>
                        <Typography variant="body" className="text-neutral-400 mb-8 max-w-sm">
                            Advanced market intelligence and portfolio tracking for the modern investor. Built on the Aura Design System.
                        </Typography>

                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#ccf32f] hover:text-black transition-colors">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#ccf32f] hover:text-black transition-colors">
                                <Instagram size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#ccf32f] hover:text-black transition-colors">
                                <Linkedin size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Simple Actions & Newsletter */}
                    <div className="flex flex-col md:flex-row gap-12 lg:justify-end">
                        {/* Simplified Links */}
                        <div>
                            <h4 className="font-bold text-white mb-6">Platform</h4>
                            <ul className="space-y-4">
                                <li>
                                    <Link href="/" className="text-neutral-400 hover:text-[#ccf32f] transition-colors">Home</Link>
                                </li>
                                {/* Since we can't easily trigger upload from footer without context, we'll omit or just link home */}
                            </ul>
                        </div>

                        {/* Newsletter */}
                        <div className="max-w-xs">
                            <h4 className="font-bold text-white mb-6">Stay Updated</h4>
                            <NewsletterForm />
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-neutral-500">
                    <p>&copy; {new Date().getFullYear()} Pro Finance. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </Container>
        </footer>
    );
};
