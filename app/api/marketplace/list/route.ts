import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/database"
import { createMarketplaceListing } from "@/lib/web3"
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
    const { nftTokenId, price, currency = "ETH" } = body

    // Verify NFT ownership
    const { data: nftToken } = await supabaseAdmin
      .from("nft_tokens")
      .select("*")
      .eq("id", nftTokenId)
      .eq("creator_id", session.user.id)
      .eq("tenant_id", tenantId)
      .single()

    if (!nftToken) {
      return NextResponse.json({ error: "NFT not found" }, { status: 404 })
    }

    // Create marketplace listing
    const listing = await createMarketplaceListing(nftToken.contract_address, nftToken.token_id, price)

    // Update NFT record
    const { error: updateError } = await supabaseAdmin
      .from("nft_tokens")
      .update({
        price: Number.parseFloat(price),
        currency,
        is_listed: true,
      })
      .eq("id", nftTokenId)

    if (updateError) throw updateError

    // Create transaction record
    const { data: transaction } = await supabaseAdmin
      .from("marketplace_transactions")
      .insert({
        tenant_id: tenantId,
        nft_token_id: nftTokenId,
        seller_id: session.user.id,
        price: Number.parseFloat(price),
        currency,
        status: "listed",
      })
      .select()
      .single()

    // Log audit event
    await logAuditEvent(tenantId, session.user.id, "nft_listed", "marketplace_transaction", transaction?.id, {
      nftTokenId,
      price,
      currency,
    })

    return NextResponse.json({
      listing,
      transaction,
    })
  } catch (error) {
    console.error("Error listing NFT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
