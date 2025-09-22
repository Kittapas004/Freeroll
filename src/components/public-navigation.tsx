'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useRef } from "react"
import { Menu, X, Search, LogIn } from "lucide-react"

interface PublicNavigationProps {
    className?: string
}

export default function PublicNavigation({ className = "" }: PublicNavigationProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const searchInputRef = useRef<HTMLInputElement>(null)

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen)
        if (!isSearchOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 100)
        }
    }

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            // Check if search query looks like a Lot ID (contains letters and numbers)
            const lotIdPattern = /^[A-Za-z0-9\-_]+$/
            
            if (lotIdPattern.test(searchQuery.trim())) {
                try {
                    // Search for product with matching Lot ID in factory-processings
                    const response = await fetch(`https://api-freeroll-production.up.railway.app/api/factory-processings?populate=*&filters[batch_lot_number][$eq]=${encodeURIComponent(searchQuery.trim())}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    })
                    
                    if (response.ok) {
                        const result = await response.json()
                        
                        if (result.data && result.data.length > 0) {
                            const product = result.data[0]
                            // Redirect to trace page with product documentId
                            window.location.href = `/trace/${product.documentId}`
                            return
                        }
                    }
                } catch (error) {
                    console.error('Error searching for Lot ID:', error)
                }
            }
            
            // Fallback to general search if not a Lot ID or Lot ID not found
            window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
        }
    }

    return (
        <nav className={`bg-white shadow-sm border-b ${className}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-3 items-center h-30">
                    {/* Search Section - Fixed Width */}
                    <div className="flex items-center justify-start">
                        {!isSearchOpen ? (
                            <Button
                                variant="ghost"
                                onClick={toggleSearch}
                                className="flex items-center space-x-2 text-gray-600 hover:text-green-600"
                            >
                                <Search className="w-5 h-5" />
                                <span className="text-sm">Search</span>
                            </Button>
                        ) : (
                            <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
                                <Input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search products, batches..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-48 sm:w-64"
                                    onBlur={() => {
                                        // Only close if no search query
                                        if (!searchQuery.trim()) {
                                            setTimeout(() => setIsSearchOpen(false), 200)
                                        }
                                    }}
                                />
                                <Button type="submit" size="sm" className="bg-green-500 hover:bg-green-600">
                                    <Search className="w-4 h-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setIsSearchOpen(false)
                                        setSearchQuery("")
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </form>
                        )}
                    </div>

                    {/* Logo - Always Centered */}
                    <div className="flex items-center justify-center">
                        <Link href="/home" className="flex flex-col items-center">
                            <img src="/image2.png" alt="TurmeRic" className="h-22 w-auto" />
                        </Link>
                    </div>

                    {/* Login Button - Fixed Width */}
                    <div className="flex items-center justify-end space-x-2">
                        <Link href="/login">
                            <Button variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center space-x-2 px-4 py-2">
                                <span>Login</span>
                                <LogIn className="w-4 h-4" />
                            </Button>
                        </Link>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <Button variant="ghost" size="sm" onClick={toggleMenu}>
                                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu - Centered below logo */}
                <div className="hidden md:flex justify-center items-center space-x-8 pb-4">
                    <a href="/home#home" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
                        Home
                    </a>
                    <a href="/home#products" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
                        Products
                    </a>
                    <a href="/home#trace" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
                        Trace Back
                    </a>
                    <a href="/home#farm" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
                        Farm
                    </a>
                    <a href="/home#contact" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
                        Blog
                    </a>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden border-t bg-white">
                        {/* Mobile Search */}
                        <div className="px-4 py-3 border-b">
                            <form onSubmit={handleSearchSubmit} className="flex space-x-2">
                                <Input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="submit" size="sm" className="bg-green-500 hover:bg-green-600">
                                    <Search className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>

                        <div className="px-2 pt-2 pb-3 space-y-1">
                            <a
                                href="/home#home"
                                className="block px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Home
                            </a>
                            <a
                                href="/home#products"
                                className="block px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md"
                                onClick={() => setIsMenuOpen(false)}
                            >
                               Products
                            </a>
                            <a
                                href="/home#trace"
                                className="block px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Trace Back
                            </a>
                            <a
                                href="/home#farm"
                                className="block px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Farm
                            </a>
                            <Link
                                href="/blog"
                                className="block px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Blog
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}