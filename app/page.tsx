import DashboardAnalytics from "@/components/admin/dashboard-analytics"
import Link from "next/link" // Adicionado
import { Button } from "@/components/ui/button" // Adicionado
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" // Adicionado
import { Mail, ListOrdered, Users, BarChart3 } from "lucide-react" // Adicionado

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Analytics Dashboard
        </p>
      </div>
      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-1 lg:text-left">
        {/* Início da nova estrutura de layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 w-full">
          {/* Navegação Lateral */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automação de E-mails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link href="/admin/email-automation/templates">
                    <Mail className="mr-2 h-4 w-4" />
                    Templates de E-mail
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link href="/admin/email-automation/sequences">
                    <ListOrdered className="mr-2 h-4 w-4" />
                    Sequências de E-mail
                  </Link>
                </Button>
                {/* Adicione mais links de navegação aqui conforme necessário */}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Leads</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link href="/admin/lead-migration">
                    <Users className="mr-2 h-4 w-4" />
                    Migração de Leads
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link href="/admin/lead-migration/analytics">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics de Migração
                  </Link>
                </Button>
                {/* Adicione mais links de gerenciamento de leads aqui conforme necessário */}
              </CardContent>
            </Card>
          </div>

          {/* Conteúdo Principal do Dashboard */}
          <div className="lg:col-span-3">
            <DashboardAnalytics />
          </div>
        </div>
        {/* Fim da nova estrutura de layout */}
      </div>
    </main>
  )
}
