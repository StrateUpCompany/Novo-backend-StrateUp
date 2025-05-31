"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function debugDiagnosticsSchema() {
  const supabase = createClient()
  try {
    const { data, error } = await supabase.from("diagnostics").select("*").limit(1)

    if (error) {
      console.error("DEBUG: Erro ao buscar dados de diagnostics para depuração:", error.message)
      return { success: false, message: `Erro ao buscar dados: ${error.message}`, columns: [] }
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0])
      console.log("DEBUG: Colunas encontradas na tabela diagnostics:", columns)
      return { success: true, message: "Colunas encontradas com sucesso.", columns: columns }
    } else {
      console.log("DEBUG: Tabela diagnostics vazia ou sem dados para inspecionar colunas.")
      return {
        success: true,
        message: "Tabela diagnostics vazia, não foi possível inspecionar colunas de uma linha.",
        columns: [],
      }
    }
  } catch (e: any) {
    console.error("DEBUG: Erro inesperado na função debugDiagnosticsSchema:", e.message)
    return { success: false, message: `Erro inesperado: ${e.message}`, columns: [] }
  }
}

export async function getDashboardAnalyticsData() {
  const supabase = createClient()

  try {
    revalidatePath("/")

    // 1. Total de Visualizações de Página
    const { count: totalPageViews, error: pageViewsError } = await supabase
      .from("page_views")
      .select("*", { count: "exact", head: true })

    if (pageViewsError) throw pageViewsError

    // 2. Visitantes Únicos (baseado em session_id)
    const { data: sessionIdsData, error: uniqueVisitorsError } = await supabase.from("page_views").select("session_id")

    if (uniqueVisitorsError) throw uniqueVisitorsError

    const uniqueVisitors = new Set(sessionIdsData?.map((item: { session_id: string }) => item.session_id)).size || 0

    // 3. Total de Diagnósticos Concluídos
    const { count: totalDiagnosticsCompleted, error: diagnosticsError } = await supabase
      .from("diagnostics")
      .select("*", { count: "exact", head: true })

    if (diagnosticsError) throw diagnosticsError

    // 4. Distribuição de Tipos de Lead (CORRIGIDO: leadtype em minúsculo)
    const { data: leadTypeRawData, error: leadTypeDistributionError } = await supabase
      .from("diagnostics")
      .select("leadtype") // ✅ CORRIGIDO: Agora usa "leadtype" (minúsculo)

    if (leadTypeDistributionError) throw leadTypeDistributionError

    const distributionMap = new Map<string, number>()
    leadTypeRawData?.forEach((item: { leadtype: string }) => {
      // ✅ CORRIGIDO: leadtype minúsculo
      distributionMap.set(item.leadtype, (distributionMap.get(item.leadtype) || 0) + 1)
    })
    const leadTypeDistribution = Array.from(distributionMap.entries()).map(([leadType, count]) => ({ leadType, count }))

    // 5. Páginas Mais Populares (Top 5)
    const { data: popularPagesRawData, error: popularPagesError } = await supabase.from("page_views").select("path")

    if (popularPagesError) throw popularPagesError

    const pageViewsMap = new Map<string, number>()
    popularPagesRawData?.forEach((item: { path: string }) => {
      pageViewsMap.set(item.path, (pageViewsMap.get(item.path) || 0) + 1)
    })
    const popularPages = Array.from(pageViewsMap.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalPageViews: totalPageViews || 0,
      uniqueVisitors: uniqueVisitors,
      totalDiagnosticsCompleted: totalDiagnosticsCompleted || 0,
      leadTypeDistribution: leadTypeDistribution || [],
      popularPages: popularPages || [],
      error: null,
    }
  } catch (error: any) {
    console.error("Erro ao buscar dados do dashboard:", error.message)
    return {
      totalPageViews: 0,
      uniqueVisitors: 0,
      totalDiagnosticsCompleted: 0,
      leadTypeDistribution: [],
      popularPages: [],
      error: error.message || "Erro desconhecido ao buscar dados do dashboard.",
    }
  }
}

export async function recordPageView(
  path: string,
  referrer: string | null,
  userAgent: string | null,
  sessionId: string | null,
) {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("page_views").insert({
      path,
      referrer,
      user_agent: userAgent,
      session_id: sessionId,
    })

    if (error) {
      console.error("Erro ao registrar visualização de página:", error.message)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error("Erro inesperado ao registrar visualização de página:", error.message)
    return { success: false, error: error.message }
  }
}
