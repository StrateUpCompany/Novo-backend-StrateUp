"use server"

import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { recordMigrationReport } from "./migration-analytics-actions"

// --- Tipos de Dados ---
export type MigrationResult = {
  success: boolean
  leadId?: string
  userId?: string
  migratedData?: {
    diagnostics: number
    sequenceProgress: number
    sentEmails: number
  }
  error?: string
  message?: string
}

// --- Schemas de Validação ---
const migrationSchema = z.object({
  email: z.string().email("E-mail inválido"),
  userId: z.string().uuid("ID do usuário inválido"),
  mergeStrategy: z.enum(["keep_lead", "keep_user", "merge"]).default("merge"),
})

// --- Server Action Principal para Migração ---
export async function migrateLeadToUser(migrationData: z.infer<typeof migrationSchema>): Promise<MigrationResult> {
  const supabase = createClient()

  try {
    const validatedData = migrationSchema.parse(migrationData)
    const { email, userId, mergeStrategy } = validatedData

    // 1. Buscar o lead pelo e-mail
    const { data: lead, error: leadError } = await supabase.from("leads").select("*").eq("email", email).single()

    if (leadError && leadError.code !== "PGRST116") {
      throw leadError
    }

    if (!lead) {
      return {
        success: false,
        message: "Nenhum lead encontrado para este e-mail",
      }
    }

    // 2. Verificar se o usuário já existe
    const { data: existingUser, error: userError } = await supabase.auth.admin.getUserById(userId)

    if (userError || !existingUser.user) {
      throw new Error(`Usuário não encontrado: ${userError?.message}`)
    }

    // 3. Iniciar transação de migração
    const migrationResult = await performMigration(supabase, lead, userId, mergeStrategy, existingUser)

    return {
      success: true,
      leadId: lead.id,
      userId: userId,
      migratedData: migrationResult,
      message: `Migração concluída com sucesso! ${migrationResult.diagnostics} diagnósticos, ${migrationResult.sequenceProgress} progressos de sequência e ${migrationResult.sentEmails} e-mails migrados.`,
    }
  } catch (e: any) {
    console.error("Erro na migração de lead para usuário:", e.message)
    return {
      success: false,
      error: e.message,
    }
  }
}

// --- Função Auxiliar para Realizar a Migração ---
async function performMigration(
  supabase: any,
  lead: any,
  userId: string,
  mergeStrategy: "keep_lead" | "keep_user" | "merge",
  existingUser: any,
) {
  const migratedData = {
    diagnostics: 0,
    sequenceProgress: 0,
    sentEmails: 0,
  }

  let migrationStartTime = Date.now()

  try {
    // 1. Migrar diagnósticos
    const { data: diagnostics, error: diagnosticsError } = await supabase
      .from("lead_diagnostics")
      .select("*")
      .eq("lead_id", lead.id)

    if (diagnosticsError) throw diagnosticsError

    if (diagnostics && diagnostics.length > 0) {
      // Criar registros na tabela diagnostics para o usuário autenticado
      const diagnosticsToInsert = diagnostics.map((diag: any) => ({
        user_id: userId,
        leadtype: diag.lead_type,
        score: diag.score,
        answers: diag.answers,
        session_id: diag.session_id,
        created_at: diag.created_at,
        // Adicionar metadados indicando que foi migrado
        metadata: {
          migratedFromLead: true,
          originalLeadId: lead.id,
          originalDiagnosticId: diag.id,
        },
      }))

      const { error: insertDiagnosticsError } = await supabase.from("diagnostics").insert(diagnosticsToInsert)

      if (insertDiagnosticsError) {
        console.warn("Erro ao migrar diagnósticos:", insertDiagnosticsError.message)
      } else {
        migratedData.diagnostics = diagnostics.length
      }
    }

    // 2. Migrar progresso de sequências
    const { data: sequenceProgress, error: progressError } = await supabase
      .from("user_sequence_progress")
      .select("*")
      .eq("lead_id", lead.id)

    if (progressError) throw progressError

    if (sequenceProgress && sequenceProgress.length > 0) {
      // Atualizar registros para usar user_id em vez de lead_id
      for (const progress of sequenceProgress) {
        const { error: updateProgressError } = await supabase
          .from("user_sequence_progress")
          .update({
            user_id: userId,
            lead_id: null,
            metadata: {
              ...progress.metadata,
              migratedFromLead: true,
              originalLeadId: lead.id,
            },
          })
          .eq("id", progress.id)

        if (updateProgressError) {
          console.warn(`Erro ao migrar progresso ${progress.id}:`, updateProgressError.message)
        } else {
          migratedData.sequenceProgress++
        }
      }
    }

    // 3. Atualizar registros de e-mails enviados (para referência)
    const { data: sentEmails, error: emailsError } = await supabase
      .from("sent_emails")
      .select("id")
      .eq("recipient_email", lead.email)

    if (emailsError) throw emailsError

    if (sentEmails && sentEmails.length > 0) {
      // Adicionar metadados aos e-mails indicando a migração
      for (const email of sentEmails) {
        const { error: updateEmailError } = await supabase
          .from("sent_emails")
          .update({
            metadata: {
              migratedToUser: true,
              userId: userId,
              originalLeadId: lead.id,
            },
          })
          .eq("id", email.id)

        if (updateEmailError) {
          console.warn(`Erro ao atualizar e-mail ${email.id}:`, updateEmailError.message)
        } else {
          migratedData.sentEmails++
        }
      }
    }

    // 4. Marcar o lead como migrado (não deletar para auditoria)
    const { error: updateLeadError } = await supabase
      .from("leads")
      .update({
        metadata: {
          ...lead.metadata,
          migratedToUser: true,
          migratedAt: new Date().toISOString(),
          migratedToUserId: userId,
        },
      })
      .eq("id", lead.id)

    if (updateLeadError) {
      console.warn("Erro ao marcar lead como migrado:", updateLeadError.message)
    }

    // 5. Registrar reporte de migração
    const migrationEndTime = Date.now()
    migrationStartTime =
      migrationEndTime -
      (migratedData.diagnostics * 100 + migratedData.sequenceProgress * 50 + migratedData.sentEmails * 10) // Estimativa

    await recordMigrationReport({
      lead_id: lead.id,
      user_id: userId,
      migration_status: "success",
      data_migrated: migratedData,
      migration_time_ms: migrationEndTime - migrationStartTime,
      lead_source: lead.source,
      lead_email: lead.email,
      user_email: existingUser.user?.email || "",
    })

    return migratedData
  } catch (e: any) {
    console.error("Erro durante a migração:", e.message)

    // Registrar erro de migração
    await recordMigrationReport({
      lead_id: lead.id,
      user_id: userId,
      migration_status: "failed",
      data_migrated: { diagnostics: 0, sequenceProgress: 0, sentEmails: 0 },
      migration_time_ms: Date.now() - migrationStartTime,
      error_message: e.message,
      lead_source: lead.source,
      lead_email: lead.email,
      user_email: existingUser.user?.email || "",
    }).catch(console.error) // Não falhar se não conseguir registrar

    throw e
  }
}

// --- Server Action para Detecção Automática de Migração ---
export async function detectAndMigrateLead(email: string, userId: string): Promise<MigrationResult> {
  const supabase = createClient()

  try {
    // Verificar se existe um lead para este e-mail que ainda não foi migrado
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("email", email)
      .is("metadata->>migratedToUser", null) // Apenas leads não migrados
      .single()

    if (leadError && leadError.code !== "PGRST116") {
      throw leadError
    }

    if (!lead) {
      return {
        success: false,
        message: "Nenhum lead não migrado encontrado para este e-mail",
      }
    }

    // Verificar se há dados relevantes para migrar
    const hasRelevantData = await checkForRelevantData(supabase, lead.id, email)

    if (!hasRelevantData) {
      // Marcar como migrado mesmo sem dados relevantes
      await supabase
        .from("leads")
        .update({
          metadata: {
            ...lead.metadata,
            migratedToUser: true,
            migratedAt: new Date().toISOString(),
            migratedToUserId: userId,
            migrationNote: "Sem dados relevantes para migrar",
          },
        })
        .eq("id", lead.id)

      return {
        success: true,
        message: "Lead encontrado mas sem dados relevantes para migrar",
      }
    }

    // Realizar migração automática
    return await migrateLeadToUser({
      email,
      userId,
      mergeStrategy: "merge",
    })
  } catch (e: any) {
    console.error("Erro na detecção/migração automática:", e.message)
    return {
      success: false,
      error: e.message,
    }
  }
}

// --- Função Auxiliar para Verificar Dados Relevantes ---
async function checkForRelevantData(supabase: any, leadId: string, email: string): Promise<boolean> {
  try {
    // Verificar diagnósticos
    const { count: diagnosticsCount } = await supabase
      .from("lead_diagnostics")
      .select("*", { count: "exact", head: true })
      .eq("lead_id", leadId)

    // Verificar progresso de sequências ativas
    const { count: activeSequencesCount } = await supabase
      .from("user_sequence_progress")
      .select("*", { count: "exact", head: true })
      .eq("lead_id", leadId)
      .in("status", ["active", "paused"])

    // Verificar e-mails enviados recentemente (últimos 30 dias)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: recentEmailsCount } = await supabase
      .from("sent_emails")
      .select("*", { count: "exact", head: true })
      .eq("recipient_email", email)
      .gte("sent_at", thirtyDaysAgo.toISOString())

    return (diagnosticsCount || 0) > 0 || (activeSequencesCount || 0) > 0 || (recentEmailsCount || 0) > 0
  } catch (e: any) {
    console.error("Erro ao verificar dados relevantes:", e.message)
    return false
  }
}

// --- Server Action para Buscar Leads Pendentes de Migração ---
export async function getPendingMigrationLeads(email?: string): Promise<{
  leads: any[]
  error?: string
}> {
  const supabase = createClient()

  try {
    let query = supabase
      .from("leads")
      .select(`
        *,
        lead_diagnostics(count),
        user_sequence_progress(count)
      `)
      .is("metadata->>migratedToUser", null)

    if (email) {
      query = query.eq("email", email)
    }

    const { data: leads, error } = await query.order("created_at", { ascending: false }).limit(100)

    if (error) throw error

    return { leads: leads || [] }
  } catch (e: any) {
    console.error("Erro ao buscar leads pendentes:", e.message)
    return { leads: [], error: e.message }
  }
}

// --- Server Action para Reverter Migração (se necessário) ---
export async function revertMigration(leadId: string): Promise<{
  success: boolean
  error?: string
  message?: string
}> {
  const supabase = createClient()

  try {
    // Buscar o lead migrado
    const { data: lead, error: leadError } = await supabase.from("leads").select("*").eq("id", leadId).single()

    if (leadError) throw leadError

    if (!lead.metadata?.migratedToUser) {
      return {
        success: false,
        message: "Este lead não foi migrado",
      }
    }

    const userId = lead.metadata.migratedToUserId

    // Reverter progresso de sequências
    const { error: revertProgressError } = await supabase
      .from("user_sequence_progress")
      .update({
        user_id: null,
        lead_id: leadId,
      })
      .eq("user_id", userId)
      .not("metadata->>originalLeadId", "is", null)

    if (revertProgressError) {
      console.warn("Erro ao reverter progresso de sequências:", revertProgressError.message)
    }

    // Remover diagnósticos migrados (opcional - pode ser perigoso)
    // const { error: deleteDiagnosticsError } = await supabase
    //   .from("diagnostics")
    //   .delete()
    //   .eq("user_id", userId)
    //   .eq("metadata->>migratedFromLead", true)

    // Marcar lead como não migrado
    const { error: updateLeadError } = await supabase
      .from("leads")
      .update({
        metadata: {
          ...lead.metadata,
          migratedToUser: false,
          revertedAt: new Date().toISOString(),
        },
      })
      .eq("id", leadId)

    if (updateLeadError) throw updateLeadError

    return {
      success: true,
      message: "Migração revertida com sucesso",
    }
  } catch (e: any) {
    console.error("Erro ao reverter migração:", e.message)
    return {
      success: false,
      error: e.message,
    }
  }
}
