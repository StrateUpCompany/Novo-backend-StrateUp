"use server"

import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

// --- Tipos de Dados ---
export type MigrationMetrics = {
  totalMigrations: number
  successfulMigrations: number
  failedMigrations: number
  pendingLeads: number
  migrationsToday: number
  migrationsThisWeek: number
  migrationsThisMonth: number
  averageMigrationTime: number
  topSources: Array<{ source: string; count: number }>
  migrationsByDay: Array<{ date: string; count: number }>
  dataTypeMigrations: {
    diagnostics: number
    sequences: number
    emails: number
  }
}

export type MigrationReport = {
  id: string
  lead_id: string
  user_id: string
  migration_date: string
  migration_status: "success" | "failed" | "partial"
  data_migrated: {
    diagnostics: number
    sequences: number
    emails: number
  }
  migration_time_ms: number
  error_message?: string
  lead_source?: string
  lead_email: string
  user_email: string
  created_at: string
}

export type DetailedMigrationStats = {
  migrationTrends: Array<{
    period: string
    migrations: number
    success_rate: number
  }>
  sourceAnalysis: Array<{
    source: string
    total_leads: number
    migrated_leads: number
    migration_rate: number
    avg_time_to_migrate_days: number
  }>
  performanceMetrics: {
    fastest_migration_ms: number
    slowest_migration_ms: number
    average_migration_ms: number
    median_migration_ms: number
  }
  errorAnalysis: Array<{
    error_type: string
    count: number
    percentage: number
  }>
}

// --- Schemas de Validação ---
const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(["day", "week", "month", "quarter", "year"]).default("month"),
})

const migrationReportSchema = z.object({
  lead_id: z.string().uuid(),
  user_id: z.string().uuid(),
  migration_status: z.enum(["success", "failed", "partial"]),
  data_migrated: z.object({
    diagnostics: z.number().default(0),
    sequences: z.number().default(0),
    emails: z.number().default(0),
  }),
  migration_time_ms: z.number(),
  error_message: z.string().optional(),
  lead_source: z.string().optional(),
  lead_email: z.string().email(),
  user_email: z.string().email(),
})

// --- Server Action para Registrar Migração ---
export async function recordMigrationReport(
  reportData: z.infer<typeof migrationReportSchema>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const validatedData = migrationReportSchema.parse(reportData)

    const { error } = await supabase.from("migration_reports").insert({
      ...validatedData,
      migration_date: new Date().toISOString(),
    })

    if (error) throw error
    return { success: true }
  } catch (e: any) {
    console.error("Erro ao registrar relatório de migração:", e.message)
    return { success: false, error: e.message }
  }
}

// --- Server Action para Obter Métricas Gerais ---
export async function getMigrationMetrics(
  dateRange?: z.infer<typeof dateRangeSchema>,
): Promise<{ metrics?: MigrationMetrics; error?: string }> {
  const supabase = createClient()

  try {
    const validatedRange = dateRange ? dateRangeSchema.parse(dateRange) : { period: "month" as const }
    const now = new Date()
    const startDate = getStartDate(now, validatedRange.period)

    // Total de migrações
    const { count: totalMigrations } = await supabase
      .from("migration_reports")
      .select("*", { count: "exact", head: true })

    // Migrações bem-sucedidas
    const { count: successfulMigrations } = await supabase
      .from("migration_reports")
      .select("*", { count: "exact", head: true })
      .eq("migration_status", "success")

    // Migrações falhadas
    const { count: failedMigrations } = await supabase
      .from("migration_reports")
      .select("*", { count: "exact", head: true })
      .eq("migration_status", "failed")

    // Leads pendentes
    const { count: pendingLeads } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .is("metadata->>migratedToUser", null)

    // Migrações hoje
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: migrationsToday } = await supabase
      .from("migration_reports")
      .select("*", { count: "exact", head: true })
      .gte("migration_date", today.toISOString())

    // Migrações esta semana
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const { count: migrationsThisWeek } = await supabase
      .from("migration_reports")
      .select("*", { count: "exact", head: true })
      .gte("migration_date", weekStart.toISOString())

    // Migrações este mês
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const { count: migrationsThisMonth } = await supabase
      .from("migration_reports")
      .select("*", { count: "exact", head: true })
      .gte("migration_date", monthStart.toISOString())

    // Tempo médio de migração
    const { data: avgTimeData } = await supabase
      .from("migration_reports")
      .select("migration_time_ms")
      .eq("migration_status", "success")

    const averageMigrationTime =
      avgTimeData && avgTimeData.length > 0
        ? avgTimeData.reduce((sum, item) => sum + item.migration_time_ms, 0) / avgTimeData.length
        : 0

    // Top fontes de leads
    const { data: sourcesData } = await supabase
      .from("migration_reports")
      .select("lead_source")
      .not("lead_source", "is", null)

    const sourceCounts = sourcesData?.reduce(
      (acc, item) => {
        acc[item.lead_source] = (acc[item.lead_source] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const topSources = Object.entries(sourceCounts || {})
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Migrações por dia (últimos 30 dias)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: dailyMigrations } = await supabase
      .from("migration_reports")
      .select("migration_date")
      .gte("migration_date", thirtyDaysAgo.toISOString())
      .order("migration_date", { ascending: true })

    const migrationsByDay = generateDailyStats(dailyMigrations || [], thirtyDaysAgo, now)

    // Tipos de dados migrados
    const { data: dataTypesData } = await supabase
      .from("migration_reports")
      .select("data_migrated")
      .eq("migration_status", "success")

    const dataTypeMigrations = dataTypesData?.reduce(
      (acc, item) => {
        acc.diagnostics += item.data_migrated.diagnostics || 0
        acc.sequences += item.data_migrated.sequences || 0
        acc.emails += item.data_migrated.emails || 0
        return acc
      },
      { diagnostics: 0, sequences: 0, emails: 0 },
    ) || { diagnostics: 0, sequences: 0, emails: 0 }

    const metrics: MigrationMetrics = {
      totalMigrations: totalMigrations || 0,
      successfulMigrations: successfulMigrations || 0,
      failedMigrations: failedMigrations || 0,
      pendingLeads: pendingLeads || 0,
      migrationsToday: migrationsToday || 0,
      migrationsThisWeek: migrationsThisWeek || 0,
      migrationsThisMonth: migrationsThisMonth || 0,
      averageMigrationTime,
      topSources,
      migrationsByDay,
      dataTypeMigrations,
    }

    return { metrics }
  } catch (e: any) {
    console.error("Erro ao obter métricas de migração:", e.message)
    return { error: e.message }
  }
}

// --- Server Action para Relatórios Detalhados ---
export async function getDetailedMigrationStats(
  dateRange?: z.infer<typeof dateRangeSchema>,
): Promise<{ stats?: DetailedMigrationStats; error?: string }> {
  const supabase = createClient()

  try {
    const validatedRange = dateRange ? dateRangeSchema.parse(dateRange) : { period: "month" as const }

    // Tendências de migração
    const { data: trendsData } = await supabase
      .from("migration_reports")
      .select("migration_date, migration_status")
      .order("migration_date", { ascending: true })

    const migrationTrends = generateTrendStats(trendsData || [], validatedRange.period)

    // Análise por fonte
    const { data: sourceData } = await supabase.rpc("get_migration_source_analysis")

    const sourceAnalysis = sourceData || []

    // Métricas de performance
    const { data: performanceData } = await supabase
      .from("migration_reports")
      .select("migration_time_ms")
      .eq("migration_status", "success")
      .order("migration_time_ms", { ascending: true })

    const times = performanceData?.map((item) => item.migration_time_ms) || []
    const performanceMetrics = {
      fastest_migration_ms: times.length > 0 ? Math.min(...times) : 0,
      slowest_migration_ms: times.length > 0 ? Math.max(...times) : 0,
      average_migration_ms: times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0,
      median_migration_ms: times.length > 0 ? times[Math.floor(times.length / 2)] : 0,
    }

    // Análise de erros
    const { data: errorData } = await supabase
      .from("migration_reports")
      .select("error_message")
      .eq("migration_status", "failed")
      .not("error_message", "is", null)

    const errorCounts = errorData?.reduce(
      (acc, item) => {
        const errorType = categorizeError(item.error_message)
        acc[errorType] = (acc[errorType] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const totalErrors = Object.values(errorCounts || {}).reduce((sum, count) => sum + count, 0)
    const errorAnalysis = Object.entries(errorCounts || {}).map(([error_type, count]) => ({
      error_type,
      count,
      percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0,
    }))

    const stats: DetailedMigrationStats = {
      migrationTrends,
      sourceAnalysis,
      performanceMetrics,
      errorAnalysis,
    }

    return { stats }
  } catch (e: any) {
    console.error("Erro ao obter estatísticas detalhadas:", e.message)
    return { error: e.message }
  }
}

// --- Server Action para Obter Relatórios de Migração ---
export async function getMigrationReports(filters?: {
  status?: "success" | "failed" | "partial"
  source?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}): Promise<{ reports: MigrationReport[]; total: number; error?: string }> {
  const supabase = createClient()

  try {
    let query = supabase.from("migration_reports").select("*", { count: "exact" })

    if (filters?.status) {
      query = query.eq("migration_status", filters.status)
    }

    if (filters?.source) {
      query = query.eq("lead_source", filters.source)
    }

    if (filters?.startDate) {
      query = query.gte("migration_date", filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte("migration_date", filters.endDate)
    }

    query = query.order("migration_date", { ascending: false })

    if (filters?.limit) {
      const offset = filters.offset || 0
      query = query.range(offset, offset + filters.limit - 1)
    }

    const { data: reports, error, count } = await query

    if (error) throw error

    return {
      reports: reports || [],
      total: count || 0,
    }
  } catch (e: any) {
    console.error("Erro ao obter relatórios de migração:", e.message)
    return {
      reports: [],
      total: 0,
      error: e.message,
    }
  }
}

// --- Funções Auxiliares ---
function getStartDate(now: Date, period: "day" | "week" | "month" | "quarter" | "year"): Date {
  const date = new Date(now)
  switch (period) {
    case "day":
      date.setHours(0, 0, 0, 0)
      break
    case "week":
      date.setDate(date.getDate() - date.getDay())
      date.setHours(0, 0, 0, 0)
      break
    case "month":
      date.setDate(1)
      date.setHours(0, 0, 0, 0)
      break
    case "quarter":
      const quarter = Math.floor(date.getMonth() / 3)
      date.setMonth(quarter * 3, 1)
      date.setHours(0, 0, 0, 0)
      break
    case "year":
      date.setMonth(0, 1)
      date.setHours(0, 0, 0, 0)
      break
  }
  return date
}

function generateDailyStats(
  migrations: Array<{ migration_date: string }>,
  startDate: Date,
  endDate: Date,
): Array<{ date: string; count: number }> {
  const stats: Array<{ date: string; count: number }> = []
  const current = new Date(startDate)

  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0]
    const count = migrations.filter((m) => m.migration_date.startsWith(dateStr)).length
    stats.push({ date: dateStr, count })
    current.setDate(current.getDate() + 1)
  }

  return stats
}

function generateTrendStats(
  data: Array<{ migration_date: string; migration_status: string }>,
  period: "day" | "week" | "month" | "quarter" | "year",
): Array<{ period: string; migrations: number; success_rate: number }> {
  // Implementação simplificada - pode ser expandida
  const grouped = data.reduce(
    (acc, item) => {
      const date = new Date(item.migration_date)
      let key: string

      switch (period) {
        case "day":
          key = date.toISOString().split("T")[0]
          break
        case "week":
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split("T")[0]
          break
        case "month":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          break
        default:
          key = date.getFullYear().toString()
      }

      if (!acc[key]) {
        acc[key] = { total: 0, successful: 0 }
      }

      acc[key].total++
      if (item.migration_status === "success") {
        acc[key].successful++
      }

      return acc
    },
    {} as Record<string, { total: number; successful: number }>,
  )

  return Object.entries(grouped).map(([period, stats]) => ({
    period,
    migrations: stats.total,
    success_rate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
  }))
}

function categorizeError(errorMessage: string): string {
  if (errorMessage.includes("email")) return "Email Error"
  if (errorMessage.includes("database")) return "Database Error"
  if (errorMessage.includes("validation")) return "Validation Error"
  if (errorMessage.includes("permission")) return "Permission Error"
  if (errorMessage.includes("timeout")) return "Timeout Error"
  return "Other Error"
}
