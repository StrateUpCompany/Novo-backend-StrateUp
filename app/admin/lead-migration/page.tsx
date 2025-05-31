"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getPendingMigrationLeads, migrateLeadToUser, revertMigration } from "@/app/actions/lead-migration-actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, ArrowRight, Loader2, AlertTriangle, Undo2, Search, BarChart3 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function LeadMigrationPage() {
  const [pendingLeads, setPendingLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchEmail, setSearchEmail] = useState("")
  const [manualMigration, setManualMigration] = useState({
    email: "",
    userId: "",
    strategy: "merge" as "keep_lead" | "keep_user" | "merge",
  })
  const [migrationInProgress, setMigrationInProgress] = useState<string | null>(null)

  useEffect(() => {
    loadPendingLeads()
  }, [])

  const loadPendingLeads = async (email?: string) => {
    setLoading(true)
    setError(null)
    try {
      const { leads, error: leadsError } = await getPendingMigrationLeads(email)
      if (leadsError) throw new Error(leadsError)
      setPendingLeads(leads)
    } catch (e: any) {
      setError(e.message)
      toast.error(`Erro ao carregar leads: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadPendingLeads(searchEmail || undefined)
  }

  const handleManualMigration = async () => {
    if (!manualMigration.email || !manualMigration.userId) {
      toast.error("E-mail e ID do usuário são obrigatórios")
      return
    }

    setMigrationInProgress(manualMigration.email)
    try {
      const result = await migrateLeadToUser({
        email: manualMigration.email,
        userId: manualMigration.userId,
        mergeStrategy: manualMigration.strategy,
      })

      if (result.success) {
        toast.success(result.message || "Migração realizada com sucesso!")
        setManualMigration({ email: "", userId: "", strategy: "merge" })
        loadPendingLeads()
      } else {
        toast.error(result.error || "Erro na migração")
      }
    } catch (e: any) {
      toast.error(`Erro inesperado: ${e.message}`)
    } finally {
      setMigrationInProgress(null)
    }
  }

  const handleRevertMigration = async (leadId: string) => {
    if (!confirm("Tem certeza que deseja reverter esta migração?")) return

    try {
      const result = await revertMigration(leadId)
      if (result.success) {
        toast.success(result.message || "Migração revertida com sucesso!")
        loadPendingLeads()
      } else {
        toast.error(result.error || "Erro ao reverter migração")
      }
    } catch (e: any) {
      toast.error(`Erro inesperado: ${e.message}`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gerenciamento de Migração de Leads</h1>
            <p className="text-muted-foreground">Migre dados de leads não autenticados para usuários autenticados</p>
          </div>
          <Button asChild>
            <Link href="/admin/lead-migration/analytics">
              <BarChart3 className="mr-2 h-4 w-4" />
              Ver Analytics
            </Link>
          </Button>
        </div>
      </div>

      {/* Migração Manual */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Migração Manual
          </CardTitle>
          <CardDescription>Migre manualmente um lead específico para um usuário autenticado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="email">E-mail do Lead</Label>
              <Input
                id="email"
                type="email"
                placeholder="lead@exemplo.com"
                value={manualMigration.email}
                onChange={(e) => setManualMigration((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="userId">ID do Usuário</Label>
              <Input
                id="userId"
                placeholder="uuid-do-usuario"
                value={manualMigration.userId}
                onChange={(e) => setManualMigration((prev) => ({ ...prev, userId: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="strategy">Estratégia</Label>
              <Select
                value={manualMigration.strategy}
                onValueChange={(value: any) => setManualMigration((prev) => ({ ...prev, strategy: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="merge">Mesclar dados</SelectItem>
                  <SelectItem value="keep_lead">Manter dados do lead</SelectItem>
                  <SelectItem value="keep_user">Manter dados do usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleManualMigration}
                disabled={migrationInProgress === manualMigration.email}
                className="w-full"
              >
                {migrationInProgress === manualMigration.email ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Migrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Busca de Leads */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Leads Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Filtrar por e-mail (opcional)"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Buscar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearchEmail("")
                loadPendingLeads()
              }}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Leads Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Leads Pendentes de Migração ({pendingLeads.length})
          </CardTitle>
          <CardDescription>Leads que ainda não foram migrados para usuários autenticados</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando leads...</span>
            </div>
          ) : pendingLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum lead pendente de migração encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Diagnósticos</TableHead>
                    <TableHead>Sequências</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.email}</TableCell>
                      <TableCell>{lead.name || "-"}</TableCell>
                      <TableCell>{lead.company || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.source || "unknown"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{lead.lead_diagnostics?.[0]?.count || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{lead.user_sequence_progress?.[0]?.count || 0}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(lead.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setManualMigration((prev) => ({ ...prev, email: lead.email }))}
                          >
                            Migrar
                          </Button>
                          {lead.metadata?.migratedToUser && (
                            <Button size="sm" variant="destructive" onClick={() => handleRevertMigration(lead.id)}>
                              <Undo2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
