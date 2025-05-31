"use server"

import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"
import { z } from "zod"

// Inicializar Resend com a chave de API
const resend = new Resend(process.env.RESEND_API_KEY)

// --- Tipos de Dados ---
export type EmailTemplate = {
  id: string
  name: string
  subject: string
  html_content: string
  text_content: string | null
  created_at: string
  updated_at: string
}

export type EmailSequence = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type SequenceStep = {
  id: string
  sequence_id: string
  template_id: string
  step_order: number
  delay_days: number
  delay_hours: number
  delay_minutes: number
  created_at: string
  updated_at: string
}

export type SentEmail = {
  id: string
  recipient_email: string
  template_id: string | null
  sequence_id: string | null
  step_id: string | null
  sent_at: string
  status: string
  message_id: string | null
  error_message: string | null
  metadata: Record<string, any> | null
  created_at: string
}

export type UserSequenceProgress = {
  id: string
  user_id: string | null
  lead_id: string | null
  sequence_id: string
  current_step_id: string | null
  next_send_at: string | null
  status: "active" | "completed" | "paused" | "exited"
  started_at: string
  completed_at: string | null
  last_activity_at: string
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

// --- Schemas de Validação (Zod) ---
const createTemplateSchema = z.object({
  name: z.string().min(1, "O nome do template é obrigatório."),
  subject: z.string().min(1, "O assunto do e-mail é obrigatório."),
  html_content: z.string().min(1, "O conteúdo HTML é obrigatório."),
  text_content: z.string().nullable().optional(),
})

const updateTemplateSchema = createTemplateSchema.partial().extend({
  id: z.string().uuid("ID do template inválido."),
})

const createSequenceSchema = z.object({
  name: z.string().min(1, "O nome da sequência é obrigatório."),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
})

const updateSequenceSchema = createSequenceSchema.partial().extend({
  id: z.string().uuid("ID da sequência inválido."),
})

const createStepSchema = z.object({
  sequence_id: z.string().uuid("ID da sequência inválido."),
  template_id: z.string().uuid("ID do template inválido."),
  step_order: z.number().int().positive("A ordem do passo deve ser um número inteiro positivo."),
  delay_days: z.number().int().min(0).default(0),
  delay_hours: z.number().int().min(0).max(23).default(0),
  delay_minutes: z.number().int().min(0).max(59).default(0),
})

const updateStepSchema = createStepSchema.partial().extend({
  id: z.string().uuid("ID do passo inválido."),
})

const sendEmailSchema = z.object({
  to: z.string().email("E-mail do destinatário inválido."),
  from: z.string().email("E-mail do remetente inválido."),
  subject: z.string().min(1, "O assunto do e-mail é obrigatório."),
  html: z.string().min(1, "O conteúdo HTML é obrigatório."),
  text: z.string().optional(),
  templateId: z.string().uuid().optional(),
  sequenceId: z.string().uuid().optional(),
  stepId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
})

const enrollSchema = z
  .object({
    user_id: z.string().uuid().optional(),
    lead_id: z.string().uuid().optional(),
    sequence_id: z.string().uuid("ID da sequência inválido."),
    metadata: z.record(z.any()).optional(),
  })
  .refine((data) => data.user_id || data.lead_id, {
    message: "Deve fornecer user_id ou lead_id",
    path: ["user_id", "lead_id"],
  })

const updateUserProgressSchema = z.object({
  id: z.string().uuid("ID do progresso do usuário inválido."),
  current_step_id: z.string().uuid().nullable().optional(),
  next_send_at: z.string().datetime().nullable().optional(),
  status: z.enum(["active", "completed", "paused", "exited"]).optional(),
  completed_at: z.string().datetime().nullable().optional(),
  last_activity_at: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
})

// --- Server Actions para Email Templates ---
export async function createEmailTemplate(
  templateData: z.infer<typeof createTemplateSchema>,
): Promise<{ template?: EmailTemplate; error?: string }> {
  const supabase = createClient()
  try {
    const validatedData = createTemplateSchema.parse(templateData)
    const { data, error } = await supabase.from("email_templates").insert(validatedData).select().single()

    if (error) throw error
    return { template: data }
  } catch (e: any) {
    console.error("Erro ao criar template de e-mail:", e.message)
    return { error: e.message }
  }
}

export async function getEmailTemplates(): Promise<{ templates: EmailTemplate[]; error?: string }> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase.from("email_templates").select("*").order("name", { ascending: true })
    if (error) throw error
    return { templates: data }
  } catch (e: any) {
    console.error("Erro ao buscar templates de e-mail:", e.message)
    return { templates: [], error: e.message }
  }
}

export async function updateEmailTemplate(
  templateData: z.infer<typeof updateTemplateSchema>,
): Promise<{ template?: EmailTemplate; error?: string }> {
  const supabase = createClient()
  try {
    const validatedData = updateTemplateSchema.parse(templateData)
    const { id, ...updateFields } = validatedData
    const { data, error } = await supabase.from("email_templates").update(updateFields).eq("id", id).select().single()

    if (error) throw error
    return { template: data }
  } catch (e: any) {
    console.error("Erro ao atualizar template de e-mail:", e.message)
    return { error: e.message }
  }
}

export async function deleteEmailTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from("email_templates").delete().eq("id", templateId)
    if (error) throw error
    return { success: true }
  } catch (e: any) {
    console.error("Erro ao deletar template de e-mail:", e.message)
    return { success: false, error: e.message }
  }
}

// --- Server Actions para Email Sequences ---
export async function createEmailSequence(
  sequenceData: z.infer<typeof createSequenceSchema>,
): Promise<{ sequence?: EmailSequence; error?: string }> {
  const supabase = createClient()
  try {
    const validatedData = createSequenceSchema.parse(sequenceData)
    const { data, error } = await supabase.from("email_sequences").insert(validatedData).select().single()

    if (error) throw error
    return { sequence: data }
  } catch (e: any) {
    console.error("Erro ao criar sequência de e-mail:", e.message)
    return { error: e.message }
  }
}

export async function getEmailSequences(): Promise<{ sequences: EmailSequence[]; error?: string }> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase.from("email_sequences").select("*").order("name", { ascending: true })
    if (error) throw error
    return { sequences: data }
  } catch (e: any) {
    console.error("Erro ao buscar sequências de e-mail:", e.message)
    return { sequences: [], error: e.message }
  }
}

export async function updateEmailSequence(
  sequenceData: z.infer<typeof updateSequenceSchema>,
): Promise<{ sequence?: EmailSequence; error?: string }> {
  const supabase = createClient()
  try {
    const validatedData = updateSequenceSchema.parse(sequenceData)
    const { id, ...updateFields } = validatedData
    const { data, error } = await supabase.from("email_sequences").update(updateFields).eq("id", id).select().single()

    if (error) throw error
    return { sequence: data }
  } catch (e: any) {
    console.error("Erro ao atualizar sequência de e-mail:", e.message)
    return { error: e.message }
  }
}

export async function deleteEmailSequence(sequenceId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from("email_sequences").delete().eq("id", sequenceId)
    if (error) throw error
    return { success: true }
  } catch (e: any) {
    console.error("Erro ao deletar sequência de e-mail:", e.message)
    return { success: false, error: e.message }
  }
}

// --- Server Actions para Sequence Steps ---
export async function createSequenceStep(
  stepData: z.infer<typeof createStepSchema>,
): Promise<{ step?: SequenceStep; error?: string }> {
  const supabase = createClient()
  try {
    const validatedData = createStepSchema.parse(stepData)
    const { data, error } = await supabase.from("sequence_steps").insert(validatedData).select().single()

    if (error) throw error
    return { step: data }
  } catch (e: any) {
    console.error("Erro ao criar passo da sequência:", e.message)
    return { error: e.message }
  }
}

export async function getSequenceSteps(sequenceId: string): Promise<{ steps: SequenceStep[]; error?: string }> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("sequence_steps")
      .select("*")
      .eq("sequence_id", sequenceId)
      .order("step_order", { ascending: true })
    if (error) throw error
    return { steps: data }
  } catch (e: any) {
    console.error("Erro ao buscar passos da sequência:", e.message)
    return { steps: [], error: e.message }
  }
}

export async function updateSequenceStep(
  stepData: z.infer<typeof updateStepSchema>,
): Promise<{ step?: SequenceStep; error?: string }> {
  const supabase = createClient()
  try {
    const validatedData = updateStepSchema.parse(stepData)
    const { id, ...updateFields } = validatedData
    const { data, error } = await supabase.from("sequence_steps").update(updateFields).eq("id", id).select().single()

    if (error) throw error
    return { step: data }
  } catch (e: any) {
    console.error("Erro ao atualizar passo da sequência:", e.message)
    return { error: e.message }
  }
}

export async function deleteSequenceStep(stepId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from("sequence_steps").delete().eq("id", stepId)
    if (error) throw error
    return { success: true }
  } catch (e: any) {
    console.error("Erro ao deletar passo da sequência:", e.message)
    return { success: false, error: e.message }
  }
}

// --- Server Actions para User/Lead Sequence Progress ---
export async function enrollInSequence(
  enrollData: z.infer<typeof enrollSchema>,
): Promise<{ progress?: UserSequenceProgress; error?: string }> {
  const supabase = createClient()
  try {
    const validatedData = enrollSchema.parse(enrollData)

    // Verificar se já está inscrito nesta sequência
    let existingQuery = supabase
      .from("user_sequence_progress")
      .select("id")
      .eq("sequence_id", validatedData.sequence_id)

    if (validatedData.user_id) {
      existingQuery = existingQuery.eq("user_id", validatedData.user_id)
    } else {
      existingQuery = existingQuery.eq("lead_id", validatedData.lead_id!)
    }

    const { data: existingProgress, error: checkError } = await existingQuery.single()

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError
    }

    if (existingProgress) {
      return { error: "Usuário/Lead já inscrito nesta sequência." }
    }

    // Obter o primeiro passo da sequência
    const { data: firstStep, error: stepError } = await supabase
      .from("sequence_steps")
      .select("id, delay_days, delay_hours, delay_minutes")
      .eq("sequence_id", validatedData.sequence_id)
      .eq("step_order", 1)
      .single()

    if (stepError || !firstStep) {
      throw new Error("Primeiro passo da sequência não encontrado ou erro ao buscar.")
    }

    // Calcular next_send_at para o primeiro e-mail
    const now = new Date()
    const nextSendAt = new Date(now.getTime())
    nextSendAt.setDate(now.getDate() + firstStep.delay_days)
    nextSendAt.setHours(now.getHours() + firstStep.delay_hours)
    nextSendAt.setMinutes(now.getMinutes() + firstStep.delay_minutes)

    const { data, error } = await supabase
      .from("user_sequence_progress")
      .insert({
        user_id: validatedData.user_id || null,
        lead_id: validatedData.lead_id || null,
        sequence_id: validatedData.sequence_id,
        current_step_id: null,
        next_send_at: nextSendAt.toISOString(),
        status: "active",
        started_at: now.toISOString(),
        last_activity_at: now.toISOString(),
        metadata: validatedData.metadata || {},
      })
      .select()
      .single()

    if (error) throw error
    return { progress: data }
  } catch (e: any) {
    console.error("Erro ao inscrever na sequência:", e.message)
    return { error: e.message }
  }
}

export async function updateUserSequenceProgress(
  progressData: z.infer<typeof updateUserProgressSchema>,
): Promise<{ progress?: UserSequenceProgress; error?: string }> {
  const supabase = createClient()
  try {
    const validatedData = updateUserProgressSchema.parse(progressData)
    const { id, ...updateFields } = validatedData
    const { data, error } = await supabase
      .from("user_sequence_progress")
      .update({ ...updateFields, last_activity_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return { progress: data }
  } catch (e: any) {
    console.error("Erro ao atualizar progresso na sequência:", e.message)
    return { error: e.message }
  }
}

export async function getUsersReadyForNextStep(): Promise<{
  usersProgress: (UserSequenceProgress & {
    sequence_steps: SequenceStep | null
    email_templates: EmailTemplate | null
  })[]
  error?: string
}> {
  const supabase = createClient()
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("user_sequence_progress")
      .select(
        `
        *,
        sequence_steps (
          *,
          email_templates (*)
        )
      `,
      )
      .eq("status", "active")
      .lt("next_send_at", now)
      .order("next_send_at", { ascending: true })

    if (error) throw error

    const filteredData = data.filter(
      (item): item is UserSequenceProgress & { sequence_steps: SequenceStep & { email_templates: EmailTemplate } } =>
        item.sequence_steps !== null && item.sequence_steps.email_templates !== null,
    )

    return { usersProgress: filteredData }
  } catch (e: any) {
    console.error("Erro ao buscar usuários prontos para o próximo passo:", e.message)
    return { usersProgress: [], error: e.message }
  }
}

// --- Server Action Melhorada para Inscrição Baseada em Diagnóstico ---
export async function enrollLeadBasedOnDiagnostic(
  email: string,
  leadType: string,
  diagnosticData?: {
    name?: string
    phone?: string
    company?: string
    answers?: Record<string, any>
    score?: number
    sessionId?: string
    utmParams?: {
      source?: string
      medium?: string
      campaign?: string
      content?: string
      term?: string
    }
  },
): Promise<{ success: boolean; message?: string; leadId?: string; error?: string }> {
  const supabase = createClient()

  try {
    // 1. Criar ou atualizar o lead
    const { createOrUpdateLead } = await import("./lead-management-actions")
    const {
      lead,
      isNew,
      error: leadError,
    } = await createOrUpdateLead({
      email,
      name: diagnosticData?.name,
      phone: diagnosticData?.phone,
      company: diagnosticData?.company,
      source: "diagnostic",
      utm_source: diagnosticData?.utmParams?.source,
      utm_medium: diagnosticData?.utmParams?.medium,
      utm_campaign: diagnosticData?.utmParams?.campaign,
      utm_content: diagnosticData?.utmParams?.content,
      utm_term: diagnosticData?.utmParams?.term,
      metadata: { lastDiagnosticType: leadType },
    })

    if (leadError || !lead) {
      throw new Error(`Erro ao criar/atualizar lead: ${leadError}`)
    }

    // 2. Registrar o diagnóstico
    const { createLeadDiagnostic } = await import("./lead-management-actions")
    const { diagnostic, error: diagnosticError } = await createLeadDiagnostic({
      lead_id: lead.id,
      diagnostic_type: "business_assessment",
      lead_type: leadType,
      score: diagnosticData?.score,
      answers: diagnosticData?.answers,
      session_id: diagnosticData?.sessionId,
    })

    if (diagnosticError) {
      console.warn(`Erro ao registrar diagnóstico: ${diagnosticError}`)
    }

    // 3. Buscar sequência correspondente ao leadType
    const normalizedLeadType = leadType.toLowerCase()
    const { data: sequence, error: sequenceError } = await supabase
      .from("email_sequences")
      .select("id")
      .eq("name", normalizedLeadType)
      .eq("is_active", true)
      .single()

    if (sequenceError && sequenceError.code !== "PGRST116") {
      throw sequenceError
    }

    if (!sequence) {
      console.warn(`Nenhuma sequência ativa encontrada para o leadType: ${leadType}`)
      return {
        success: true,
        message: `Lead ${isNew ? "criado" : "atualizado"} com sucesso, mas nenhuma sequência encontrada para: ${leadType}`,
        leadId: lead.id,
      }
    }

    // 4. Verificar se deve inscrever na sequência
    const { shouldEnrollInSequence } = await import("./lead-management-actions")
    const { shouldEnroll, reason, error: enrollCheckError } = await shouldEnrollInSequence(lead.id, sequence.id)

    if (enrollCheckError) {
      throw new Error(`Erro ao verificar inscrição: ${enrollCheckError}`)
    }

    if (!shouldEnroll) {
      return {
        success: true,
        message: `Lead processado, mas não inscrito na sequência: ${reason}`,
        leadId: lead.id,
      }
    }

    // 5. Inscrever na sequência
    const { progress, error: enrollError } = await enrollInSequence({
      lead_id: lead.id,
      sequence_id: sequence.id,
      metadata: {
        leadType,
        diagnosticId: diagnostic?.id,
        enrollmentReason: reason,
      },
    })

    if (enrollError) {
      throw new Error(`Falha ao inscrever na sequência: ${enrollError}`)
    }

    return {
      success: true,
      message: `Lead ${isNew ? "criado" : "atualizado"} e inscrito na sequência ${normalizedLeadType} com sucesso!`,
      leadId: lead.id,
    }
  } catch (e: any) {
    console.error("Erro ao processar lead baseado em diagnóstico:", e.message)
    return { success: false, error: e.message }
  }
}

// --- Server Action para Envio de E-mail (via Resend) e Registro ---
export async function sendEmailAndRecord(
  emailData: z.infer<typeof sendEmailSchema>,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const supabase = createClient()
  let messageId: string | null = null
  let sendStatus = "failed"
  let errorMessage: string | null = null

  try {
    const validatedData = sendEmailSchema.parse(emailData)
    const { to, from, subject, html, text, templateId, sequenceId, stepId, metadata } = validatedData

    // Enviar e-mail via Resend
    const { data, error: resendError } = await resend.emails.send({
      from: from,
      to: to,
      subject: subject,
      html: html,
      text: text || undefined,
    })

    if (resendError) {
      errorMessage = resendError.message
      throw new Error(`Erro ao enviar e-mail via Resend: ${resendError.message}`)
    }

    messageId = data?.id || null
    sendStatus = "sent"

    return { success: true, messageId: messageId || undefined }
  } catch (e: any) {
    errorMessage = e.message
    console.error("Erro no processo de envio de e-mail:", e.message)
    return { success: false, error: e.message }
  } finally {
    try {
      const { error: recordError } = await supabase.from("sent_emails").insert({
        recipient_email: emailData.to,
        template_id: emailData.templateId || null,
        sequence_id: emailData.sequenceId || null,
        step_id: emailData.stepId || null,
        status: sendStatus,
        message_id: messageId,
        error_message: errorMessage,
        metadata: emailData.metadata || {},
      })

      if (recordError) {
        console.error("Erro ao registrar e-mail enviado no DB:", recordError.message)
      }
    } catch (e: any) {
      console.error("Erro inesperado ao registrar e-mail enviado:", e.message)
    }
  }
}
