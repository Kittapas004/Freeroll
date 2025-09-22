'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import PublicNavigation from '@/components/public-navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, Leaf, Factory, ShoppingCart, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface SearchResult {
  id: string
  type: 'product' | 'batch' | 'process' | 'farm'
  title: string
  description: string
  location?: string
  status?: string
  batchId?: string
}

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const searchData = async () => {
      setIsLoading(true)

      if (!query) {
        // Show sample/popular searches when no query
        const mockResults: SearchResult[] = [
          {
            id: 'batch-001',
            type: 'batch',
            title: 'Turmeric Batch #TUR-2024-001',
            description: 'Premium organic turmeric harvested from Chiang Mai farms',
            location: 'Chiang Mai, Thailand',
            status: 'Ready for Processing',
            batchId: 'TUR-2024-001'
          },
          {
            id: 'product-001',
            type: 'product',
            title: 'TurmeRic Curcumin Capsules',
            description: 'High-potency curcumin extract with 95% curcuminoids',
            status: 'Available'
          },
          {
            id: 'farm-001',
            type: 'farm',
            title: 'Golden Fields Farm',
            description: 'Certified organic turmeric farm in Northern Thailand',
            location: 'Chiang Mai, Thailand',
            status: 'Active'
          }
        ]
        
        setTimeout(() => {
          setResults(mockResults)
          setIsLoading(false)
        }, 500)
        return
      }

      try {
        const searchResults: SearchResult[] = []

        // Search for products by lot number
        const productResponse = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/products?populate=*&filters[batch_lot_number][$containsi]=${query}`)
        if (productResponse.ok) {
          const productData = await productResponse.json()
          productData.data.forEach((product: any) => {
            searchResults.push({
              id: product.documentId,
              type: 'product',
              title: `${product.plant_variety} - Lot ${product.batch_lot_number}`,
              description: `${product.product_type} from ${product.farm_origin || 'Unknown Farm'}`,
              status: 'Traceable',
              batchId: product.batch_lot_number
            })
          })
        }

        // Search for factory processing batches
        const batchResponse = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/factory-processings?populate=*&filters[batch_lot_number][$containsi]=${query}`)
        if (batchResponse.ok) {
          const batchData = await batchResponse.json()
          batchData.data.forEach((batch: any) => {
            searchResults.push({
              id: batch.documentId,
              type: 'batch',
              title: `Processing Batch #${batch.batch_lot_number}`,
              description: `${batch.processing_type || 'Processing'} at ${batch.factory?.factory_name || 'Factory'}`,
              location: batch.factory?.location || 'Unknown Location',
              status: batch.processing_status || 'In Progress',
              batchId: batch.batch_lot_number
            })
          })
        }

        // Search by general terms in product names and descriptions
        if (searchResults.length === 0) {
          const generalProductResponse = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/products?populate=*&filters[$or][0][plant_variety][$containsi]=${query}&filters[$or][1][product_type][$containsi]=${query}&filters[$or][2][farm_origin][$containsi]=${query}`)
          if (generalProductResponse.ok) {
            const generalProductData = await generalProductResponse.json()
            generalProductData.data.slice(0, 5).forEach((product: any) => {
              searchResults.push({
                id: product.documentId,
                type: 'product',
                title: `${product.plant_variety} - Lot ${product.batch_lot_number}`,
                description: `${product.product_type} from ${product.farm_origin || 'Unknown Farm'}`,
                status: 'Traceable',
                batchId: product.batch_lot_number
              })
            })
          }
        }

        setResults(searchResults)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    searchData()
  }, [query])

  const getIcon = (type: string) => {
    switch (type) {
      case 'product': return <ShoppingCart className="w-5 h-5" />
      case 'batch': return <Package className="w-5 h-5" />
      case 'farm': return <Leaf className="w-5 h-5" />
      case 'process': return <Factory className="w-5 h-5" />
      default: return <Package className="w-5 h-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'product': return 'bg-blue-100 text-blue-800'
      case 'batch': return 'bg-green-100 text-green-800'
      case 'farm': return 'bg-yellow-100 text-yellow-800'
      case 'process': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getResultLink = (result: SearchResult) => {
    switch (result.type) {
      case 'batch':
        return `/trace/${result.batchId || result.id}`
      case 'product':
        return `/trace/${result.id}` // Link to trace page using product documentId
      case 'farm':
        return `/home#farm`
      case 'process':
        return `/home#process`
      default:
        return '/home'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Results</h1>
          <p className="text-gray-600">
            {query ? (
              <>
                Showing results for "<span className="font-semibold text-green-600">{query}</span>"
                {!isLoading && ` (${results.length} result${results.length !== 1 ? 's' : ''})`}
              </>
            ) : (
              'Browse all available content'
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-green-600">
                        {getIcon(result.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{result.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getTypeColor(result.type)}>
                            {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                          </Badge>
                          {result.status && (
                            <Badge variant="outline">{result.status}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link href={getResultLink(result)}>
                      <Button size="sm" className="bg-green-500 hover:bg-green-600">
                        View Details
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-2">{result.description}</p>
                  {result.location && (
                    <p className="text-sm text-gray-500">📍 {result.location}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No results found</h3>
            <p className="text-gray-500 mb-6">
              {query
                ? `We couldn't find any results for "${query}". Try adjusting your search terms.`
                : 'Start typing to search for products, batches, farms, or processes.'
              }
            </p>
            <Link href="/home">
              <Button className="bg-green-500 hover:bg-green-600">
                Back to Home
              </Button>
            </Link>
          </div>
        )}

        {/* Search Suggestions */}
        {!query && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Searches</h2>
            <div className="flex flex-wrap gap-2">
              {['turmeric', 'batch', 'organic', 'curcumin', 'farm', 'quality'].map((term) => (
                <Link key={term} href={`/search?q=${term}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-green-50 hover:border-green-300">
                    {term}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <SearchContent />
    </Suspense>
  )
}