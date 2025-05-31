"use server"

import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

// --- Tipos de Dados ---
export type Lead = {
  id: string
  email: string
  name: string | null
  phone: string | null
  company: string | null
  source: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export type LeadDiagnostic = {
  id: string
  lead_id: string
  diagnostic_type: string
  lead_type: string
  score: number | null
  answers: Record<string, any> | null
  session_id: string | null
  created_at: string
}

// --- Schemas de Validação ---
const createLeadSchema = z.object({
  email: z.string().email("E-mail inválido"),
  name: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().default("diagnostic"),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  metadata: z.record(z.any()).default({}),
})

const createDiagnosticSchema = z.object({
  lead_id: z.string().uuid("ID do lead inválido"),
  diagnostic_type: z.string().min(1, "Tipo de diagnóstico é obrigatório"),
  lead_type: z.string().min(1, "Tipo de lead é obrigatório"),
  score: z.number().optional(),
  answers: z.record(z.any()).optional(),
  session_id: z.string().optional(),
})

// --- Server Actions para Leads ---
export async function createOrUpdateLead(
  leadData: z.infer<typeof createLeadSchema>,
): Promise<{ lead?: Lead; isNew: boolean; error?: string }> {
  const supabase = createClient()
  try {
    const validatedData = createLeadSchema.parse(leadData)

    // Tentar encontrar um lead existente pelo e-mail
    const { data: existingLead, error: findError } = await supabase
      .from("leads")
      .select("*")
      .eq("email", validatedData.email)
      .single()

    if (findError && findError.code !== "PGRST116") {
      throw findError
    }

    if (existingLead) {
      // Lead existe, atualizar com novos dados (se fornecidos)
      const updateData = {
        name: validatedData.name || existingLead.name,
        phone: validatedData.phone || existingLead.phone,
        company: validatedData.company || existingLead.company,
        source: validatedData.source || existingLead.source,
        utm_source: validatedData.utm_source || existingLead.utm_source,
        utm_medium: validatedData.utm_medium || existingLead.utm_medium,
        utm_campaign: validatedData.utm_campaign || existingLead.utm_campaign,
        utm_content: validatedData.utm_content || existingLead.utm_content,
        utm_term: validatedData.utm_term || existingLead.utm_term,
        ip_address: validatedData.ip_address || existingLead.ip_address,
        user_agent: validatedData.user_agent || existingLead.user_agent,
        metadata: { ...existingLead.metadata, ...validatedData.metadata },
      }

      const { data: updatedLead, error: updateError } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", existingLead.id)
        .select()
        .single()

      if (updateError) throw updateError
      return { lead: updatedLead, isNew: false }
    } else {
      // Lead não existe, criar novo
      const { data: newLead, error: createError } = await supabase.from("leads").insert(validatedData).select().single()

      if (createError) throw createError
      return { lead: newLead, isNew: true }
    }
  } catch (e: any) {
    console.error("Erro ao criar/atualizar lead:", e.message)
    return { isNew: false, error: e.message }
  }
}

export async function createLeadDiagnostic(
  diagnosticData: z.infer<typeof createDiagnosticSchema>,
): Promise<{ diagnostic?: LeadDiagnostic; error?: string }> {
  const supabase = createClient()
  try {
    const validatedData = createDiagnosticSchema.parse(diagnosticData)
    const { data, error } = await supabase.from("lead_diagnostics").insert(validatedData).select().single()

    if (error) throw error
    return { diagnostic: data }
  } catch (e: any) {
    console.error("Erro ao criar diagnóstico do lead:", e.message)
    return { error: e.message }
  }
}

export async function getLeadDiagnostics(leadId: string): Promise<{ diagnostics: LeadDiagnostic[]; error?: string }> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("lead_diagnostics")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return { diagnostics: data || [] }
  } catch (e: any) {
    console.error("Erro ao buscar diagnósticos do lead:", e.message)
    return { diagnostics: [], error: e.message }
  }
}

export async function getLeadByEmail(email: string): Promise<{ lead?: Lead; error?: string }> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase.from("leads").select("*").eq("email", email).single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return { lead: data || undefined }
  } catch (e: any) {
    console.error("Erro ao buscar lead por e-mail:", e.message)
    return { error: e.message }
  }
}

// --- Função para determinar se deve inscrever em nova sequência ---
export async function shouldEnrollInSequence(
  leadId: string,
  sequenceId: string,
): Promise<{ shouldEnroll: boolean; reason?: string; error?: string }> {
  const supabase = createClient()
  try {
    // Verificar se o lead já está inscrito nesta sequência
    const { data: existingProgress, error: progressError } = await supabase
      .from("user_sequence_progress")
      .select("status")
      .eq("lead_id", leadId)
      .eq("sequence_id", sequenceId)
      .single()

    if (progressError && progressError.code !== "PGRST116") {
      throw progressError
    }

    if (existingProgress) {
      if (existingProgress.status === "active") {
        return { shouldEnroll: false, reason: "Lead já está ativo nesta sequência" }
      } else if (existingProgress.status === "completed") {
        return { shouldEnroll: false, reason: "Lead já completou esta sequência" }
      } else if (existingProgress.status === "paused") {
        // Pode reativar se estava pausado
        return { shouldEnroll: true, reason: "Reativando sequência pausada" }
      }
    }

    return { shouldEnroll: true, reason: "Nova inscrição" }
  } catch (e: any) {
    console.error("Erro ao verificar se deve inscrever na sequência:", e.message)
    return { shouldEnroll: false, error: e.message }
  }
}
