'use client'

import { useState, useEffect } from 'react'
import PublicNavigation from '@/components/public-navigation'
import Footer from '@/components/Footer'

export default function RootsInRichSoilPage() {
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
                        <span>Roots in Rich Soil</span>
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
                                Roots in Rich Soil
                            </h1>

                            <p className="text-lg text-gray-600 mb-12 leading-relaxed">
                                Everything begins with select Curcuma longa varieties
                                planted in the fertile soils of Chiang Rai. Your journey of
                                pure wellness starts here.
                            </p>

                            {/* Main Image */}
                            <div className="mb-20">
                                <img
                                    src="/image10.png"
                                    alt="Turmeric planting"
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
                                src="/image12.png"
                                alt="Turmeric field"
                                className="w-full h-64 object-cover rounded-lg shadow-lg"
                            />
                        </div>

                        {/* Description */}
                        <div className="text-white">
                            <p className="text-lg leading-relaxed">
                                Turmeric cultivation begins with the collection of produce
                                from farmers whose fields are located in Chiang Rai Province.
                                Cultivation begins with the selection of high-quality turmeric
                                varieties that are suitable for Chiang Rai's soil and climate
                                conditions in order to produce products with a strong aroma
                                and flavor that meet standards.
                            </p>
                        </div>

                        {/* Bottom Images */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <img
                                    src="/image13.png"
                                    alt="Turmeric rows"
                                    className="w-full h-32 object-cover rounded-lg"
                                />
                            </div>
                            <div>
                                <img
                                    src="/image14.png"
                                    alt="Farmer working"
                                    className="w-full h-32 object-cover rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Final Description */}
                        <div className="text-white">
                            <p className="text-lg leading-relaxed">
                                After harvesting, turmeric is sorted and sent directly to the
                                processing plant to preserve its quality and full medicinal
                                value.
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