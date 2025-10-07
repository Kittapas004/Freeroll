'use client'

import { useState, useEffect } from 'react'
import PublicNavigation from '@/components/public-navigation'
import Footer from '@/components/Footer'

export default function RefinedPackagedPage() {
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
                        <span>Refined & Packaged</span>
                    </div>
                </div>
            </div>

            {/* Main Content Section */}
            <div className="flex flex-col lg:flex-row">
                {/* Left Content - White Background - Sticky */}
                <div className="w-full lg:w-1/2 bg-white">
                    <div className="lg:sticky lg:top-0 flex items-center">
                        <div className="max-w-md mx-auto py-12 lg:py-20 px-6 lg:px-8">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 lg:mb-8">
                                Refined & Packaged
                            </h1>

                            <p className="text-base md:text-lg text-gray-600 mb-8 lg:mb-12 leading-relaxed">
                                Our state-of-the-art facilities transform harvested roots
                                into pure supplements, ensuring 3.5%+ curcumin retention
                                through gentle processing methods.
                            </p>

                            {/* Main Image */}
                            <div className="mb-12 lg:mb-20">
                                <img
                                    src="/image6.png"
                                    alt="Processing facility"
                                    className="w-full rounded-lg shadow-lg"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content - Green Background */}
                <div className="w-full lg:w-1/2 bg-green-700 lg:min-h-screen">
                    <div className="max-w-md mx-auto space-y-6 lg:space-y-8 py-12 lg:py-20 px-6 lg:px-8">
                        {/* Top Image */}
                        <div>
                            <img
                                src="/image21.png"
                                alt="Factory processing"
                                className="w-full h-48 md:h-56 lg:h-64 object-cover rounded-lg shadow-lg"
                            />
                        </div>

                        {/* Description */}
                        <div className="text-white">
                            <p className="text-base md:text-lg leading-relaxed">
                                Harvested turmeric roots are carefully refined in our state-
                                of-the-art facilities, where gentle processing methods
                                preserve over 3.5% curcumin, ensuring that every
                                supplement delivers maximum potency and natural
                                benefits.
                            </p>
                        </div>

                        {/* Bottom Image */}
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div>
                                <img
                                    src="/image22.png"
                                    alt="Turmeric rows"
                                    className="w-full h-24 md:h-28 lg:h-32 object-cover rounded-lg"
                                />
                            </div>
                            <div>
                                <img
                                    src="/image23.png"
                                    alt="Farmer working"
                                    className="w-auto h-24 md:h-28 lg:h-32 object-cover rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Final Description */}
                        <div className="text-white pb-12 lg:pb-20">
                            <p className="text-base md:text-lg leading-relaxed">
                                Shown here is a close-up of our final product, reflecting the
                                meticulous processing that preserves natural curcumin
                                and ensures premium quality in every batch.
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