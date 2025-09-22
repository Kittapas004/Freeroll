export default function Footer() {
    return (
        <section id="contact">
            <footer className="bg-gray-900 text-white py-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8 justify-items-center text-center md:text-left">
                        <div className="space-y-4 md:justify-self-start md:text-left">
                            <div className="flex justify-center md:justify-start">
                                <img src="/LogoWhite.png" alt="TurmeRic" className="h-20" />
                            </div>
                            <p className="text-gray-400 max-w-xs">
                                From Soil to Supplement - Traceability
                                for authentic, sustainable turmeric products.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold mb-4">Products</h3>
                            <div className="space-y-2 text-gray-400">
                                <div>Oil</div>
                                <div>Powder</div>
                                <div>Capsules</div>
                                <div>Tea Bags</div>
                            </div>
                        </div>
                        <div className="space-y-4 md:justify-self-end md:text-right">
                            <h3 className="text-lg font-semibold mb-4">Trace Your Turmeric</h3>
                            <div className="space-y-2 text-gray-400">
                                <div>QR Code</div>
                                <div>Batch Tracking</div>
                                <div>Quality Reports</div>
                                <div>Farm Information</div>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                        <p>© 2025 TurmeRic. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </section>
    )
}