"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getMigrationMetrics, getDetailedMigrationStats } from "@/app/actions/migration-analytics-actions"
import type { MigrationMetrics, DetailedMigrationStats } from "@/app/actions/migration-analytics-actions"
import {
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { Users, CheckCircle, Clock, AlertTriangle, Activity, Mail, FileText, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function MigrationMetricsDashboard() {
  const [metrics, setMetrics] = useState<MigrationMetrics | null>(null)
  const [detailedStats, setDetailedStats] = useState<DetailedMigrationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<"day" | "week" | "month" | "quarter" | "year">("month")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadMetrics()
  }, [period])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const [metricsResult, statsResult] = await Promise.all([
        getMigrationMetrics({ period }),
        getDetailedMigrationStats({ period }),
      ])

      if (metricsResult.error) {
        toast.error(`Erro ao carregar métricas: ${metricsResult.error}`)
      } else {
        setMetrics(metricsResult.metrics || null)
      }

      if (statsResult.error) {
        toast.error(`Erro ao carregar estatísticas: ${statsResult.error}`)
      } else {
        setDetailedStats(statsResult.stats || null)
      }
    } catch (error: any) {
      toast.error(`Erro inesperado: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadMetrics()
    setRefreshing(false)
    toast.success("Métricas atualizadas!")
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}min`
  }

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`

  const successRate = metrics
    ? metrics.totalMigrations > 0
      ? (metrics.successfulMigrations / metrics.totalMigrations) * 100
      : 0
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando métricas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Métricas de Migração</h2>
          <p className="text-muted-foreground">Análise completa do processo de migração de leads</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dia</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Migrações</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalMigrations || 0}</div>
            <p className="text-xs text-muted-foreground">{metrics?.migrationsToday || 0} hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPercentage(successRate)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.successfulMigrations || 0} de {metrics?.totalMigrations || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Pendentes</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics?.pendingLeads || 0}</div>
            <p className="text-xs text-muted-foreground">Aguardando migração</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatTime(metrics?.averageMigrationTime || 0)}</div>
            <p className="text-xs text-muted-foreground">Por migração</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de tendências */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Migrações por dia */}
        <Card>
          <CardHeader>
            <CardTitle>Migrações por Dia (Últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics?.migrationsByDay || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                  }
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString("pt-BR")}
                  formatter={(value) => [value, "Migrações"]}
                />
                <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de tipos de dados */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Dados Migrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics?.dataTypeMigrations.diagnostics || 0}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <FileText className="h-3 w-3" />
                  Diagnósticos
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics?.dataTypeMigrations.sequences || 0}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Activity className="h-3 w-3" />
                  Sequências
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{metrics?.dataTypeMigrations.emails || 0}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Mail className="h-3 w-3" />
                  E-mails
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Diagnósticos", value: metrics?.dataTypeMigrations.diagnostics || 0 },
                    { name: "Sequências", value: metrics?.dataTypeMigrations.sequences || 0 },
                    { name: "E-mails", value: metrics?.dataTypeMigrations.emails || 0 },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análise de fontes e performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top fontes de leads */}
        <Card>
          <CardHeader>
            <CardTitle>Principais Fontes de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.topSources.map((source, index) => (
                <div key={source.source} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="font-medium">{source.source}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{source.count}</div>
                    <div className="text-xs text-muted-foreground">migrações</div>
                  </div>
                </div>
              )) || <p className="text-muted-foreground">Nenhum dado disponível</p>}
            </div>
          </CardContent>
        </Card>

        {/* Métricas de performance */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Migração mais rápida:</span>
                <span className="font-bold text-green-600">
                  {formatTime(detailedStats?.performanceMetrics.fastest_migration_ms || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Migração mais lenta:</span>
                <span className="font-bold text-red-600">
                  {formatTime(detailedStats?.performanceMetrics.slowest_migration_ms || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tempo médio:</span>
                <span className="font-bold text-blue-600">
                  {formatTime(detailedStats?.performanceMetrics.average_migration_ms || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tempo mediano:</span>
                <span className="font-bold">
                  {formatTime(detailedStats?.performanceMetrics.median_migration_ms || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise de erros */}
      {detailedStats?.errorAnalysis && detailedStats.errorAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Análise de Erros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {detailedStats.errorAnalysis.map((error, index) => (
                <div key={error.error_type} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{error.error_type}</span>
                    <Badge variant="destructive">{error.count}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{formatPercentage(error.percentage)} dos erros</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tendências de migração */}
      {detailedStats?.migrationTrends && detailedStats.migrationTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tendências de Migração</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={detailedStats.migrationTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="migrations" fill="#8884d8" name="Migrações" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="success_rate"
                  stroke="#82ca9d"
                  name="Taxa de Sucesso (%)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
