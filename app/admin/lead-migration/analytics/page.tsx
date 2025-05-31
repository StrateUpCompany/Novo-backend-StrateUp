"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import MigrationMetricsDashboard from "@/components/migration/metrics-dashboard"
import MigrationReportsTable from "@/components/migration/migration-reports-table"
import { BarChart3, FileText, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function MigrationAnalyticsPage() {
  const [activeTab, setActiveTab] = useState("dashboard")

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/lead-migration">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Migração
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-2">Analytics de Migração de Leads</h1>
        <p className="text-muted-foreground">
          Análise completa e relatórios detalhados do processo de migração de leads para usuários
        </p>
      </div>

      {/* Tabs de navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard de Métricas
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Relatórios Detalhados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <MigrationMetricsDashboard />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <MigrationReportsTable />
        </TabsContent>
      </Tabs>

      {/* Informações adicionais */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Sobre as Métricas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Dashboard de Métricas</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Visão geral das migrações realizadas</li>
                <li>• Taxa de sucesso e tempo médio de migração</li>
                <li>• Análise de tendências e padrões</li>
                <li>• Identificação de fontes mais produtivas</li>
                <li>• Métricas de performance detalhadas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Relatórios Detalhados</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Histórico completo de todas as migrações</li>
                <li>• Filtros avançados por status, data e fonte</li>
                <li>• Detalhes de erros e problemas encontrados</li>
                <li>• Exportação de dados para análise externa</li>
                <li>• Rastreamento individual de cada migração</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
