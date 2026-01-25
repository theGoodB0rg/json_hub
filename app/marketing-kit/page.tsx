"use client";

import React from "react";
import {
    ShieldCheck,
    Zap,
    Database,
    FileJson,
    Table,
    Download,
    Github,
    Lock,
    Eye,
    CheckCircle2,
    Layers,
    Pencil,
    FileStack,
    CloudOff,
    Building2,
    BadgeCheck
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { toPng } from 'html-to-image';
import { useCallback, useRef } from 'react';

// Dimensions for Product Hunt Gallery: 1270x760
const SLIDE_WIDTH = 1270;
const SLIDE_HEIGHT = 760;

const SlideWrapper = ({ children, title, id }: { children: React.ReactNode, title: string, id: string }) => {
    const ref = useRef<HTMLDivElement>(null);

    const downloadImage = useCallback(() => {
        if (ref.current === null) {
            return;
        }

        toPng(ref.current, { cacheBust: true, pixelRatio: 2 }) // 2x pixel ratio for Retina-like quality
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `${id}.png`;
                link.href = dataUrl;
                link.click();
            })
            .catch((err) => {
                console.error('oops, something went wrong!', err);
            });
    }, [ref, id]);

    return (
        <div className="mb-20 flex flex-col items-center gap-4">
            <div className="flex items-center gap-4 w-[1270px] justify-between">
                <div className="text-xl font-bold text-muted-foreground">{title} (1270x760)</div>
                <button
                    onClick={downloadImage}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-sm font-medium transition-colors"
                >
                    <Download className="w-4 h-4" /> Download PNG
                </button>
            </div>
            <div
                ref={ref}
                id={id}
                className="relative overflow-hidden bg-background border border-border shadow-2xl flex flex-col"
                style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT }}
            >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
                {children}
            </div>
        </div>
    );
};

export default function MarketingKit() {
    return (
        <div className="min-h-screen bg-neutral-950 p-10 flex flex-col items-center font-sans dark">
            <h1 className="text-4xl font-bold text-white mb-10">Product Hunt Asset Generator</h1>
            <p className="text-neutral-400 mb-10 max-w-2xl text-center">
                Instructions: Open your browser&apos;s dev tools, set the responsive view to 1270x760, and capture these slides.
                Or rely on the fixed pixel dimensions below.
            </p>

            {/* SLIDE 1: THE HERO / HOOK */}
            <SlideWrapper title="01. Hero / Main Value Prop" id="slide-hero">
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                        <span className="font-semibold tracking-wide text-sm uppercase">Privacy First Converter</span>
                    </div>

                    <h2 className="text-7xl font-extrabold tracking-tight mb-6 text-white drop-shadow-2xl">
                        Stop Wrestling with <br /> Complex JSON
                    </h2>

                    <p className="text-2xl text-gray-300 max-w-3xl leading-relaxed mb-12 drop-shadow-md">
                        Convert massive, nested JSON files into clean Excel tables instantly.
                        <br />
                        <span className="text-white font-bold border-b-2 border-primary/50">100% Client-Side. Your data never leaves your device.</span>
                    </p>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-neutral-900/80 border border-white/10 backdrop-blur-md shadow-xl">
                            <FileJson className="w-10 h-10 text-blue-400" />
                            <span className="font-semibold text-sm text-gray-200">Any JSON</span>
                        </div>
                        <div className="active-arrow text-gray-500">
                            <svg width="40" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                        </div>
                        <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-neutral-900/80 border border-white/10 backdrop-blur-md shadow-xl">
                            <Zap className="w-10 h-10 text-yellow-400" />
                            <span className="font-semibold text-sm text-gray-200">Smart Flatten</span>
                        </div>
                        <div className="active-arrow text-gray-500">
                            <svg width="40" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                        </div>
                        <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-neutral-900/80 border border-white/10 backdrop-blur-md shadow-xl">
                            <Table className="w-10 h-10 text-green-400" />
                            <span className="font-semibold text-sm text-gray-200">Excel / CSV</span>
                        </div>
                    </div>
                </div>
            </SlideWrapper>

            {/* SLIDE 2: PRIVACY */}
            <SlideWrapper title="02. Privacy & Security" id="slide-privacy">
                <div className="relative z-10 flex flex-row items-center justify-between h-full px-20">
                    <div className="flex-1 pr-12">
                        <h3 className="text-5xl font-bold mb-6 text-white drop-shadow-md">Your Data is Yours. <br />Period.</h3>
                        <p className="text-xl text-gray-300 leading-relaxed mb-8">
                            Most converters upload your sensitive data to their servers.
                            <strong className="text-white block mt-2 text-2xl">We don&apos;t.</strong>
                        </p>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30"><ShieldCheck className="w-8 h-8" /></div>
                                <span className="text-xl font-medium text-gray-100">100% Client-Side Processing</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30"><Lock className="w-8 h-8" /></div>
                                <span className="text-xl font-medium text-gray-100">No Server Uploads</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30"><Database className="w-8 h-8" /></div>
                                <span className="text-xl font-medium text-gray-100">GDPR & CCPA Compliant by Design</span>
                            </div>
                        </div>
                    </div>

                    {/* Visual Abstract Representation of Local Processing */}
                    <div className="flex-1 relative h-[500px] flex items-center justify-center">
                        <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full" />
                        <div className="relative z-10 w-full max-w-md bg-[#0D0D0D] border border-gray-700/50 rounded-2xl p-8 shadow-2xl ring-1 ring-white/10">
                            <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <div className="ml-auto text-xs text-gray-400 font-mono">localhost</div>
                            </div>
                            <div className="space-y-4 font-mono text-sm leading-relaxed">
                                <div className="flex justify-between text-green-400">
                                    <span>&gt; init_secure_env()</span>
                                    <span className="opacity-70 font-bold">OK</span>
                                </div>
                                <div className="flex justify-between text-blue-400">
                                    <span>&gt; load_file(&quot;data.json&quot;)</span>
                                    <span className="opacity-70 font-bold">LOCAL</span>
                                </div>
                                <div className="flex justify-between text-white">
                                    <span>&gt; network_request()</span>
                                    <span className="text-red-500 font-bold bg-red-500/10 px-2 rounded">BLOCKED</span>
                                </div>
                                <div className="p-4 mt-8 bg-green-900/20 rounded border border-green-500/30 text-center">
                                    <span className="text-green-400 font-bold text-lg flex items-center justify-center gap-2">
                                        <Lock className="w-5 h-5" /> Secure Sandbox Active
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SlideWrapper>

            {/* SLIDE 3: PERFORMANCE / LARGE FILES */}
            <SlideWrapper title="03. Performance" id="slide-performance">
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-16">
                    <h3 className="text-6xl font-black mb-8 text-white drop-shadow-lg">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">100MB+?</span> No Problem.
                    </h3>
                    <p className="text-xl text-gray-300 max-w-2xl mb-12">
                        Built with streaming parsers and web workers to handle massive files that crash other tools.
                    </p>

                    <div className="grid grid-cols-3 gap-8 w-full max-w-4xl">
                        <div className="group p-8 rounded-2xl bg-neutral-900/80 border border-white/10 hover:border-blue-500/50 transition-all shadow-xl">
                            <div className="mb-4 inline-flex p-3 rounded-xl bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                                <Zap className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-bold mb-2 text-white">Instant Parse</h4>
                            <p className="text-gray-400 group-hover:text-gray-300">Stream processing means no waiting for the whole file to result.</p>
                        </div>
                        <div className="group p-8 rounded-2xl bg-neutral-900/80 border border-white/10 hover:border-purple-500/50 transition-all shadow-xl">
                            <div className="mb-4 inline-flex p-3 rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                                <Database className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-bold mb-2 text-white">No Ram Limits</h4>
                            <p className="text-gray-400 group-hover:text-gray-300">Smart memory management handles files larger than your RAM.</p>
                        </div>
                        <div className="group p-8 rounded-2xl bg-neutral-900/80 border border-white/10 hover:border-orange-500/50 transition-all shadow-xl">
                            <div className="mb-4 inline-flex p-3 rounded-xl bg-orange-500/20 text-orange-400 group-hover:scale-110 transition-transform">
                                <Table className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-bold mb-2 text-white">Virtual Scroll</h4>
                            <p className="text-gray-400 group-hover:text-gray-300">Preview millions of rows smoothly without browser lag.</p>
                        </div>
                    </div>
                </div>
            </SlideWrapper>

            {/* SLIDE 4: SMART FLATTENING VISUALIZATION */}
            <SlideWrapper title="04. Smart Flattening" id="slide-flattening">
                <div className="relative z-10 flex flex-row h-full">
                    {/* Left: JSON Chaos */}
                    <div className="w-1/2 bg-[#1e1e1e] p-10 flex flex-col justify-center border-r border-border/20 relative">
                        <div className="absolute top-6 left-6 text-xs font-mono px-2 py-1 bg-white/10 rounded text-red-300">BEFORE: Nested Chaos</div>
                        <pre className="font-mono text-sm text-blue-300 opacity-60">
                            {`[
  {
    "id": 1,
    "user": {
      "name": "Alex",
      "contact": {
        "email": "..."`}
                        </pre>
                        <pre className="font-mono text-sm text-white font-bold my-4 scale-110 origin-left">
                            {`        "address": {
          "city": "NY",
          "coords": [40.7, -74]
        }
      }
    },`}
                        </pre>
                        <pre className="font-mono text-sm text-blue-300 opacity-60">
                            {`    "tags": ["admin", "pro"]
  }
]`}
                        </pre>
                    </div>

                    {/* Middle: Arrow */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/20">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white ml-1"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                        </div>
                    </div>

                    {/* Right: Excel Order */}
                    <div className="w-1/2 bg-white p-10 flex flex-col justify-center relative">
                        <div className="absolute top-6 left-6 text-xs font-mono px-2 py-1 bg-black/10 rounded text-green-700 font-bold">AFTER: Clean Table</div>

                        <div className="border border-neutral-200 rounded-lg overflow-hidden shadow-lg bg-white text-black text-sm">
                            <table className="w-full">
                                <thead className="bg-neutral-100 border-b border-neutral-200 text-neutral-500">
                                    <tr>
                                        <th className="p-3 text-left font-medium border-r">id</th>
                                        <th className="p-3 text-left font-medium border-r">user.name</th>
                                        <th className="p-3 text-left font-medium bg-green-50 text-green-700 border-r border-green-200">user.address.city</th>
                                        <th className="p-3 text-left font-medium">user.tags</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="p-3 border-r border-neutral-100">1</td>
                                        <td className="p-3 border-r border-neutral-100">Alex</td>
                                        <td className="p-3 bg-green-50/30 border-r border-green-100 font-medium">NY</td>
                                        <td className="p-3 text-neutral-500">admin, pro</td>
                                    </tr>
                                    <tr className="bg-neutral-50/50">
                                        <td className="p-3 border-r border-neutral-100">2</td>
                                        <td className="p-3 border-r border-neutral-100">Sarah</td>
                                        <td className="p-3 bg-green-50/30 border-r border-green-100 font-medium">SF</td>
                                        <td className="p-3 text-neutral-500">user</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 border-r border-neutral-100">3</td>
                                        <td className="p-3 border-r border-neutral-100">Mike</td>
                                        <td className="p-3 bg-green-50/30 border-r border-green-100 font-medium">LDN</td>
                                        <td className="p-3 text-neutral-500">guest</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </SlideWrapper>

            {/* SLIDE 5: TRANSPARENCY / GITHUB */}
            <SlideWrapper title="05. Transparency (Not 'Free')" id="slide-open">
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-16">
                    <div className="w-24 h-24 mb-6 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                        <Github size={64} />
                    </div>

                    <h3 className="text-5xl font-bold mb-6 text-white drop-shadow-md">Open & Transparent</h3>

                    <p className="text-xl text-gray-300 max-w-2xl mb-10 font-medium">
                        You don&apos;t have to trust us blindly. <strong className="text-white">Our code is public</strong> for inspection.
                        <br />
                        Verify the security yourself.
                    </p>

                    <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
                        <div className="flex items-center gap-4 p-5 rounded-xl bg-neutral-900/90 border border-white/10 hover:border-green-500/50 transition-colors shadow-lg">
                            <CheckCircle2 className="text-green-400 w-6 h-6 shrink-0" />
                            <span className="font-semibold text-lg text-gray-200">Auditable Codebase</span>
                        </div>
                        <div className="flex items-center gap-4 p-5 rounded-xl bg-neutral-900/90 border border-white/10 hover:border-green-500/50 transition-colors shadow-lg">
                            <CheckCircle2 className="text-green-400 w-6 h-6 shrink-0" />
                            <span className="font-semibold text-lg text-gray-200">Community Verified</span>
                        </div>
                        <div className="flex items-center gap-4 p-5 rounded-xl bg-neutral-900/90 border border-white/10 hover:border-green-500/50 transition-colors shadow-lg">
                            <CheckCircle2 className="text-green-400 w-6 h-6 shrink-0" />
                            <span className="font-semibold text-lg text-gray-200">No Hidden API Calls</span>
                        </div>
                        <div className="flex items-center gap-4 p-5 rounded-xl bg-neutral-900/90 border border-white/10 hover:border-green-500/50 transition-colors shadow-lg">
                            <CheckCircle2 className="text-green-400 w-6 h-6 shrink-0" />
                            <span className="font-semibold text-lg text-gray-200">Self-Hostable</span>
                        </div>
                    </div>

                    <div className="mt-12 py-3 px-8 rounded-full border border-white/30 text-base font-mono text-gray-300 bg-white/5">
                        github.com/theGoodB0rg/json_hub
                    </div>
                </div>
            </SlideWrapper>

            {/* SLIDE 6: BATCH PROCESSING */}
            <SlideWrapper title="06. Batch Processing" id="slide-batch">
                <div className="relative z-10 flex flex-row items-center justify-between h-full px-20">
                    <div className="flex-1 pr-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 mb-8">
                            <Layers className="w-4 h-4" />
                            <span className="font-semibold tracking-wide text-sm uppercase">Bulk Operations</span>
                        </div>
                        <h3 className="text-6xl font-black mb-6 text-white drop-shadow-md leading-tight">
                            Convert 100s of <br /> Files at Once
                        </h3>
                        <p className="text-xl text-gray-300 leading-relaxed mb-8">
                            Drag and drop an entire folder. We&apos;ll convert each file individually and package them into a single ZIP.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-lg text-gray-200">
                                <span className="p-1 rounded bg-blue-500/20 text-blue-400"><CheckCircle2 className="w-5 h-5" /></span>
                                Process Multiple Files
                            </li>
                            <li className="flex items-center gap-3 text-lg text-gray-200">
                                <span className="p-1 rounded bg-blue-500/20 text-blue-400"><CheckCircle2 className="w-5 h-5" /></span>
                                Auto-Zip Results
                            </li>
                            <li className="flex items-center gap-3 text-lg text-gray-200">
                                <span className="p-1 rounded bg-blue-500/20 text-blue-400"><CheckCircle2 className="w-5 h-5" /></span>
                                Preserves Folder Structure
                            </li>
                        </ul>
                    </div>

                    {/* Visual: Multiple Files -> One */}
                    <div className="flex-1 relative h-[500px] flex items-center justify-center">
                        <div className="relative w-full max-w-md h-64">
                            {/* File Stack Animation */}
                            <div className="absolute top-0 left-0 w-32 h-40 bg-neutral-800 border border-neutral-600 rounded-lg shadow-xl transform -rotate-12 translate-y-4 flex items-center justify-center">
                                <FileJson className="text-gray-500 w-12 h-12" />
                            </div>
                            <div className="absolute top-0 left-8 w-32 h-40 bg-neutral-800 border border-neutral-600 rounded-lg shadow-xl transform -rotate-6 translate-y-2 flex items-center justify-center">
                                <FileJson className="text-gray-400 w-12 h-12" />
                            </div>
                            <div className="absolute top-0 left-16 w-32 h-40 bg-neutral-800 border border-neutral-500 rounded-lg shadow-xl transform rotate-0 z-10 flex items-center justify-center">
                                <FileJson className="text-blue-400 w-12 h-12" />
                                <span className="absolute bottom-4 text-xs font-mono text-gray-400">data_03.json</span>
                            </div>

                            {/* Arrow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 ml-8">
                                <div className="p-3 bg-white rounded-full shadow-lg">
                                    <Zap className="w-6 h-6 text-black" />
                                </div>
                            </div>

                            {/* Result: Excel File */}
                            <div className="absolute top-4 right-0 w-48 h-56 bg-[#FFB800] border border-yellow-400/30 rounded-xl shadow-2xl transform rotate-3 flex flex-col items-center justify-center z-0">
                                <FileStack className="text-black w-20 h-20 mb-4" />
                                <span className="font-bold text-black text-lg">Batch_Export.zip</span>
                                <span className="text-black/60 text-sm">25.4 MB</span>
                            </div>
                        </div>
                    </div>
                </div>
            </SlideWrapper>

            {/* SLIDE 7: SMART EDITS */}
            <SlideWrapper title="07. Smart Edits" id="slide-edits">
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-16">
                    <h3 className="text-5xl font-bold mb-6 text-white drop-shadow-md">
                        Quick Fixes? <span className="text-yellow-400 decoration-wavy underline decoration-yellow-400/30">Just Click.</span>
                    </h3>
                    <p className="text-xl text-gray-300 max-w-2xl mb-12">
                        Spot a typo or need to change a value? Edit your data directly in the grid before exporting. No need to open Excel yet.
                    </p>

                    {/* Interactive Table Mockup */}
                    <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden text-left text-black ring-4 ring-black/20">
                        <div className="bg-neutral-100 border-b border-neutral-300 px-4 py-2 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                                <tr>
                                    <th className="p-4 w-16 text-center border-r">#</th>
                                    <th className="p-4 border-r">Product Name</th>
                                    <th className="p-4 border-r w-32">Price</th>
                                    <th className="p-4 w-40">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-neutral-100">
                                    <td className="p-4 text-center text-neutral-400 border-r">1</td>
                                    <td className="p-4 font-medium border-r">Wireless Headphones</td>
                                    <td className="p-4 border-r">$129.99</td>
                                    <td className="p-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold uppercase">Active</span></td>
                                </tr>
                                <tr className="bg-blue-50/50 border-b border-blue-100">
                                    <td className="p-4 text-center text-neutral-400 border-r">2</td>
                                    <td className="p-4 font-medium border-r text-neutral-400 line-through decoration-red-400 relative">
                                        Noise Cancling Headset
                                        {/* Floating Edit Input */}
                                        <div className="absolute top-1 left-4 bg-white border-2 border-primary shadow-lg rounded px-3 py-2 flex items-center gap-2 z-10 animate-in zoom-in-95 min-w-[200px]">
                                            <span className="font-medium text-black">Noise Cancelling Headset</span>
                                            <span className="w-0.5 h-5 bg-black animate-pulse"></span>
                                            <Pencil className="w-4 h-4 text-primary ml-2" />
                                        </div>
                                    </td>
                                    <td className="p-4 border-r">$249.00</td>
                                    <td className="p-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold uppercase">Draft</span></td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-center text-neutral-400 border-r">3</td>
                                    <td className="p-4 font-medium border-r">Bluetooth Speaker</td>
                                    <td className="p-4 border-r">$59.99</td>
                                    <td className="p-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold uppercase">Active</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </SlideWrapper>

            {/* SLIDE 8: SALESFORCE / ENTERPRISE */}
            <SlideWrapper title="08. Salesforce / Enterprise" id="slide-salesforce">
                <div className="relative z-10 flex flex-row h-full bg-[#00A1E0]">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

                    {/* Left Content */}
                    <div className="w-1/2 p-16 flex flex-col justify-center text-white relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white mb-8 w-fit">
                            <CloudOff className="w-4 h-4" />
                            <span className="font-bold tracking-wide text-sm uppercase">Offline Mode</span>
                        </div>

                        <h3 className="text-6xl font-black mb-6 drop-shadow-md leading-tight">
                            Salesforce to Excel.
                        </h3>
                        <p className="text-2xl font-medium opacity-90 mb-10 leading-relaxed max-w-md">
                            Export Accounts, Opportunities, and Reports <br />
                            <span className="bg-white text-[#00A1E0] px-2 font-bold decoration-clone box-decoration-clone">100% Private. No Cloud.</span>
                        </p>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl border border-white/20">
                                <BadgeCheck className="w-8 h-8 text-white" />
                                <div>
                                    <div className="font-bold text-lg">GDPR Compliant</div>
                                    <div className="text-sm opacity-80">Data never leaves your browser</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl border border-white/20">
                                <Database className="w-8 h-8 text-white" />
                                <div>
                                    <div className="font-bold text-lg">Smart Flattening</div>
                                    <div className="text-sm opacity-80">Auto-cleans nested &quot;attributes&quot;</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Visual */}
                    <div className="w-1/2 relative bg-white flex items-center justify-center p-12 overflow-hidden">
                        {/* Decorative Blob */}
                        <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-40 h-40 bg-[#00A1E0] rounded-full blur-3xl opacity-20" />

                        {/* Stacked Cards Animation */}
                        <div className="relative w-full max-w-md aspect-[4/3]">

                            {/* Card 1: JSON Input (Behind) */}
                            <div className="absolute top-0 right-0 w-[90%] bg-neutral-900 rounded-xl shadow-2xl p-6 transform translate-x-4 -translate-y-4 border border-neutral-700 opacity-60 scale-95">
                                <div className="flex gap-2 mb-4">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                </div>
                                <div className="space-y-2 opacity-50">
                                    <div className="h-2 bg-neutral-700 rounded w-3/4" />
                                    <div className="h-2 bg-neutral-700 rounded w-1/2" />
                                    <div className="h-2 bg-neutral-700 rounded w-full" />
                                </div>
                            </div>

                            {/* Card 2: Excel Output (Front) */}
                            <div className="absolute top-8 right-8 inset-0 bg-white rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-neutral-200 overflow-hidden flex flex-col">
                                <div className="bg-[#107C41] text-white px-4 py-3 flex items-center justify-between shadow-sm z-10">
                                    <div className="flex items-center gap-2">
                                        <Table className="w-5 h-5" />
                                        <span className="font-bold text-sm">Account_Export.xlsx</span>
                                    </div>
                                    <div className="text-xs opacity-80 font-mono">5.2 MB</div>
                                </div>

                                <div className="p-0 flex-1 overflow-hidden bg-neutral-50 relative">
                                    {/* Grid Lines */}
                                    <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, #e5e5e5 1px, transparent 1px), linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)', backgroundSize: '100px 40px' }} />

                                    {/* Table Content */}
                                    <div className="relative z-10 p-4 space-y-3">
                                        <div className="flex gap-4 border-b border-neutral-200 pb-2">
                                            <div className="w-24 h-4 bg-neutral-200/80 rounded animate-pulse" />
                                            <div className="w-32 h-4 bg-neutral-200/80 rounded animate-pulse" />
                                            <div className="w-20 h-4 bg-neutral-200/80 rounded animate-pulse" />
                                        </div>
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="flex gap-4 items-center">
                                                <div className="w-24 h-3 bg-neutral-100 rounded" />
                                                <div className="w-32 h-3 bg-neutral-100 rounded" />
                                                <div className="w-20 h-3 bg-green-100 text-green-700 text-[10px] px-2 rounded-full flex items-center">Active</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Floating Success Badge */}
                                    <div className="absolute bottom-6 right-6 bg-white pl-2 pr-4 py-2 rounded-full shadow-lg border border-green-100 flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-700 delay-300">
                                        <div className="bg-green-500 rounded-full p-1">
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-sm font-bold text-green-700">Ready</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SlideWrapper>

        </div>
    );
}
