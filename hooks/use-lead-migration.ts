"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { detectAndMigrateLead } from "@/app/actions/lead-migration-actions"
import type { MigrationResult } from "@/app/actions/lead-migration-actions"

export function useLeadMigration() {
  const [migrationStatus, setMigrationStatus] = useState<{
    isChecking: boolean
    result?: MigrationResult
    error?: string
  }>({
    isChecking: false,
  })

  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    async function checkAndMigrate() {
      if (!mounted) return

      setMigrationStatus({ isChecking: true })

      try {
        // Obter usuário autenticado
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          setMigrationStatus({ isChecking: false })
          return
        }

        // Verificar se há leads para migrar
        const result = await detectAndMigrateLead(user.email!, user.id)

        if (mounted) {
          setMigrationStatus({
            isChecking: false,
            result,
          })
        }
      } catch (error: any) {
        if (mounted) {
          setMigrationStatus({
            isChecking: false,
            error: error.message,
          })
        }
      }
    }

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Aguardar um pouco para garantir que a sessão está estabelecida
        setTimeout(checkAndMigrate, 1000)
      }
    })

    // Verificar imediatamente se já está autenticado
    checkAndMigrate()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  return migrationStatus
}
