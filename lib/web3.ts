import { ThirdwebSDK } from "@thirdweb-dev/sdk"
import { Polygon } from "@thirdweb-dev/chains"

export const sdk = ThirdwebSDK.fromPrivateKey(process.env.THIRDWEB_SECRET_KEY!, Polygon, {
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
})

export async function mintNFT(
  contractAddress: string,
  metadata: {
    name: string
    description: string
    image: string
    attributes?: Array<{ trait_type: string; value: string }>
  },
  recipientAddress: string,
) {
  try {
    const contract = await sdk.getContract(contractAddress)
    const tx = await contract.erc721.mintTo(recipientAddress, metadata)
    return tx
  } catch (error) {
    console.error("Error minting NFT:", error)
    throw error
  }
}

export async function createMarketplaceListing(contractAddress: string, tokenId: string, price: string) {
  try {
    const marketplace = await sdk.getContract(process.env.MARKETPLACE_CONTRACT_ADDRESS!)
    const listing = await marketplace.marketplace.createListing({
      assetContractAddress: contractAddress,
      tokenId: tokenId,
      pricePerToken: price,
      currencyContractAddress: "0x0000000000000000000000000000000000000000", // ETH
      quantity: 1,
      startTimestamp: new Date(),
      endTimestamp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    })
    return listing
  } catch (error) {
    console.error("Error creating marketplace listing:", error)
    throw error
  }
}
