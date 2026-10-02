import { Fragment, useMemo } from 'react'
import type { ReactNode } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

function Tex({ tex, block }: { tex: string; block?: boolean }) {
  const html = useMemo(() => katex.renderToString(tex, { displayMode: block, throwOnError: false, trust: false, strict: 'ignore' }), [tex, block])
  return block ? <div className="math-block" dangerouslySetInnerHTML={{ __html: html }} /> : <span dangerouslySetInnerHTML={{ __html: html }} />
}

/** Inline: **bold**, `code`, $math$. Text is rendered as React text nodes (never as HTML). */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\$[^$\n]+\$)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tok = m[0]
    const key = `${keyBase}-${i++}`
    if (tok.startsWith('**')) out.push(<strong key={key}>{tok.slice(2, -2)}</strong>)
    else if (tok.startsWith('`')) out.push(<code key={key} className="mono">{tok.slice(1, -1)}</code>)
    else out.push(<Tex key={key} tex={tok.slice(1, -1)} />)
    last = m.index + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function Markdown({ source }: { source: string }) {
  const blocks = useMemo(() => {
    const lines = source.replace(/\r\n/g, '\n').split('\n')
    const nodes: ReactNode[] = []
    let i = 0
    let key = 0
    while (i < lines.length) {
      const line = lines[i]
      if (line.trim() === '') { i++; continue }
      if (line.trim().startsWith('```')) {
        const buf: string[] = []
        i++
        while (i < lines.length && !lines[i].trim().startsWith('```')) buf.push(lines[i++])
        i++
        nodes.push(<pre key={key++} className="code"><code>{buf.join('\n')}</code></pre>)
        continue
      }
      if (line.trim().startsWith('$$')) {
        const buf: string[] = [line.trim().replace(/^\$\$/, '')]
        while (!buf[buf.length - 1].includes('$$') && i + 1 < lines.length) buf.push(lines[++i])
        i++
        nodes.push(<Tex key={key++} block tex={buf.join('\n').replace(/\$\$/g, '').trim()} />)
        continue
      }
      const h = /^(#{1,3})\s+(.*)$/.exec(line)
      if (h) {
        const level = h[1].length
        const content = inline(h[2], `h${key}`)
        nodes.push(level === 1 ? <h2 key={key++}>{content}</h2> : level === 2 ? <h3 key={key++}>{content}</h3> : <h4 key={key++}>{content}</h4>)
        i++
        continue
      }
      if (/^\s*[-*]\s+/.test(line)) {
        const items: string[] = []
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ''))
        nodes.push(<ul key={key++}>{items.map((t, n) => <li key={n}>{inline(t, `l${key}-${n}`)}</li>)}</ul>)
        continue
      }
      const para: string[] = []
      while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,3}\s|\s*[-*]\s|```|\$\$)/.test(lines[i])) para.push(lines[i++])
      nodes.push(<p key={key++}>{inline(para.join(' '), `p${key}`)}</p>)
    }
    return nodes
  }, [source])
  return <div className="prose">{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>
}
