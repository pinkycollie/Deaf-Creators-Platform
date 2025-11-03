import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/database"
import { mintNFT } from "@/lib/web3"
import { logAuditEvent, validateTenantAccess } from "@/lib/security"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = request.headers.get("x-tenant-id")
    if (!tenantId || !(await validateTenantAccess(tenantId, session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { contentId, contractAddress, recipientAddress, metadata } = body

    // Verify content ownership
    const { data: content } = await supabaseAdmin
      .from("content")
      .select("*")
      .eq("id", contentId)
      .eq("creator_id", session.user.id)
      .eq("tenant_id", tenantId)
      .single()

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    // Mint NFT
    const mintResult = await mintNFT(contractAddress, metadata, recipientAddress)

    // Store NFT record
    const { data: nftToken, error } = await supabaseAdmin
      .from("nft_tokens")
      .insert({
        tenant_id: tenantId,
        content_id: contentId,
        creator_id: session.user.id,
        token_id: mintResult.id.toString(),
        contract_address: contractAddress,
        chain_id: 137, // Polygon
        metadata_uri: mintResult.receipt.logs[0]?.data,
      })
      .select()
      .single()

    if (error) throw error

    // Log audit event
    await logAuditEvent(tenantId, session.user.id, "nft_minted", "nft_token", nftToken.id, {
      contentId,
      tokenId: mintResult.id.toString(),
    })

    return NextResponse.json({
      nftToken,
      transactionHash: mintResult.receipt.transactionHash,
    })
  } catch (error) {
    console.error("Error minting NFT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
