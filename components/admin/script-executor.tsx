"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Shield, Terminal, Database, Code } from "lucide-react"
import { checkAdminAccess, executeAdminScript } from "@/app/actions/admin-actions"

export default function ScriptExecutor() {
  const [script, setScript] = useState("")
  const [scriptType, setScriptType] = useState<"sql" | "javascript">("javascript")
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [accessError, setAccessError] = useState<string | null>(null)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)

  // Verificar acesso de administrador ao carregar o componente
  useEffect(() => {
    async function verifyAccess() {
      setIsCheckingAccess(true)
      try {
        const { isAdmin: adminStatus, error } = await checkAdminAccess()
        setIsAdmin(adminStatus)
        setAccessError(error)
      } catch (err: any) {
        setIsAdmin(false)
        setAccessError(err.message)
      } finally {
        setIsCheckingAccess(false)
      }
    }

    verifyAccess()
  }, [])

  const handleExecute = async () => {
    if (!script.trim()) {
      setResult({ error: "Por favor, insira um script para executar." })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await executeAdminScript(script, scriptType)
      setResult(response)
    } catch (error: any) {
      setResult({ success: false, error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar loading enquanto verifica acesso
  if (isCheckingAccess) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verificando Permissões...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Mostrar erro de acesso se não for administrador
  if (!isAdmin) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Acesso Negado
          </CardTitle>
          <CardDescription>Você não tem permissão para acessar esta funcionalidade.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acesso Restrito</AlertTitle>
            <AlertDescription>
              {accessError || "Apenas administradores podem acessar o Executor de Scripts."}
              <br />
              <br />
              Se você acredita que deveria ter acesso, entre em contato com um administrador do sistema.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Interface principal para administradores
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Avisos de Segurança */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>⚠️ AVISO DE SEGURANÇA CRÍTICO</AlertTitle>
        <AlertDescription>
          <strong>Esta funcionalidade é SIMULADA por motivos de segurança.</strong>
          <br />
          Em um ambiente de produção real, a execução de scripts arbitrários requer:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Sandboxing completo e isolamento de processos</li>
            <li>Validação rigorosa de entrada e sanitização</li>
            <li>Logs de auditoria detalhados</li>
            <li>Limitações de recursos (CPU, memória, tempo)</li>
            <li>Revisão de código obrigatória</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Executor de Scripts Administrativos
            <Badge variant="secondary" className="ml-2">
              SIMULADO
            </Badge>
          </CardTitle>
          <CardDescription>
            Execute scripts administrativos com segurança. Atualmente em modo de simulação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={scriptType} onValueChange={(value) => setScriptType(value as "sql" | "javascript")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="javascript" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                JavaScript
              </TabsTrigger>
              <TabsTrigger value="sql" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                SQL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="javascript" className="space-y-4">
              <div>
                <label htmlFor="js-script" className="block text-sm font-medium mb-2">
                  Script JavaScript
                </label>
                <Textarea
                  id="js-script"
                  placeholder="// Exemplo de script JavaScript
console.log('Hello, Admin!');
const result = { message: 'Script executado com sucesso' };
return result;"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="sql" className="space-y-4">
              <div>
                <label htmlFor="sql-script" className="block text-sm font-medium mb-2">
                  Script SQL
                </label>
                <Textarea
                  id="sql-script"
                  placeholder="-- Exemplo de script SQL
SELECT COUNT(*) as total_users FROM auth.users;
-- OU
UPDATE user_roles SET role = 'editor' WHERE user_id = 'uuid-here';"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleExecute} disabled={isLoading || !script.trim()}>
              {isLoading ? "Executando..." : "Executar Script (Simulado)"}
            </Button>
            <Button variant="outline" onClick={() => setScript("")}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultado da Execução */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Resultado da Execução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm">
              {result.success ? (
                <div className="text-green-600 dark:text-green-400">
                  <div className="font-semibold mb-2">✅ Execução Simulada Bem-sucedida</div>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(result.result, null, 2)}</pre>
                </div>
              ) : (
                <div className="text-red-600 dark:text-red-400">
                  <div className="font-semibold mb-2">❌ Erro na Execução</div>
                  <pre className="whitespace-pre-wrap">{result.error}</pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
