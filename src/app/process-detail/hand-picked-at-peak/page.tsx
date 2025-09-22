'use client'

import { useState, useEffect } from 'react'
import PublicNavigation from '@/components/public-navigation'
import Footer from '@/components/Footer'

export default function HandPickedAtPeakPage() {
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
                        <span>Hand - Picked at Peak</span>
                    </div>
                </div>
            </div>

            {/* Main Content Section */}
            <div className="flex">
                {/* Left Content - White Background */}
                <div className="w-1/2 bg-white">
                    <div className="sticky top-0 flex items-center">
                        <div className="max-w-md mx-auto py-20 px-8">
                            <h1 className="text-5xl font-bold text-gray-900 mb-8">
                                Hand-Picked<br />
                                at Peak
                            </h1>

                            <p className="text-lg text-gray-600 mb-12 leading-relaxed">
                                After 9 months of careful growth, our farmers hand-harvest
                                each rhizome at peak maturity. Every batch is tested for
                                Grade A quality before lab submission.
                            </p>

                            {/* Main Image */}
                            <div className="mb-20">
                                <img
                                    src="/image8.png"
                                    alt="Hand-picked turmeric"
                                    className="w-full rounded-lg shadow-lg"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content - Green Background */}
                <div className="w-1/2 bg-green-700">
                    <div className="max-w-md mx-auto space-y-8 py-20 px-8">
                        {/* Top Image */}
                        <div>
                            <img
                                src="/image17.png"
                                alt="Harvesting turmeric"
                                className="w-full h-64 object-cover rounded-lg shadow-lg"
                            />
                        </div>

                        {/* Description */}
                        <div className="text-white">
                            <p className="text-lg leading-relaxed">
                                At the height of maturity, each turmeric plant is harvested
                                with meticulous attention, capturing its richest nutrients and
                                deepest golden hue. Detailed inspections follow immediately,
                                certifying that every batch meets our highest benchmarks for
                                freshness and Grade A excellence.
                            </p>
                        </div>

                        {/* Bottom Image */}
                        <div>
                            <img
                                src="/image18.png"
                                alt="Fresh turmeric batch"
                                className="w-full h-48 object-cover rounded-lg"
                            />
                        </div>

                        {/* Final Description */}
                        <div className="text-white">
                            <p className="text-lg leading-relaxed">
                                From soil to harvest, every root reflects our devotion to quality
                                and sustainable farming. What reaches you is turmeric at its
                                most vibrant and authentic.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    )
}