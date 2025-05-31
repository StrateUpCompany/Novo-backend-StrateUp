import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e Descrição */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
              <span className="text-xl font-bold text-foreground">StrateUp</span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              Transformamos empresas através de estratégias inteligentes e soluções personalizadas. Diagnósticos
              precisos, consultoria especializada e resultados mensuráveis.
            </p>
            <div className="flex space-x-4">
              <a href="mailto:contato@strateup.com.br" className="footer-link" aria-label="Enviar e-mail para StrateUp">
                contato@strateup.com.br
              </a>
            </div>
          </div>

          {/* Serviços */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Serviços</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/diagnostico" className="footer-link">
                  Diagnóstico Empresarial
                </Link>
              </li>
              <li>
                <Link href="/consultoria" className="footer-link">
                  Consultoria Estratégica
                </Link>
              </li>
              <li>
                <Link href="/blog" className="footer-link">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contato" className="footer-link">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacidade" className="footer-link">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos" className="footer-link">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="footer-link">
                  Política de Cookies
                </Link>
              </li>
              <li>
                <a href="mailto:juridico@strateup.com.br" className="footer-link">
                  Suporte Jurídico
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Linha de Copyright */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} StrateUp. Todos os direitos reservados.
            </p>
            <p className="text-sm text-muted-foreground mt-2 md:mt-0">Desenvolvido com ❤️ para transformar empresas</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
