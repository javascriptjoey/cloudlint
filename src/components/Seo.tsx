import { useEffect } from 'react'

export type SeoProps = {
  title?: string
  description?: string
  ogTitle?: string
  ogDescription?: string
  canonical?: string
}

export function Seo({ title, description, ogTitle, ogDescription, canonical }: SeoProps) {
  useEffect(() => {
    if (title) document.title = title
    const ensure = (selector: string, create: () => HTMLElement) => {
      let el = document.head.querySelector(selector) as HTMLElement | null
      if (!el) { el = create(); document.head.appendChild(el) }
      return el
    }
    if (description) {
      const meta = ensure('meta[name="description"]', () => document.createElement('meta')) as HTMLMetaElement
      meta.setAttribute('name', 'description')
      meta.setAttribute('content', description)
    }
    if (ogTitle) {
      const meta = ensure('meta[property="og:title"]', () => document.createElement('meta')) as HTMLMetaElement
      meta.setAttribute('property', 'og:title')
      meta.setAttribute('content', ogTitle)
    }
    if (ogDescription) {
      const meta = ensure('meta[property="og:description"]', () => document.createElement('meta')) as HTMLMetaElement
      meta.setAttribute('property', 'og:description')
      meta.setAttribute('content', ogDescription)
    }
    if (canonical) {
      let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
      if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link) }
      link.setAttribute('href', canonical)
    }
  }, [title, description, ogTitle, ogDescription, canonical])
  return null
}
