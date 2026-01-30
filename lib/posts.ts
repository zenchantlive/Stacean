import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const postsDirectory = path.join(process.cwd(), 'posts')

export interface Post {
  slug: string
  date: string
  title: string
  content: string
  excerpt: string
  skills?: string[]
  confidence?: number
}

export function getSortedPosts(): Post[] {
  // Create posts directory if it doesn't exist
  if (!fs.existsSync(postsDirectory)) {
    return []
  }

  const fileNames = fs.readdirSync(postsDirectory)
  const allPosts = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '')
      const fullPath = path.join(postsDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter(fileContents)
      
      return {
        slug,
        date: data.date || new Date().toISOString().split('T')[0],
        title: data.title || slug,
        content,
        excerpt: data.excerpt || content.slice(0, 200) + '...',
        skills: data.skills || [],
        confidence: data.confidence || 0
      }
    })

  return allPosts.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getPostBySlug(slug: string): Post | null {
  const fullPath = path.join(postsDirectory, `${slug}.md`)
  
  if (!fs.existsSync(fullPath)) {
    return null
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)
  
  return {
    slug,
    date: data.date || new Date().toISOString().split('T')[0],
    title: data.title || slug,
    content,
    excerpt: data.excerpt || content.slice(0, 200) + '...',
    skills: data.skills || [],
    confidence: data.confidence || 0
  }
}

export function savePost(slug: string, content: string, metadata: any): void {
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true })
  }
  
  const fullPath = path.join(postsDirectory, `${slug}.md`)
  const fileContent = matter.stringify(content, {
    title: metadata.title || slug,
    date: metadata.date || new Date().toISOString().split('T')[0],
    excerpt: metadata.excerpt || content.slice(0, 200) + '...',
    skills: metadata.skills || [],
    confidence: metadata.confidence || 0
  })
  
  fs.writeFileSync(fullPath, fileContent)
}
