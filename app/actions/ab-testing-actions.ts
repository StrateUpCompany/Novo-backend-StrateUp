"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export interface ABTestVariant {
  id: string
  test_name: string
  variant_name: string
  traffic_percentage: number
  is_control: boolean
  is_active: boolean
}

export interface ABTestAssignment {
  id: string
  session_id: string
  test_name: string
  variant_name: string
  assigned_at: string
}

export async function getOrAssignVariant(
  testName: string,
  sessionId: string,
): Promise<{
  variant: string | null
  error: string | null
}> {
  const supabase = createClient()

  try {
    // 1. Verificar se já existe uma atribuição para esta sessão e teste
    const { data: existingAssignment, error: assignmentError } = await supabase
      .from("ab_test_assignments")
      .select("variant_name")
      .eq("session_id", sessionId)
      .eq("test_name", testName)
      .single()

    if (assignmentError && assignmentError.code !== "PGRST116") {
      // PGRST116 = "The result contains 0 rows" (não encontrado)
      throw assignmentError
    }

    if (existingAssignment) {
      // Usuário já tem uma variante atribuída
      return { variant: existingAssignment.variant_name, error: null }
    }

    // 2. Buscar variantes ativas para este teste
    const { data: variants, error: variantsError } = await supabase
      .from("ab_test_variants")
      .select("*")
      .eq("test_name", testName)
      .eq("is_active", true)
      .order("traffic_percentage", { ascending: false })

    if (variantsError) throw variantsError

    if (!variants || variants.length === 0) {
      return { variant: null, error: `Nenhuma variante ativa encontrada para o teste: ${testName}` }
    }

    // 3. Selecionar uma variante baseada na porcentagem de tráfego
    const randomValue = Math.random() * 100
    let cumulativePercentage = 0
    let selectedVariant: ABTestVariant | null = null

    for (const variant of variants) {
      cumulativePercentage += variant.traffic_percentage
      if (randomValue <= cumulativePercentage) {
        selectedVariant = variant
        break
      }
    }

    // Se nenhuma variante foi selecionada (pode acontecer se as porcentagens não somam 100%), usar a primeira
    if (!selectedVariant) {
      selectedVariant = variants[0]
    }

    // 4. Salvar a atribuição no banco de dados
    const { error: insertError } = await supabase.from("ab_test_assignments").insert({
      session_id: sessionId,
      test_name: testName,
      variant_name: selectedVariant.variant_name,
    })

    if (insertError) throw insertError

    return { variant: selectedVariant.variant_name, error: null }
  } catch (error: any) {
    console.error("Erro ao obter/atribuir variante:", error.message)
    return { variant: null, error: error.message }
  }
}

export async function recordABTestEvent(
  testName: string,
  variantName: string,
  eventType: "impression" | "conversion",
  sessionId: string,
  additionalData?: Record<string, any>,
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("analytics_events").insert({
      event_type: "ab_test",
      event_name: `${testName}_${eventType}`,
      session_id: sessionId,
      properties: {
        test_name: testName,
        variant_name: variantName,
        event_type: eventType,
        ...additionalData,
      },
    })

    if (error) throw error

    return { success: true, error: null }
  } catch (error: any) {
    console.error("Erro ao registrar evento de A/B testing:", error.message)
    return { success: false, error: error.message }
  }
}

export async function setABTestVariantCookie(testName: string, variantName: string) {
  const cookieStore = cookies()
  const cookieName = `ab_test_${testName}`

  // Define o cookie com duração de 30 dias
  cookieStore.set(cookieName, variantName, {
    maxAge: 30 * 24 * 60 * 60, // 30 dias em segundos
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  })
}

export async function getABTestVariantFromCookie(testName: string): Promise<string | null> {
  const cookieStore = cookies()
  const cookieName = `ab_test_${testName}`
  const cookie = cookieStore.get(cookieName)

  return cookie?.value || null
}
