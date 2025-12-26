<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portfolio Intelligence AI</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #fffdf7;
            color: #18181b;
        }
        h1, h2, h3, h4, h5, h6, .font-heading {
            font-family: 'Space Grotesk', sans-serif;
        }
        .font-mono {
            font-family: 'JetBrains Mono', monospace;
        }
        
        /* Neo-Brutalist Utilities */
        .brutal-shadow {
            box-shadow: 4px 4px 0px 0px #000000;
        }
        .brutal-shadow-sm {
            box-shadow: 2px 2px 0px 0px #000000;
        }
        .brutal-shadow-lg {
            box-shadow: 6px 6px 0px 0px #000000;
        }
        .brutal-hover:hover {
            transform: translate(2px, 2px);
            box-shadow: 2px 2px 0px 0px #000000;
        }
        .brutal-hover-lift:hover {
            transform: translate(-2px, -2px);
            box-shadow: 6px 6px 0px 0px #000000;
        }
        
        .bg-grid-pattern {
            background-image: linear-gradient(#000000 1px, transparent 1px), linear-gradient(90deg, #000000 1px, transparent 1px);
            background-size: 40px 40px;
            background-position: center center;
            opacity: 0.05;
        }
        
        /* Specific patterns */
        .bg-diagonal {
            background-image: repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%);
            background-size: 10px 10px;
            opacity: 0.05;
        }
    </style>
</head>
<body class="antialiased selection:bg-purple-200 selection:text-black min-h-screen relative">

    <!-- Background Grid -->
    <div class="fixed inset-0 bg-grid-pattern pointer-events-none z-0"></div>

    <!-- Navigation -->
    <nav class="fixed top-0 w-full z-50 border-b-2 border-black bg-[#fffdf7]/95 backdrop-blur-sm">
        <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-indigo-500 rounded-lg border-2 border-black flex items-center justify-center brutal-shadow-sm text-white">
                    <i data-lucide="box" class="w-6 h-6"></i>
                </div>
                <div class="flex flex-col leading-none">
                    <span class="text-xl font-bold font-heading tracking-tight">Klyx<span class="text-zinc-500">Intell</span></span>
                </div>
            </div>
            
            <div class="flex items-center gap-4">
                <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-black bg-white brutal-shadow-sm">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-black"></span>
                    <span class="text-xs font-bold uppercase tracking-wider">System Active</span>
                </div>
                <button class="bg-black text-white px-5 py-2 text-sm font-bold rounded-lg border-2 border-black brutal-shadow brutal-hover transition-all">
                    Connect API
                </button>
            </div>
        </div>
    </nav>

    <main class="relative z-10 pt-32 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
        
        <!-- Hero / Prompt Section -->
        <div class="max-w-3xl mx-auto text-center mb-16 relative">
            <!-- Decorative Elements -->
            <div class="absolute -top-10 -left-10 w-12 h-12 border-2 border-black bg-[#fde047] rounded-full hidden md:block brutal-shadow-sm"></div>
            <div class="absolute bottom-10 -right-12 w-8 h-8 border-2 border-black bg-[#ff9ebb] rotate-45 hidden md:block brutal-shadow-sm"></div>

            <div class="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border-2 border-black bg-[#bfdbfe] brutal-shadow-sm transform -rotate-1">
                <i data-lucide="sparkles" class="w-4 h-4"></i>
                <span class="text-xs font-bold uppercase tracking-wide">v2.2 Architecture</span>
            </div>
            
            <h1 class="text-5xl sm:text-7xl font-bold font-heading text-black tracking-tight mb-6 leading-[0.95]">
                Structural
                <span class="relative inline-block px-2 mx-1">
                    <span class="absolute inset-0 bg-[#fde047] -rotate-1 border-2 border-black rounded-lg -z-10 brutal-shadow-sm"></span>
                    Clarity.
                </span>
            </h1>
            <p class="text-xl font-medium text-zinc-600 mb-10 max-w-lg mx-auto leading-relaxed">
                Reveal hidden risks through archetype analysis. Input your holdings to generate a structural risk map.
            </p>

            <!-- AI Prompt Input -->
            <div class="relative group max-w-xl mx-auto">
                <div class="relative flex items-center bg-white rounded-xl border-2 border-black p-2 brutal-shadow-lg transition-transform focus-within:-translate-y-1">
                    <div class="pl-3 pr-2 text-black">
                        <i data-lucide="search" class="w-6 h-6 stroke-2"></i>
                    </div>
                    <input type="text" placeholder="Ask about a stock (e.g., RELIANCE)..." class="w-full bg-transparent border-none focus:ring-0 text-lg font-medium text-black placeholder-zinc-400 h-12 outline-none">
                    <button class="p-3 rounded-lg bg-black text-white border-2 border-black hover:bg-zinc-800 transition-colors brutal-shadow-sm">
                        <i data-lucide="arrow-right" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Bento Grid Layout -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">
            
            <!-- Card 1: Stock Analyzer (Large) -->
            <div class="md:col-span-7 relative group rounded-2xl border-2 border-black bg-[#a78bfa] p-8 brutal-shadow hover:-translate-y-1 transition-transform overflow-hidden">
                <div class="absolute top-4 right-4 bg-black/10 p-2 rounded border-2 border-black/20">
                    <i data-lucide="bar-chart-2" class="w-6 h-6 text-white mix-blend-hard-light"></i>
                </div>
                
                <div class="relative z-10 h-full flex flex-col justify-between">
                    <div>
                        <div class="inline-block bg-black text-white px-2 py-1 rounded border-2 border-black text-xs font-mono mb-4">MOD: ANALYZE</div>
                        <h3 class="text-3xl font-bold font-heading mb-2 text-white" style="text-shadow: 2px 2px 0px #000;">Market Intelligence</h3>
                        <p class="text-base font-bold text-indigo-100 max-w-xs leading-relaxed">
                            Deep dive into fundamentals, valuations, and technical structure of any NSE stock.
                        </p>
                    </div>
                    
                    <div class="mt-8 bg-white/90 backdrop-blur rounded-xl border-2 border-black p-4 brutal-shadow-sm">
                        <div class="text-xs font-bold uppercase text-zinc-500 mb-2">Recent Scans</div>
                        <div class="flex flex-wrap gap-2">
                            <span class="px-2 py-1 bg-white border border-black rounded text-xs font-bold hover:bg-yellow-200 cursor-pointer transition-colors">RELIANCE</span>
                            <span class="px-2 py-1 bg-white border border-black rounded text-xs font-bold hover:bg-yellow-200 cursor-pointer transition-colors">HDFCBANK</span>
                            <span class="px-2 py-1 bg-white border border-black rounded text-xs font-bold hover:bg-yellow-200 cursor-pointer transition-colors">INFY</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card 2: Create Portfolio (Side) -->
            <div class="md:col-span-5 relative group rounded-2xl border-2 border-black bg-[#86efac] p-8 brutal-shadow hover:-translate-y-1 transition-transform flex flex-col">
                <div class="flex justify-between items-start mb-6">
                    <div class="inline-block bg-white text-black px-2 py-1 rounded border-2 border-black text-xs font-mono">MOD: BUILD</div>
                    <div class="w-10 h-10 bg-white rounded-full border-2 border-black flex items-center justify-center">
                        <i data-lucide="layers" class="w-5 h-5"></i>
                    </div>
                </div>
                
                <h3 class="text-2xl font-bold font-heading mb-2">Portfolio Architect</h3>
                <p class="text-sm font-bold text-green-900/70 mb-6">
                    Connect your broker or upload CSV to map structural risks.
                </p>

                <div class="mt-auto">
                    <button class="w-full py-4 rounded-xl border-2 border-black border-dashed bg-white/50 hover:bg-white hover:border-solid transition-all flex items-center justify-center gap-2 group-hover:brutal-shadow-sm">
                        <i data-lucide="plus" class="w-5 h-5"></i>
                        <span class="font-bold text-sm">New Collection</span>
                    </button>
                </div>
            </div>

            <!-- Card 3: Current Analysis (Full Width Bottom) -->
            <div class="md:col-span-12 relative rounded-2xl border-2 border-black bg-white flex flex-col md:flex-row overflow-hidden brutal-shadow">
                
                <!-- Visual Decoration Left -->
                <div class="w-full md:w-1/3 min-h-[200px] border-b-2 md:border-b-0 md:border-r-2 border-black bg-zinc-50 relative flex items-center justify-center overflow-hidden">
                    <div class="absolute inset-0 bg-diagonal"></div>
                    <div class="flex flex-col items-center gap-4 z-10 p-6 text-center">
                        <div class="w-16 h-16 bg-zinc-200 rounded-full border-2 border-black flex items-center justify-center">
                            <i data-lucide="lock" class="w-8 h-8 text-zinc-500"></i>
                        </div>
                        <span class="text-xs font-mono font-bold uppercase tracking-widest bg-zinc-900 text-white px-2 py-1">No Active Data</span>
                    </div>
                </div>

                <!-- Content Right -->
                <div class="flex-1 p-8 flex flex-col justify-center">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-3 h-3 rounded-full bg-red-500 border border-black animate-pulse"></div>
                        <h3 class="text-xl font-bold font-heading">Analysis Session</h3>
                    </div>
                    <p class="text-zinc-600 font-medium mb-6 max-w-lg">
                        Your workspace is currently empty. Initialize a portfolio scan or run a stock query to populate the structural risk matrix.
                    </p>
                    
                    <div class="flex gap-4">
                        <button class="px-6 py-2.5 rounded-lg bg-zinc-100 border-2 border-zinc-300 text-zinc-400 font-bold text-sm cursor-not-allowed flex items-center gap-2" disabled>
                            <i data-lucide="file-text" class="w-4 h-4"></i> View Report
                        </button>
                        <button class="px-6 py-2.5 rounded-lg border-2 border-black bg-[#fde047] text-black font-bold text-sm hover:bg-[#fcd34d] transition-colors brutal-shadow-sm brutal-hover">
                            Run Demo Scan
                        </button>
                    </div>
                </div>
            </div>

        </div>

        <!-- Footer Metric -->
        <div class="mt-16 border-t-2 border-black pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border-2 border-black brutal-shadow-sm">
                <span class="flex h-3 w-3 rounded-full bg-emerald-500 border border-black"></span>
                <span class="text-xs font-bold font-mono">API STATUS: ONLINE (98ms)</span>
            </div>
            <p class="text-sm font-bold text-zinc-600">© 2024 KLYX SYSTEMS</p>
        </div>

    </main>

    <script>
        lucide.createIcons({
            attrs: {
                "stroke-width": 1.5
            }
        });
    </script>
</body>
</html>