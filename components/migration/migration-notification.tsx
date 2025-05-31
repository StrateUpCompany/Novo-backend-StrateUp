"use client"

import { useLeadMigration } from "@/hooks/use-lead-migration"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function MigrationNotification() {
  const { isChecking, result, error } = useLeadMigration()
  const [dismissed, setDismissed] = useState(false)

  // Não mostrar se não há resultado ou foi dispensado
  if (!result || dismissed || error) {
    return null
  }

  // Não mostrar se não houve migração bem-sucedida
  if (!result.success || !result.migratedData) {
    return null
  }

  const handleDismiss = () => {
    setDismissed(true)
    toast.success("Notificação dispensada")
  }

  if (isChecking) {
    return (
      <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Verificando dados anteriores...</AlertTitle>
        <AlertDescription>
          Estamos verificando se você tem dados de diagnósticos anteriores para migrar.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="mb-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertTitle className="flex items-center justify-between">
        Dados migrados com sucesso!
        <Button variant="ghost" size="sm" onClick={handleDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription>
        <p className="mb-2">{result.message}</p>
        {result.migratedData && (
          <div className="text-sm space-y-1">
            <p>• {result.migratedData.diagnostics} diagnósticos migrados</p>
            <p>• {result.migratedData.sequenceProgress} sequências de e-mail ativas</p>
            <p>• {result.migratedData.sentEmails} registros de e-mail atualizados</p>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
