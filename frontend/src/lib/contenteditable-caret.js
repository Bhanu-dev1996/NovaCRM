export function plainTextFromEditor(el) {
  if (!el) return "";
  return el.innerText.replace(/\r\n/g, "\n");
}

export function caretOffsetInEditor(el) {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !el) return 0;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.endContainer)) return plainTextFromEditor(el).length;
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.endContainer, range.endOffset);
  return pre.toString().length;
}

export function setCaretOffsetInEditor(el, offset) {
  const sel = window.getSelection();
  if (!el || !sel) return;
  const range = document.createRange();
  let remaining = Math.max(0, offset);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const len = node.textContent?.length ?? 0;
    if (remaining <= len) {
      range.setStart(node, remaining);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    remaining -= len;
    node = walker.nextNode();
  }
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}
