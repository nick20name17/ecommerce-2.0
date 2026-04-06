import { useEffect, useState, useRef } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

interface ArticleProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

function TableOfContents({ items, activeId }: { items: TocItem[]; activeId: string }) {
  if (items.length === 0) return null

  return (
    <nav className="hidden xl:block">
      <div className="sticky top-24 w-[200px]">
        <p className="mb-3 text-xs font-medium text-muted-foreground">On this page</p>
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`block py-1 text-[13px] leading-snug transition-colors ${
                  item.level === 3 ? 'pl-3' : ''
                } ${
                  activeId === item.id
                    ? 'font-medium text-accent'
                    : 'text-text-tertiary hover:text-foreground'
                }`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

export function Article({ title, subtitle, children }: ArticleProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState('')

  // Extract headings from rendered content
  useEffect(() => {
    if (!contentRef.current) return

    const headings = contentRef.current.querySelectorAll('h2, h3')
    const items: TocItem[] = []

    headings.forEach((heading) => {
      if (!heading.id) {
        heading.id = heading.textContent
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') ?? ''
      }
      items.push({
        id: heading.id,
        text: heading.textContent ?? '',
        level: parseInt(heading.tagName[1]),
      })
    })

    setTocItems(items)
  }, [children])

  // Track active heading with IntersectionObserver
  useEffect(() => {
    if (!contentRef.current || tocItems.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 },
    )

    const headings = contentRef.current.querySelectorAll('h2, h3')
    headings.forEach((heading) => observer.observe(heading))

    return () => observer.disconnect()
  }, [tocItems])

  return (
    <div className="flex gap-10">
      <article className="min-w-0 flex-1">
        <header className="mb-8">
          <h1 className="text-[1.75rem] font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
        </header>
        <div ref={contentRef} className="docs-prose">
          {children}
        </div>
      </article>
      <TableOfContents items={tocItems} activeId={activeId} />
    </div>
  )
}
