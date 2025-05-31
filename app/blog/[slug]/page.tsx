import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getBlogPostBySlug, getBlogCategories, getBlogPosts } from "@/app/actions/blog-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, User, Clock, Share2, BookOpen } from "lucide-react"
import { BlogJsonLd } from "@/components/blog/blog-json-ld"
import { SocialShare } from "@/components/blog/social-share"
import { ReadingProgress } from "@/components/blog/reading-progress"
import { RelatedPosts } from "@/components/blog/related-posts"

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

// Gerar metadados dinâmicos para SEO otimizado
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { post, error } = await getBlogPostBySlug(params.slug)

  if (error || !post) {
    return {
      title: "Post não encontrado | StrateUp",
      description: "O artigo que você está procurando não foi encontrado.",
      robots: "noindex, nofollow",
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://strateup.com.br"
  const postUrl = `${siteUrl}/blog/${post.slug}`
  const imageUrl = post.image_url || `${siteUrl}/og-default.jpg`

  return {
    title: `${post.title} | Blog StrateUp`,
    description: post.excerpt,
    keywords: `${post.category}, estratégia empresarial, gestão, consultoria, ${post.title}`,
    authors: [{ name: post.author }],
    creator: post.author,
    publisher: "StrateUp",
    robots: "index, follow",
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: postUrl,
      siteName: "StrateUp",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: "pt_BR",
      type: "article",
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      authors: [post.author],
      tags: [post.category],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [imageUrl],
      creator: "@strateup",
    },
    alternates: {
      canonical: postUrl,
    },
  }
}

// Gerar rotas estáticas para melhor performance
export async function generateStaticParams() {
  const { posts } = await getBlogPosts({ page: 1, limit: 50 })
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { post, error } = await getBlogPostBySlug(params.slug)
  const { categories } = await getBlogCategories()

  if (error || !post) {
    notFound()
  }

  // Buscar posts relacionados
  const { posts: relatedPosts } = await getBlogPosts({
    page: 1,
    limit: 3,
    category: post.category,
  })

  // Filtrar o post atual dos relacionados
  const filteredRelatedPosts = relatedPosts.filter((p) => p.id !== post.id)

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  // Calcular tempo de leitura estimado
  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200
    const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length
    const readingTime = Math.ceil(wordCount / wordsPerMinute)
    return readingTime
  }

  const readingTime = calculateReadingTime(post.content)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://strateup.com.br"
  const postUrl = `${siteUrl}/blog/${post.slug}`

  return (
    <>
      <BlogJsonLd post={post} />
      <ReadingProgress />

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Button asChild variant="outline" className="w-full">
              <Link href="/blog" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o Blog
              </Link>
            </Button>

            {/* Compartilhamento Social */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SocialShare url={postUrl} title={post.title} />
              </CardContent>
            </Card>

            {/* Categorias */}
            <Card>
              <CardHeader>
                <CardTitle>Categorias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categories && categories.length > 0 ? (
                    categories.map((category) => (
                      <div key={category}>
                        <Link href={`/blog/categoria/${encodeURIComponent(category)}`}>
                          <Badge
                            variant={category === post.category ? "default" : "outline"}
                            className="mr-2 cursor-pointer hover:bg-secondary"
                          >
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
          </div>

          {/* Conteúdo do Post */}
          <div className="lg:col-span-3">
            <article className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
              {/* Imagem de capa */}
              <div className="relative w-full h-[400px]">
                <Image
                  src={post.image_url || "/placeholder.svg?height=800&width=1200"}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Cabeçalho do post */}
              <div className="p-8">
                <Badge className="mb-4">{post.category}</Badge>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>

                <div className="flex flex-wrap items-center text-sm text-muted-foreground mb-8 gap-4">
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    {post.author}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    {formatDate(post.created_at)}
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    {readingTime} min de leitura
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="mr-2 h-4 w-4" />
                    {post.content.replace(/<[^>]*>/g, "").split(/\s+/).length} palavras
                  </div>
                </div>

                {/* Excerpt destacado */}
                <div className="bg-muted/50 border-l-4 border-primary p-4 mb-8 rounded-r-lg">
                  <p className="text-lg font-medium text-muted-foreground italic">{post.excerpt}</p>
                </div>

                {/* Conteúdo do post */}
                <div className="prose prose-gray dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                  <div dangerouslySetInnerHTML={{ __html: post.content }} />
                </div>

                {/* Tags e compartilhamento no final do post */}
                <div className="mt-12 pt-8 border-t border-border">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Tags:</h3>
                      <Badge variant="outline">{post.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Compartilhe:</span>
                      <SocialShare url={postUrl} title={post.title} compact />
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* Posts Relacionados */}
            {filteredRelatedPosts.length > 0 && (
              <div className="mt-12">
                <RelatedPosts posts={filteredRelatedPosts} currentCategory={post.category} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
