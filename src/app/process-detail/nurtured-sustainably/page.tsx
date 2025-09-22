'use client'

import { useState, useEffect } from 'react'
import PublicNavigation from '@/components/public-navigation'
import Footer from '@/components/Footer'

export default function NurturedSustainablyPage() {
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
                        <span>Nurtured Sustainably</span>
                    </div>
                </div>
            </div>

            {/* Main Content Section */}
            <div className="flex">
                {/* Left Content - White Background */}
                <div className="w-1/2 bg-white">
                    <div className="sticky top-0  flex items-center">
                    <div className="max-w-md mx-auto py-20 px-8">
                        <h1 className="text-5xl font-bold text-gray-900 mb-8">
                            Nurtured<br />
                            Sustainably
                        </h1>

                        <p className="text-lg text-gray-600 mb-12 leading-relaxed">
                            Organic cultivation methods with monitored soil pH
                            (6.5-7.0). Complete fertilizer and water records
                            maintained for every batch throughout the growing
                            season.
                        </p>

                        {/* Main Image */}
                        <div className="mb-20">
                            <img
                                src="/image9.png"
                                alt="Sustainable farming"
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
                                src="/image15.png"
                                alt="Drone monitoring"
                                className="w-full h-64 object-cover rounded-lg shadow-lg"
                            />
                        </div>

                        {/* Description */}
                        <div className="text-white">
                            <p className="text-lg leading-relaxed">
                                Nurtured Sustainably, each field is managed through organic
                                cultivation methods where soil pH is carefully monitored and
                                maintained within the ideal range of 6.5 to 7.0. Detailed
                                fertilizer and irrigation logs are recorded for every single
                                batch, ensuring full traceability from planting to harvest and
                                guaranteeing that every root grows in a balanced, nutrient-
                                rich environment. This commitment not only preserves soil
                                health and biodiversity but also delivers turmeric of
                                consistently high quality and potency.
                            </p>
                        </div>

                        {/* Bottom Image */}
                        <div>
                            <img
                                src="/image16.png"
                                alt="Harvested turmeric"
                                className="w-full h-48 object-cover rounded-lg"
                            />
                        </div>

                        {/* Final Description */}
                        <div className="text-white">
                            <p className="text-lg leading-relaxed">
                                "These meticulous practices ensure that produce is pure,
                                verifiable, and sustainably grown from soil to final product."
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