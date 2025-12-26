import React from 'react';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { Container } from '../ui/Container';
import { Apple, ArrowDown, ChevronRight } from 'lucide-react';

export const HeroSection: React.FC = () => {
    return (
        <Container className="mt-4">
            <div className="relative bg-[#ccf32f] rounded-[2.5rem] p-8 md:p-16 overflow-hidden min-h-[600px] md:min-h-[720px] flex flex-col md:block shadow-sm">

                {/* Content Side (Left) */}
                <div className="relative z-10 max-w-xl mt-8 md:mt-12">
                    <Typography variant="display" className="mb-8 font-medium">
                        Invest for <br />
                        the Future
                        <span className="inline-flex align-top ml-2 relative top-2">
                            {/* Abstract Spark Icon placeholder */}
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black/80"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path></svg>
                        </span>
                    </Typography>

                    <Typography variant="body-lg" className="text-neutral-800 mb-10 max-w-md font-normal">
                        Work with all the necessary information and tools to boost money flow from your capital investment using ProFinance!
                    </Typography>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <Button variant="secondary" size="lg" className="h-14 px-8 rounded-full">
                            <Apple className="mr-2" size={20} />
                            Download App
                        </Button>

                        <a href="#features" className="group inline-flex items-center gap-2 font-medium text-lg hover:text-neutral-700 transition-colors">
                            Find Out More
                            <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center group-hover:translate-y-1 transition-transform">
                                <ArrowDown size={16} />
                            </div>
                        </a>
                    </div>
                </div>

                {/* Decorative / Image Side (Right) */}
                <div className="hidden md:block absolute right-0 top-0 h-full w-1/2 pointer-events-none">
                    {/* Decorative Arrow Line */}
                    <svg className="absolute top-32 left-0 w-32 h-32 text-black" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M10,10 Q50,10 50,50 T90,90" strokeLinecap="round" />
                        <path d="M80,90 L90,90 L90,80" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>

                    {/* Mockup Placeholders - strictly CSS/Div based to match design feel without assets */}
                    <div className="absolute top-24 right-20 w-[300px] h-[600px] bg-black rounded-[3rem] border-8 border-black shadow-2xl rotate-[-6deg] overflow-hidden z-20">
                        {/* Screen Content */}
                        <div className="w-full h-full bg-neutral-900 p-6 flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <div className="w-8 h-8 rounded-full bg-white/20"></div>
                                <div className="w-8 h-8 rounded-full bg-white/20"></div>
                            </div>
                            <div className="space-y-4">
                                <div className="h-32 bg-lime-400 rounded-2xl w-full"></div>
                                <div className="h-20 bg-neutral-800 rounded-2xl w-full"></div>
                                <div className="h-20 bg-neutral-800 rounded-2xl w-full"></div>
                                <div className="h-20 bg-neutral-800 rounded-2xl w-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Card Element */}
                    <div className="absolute top-1/2 left-0 bg-white p-4 rounded-xl shadow-xl transform -translate-y-1/2 -translate-x-12 z-30 max-w-[200px]">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white">
                                <Apple size={16} fill="currentColor" />
                            </div>
                            <div>
                                <div className="text-xs font-bold">Apple Inc.</div>
                                <div className="text-[10px] text-neutral-500">AAPL</div>
                            </div>
                        </div>
                        <div className="text-lg font-bold">150.25</div>
                        <div className="text-xs text-green-600 font-medium">+2.5%</div>
                    </div>
                </div>

            </div>
        </Container>
    );
};
