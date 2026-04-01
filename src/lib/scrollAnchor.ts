/**
 * Collect elements between `node` and document root that scroll (overflow auto/scroll).
 */
export function getScrollableAncestors(node: Node | null): HTMLElement[] {
  const out: HTMLElement[] = []
  let el: Node | null = node
  if (el?.nodeType === Node.TEXT_NODE) el = el.parentNode

  while (el && el !== document.documentElement) {
    if (el instanceof HTMLElement) {
      const s = window.getComputedStyle(el)
      const oy = s.overflowY
      const ox = s.overflowX
      const o = s.overflow
      const scrollish =
        /(auto|scroll|overlay)/.test(o) ||
        /(auto|scroll|overlay)/.test(oy) ||
        /(auto|scroll|overlay)/.test(ox)
      if (scrollish && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) {
        out.push(el)
      }
    }
    el = el.parentNode
  }
  return out
}
