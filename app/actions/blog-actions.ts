"use server"

import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

// Esquema de validação para parâmetros de busca de posts
const blogQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  category: z.string().optional(),
  search: z.string().optional(),
  orderBy: z.enum(["created_at", "title", "author"]).default("created_at"),
  orderDirection: z.enum(["asc", "desc"]).default("desc"),
})

export type BlogPost = {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  author: string
  image_url: string
  category: string
  published: boolean
  created_at: string
  updated_at: string
}

export type BlogQueryParams = z.infer<typeof blogQuerySchema>

export async function getBlogPosts({
  page = 1,
  limit = 10,
  category,
  search,
  orderBy = "created_at",
  orderDirection = "desc",
}: BlogQueryParams) {
  try {
    // Validar parâmetros
    const validatedParams = blogQuerySchema.parse({
      page,
      limit,
      category,
      search,
      orderBy,
      orderDirection,
    })

    const supabase = createClient()

    // Calcular offset para paginação
    const offset = (validatedParams.page - 1) * validatedParams.limit

    // Construir query base
    let query = supabase
      .from("blog_posts")
      .select("*", { count: "exact" })
      .eq("published", true)
      .order(validatedParams.orderBy, { ascending: validatedParams.orderDirection === "asc" })
      .range(offset, offset + validatedParams.limit - 1)

    // Adicionar filtro de categoria se fornecido
    if (validatedParams.category) {
      query = query.eq("category", validatedParams.category)
    }

    // Adicionar busca por texto se fornecida
    if (validatedParams.search) {
      const searchTerm = `%${validatedParams.search}%`
      query = query.or(`title.ilike.${searchTerm},content.ilike.${searchTerm},excerpt.ilike.${searchTerm}`)
    }

    // Executar a query
    const { data: posts, error, count } = await query

    if (error) {
      throw new Error(`Erro ao buscar posts do blog: ${error.message}`)
    }

    // Calcular total de páginas
    const totalPages = count ? Math.ceil(count / validatedParams.limit) : 0

    return {
      posts: posts as BlogPost[],
      pagination: {
        currentPage: validatedParams.page,
        totalPages,
        totalItems: count || 0,
        itemsPerPage: validatedParams.limit,
      },
      error: null,
    }
  } catch (error: any) {
    console.error("Erro ao buscar posts do blog:", error.message)
    return {
      posts: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: limit,
      },
      error: error.message,
    }
  }
}

export async function getBlogCategories() {
  try {
    const supabase = createClient()

    // Buscar categorias distintas de posts publicados
    const { data, error } = await supabase.from("blog_posts").select("category").eq("published", true).order("category")

    if (error) {
      throw new Error(`Erro ao buscar categorias: ${error.message}`)
    }

    // Extrair categorias únicas
    const categories = Array.from(new Set(data.map((item) => item.category))).filter(Boolean)

    return { categories, error: null }
  } catch (error: any) {
    console.error("Erro ao buscar categorias do blog:", error.message)
    return { categories: [], error: error.message }
  }
}

export async function getBlogPostBySlug(slug: string) {
  try {
    const supabase = createClient()

    const { data: post, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single()

    if (error) {
      throw new Error(`Erro ao buscar post: ${error.message}`)
    }

    return { post: post as BlogPost, error: null }
  } catch (error: any) {
    console.error(`Erro ao buscar post com slug ${slug}:`, error.message)
    return { post: null, error: error.message }
  }
}
