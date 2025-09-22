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
            <div className="flex">
                {/* Left Content - White Background - Sticky */}
                <div className="w-1/2 bg-white">
                    <div className="sticky top-0 flex items-center">
                        <div className="max-w-md mx-auto py-20 px-8">
                            <h1 className="text-5xl font-bold text-gray-900 mb-8">
                                Refined & Packaged
                            </h1>

                            <p className="text-lg text-gray-600 mb-12 leading-relaxed">
                                Our state-of-the-art facilities transform harvested roots
                                into pure supplements, ensuring 3.5%+ curcumin retention
                                through gentle processing methods.
                            </p>

                            {/* Main Image */}
                            <div className="mb-20">
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
                <div className="w-1/2 bg-green-700 min-h-screen">
                    <div className="max-w-md mx-auto space-y-8 py-20 px-8">
                        {/* Top Image */}
                        <div>
                            <img
                                src="/image21.png"
                                alt="Factory processing"
                                className="w-full h-64 object-cover rounded-lg shadow-lg"
                            />
                        </div>

                        {/* Description */}
                        <div className="text-white">
                            <p className="text-lg leading-relaxed">
                                Harvested turmeric roots are carefully refined in our state-
                                of-the-art facilities, where gentle processing methods
                                preserve over 3.5% curcumin, ensuring that every
                                supplement delivers maximum potency and natural
                                benefits.
                            </p>
                        </div>

                        {/* Bottom Image */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <img
                                    src="/image22.png"
                                    alt="Turmeric rows"
                                    className="w-full h-32 object-cover rounded-lg"
                                />
                            </div>
                            <div>
                                <img
                                    src="/image23.png"
                                    alt="Farmer working"
                                    className="w-auto h-32 object-cover rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Final Description */}
                        <div className="text-white pb-20">
                            <p className="text-lg leading-relaxed">
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