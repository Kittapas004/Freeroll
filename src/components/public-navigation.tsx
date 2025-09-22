'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useRef, useEffect } from "react"
import { Menu, X, Search, LogIn, Package } from "lucide-react"

interface PublicNavigationProps {
    className?: string
}

interface ProductItem {
    id: number
    documentId: string
    final_product_type: string
    output_quantity: string
    product_grade: string
    batch_info?: {
        plant_variety: string
        farm_name: string
    }
}

export default function PublicNavigation({ className = "" }: PublicNavigationProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<ProductItem[]>([])
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const searchContainerRef = useRef<HTMLDivElement>(null)

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen)
        if (!isSearchOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 100)
        } else {
            setIsDropdownOpen(false)
            setSearchQuery("")
            setSearchResults([])
        }
    }

    // Get product image based on type
    const getProductImage = (productType: string) => {
        const imageMap: { [key: string]: string } = {
            'Powder': '/image3.png',
            'Capsule': '/image5.png', 
            'Oil': '/image4.png',
            'Extract': '/image4.png',
            'Tea Bag': '/image11.png',
        }
        return imageMap[productType] || '/image5.png'
    }

    // Get product display name
    const getProductDisplayName = (productType: string) => {
        const displayMap: { [key: string]: string } = {
            'Powder': 'Turmeric Powder',
            'Capsule': 'Turmeric Capsules', 
            'Oil': 'Turmeric Oil',
            'Extract': 'Turmeric Oil',
            'Tea Bag': 'Turmeric Tea Bag',
        }
        return displayMap[productType] || `Turmeric ${productType}`
    }

    // Search products when query changes
    useEffect(() => {
        const searchProducts = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([])
                setIsDropdownOpen(false)
                return
            }

            setIsSearching(true)

            try {
                // Use only localhost API to avoid CORS errors
                const response = await fetch('https://api-freeroll-production.up.railway.app/api/factory-processings?populate[factory_submission][populate][batch][populate]=*', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                }

                const result = await response.json()
                
                if (result?.data && Array.isArray(result.data)) {
                    // Filter completed items
                    const completedItems = result.data.filter((item: any) => {
                        const status = item.processing_status || item.Processing_Status
                        return status === 'Completed' || 
                               status === 'Complete' || 
                               status === 'Export Success' || 
                               status === 'Exported'
                    })

                    // Filter by search query
                    const filtered = completedItems.filter((item: any) => {
                        const searchableText = `
                            ${getProductDisplayName(item.final_product_type)} 
                            ${item.final_product_type} 
                            ${item.product_grade || ''} 
                            ${item.factory_submission?.batch?.Plant_Variety || ''} 
                            ${item.factory_submission?.batch?.Farm?.Farm_Name || ''}
                            ${item.documentId || ''}
                            ${item.batch_lot_number || ''}
                        `.toLowerCase()
                        
                        return searchableText.includes(searchQuery.toLowerCase())
                    })

                    const processedResults = filtered.slice(0, 5).map((item: any) => ({
                        id: item.id,
                        documentId: item.documentId || `item-${item.id}`,
                        final_product_type: item.final_product_type || 'Unknown',
                        output_quantity: item.output_quantity || 'N/A',
                        product_grade: item.product_grade || 'Standard',
                        batch_info: {
                            plant_variety: item.factory_submission?.batch?.Plant_Variety || 
                                          item.factory_submission?.Plant_Variety || 
                                          'Curcuma longa',
                            farm_name: item.factory_submission?.batch?.Farm?.Farm_Name ||
                                      item.factory_submission?.farm_name || 
                                      'Unknown Farm'
                        }
                    }))

                    setSearchResults(processedResults)
                    setIsDropdownOpen(processedResults.length > 0)
                } else {
                    setSearchResults([])
                    setIsDropdownOpen(false)
                }
            } catch (error) {
                console.error('Error searching products:', error)
                setSearchResults([])
                setIsDropdownOpen(false)
            } finally {
                setIsSearching(false)
            }
        }

        const timeoutId = setTimeout(searchProducts, 300) // Debounce
        return () => clearTimeout(timeoutId)
    }, [searchQuery])

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Handle product selection
    const handleProductSelect = (product: ProductItem) => {
        setSearchQuery('')
        setIsDropdownOpen(false)
        setIsSearchOpen(false)
        window.location.href = `/trace/${product.documentId}`
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
                    <div className="flex items-center justify-start relative">
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
                            <div ref={searchContainerRef} className="relative">
                                <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
                                    <div className="relative">
                                        <Input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Search products, batches..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-48 sm:w-64 pr-8"
                                            onFocus={() => {
                                                if (searchResults.length > 0) {
                                                    setIsDropdownOpen(true)
                                                }
                                            }}
                                        />
                                        {isSearching && (
                                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                                <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                    <Button type="submit" size="sm" className="bg-green-500 hover:bg-green-600">
                                        <Search className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={toggleSearch}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </form>

                                {/* Search Dropdown */}
                                {isDropdownOpen && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                                        <div className="px-4 py-2 bg-gray-50 border-b text-sm text-gray-600 font-medium">
                                            Found {searchResults.length} product{searchResults.length > 1 ? 's' : ''}
                                        </div>
                                        {searchResults.map((product) => (
                                            <div
                                                key={product.documentId}
                                                onClick={() => handleProductSelect(product)}
                                                className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                                            >
                                                {/* Product Image */}
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={getProductImage(product.final_product_type)}
                                                        alt={product.final_product_type}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement
                                                            target.src = '/image5.png' // Fallback image
                                                        }}
                                                    />
                                                </div>

                                                {/* Product Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-gray-900 truncate">
                                                        {getProductDisplayName(product.final_product_type)}
                                                    </h4>
                                                    <div className="text-sm text-gray-500 space-y-1">
                                                        <div className="flex items-center gap-4">
                                                            <span>Grade: {product.product_grade}</span>
                                                            
                                                        </div>
                                                        <div className="text-xs text-gray-400 truncate">
                                                            {product.batch_info?.farm_name} • {product.batch_info?.plant_variety}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Arrow Icon */}
                                                <div className="text-gray-400">
                                                    <Package className="h-4 w-4" />
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {searchResults.length === 5 && (
                                            <div className="px-4 py-2 text-center text-sm text-gray-500 bg-gray-50">
                                                Showing first 5 results. Press Enter for more results.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
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