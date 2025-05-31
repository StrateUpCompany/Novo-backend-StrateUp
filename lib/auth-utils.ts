import { createClient } from "@/lib/supabase/server"

export interface UserRole {
  id: string
  user_id: string
  role: "admin" | "editor" | "user"
  created_at: string
}

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = createClient()

  try {
    // Obter a sessão atual
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error("Erro ao obter sessão ou usuário não autenticado:", sessionError?.message)
      return null
    }

    // Buscar o papel do usuário na tabela user_roles
    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .single()

    if (roleError) {
      console.error("Erro ao buscar papel do usuário:", roleError.message)
      return null
    }

    return userRole
  } catch (error: any) {
    console.error("Erro inesperado ao verificar papel do usuário:", error.message)
    return null
  }
}

export async function isUserAdmin(): Promise<boolean> {
  const userRole = await getUserRole()
  return userRole?.role === "admin"
}

export async function requireAdmin() {
  const isAdmin = await isUserAdmin()

  if (!isAdmin) {
    throw new Error("Acesso não autorizado. Apenas administradores podem acessar esta funcionalidade.")
  }

  return true
}
