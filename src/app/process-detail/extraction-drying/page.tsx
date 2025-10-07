'use client'

import { useState, useEffect } from 'react'
import PublicNavigation from '@/components/public-navigation'
import Footer from '@/components/Footer'

export default function ExtractionDryingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation Header */}
            <PublicNavigation />

            {/* Breadcrumb */}
            <div className="bg-green-600 text-white py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center space-x-2 text-sm">
                        <a href="/home" className="text-white hover:text-green-600 font-medium transition-colors">
                            Home
                        </a>
                        <span>{'>'}</span>
                        <span>Extraction & Drying</span>
                    </div>
                </div>
            </div>

            {/* Main Content Section */}
            <div className="flex flex-col lg:flex-row">
                {/* Left Content - White Background */}
                <div className="w-full lg:w-1/2 bg-white">
                    <div className="lg:sticky lg:top-0 flex items-center">
                        <div className="max-w-md mx-auto py-12 lg:py-20 px-6 lg:px-8">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 lg:mb-8">
                                Extraction & Drying
                            </h1>

                            <p className="text-base md:text-lg text-gray-600 mb-8 lg:mb-12 leading-relaxed">
                                Gentle solar drying preserves nutrients and active
                                compounds. No chemicals used, with full traceability via
                                blockchain technology recording every batch.
                            </p>

                            {/* Main Image */}
                            <div className="mb-12 lg:mb-20">
                                <img
                                    src="/image7.png"
                                    alt="Solar drying process"
                                    className="w-full rounded-lg shadow-lg"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content - Green Background */}
                <div className="w-full lg:w-1/2 bg-green-700">
                    <div className="max-w-md mx-auto space-y-6 lg:space-y-8 py-12 lg:py-20 px-6 lg:px-8">
                        {/* Top Image */}
                        <div>
                            <img
                                src="/image19.png"
                                alt="Drying facility"
                                className="w-full h-48 md:h-56 lg:h-64 object-cover rounded-lg shadow-lg"
                            />
                        </div>

                        {/* Description */}
                        <div className="text-white">
                            <p className="text-base md:text-lg leading-relaxed">
                                Extraction & Drying is carried out through a careful, low-
                                temperature solar process that locks in the turmeric's
                                natural curcumin and essential oils. By avoiding chemical
                                additives entirely, we safeguard the plant's rich flavor and
                                therapeutic potency. Every lot is recorded on a blockchain
                                ledger, creating a transparent, tamper-proof trail from
                                harvest to finished product.
                            </p>
                        </div>

                        {/* Bottom Image */}
                        <div>
                            <img
                                src="/image20.png"
                                alt="Dried turmeric"
                                className="w-full h-40 md:h-44 lg:h-48 object-cover rounded-lg"
                            />
                        </div>

                        {/* Final Description */}
                        <div className="text-white">
                            <p className="text-base md:text-lg leading-relaxed">
                                Every batch is carefully dried under the sun to preserve its
                                natural nutrients, with full chemical-free processing and
                                blockchain-backed traceability.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}