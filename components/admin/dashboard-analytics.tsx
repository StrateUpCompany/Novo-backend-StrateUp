import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { getDashboardAnalyticsData, debugDiagnosticsSchema } from "@/app/actions/analytics-actions"

export default async function DashboardAnalytics() {
  const debugSchema = await debugDiagnosticsSchema() // Chame a função de depuração
  const { totalPageViews, uniqueVisitors, totalDiagnosticsCompleted, leadTypeDistribution, popularPages, error } =
    await getDashboardAnalyticsData()

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <h2 className="text-xl font-bold">Erro ao carregar dados do Dashboard:</h2>
        <p>{error}</p>
        <p>Por favor, verifique os logs do servidor e as permissões do Supabase.</p>
      </div>
    )
  }
  debugSchema && (
    <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg mb-4">
      <h3 className="font-bold">DEBUG: Verificação de Esquema da Tabela 'diagnostics'</h3>
      <p>Status: {debugSchema.success ? "Sucesso" : "Falha"}</p>
      <p>Mensagem: {debugSchema.message}</p>
      {debugSchema.columns.length > 0 && <p>Colunas detectadas: {debugSchema.columns.join(", ")}</p>}
      {debugSchema.success === false && debugSchema.message.includes("column") && (
        <p className="text-red-800 font-semibold">
          Atenção: O erro de coluna ainda pode estar relacionado a uma conexão incorreta ou cache profundo.
        </p>
      )}
    </div>
  )

  // Formatar dados para o gráfico de distribuição de leads
  const leadChartData = leadTypeDistribution.map((item) => ({
    name: item.leadType,
    count: item.count,
  }))

  // Formatar dados para o gráfico de páginas populares
  const popularPagesChartData = popularPages.map((item) => ({
    name: item.path,
    views: item.count,
  }))

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Visualizações de Página</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPageViews.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Total de visualizações em todas as páginas.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Visitantes Únicos</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{uniqueVisitors.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Visitantes únicos baseados em sessão.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Diagnósticos Concluídos</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDiagnosticsCompleted.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Total de formulários de diagnóstico enviados.</p>
        </CardContent>
      </Card>

      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Distribuição de Tipos de Lead</CardTitle>
          <CardDescription>Os tipos de lead mais comuns gerados pelos diagnósticos.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: {
                label: "Contagem",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Páginas Mais Populares</CardTitle>
          <CardDescription>As 5 páginas mais visitadas do site.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              views: {
                label: "Visualizações",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={popularPagesChartData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="views" fill="var(--color-views)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
