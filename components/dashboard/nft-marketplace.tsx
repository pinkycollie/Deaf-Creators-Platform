"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Coins, ExternalLink, Play } from "lucide-react"

interface NFTMarketplaceProps {
  tenantId: string
}

interface NFTToken {
  id: string
  content: {
    title: string
    description: string
    thumbnail_url: string
    content_type: string
  }
  token_id: string
  contract_address: string
  price: number
  currency: string
  is_listed: boolean
  creator: {
    username: string
    full_name: string
  }
}

export function NFTMarketplace({ tenantId }: NFTMarketplaceProps) {
  const [nfts, setNfts] = useState<NFTToken[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mintingContent, setMintingContent] = useState<string | null>(null)
  const [listingNft, setListingNft] = useState<string | null>(null)
  const [listingPrice, setListingPrice] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchNFTs()
  }, [tenantId])

  const fetchNFTs = async () => {
    try {
      const response = await fetch("/api/nft", {
        headers: {
          "x-tenant-id": tenantId,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch NFTs")

      const { nfts } = await response.json()
      setNfts(nfts)
    } catch (error) {
      console.error("Error fetching NFTs:", error)
      toast({
        title: "Error",
        description: "Failed to load NFTs.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMintNFT = async (contentId: string) => {
    setMintingContent(contentId)

    try {
      const response = await fetch("/api/nft/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          contentId,
          contractAddress: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS,
          recipientAddress: "0x...", // User's wallet address
          metadata: {
            name: "Content NFT",
            description: "Tokenized content from Deaf Creator Platform",
            image: "https://example.com/image.jpg",
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to mint NFT")

      const { nftToken, transactionHash } = await response.json()

      toast({
        title: "Success",
        description: `NFT minted successfully! Transaction: ${transactionHash.slice(0, 10)}...`,
      })

      fetchNFTs()
    } catch (error) {
      console.error("Error minting NFT:", error)
      toast({
        title: "Error",
        description: "Failed to mint NFT. Please try again.",
        variant: "destructive",
      })
    } finally {
      setMintingContent(null)
    }
  }

  const handleListNFT = async (nftId: string) => {
    if (!listingPrice) {
      toast({
        title: "Error",
        description: "Please enter a price.",
        variant: "destructive",
      })
      return
    }

    setListingNft(nftId)

    try {
      const response = await fetch("/api/marketplace/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          nftTokenId: nftId,
          price: listingPrice,
          currency: "ETH",
        }),
      })

      if (!response.ok) throw new Error("Failed to list NFT")

      toast({
        title: "Success",
        description: "NFT listed on marketplace successfully!",
      })

      setListingPrice("")
      fetchNFTs()
    } catch (error) {
      console.error("Error listing NFT:", error)
      toast({
        title: "Error",
        description: "Failed to list NFT. Please try again.",
        variant: "destructive",
      })
    } finally {
      setListingNft(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading NFTs...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            NFT Marketplace
          </CardTitle>
          <CardDescription>Mint and trade your tokenized content</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nfts.map((nft) => (
          <Card key={nft.id} className="overflow-hidden">
            <div className="aspect-video bg-muted relative">
              {nft.content.thumbnail_url ? (
                <img
                  src={nft.content.thumbnail_url || "/placeholder.svg"}
                  alt={nft.content.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Play className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <Badge className="absolute top-2 right-2">{nft.content.content_type}</Badge>
            </div>

            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold truncate">{nft.content.title}</h3>
                <p className="text-sm text-muted-foreground">by {nft.creator.username}</p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>Token ID: #{nft.token_id}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    window.open(`https://polygonscan.com/token/${nft.contract_address}?a=${nft.token_id}`, "_blank")
                  }
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              {nft.is_listed ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {nft.price} {nft.currency}
                    </span>
                    <Badge variant="secondary">Listed</Badge>
                  </div>
                  <Button className="w-full" size="sm">
                    Buy Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Price in ETH"
                      value={listingPrice}
                      onChange={(e) => setListingPrice(e.target.value)}
                      type="number"
                      step="0.001"
                    />
                    <Button onClick={() => handleListNFT(nft.id)} disabled={listingNft === nft.id} size="sm">
                      {listingNft === nft.id ? "Listing..." : "List"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {nfts.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No NFTs found</h3>
            <p className="text-muted-foreground">Upload content and mint your first NFT to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
