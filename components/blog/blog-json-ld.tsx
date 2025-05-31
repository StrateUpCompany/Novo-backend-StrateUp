import type { BlogPost } from "@/app/actions/blog-actions"

interface BlogJsonLdProps {
  post: BlogPost
}

export function BlogJsonLd({ post }: BlogJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://strateup.com.br"
  const postUrl = `${siteUrl}/blog/${post.slug}`
  const imageUrl = post.image_url || `${siteUrl}/og-default.jpg`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: [imageUrl],
    datePublished: post.created_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "StrateUp",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    articleSection: post.category,
    keywords: `${post.category}, estratégia empresarial, gestão, consultoria`,
    wordCount: post.content.replace(/<[^>]*>/g, "").split(/\s+/).length,
    url: postUrl,
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}
