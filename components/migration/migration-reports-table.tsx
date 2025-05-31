"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getMigrationReports } from "@/app/actions/migration-analytics-actions"
import type { MigrationReport } from "@/app/actions/migration-analytics-actions"
import {
  Search,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Calendar,
} from "lucide-react"
import { toast } from "sonner"

export default function MigrationReportsTable() {
  const [reports, setReports] = useState<MigrationReport[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [filters, setFilters] = useState({
    status: "all" as "all" | "success" | "failed" | "partial",
    source: "",
    startDate: "",
    endDate: "",
    searchEmail: "",
  })

  useEffect(() => {
    loadReports()
  }, [currentPage, filters])

  const loadReports = async () => {
    setLoading(true)
    try {
      const offset = (currentPage - 1) * pageSize
      const result = await getMigrationReports({
        status: filters.status === "all" ? undefined : filters.status,
        source: filters.source || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        limit: pageSize,
        offset,
      })

      if (result.error) {
        toast.error(`Erro ao carregar relatórios: ${result.error}`)
      } else {
        // Filtrar por email se especificado
        let filteredReports = result.reports
        if (filters.searchEmail) {
          filteredReports = result.reports.filter(
            (report) =>
              report.lead_email.toLowerCase().includes(filters.searchEmail.toLowerCase()) ||
              report.user_email.toLowerCase().includes(filters.searchEmail.toLowerCase()),
          )
        }

        setReports(filteredReports)
        setTotal(result.total)
      }
    } catch (error: any) {
      toast.error(`Erro inesperado: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const clearFilters = () => {
    setFilters({
      status: "all",
      source: "",
      startDate: "",
      endDate: "",
      searchEmail: "",
    })
    setCurrentPage(1)
  }

  const exportToCSV = () => {
    if (reports.length === 0) {
      toast.error("Nenhum dado para exportar")
      return
    }

    const headers = [
      "ID",
      "Email do Lead",
      "Email do Usuário",
      "Status",
      "Data da Migração",
      "Tempo (ms)",
      "Diagnósticos",
      "Sequências",
      "E-mails",
      "Fonte",
      "Erro",
    ]

    const csvData = reports.map((report) => [
      report.id,
      report.lead_email,
      report.user_email,
      report.migration_status,
      new Date(report.migration_date).toLocaleString("pt-BR"),
      report.migration_time_ms,
      report.data_migrated.diagnostics,
      report.data_migrated.sequences,
      report.data_migrated.emails,
      report.lead_source || "",
      report.error_message || "",
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `migration-reports-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("Relatório exportado com sucesso!")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "partial":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Sucesso</Badge>
      case "failed":
        return <Badge variant="destructive">Falhou</Badge>
      case "partial":
        return <Badge className="bg-yellow-100 text-yellow-800">Parcial</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}min`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="searchEmail">Buscar por E-mail</Label>
              <Input
                id="searchEmail"
                placeholder="email@exemplo.com"
                value={filters.searchEmail}
                onChange={(e) => handleFilterChange("searchEmail", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="source">Fonte</Label>
              <Input
                id="source"
                placeholder="website, blog, etc."
                value={filters.source}
                onChange={(e) => handleFilterChange("source", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={clearFilters} variant="outline" className="flex-1">
                Limpar
              </Button>
              <Button onClick={exportToCSV} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de relatórios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Relatórios de Migração ({total} total)</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Página {currentPage} de {totalPages}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando relatórios...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum relatório encontrado com os filtros aplicados</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>E-mail do Lead</TableHead>
                      <TableHead>E-mail do Usuário</TableHead>
                      <TableHead>Data da Migração</TableHead>
                      <TableHead>Tempo</TableHead>
                      <TableHead>Dados Migrados</TableHead>
                      <TableHead>Fonte</TableHead>
                      <TableHead>Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(report.migration_status)}
                            {getStatusBadge(report.migration_status)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{report.lead_email}</TableCell>
                        <TableCell>{report.user_email}</TableCell>
                        <TableCell>{formatDate(report.migration_date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatTime(report.migration_time_ms)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {report.data_migrated.diagnostics > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {report.data_migrated.diagnostics}D
                              </Badge>
                            )}
                            {report.data_migrated.sequences > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {report.data_migrated.sequences}S
                              </Badge>
                            )}
                            {report.data_migrated.emails > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {report.data_migrated.emails}E
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {report.lead_source ? (
                            <Badge variant="outline">{report.lead_source}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {report.error_message ? (
                            <div className="max-w-xs truncate text-red-600" title={report.error_message}>
                              {report.error_message}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {(currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, total)} de {total}{" "}
                  resultados
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm">
                    {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
