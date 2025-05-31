import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { getBlogPosts, getBlogCategories } from "@/app/actions/blog-actions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination"
import { SearchInput } from "@/components/blog/search-input"
import { Clock, User, Calendar } from "lucide-react"

export const metadata: Metadata = {
  title: "Blog | StrateUp - Estratégia Empresarial e Gestão",
  description:
    "Artigos, dicas e insights sobre estratégia empresarial, gestão e inovação para impulsionar seu negócio. Conteúdo especializado em consultoria empresarial.",
  keywords:
    "blog empresarial, estratégia empresarial, gestão, consultoria, inovação, liderança, planejamento estratégico",
  openGraph: {
    title: "Blog StrateUp - Estratégia Empresarial e Gestão",
    description: "Artigos especializados em estratégia empresarial, gestão e inovação para transformar seu negócio.",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog StrateUp - Estratégia Empresarial",
    description: "Conteúdo especializado em estratégia empresarial e gestão.",
  },
  robots: "index, follow",
  alternates: {
    canonical: "/blog",
  },
}

interface BlogPageProps {
  searchParams: {
    page?: string
    search?: string
  }
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1
  const search = searchParams.search || ""

  // Buscar posts e categorias usando Server Actions
  const {
    posts,
    pagination,
    error: postsError,
  } = await getBlogPosts({
    page,
    limit: 9,
    search,
    orderBy: "created_at",
    orderDirection: "desc",
  })

  const { categories, error: categoriesError } = await getBlogCategories()

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  // Calcular tempo de leitura estimado
  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200
    const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section do Blog */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Blog StrateUp
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Artigos, dicas e insights sobre estratégia empresarial, gestão e inovação para impulsionar seu negócio.
          Conteúdo especializado para líderes e empreendedores.
        </p>

        {/* Estatísticas do Blog */}
        <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            Atualizado semanalmente
          </div>
          <div className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Especialistas em gestão
          </div>
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            Leitura rápida e prática
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar com categorias e busca */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buscar Artigos</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchInput defaultValue={search} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categorias</CardTitle>
              <CardDescription>Explore por temas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/blog">
                  <Badge variant={!search ? "default" : "outline"} className="mr-2 cursor-pointer hover:bg-secondary">
                    Todos os artigos
                  </Badge>
                </Link>
                {categoriesError ? (
                  <p className="text-sm text-destructive">Erro ao carregar categorias</p>
                ) : categories && categories.length > 0 ? (
                  categories.map((category) => (
                    <div key={category}>
                      <Link href={`/blog/categoria/${encodeURIComponent(category)}`}>
                        <Badge variant="outline" className="mr-2 cursor-pointer hover:bg-secondary">
                          {category}
                        </Badge>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma categoria encontrada</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Newsletter Signup */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardHeader>
              <CardTitle>Newsletter</CardTitle>
              <CardDescription>Receba nossos melhores artigos por email</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Inscrever-se</Button>
            </CardContent>
          </Card>
        </div>

        {/* Lista de posts */}
        <div className="lg:col-span-3">
          {postsError ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
              <p>Erro ao carregar posts: {postsError}</p>
            </div>
          ) : posts && posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <Card key={post.id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
                    <div className="relative w-full h-48">
                      <Image
                        src={post.image_url || "/placeholder.svg?height=400&width=600"}
                        alt={post.title}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                    </div>
                    <CardHeader className="flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{post.category}</Badge>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          {calculateReadingTime(post.content)} min
                        </div>
                      </div>
                      <CardTitle className="text-xl line-clamp-2">
                        <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                          {post.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
                      <div className="flex items-center text-xs text-muted-foreground mt-2">
                        <User className="mr-1 h-3 w-3" />
                        {post.author}
                        <span className="mx-2">•</span>
                        <Calendar className="mr-1 h-3 w-3" />
                        {formatDate(post.created_at)}
                      </div>
                    </CardHeader>
                    <CardFooter>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/blog/${post.slug}`}>Ler artigo completo</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    {pagination.currentPage > 1 && (
                      <PaginationItem>
                        <PaginationLink
                          href={`/blog?page=${pagination.currentPage - 1}${search ? `&search=${search}` : ""}`}
                        >
                          Anterior
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href={`/blog?page=${pageNum}${search ? `&search=${search}` : ""}`}
                            isActive={pageNum === pagination.currentPage}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}

                    {pagination.currentPage < pagination.totalPages && (
                      <PaginationItem>
                        <PaginationLink
                          href={`/blog?page=${pagination.currentPage + 1}${search ? `&search=${search}` : ""}`}
                        >
                          Próxima
                        </PaginationLink>
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">Nenhum artigo encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {search
                  ? `Não encontramos resultados para "${search}". Tente outra busca.`
                  : "Não há posts publicados no momento."}
              </p>
              {search && (
                <Button asChild variant="outline">
                  <Link href="/blog">Ver todos os artigos</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
