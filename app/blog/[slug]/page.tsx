import { getPostBySlug, getSortedPosts } from '@/lib/posts'
import Link from 'next/link'

// For static export
export async function generateStaticParams() {
  const posts = getSortedPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'Not Found' }
  return {
    title: post.title,
    description: post.excerpt
  }
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-stone-800 mb-4">Post not found</h1>
        <Link href="/" className="text-emerald-600 hover:underline">
          ← Back to all reports
        </Link>
      </div>
    )
  }

  // Simple markdown to HTML conversion
  const htmlContent = post.content
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\| (.*) \|/gim, (match) => {
      if (match.includes('---')) return '</table>'
      if (match.includes('|')) {
        const cells = match.split('|').filter(c => c.trim())
        if (cells[0].includes('===') || cells[0].includes('--')) return ''
        return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>'
      }
      return match
    })

  return (
    <article>
      <Link href="/" className="text-emerald-600 hover:underline mb-6 inline-block">
        ← Back to all reports
      </Link>
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-2">{post.title}</h1>
        <div className="flex items-center gap-4 text-stone-500 text-sm">
          <time>{post.date}</time>
          {post.confidence && (
            <span className={`px-2 py-0.5 rounded ${
              post.confidence > 0.7 ? 'bg-emerald-100 text-emerald-700' :
              post.confidence > 0.4 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              Confidence: {(post.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>
        {post.skills && post.skills.length > 0 && (
          <div className="flex gap-2 mt-4">
            {post.skills.map((skill: string) => (
              <span 
                key={skill}
                className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </header>

      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </article>
  )
}
