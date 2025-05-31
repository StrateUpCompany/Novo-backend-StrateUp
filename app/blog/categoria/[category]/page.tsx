import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { getBlogPosts, getBlogCategories } from "@/app/actions/blog-actions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination"
import { SearchInput } from "@/components/blog/search-input"
import { notFound } from "next/navigation"

interface CategoryPageProps {
  params: {
    category: string
  }
  searchParams: {
    page?: string
    search?: string
  }
}

// Gerar metadados dinâmicos para SEO
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = decodeURIComponent(params.category)

  return {
    title: `${category} | Blog StrateUp`,
    description: `Artigos sobre ${category.toLowerCase()} - Dicas, insights e estratégias para impulsionar seu negócio.`,
  }
}

// Gerar rotas estáticas para categorias conhecidas
export async function generateStaticParams() {
  const { categories } = await getBlogCategories()
  return categories.map((category) => ({
    category: encodeURIComponent(category),
  }))
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const category = decodeURIComponent(params.category)
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
    category,
    search,
    orderBy: "created_at",
    orderDirection: "desc",
  })

  const { categories, error: categoriesError } = await getBlogCategories()

  // Se não houver posts e não for erro de busca, retornar 404
  if (posts.length === 0 && !postsError && !search) {
    notFound()
  }

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Categoria: <span className="text-primary">{category}</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Artigos, dicas e insights sobre {category.toLowerCase()} para impulsionar seu negócio.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar com categorias e busca */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buscar</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchInput defaultValue={search} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categorias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categoriesError ? (
                  <p className="text-sm text-destructive">Erro ao carregar categorias</p>
                ) : categories && categories.length > 0 ? (
                  categories.map((cat) => (
                    <div key={cat}>
                      <Link href={`/blog/categoria/${encodeURIComponent(cat)}`}>
                        <Badge
                          variant={cat === category ? "default" : "outline"}
                          className="mr-2 cursor-pointer hover:bg-secondary"
                        >
                          {cat}
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
                  <Card key={post.id} className="flex flex-col h-full">
                    <div className="relative w-full h-48">
                      <Image
                        src={post.image_url || "/placeholder.svg?height=400&width=600"}
                        alt={post.title}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                    </div>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge>{post.category}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>
                      </div>
                      <CardTitle className="text-xl">
                        <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                          {post.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                    </CardContent>
                    <CardFooter>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/blog/${post.slug}`}>Ler mais</Link>
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
                          href={`/blog/categoria/${encodeURIComponent(category)}?page=${pagination.currentPage - 1}${
                            search ? `&search=${search}` : ""
                          }`}
                        >
                          Anterior
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href={`/blog/categoria/${encodeURIComponent(category)}?page=${pageNum}${
                            search ? `&search=${search}` : ""
                          }`}
                          isActive={pageNum === pagination.currentPage}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    {pagination.currentPage < pagination.totalPages && (
                      <PaginationItem>
                        <PaginationLink
                          href={`/blog/categoria/${encodeURIComponent(category)}?page=${pagination.currentPage + 1}${
                            search ? `&search=${search}` : ""
                          }`}
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
              <h3 className="text-xl font-semibold mb-2">Nenhum post encontrado</h3>
              <p className="text-muted-foreground">
                {search
                  ? `Não encontramos resultados para "${search}" na categoria "${category}". Tente outra busca.`
                  : `Não há posts publicados na categoria "${category}" no momento.`}
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/blog">Ver todas as categorias</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
