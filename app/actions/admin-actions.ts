"use server"

import { createClient } from "@/lib/supabase/server"
import { isUserAdmin, requireAdmin } from "@/lib/auth-utils"

export async function checkAdminAccess(): Promise<{
  isAdmin: boolean
  error: string | null
}> {
  try {
    const isAdmin = await isUserAdmin()
    return { isAdmin, error: null }
  } catch (error: any) {
    console.error("Erro ao verificar acesso de administrador:", error.message)
    return { isAdmin: false, error: error.message }
  }
}

export async function executeAdminScript(
  scriptContent: string,
  scriptType: "sql" | "javascript" = "javascript",
): Promise<{
  success: boolean
  result?: any
  error?: string
}> {
  try {
    // Verificar se o usuário é administrador
    await requireAdmin()

    // IMPORTANTE: Esta é uma implementação simulada por segurança
    // Em um ambiente de produção real, você precisaria de um sandbox seguro
    console.warn("🚨 EXECUÇÃO DE SCRIPT SIMULADA - NÃO EXECUTANDO CÓDIGO REAL")

    if (scriptType === "sql") {
      // Simular execução de SQL
      return {
        success: true,
        result: {
          message: "Script SQL simulado executado com sucesso",
          affectedRows: Math.floor(Math.random() * 10),
          executedAt: new Date().toISOString(),
          script: scriptContent.substring(0, 100) + "...",
        },
      }
    } else {
      // Simular execução de JavaScript
      return {
        success: true,
        result: {
          message: "Script JavaScript simulado executado com sucesso",
          output: `Resultado simulado para: ${scriptContent.substring(0, 50)}...`,
          executedAt: new Date().toISOString(),
        },
      }
    }
  } catch (error: any) {
    console.error("Erro na execução do script:", error.message)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function assignUserRole(
  userId: string,
  role: "admin" | "editor" | "user",
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Verificar se o usuário atual é administrador
    await requireAdmin()

    const supabase = createClient()

    // Verificar se o usuário já tem um papel
    const { data: existingRole, error: checkError } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError
    }

    if (existingRole) {
      // Atualizar papel existente
      const { error: updateError } = await supabase.from("user_roles").update({ role }).eq("user_id", userId)

      if (updateError) throw updateError
    } else {
      // Criar novo papel
      const { error: insertError } = await supabase.from("user_roles").insert({
        user_id: userId,
        role,
      })

      if (insertError) throw insertError
    }

    return { success: true }
  } catch (error: any) {
    console.error("Erro ao atribuir papel ao usuário:", error.message)
    return { success: false, error: error.message }
  }
}
