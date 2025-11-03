import type { NextAuthOptions } from "next-auth"
import { SupabaseAdapter } from "@next-auth/supabase-adapter"
import GoogleProvider from "next-auth/providers/google"
import { supabaseAdmin } from "./database"

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Add tenant information to session
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("tenant_id, role, preferences")
        .eq("email", session.user?.email)
        .single()

      if (userData) {
        session.user.tenantId = userData.tenant_id
        session.user.role = userData.role
        session.user.preferences = userData.preferences
      }

      return session
    },
    async signIn({ user, account, profile }) {
      // Multi-tenant user creation logic
      if (account?.provider === "google") {
        const domain = user.email?.split("@")[1]

        // Find or create tenant based on domain
        let { data: tenant } = await supabaseAdmin.from("tenants").select("id").eq("domain", domain).single()

        if (!tenant) {
          // Create new tenant for new domain
          const { data: newTenant } = await supabaseAdmin
            .from("tenants")
            .insert({
              name: domain,
              slug: domain.replace(".", "-"),
              domain: domain,
            })
            .select("id")
            .single()

          tenant = newTenant
        }

        // Create or update user with tenant association
        await supabaseAdmin.from("users").upsert({
          email: user.email!,
          full_name: user.name,
          avatar_url: user.image,
          tenant_id: tenant?.id,
        })
      }

      return true
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
}
