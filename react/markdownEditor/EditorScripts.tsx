import type { EditorCommand } from "util/lib/react/markdownEditor/EditorTypes";
import type { MkDocument } from "@app-types/game";

/// --- DOM --- ///
// export async function buildHtml(document: MkDocument): Promise<DocumentFragment> {
//   const fragment = document.createDocumentFragment();

//   for (const id of document.order) {
//     const block = document.blocks[id];
//     if (!block) continue;
//     fragment.appendChild(buildBlock(block));
//   }

//   return fragment;
// }

// function buildBlock(block: Block): HTMLElement {
//   if (block.type === 'table') return buildTable(block);
//   if (block.type === 'moralityPairs') return buildReactPlaceholder(block.id, 'morality-pairs');

//   const tagMap: Record<string, string> = {
//     paragraph: 'p',
//     h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', h6: 'h6',
//     listItemOrdered: 'li',
//     listItemUnordered: 'li',
//     blockquote: 'blockquote',
//   };

//   const el = document.createElement(tagMap[block.type]);
//   el.id = block.id;
//   for (const node of block.content) {
//     el.appendChild(buildInlineNode(node));
//   }

//   return el;
// }

function buildReactPlaceholder(id: string, componentName: string): HTMLElement {
  const el = document.createElement('div');
  el.id = id;
  el.dataset.reactComponent = componentName;
  return el;
}

// function buildTable(block: TableBlock): HTMLTableElement {
//   const table = document.createElement('table');
//   table.id = block.id;
//   const tbody = document.createElement('tbody');
//   for (const row of block.rows) {
//     const tr = document.createElement('tr');
//     tr.id = row.id;
//     for (const cell of row.cells) {
//       const td = document.createElement('td');
//       td.id = cell.id;
//       for (const node of cell.content) {
//         td.appendChild(buildInlineNode(node));
//       }
//       tr.appendChild(td);
//     }
//     tbody.appendChild(tr);
//   }
//   table.appendChild(tbody);
//   return table;
// }

function createTableDom(rows: number, cols: number): HTMLTableElement {
  const table = document.createElement('table');
  table.id = crypto.randomUUID();
  const tbody = document.createElement('tbody');
  for (let r = 0; r < rows; r++) {
    const tr = document.createElement('tr');
    tr.id = crypto.randomUUID();
    for (let c = 0; c < cols; c++) {
      const td = document.createElement('td');
      td.id = crypto.randomUUID();
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}

export function insertMoralityPairsBlock(
  lastFocusedRef: React.RefObject<HTMLElement | null>,
  contentsRef: React.RefObject<HTMLElement | null>,
  dispatch: (cmd: EditorCommand) => void
) {
  const anchor = lastFocusedRef.current;
  const el = buildReactPlaceholder(crypto.randomUUID(), 'morality-pairs');
  const elWrapper = wrapBlock(el, 0);
  if (anchor) {
    const anchorWrapper = anchor.parentElement!;
    anchorWrapper.insertAdjacentElement('afterend', elWrapper);
    dispatch({ type: 'element-created', id: el.id, tag: 'morality-pairs', afterId: anchor.id || null, content: '' });
  } else if (contentsRef.current) {
    const lastWrapper = contentsRef.current.lastElementChild as HTMLElement | null;
    const lastBlock = lastWrapper ? getBlockFromWrapper(lastWrapper) : null;
    contentsRef.current.appendChild(elWrapper);
    dispatch({ type: 'element-created', id: el.id, tag: 'morality-pairs', afterId: lastBlock?.id || null, content: '' });
  }
}

export function insertTable(
  lastFocusedRef: React.RefObject<HTMLElement | null>,
  contentsRef: React.RefObject<HTMLElement | null>,
  dispatch: (cmd: EditorCommand) => void
) {
  const anchor = lastFocusedRef.current;
  const table = createTableDom(3, 3);
  table.contentEditable = 'true';
  const tableWrapper = wrapBlock(table, 0);
  if (anchor) {
    const anchorWrapper = anchor.parentElement!;
    anchorWrapper.insertAdjacentElement('afterend', tableWrapper);
    dispatch({ type: 'element-created', id: table.id, tag: 'table', afterId: anchor.id || null, content: '' });
  } else if (contentsRef.current) {
    const lastWrapper = contentsRef.current.lastElementChild as HTMLElement | null;
    const lastBlock = lastWrapper ? getBlockFromWrapper(lastWrapper) : null;
    contentsRef.current.appendChild(tableWrapper);
    dispatch({ type: 'element-created', id: table.id, tag: 'table', afterId: lastBlock?.id || null, content: '' });
  }
}

// function buildInlineNode(node: InlineNode): Node {
//   // check for special nodes first
//   if (node.dataLink) {
//     const span = document.createElement('span');
//     span.id = crypto.randomUUID();
//     span.dataset.reactComponent = 'inline-data-link';
//     span.dataset.link = JSON.stringify(node.dataLink);
//     if (node.text) span.dataset.givenLabel = node.text;
//     span.contentEditable = 'false';
//     return span;
//   }

//   // ... then create a basic html inline node
//   const text = document.createTextNode(node.text);
//   if (!node.bold && !node.italic) return text;

//   let wrapper: HTMLElement | undefined;
//   if (node.bold) {
//     wrapper = document.createElement('strong');
//     wrapper.appendChild(text);
//   }
//   if (node.italic) {
//     const em = document.createElement('em');
//     em.appendChild(wrapper ?? text);
//     wrapper = em;
//   }
//   return wrapper!;
// }

export function changeBlockType(lastFocusedRef: React.RefObject<HTMLElement | null>, newTag: string, dispatch: (cmd: EditorCommand) => void) {
  const el = lastFocusedRef.current;
  if (!el) return;
  const beforeTag = el.tagName.toLowerCase();
  if (beforeTag === newTag) return;
  const newEl = document.createElement(newTag);
  newEl.id = el.id;
  newEl.contentEditable = el.contentEditable;
  newEl.className = el.className;
  newEl.innerHTML = el.innerHTML;
  el.replaceWith(newEl);
  lastFocusedRef.current = newEl;
  dispatch({ type: 'element-changed-type', id: newEl.id, before: beforeTag, after: newTag });
};

export function clearFocusedBlock(lastFocusedRef: React.RefObject<HTMLElement | null>, lastFocusedCellRef?: React.RefObject<HTMLElement | null>) {
  if (lastFocusedRef.current) {
    lastFocusedRef.current.classList.remove('be-focused');
    lastFocusedRef.current = null;
  }
  if (lastFocusedCellRef?.current) {
    lastFocusedCellRef.current.classList.remove('be-focused');
    lastFocusedCellRef.current = null;
  }
};

/// --- WRAPPER HELPERS --- ///
export function wrapBlock(block: HTMLElement, index: number): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'block-line';

  const gutter = document.createElement('div');
  gutter.className = 'block-gutter';
  gutter.contentEditable = 'false';
  gutter.textContent = String(index);
  gutter.title = block.id;
  gutter.dataset.tooltip = block.id;

  const after = document.createElement('div');
  after.className = 'block-after';
  after.contentEditable = 'false';
  // ... create button to delete line

  wrapper.appendChild(gutter);
  wrapper.appendChild(block);
  return wrapper;
}

export function getBlockFromWrapper(wrapper: HTMLElement): HTMLElement | null {
  return wrapper.lastElementChild as HTMLElement | null;
}

export function renumberGutters(container: HTMLElement): void {
  let index = 1;
  for (const child of container.children) {
    const gutter = (child as HTMLElement).querySelector(':scope > .block-gutter');
    if (gutter) gutter.textContent = String(index);
    index++;
  }
}

/// --- EVENTS --- ///
export function handleKeyUp(
  e: React.KeyboardEvent<HTMLElement>,
  modifiers: {
    alt: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
    ctrl: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
    shift: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  }
) {
  // console.log(`---> handleKeyUp(${e.key})`);
  const target = e.target as HTMLElement;
  const [isAlt, setAlt] = modifiers.alt;
  const [isCtrl, setCtrl] = modifiers.ctrl;
  const [isShift, setShift] = modifiers.shift;

  // Skip if the event fired on the section itself rather than a block element
  if (target === e.currentTarget) return;

  // Let native inputs handle their own keyboard events
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;

  // Capture modifier keys
  if (["Alt", "Ctrl", "Shift"].includes(e.key)) {
    switch (e.key) {
      case "Alt":
        setAlt(false);
        break;
      case "Ctrl":
        setCtrl(false);
        break;
      case "Shift":
        setShift(false);
        break;
    }
    return;
  }
}

export function handleKeyDown(
  e: React.KeyboardEvent<HTMLElement>,
  modifiers: {
    alt: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
    ctrl: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
    shift: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  },
  dispatch: (cmd: EditorCommand) => void
) {
  console.log(`---> handleKeyDown(${e.key})`);
  const target = e.target as HTMLElement;
  // console.log(target);
  const [isAlt, setAlt] = modifiers.alt;
  const [isCtrl, setCtrl] = modifiers.ctrl;
  const [isShift, setShift] = modifiers.shift;

  // Skip if the event fired on the section itself rather than a block element
  if (target === e.currentTarget) return;

  // Let native inputs handle their own keyboard events
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;

  // If a printable character is typed while the caret is inside a non-editable inline element
  // (e.g. an InlineDataLink span), escape the caret to just after that element first so the
  // character is inserted in the surrounding editable block rather than being swallowed.
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.getRangeAt(0).startContainer;
      while (node && node !== e.currentTarget) {
        if (node instanceof HTMLElement && node.contentEditable === 'false') {
          const escaped = document.createRange();
          escaped.setStartAfter(node);
          escaped.collapse(true);
          sel.removeAllRanges();
          sel.addRange(escaped);
          break;
        }
        node = node.parentNode;
      }
    }
  }

  // Capture modifier keys
  if (["Alt", "Ctrl", "Shift"].includes(e.key)) {
    switch (e.key) {
      case "Alt":
        setAlt(true);
        break;
      case "Ctrl":
        setCtrl(true);
        break;
      case "Shift":
        setShift(true);
        break;
    }
    return;
  }

  const elementType = target.tagName.toLowerCase();

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);

  switch (e.key) {
    case "ArrowDown": {
      if (!isInTable(target)) break;
      const cell = getCellFromSelection(sel);
      if (!cell) break;
      const below = getAdjacentCell(cell, 'down');
      if (!below) break;
      e.preventDefault();
      focusCellStart(below);
      break;
    }
    case "ArrowLeft": {
      if (!isInTable(target)) break;
      const cell = getCellFromSelection(sel);
      if (!cell) break;
      if (!isAtCellStart(sel, cell)) break;
      const prev = getAdjacentCell(cell, 'left');
      if (!prev) break;
      e.preventDefault();
      focusCellEnd(prev);
      break;
    }
    case "ArrowRight": {
      if (!isInTable(target)) break;
      const cell = getCellFromSelection(sel);
      if (!cell) break;
      if (!isAtCellEnd(sel, cell)) break;
      const next = getAdjacentCell(cell, 'right');
      if (!next) break;
      e.preventDefault();
      focusCellStart(next);
      break;
    }
    case "ArrowUp": {
      if (!isInTable(target)) break;
      const cell = getCellFromSelection(sel);
      if (!cell) break;
      const above = getAdjacentCell(cell, 'up');
      if (!above) break;
      e.preventDefault();
      focusCellStart(above);
      break;
    }
    case "Backspace": {
      // Not at the beginning of the line — let the browser handle it normally
      if (!isAtStart(range, target)) return;

      e.preventDefault();

      const wrapper = target.parentElement;
      const container = wrapper?.parentElement;

      // Only element in the document — nothing to merge into
      if (!container || container.children.length <= 1) return;

      const prevWrapper = wrapper!.previousElementSibling as HTMLElement | null;
      const prev = prevWrapper ? getBlockFromWrapper(prevWrapper) : null;
      if (!prev) return;

      // Save cursor position at the end of the previous element (the join point)
      const joinRange = document.createRange();
      joinRange.selectNodeContents(prev);
      joinRange.collapse(false);

      if (target.textContent === '') {
        // Empty line: just remove it
        dispatch({ type: 'element-deleted', id: target.id, tag: elementType, afterId: prev.id || null, content: '' });
        wrapper!.remove();
      } else {
        // Non-empty line: capture content before the merge, then move into previous element
        const targetContent = target.innerHTML;
        const prevBefore = prev.innerHTML;
        while (target.firstChild) {
          prev.appendChild(target.firstChild);
        }
        wrapper!.remove();
        dispatch({ type: 'element-deleted', id: target.id, tag: elementType, afterId: prev.id || null, content: targetContent });
        dispatch({ type: 'element-changed-contents', id: prev.id, before: prevBefore, after: prev.innerHTML });
      }

      sel.removeAllRanges();
      sel.addRange(joinRange);
      break;
    }
    case "Enter": {
      e.preventDefault();

      const wrapper = target.parentElement;
      if (!wrapper?.parentElement) return;

      // Headings drop back to paragraph; everything else continues as the same type
      const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      const newTag = headingTags.includes(elementType) ? 'p' : elementType;
      const newElement = document.createElement(newTag);
      newElement.id = crypto.randomUUID();
      newElement.contentEditable = 'true';

      // Extract everything after the cursor and place it in the new element
      if (target.lastChild) {
        const afterRange = document.createRange();
        afterRange.setStart(range.endContainer, range.endOffset);
        afterRange.setEndAfter(target.lastChild);
        newElement.appendChild(afterRange.extractContents());
      }

      const newWrapper = wrapBlock(newElement, 0);
      wrapper.insertAdjacentElement('afterend', newWrapper);
      dispatch({ type: 'element-created', id: newElement.id, tag: newTag, afterId: target.id || null, content: newElement.innerHTML });

      // Move cursor to the start of the new element
      const newRange = document.createRange();
      newRange.setStart(newElement, 0);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      break;
    }
  }
}

function isAtStart(range: Range, element: HTMLElement): boolean {
  if (range.startOffset !== 0) return false;
  let node: Node = range.startContainer;
  while (node !== element) {
    if (node.previousSibling) return false;
    if (!node.parentNode) return false;
    node = node.parentNode;
  }
  return true;
}

function isInTable(element: HTMLElement): boolean {
  return element.tagName === 'TABLE';
}

function getCellFromSelection(sel: Selection): HTMLTableCellElement | null {
  let node: Node | null = sel.focusNode;
  while (node) {
    if (node instanceof HTMLTableCellElement) return node;
    node = node.parentNode;
  }
  return null;
}

function isAtCellStart(sel: Selection, cell: HTMLTableCellElement): boolean {
  const range = sel.getRangeAt(0);
  if (!range.collapsed) return false;
  if (range.startOffset !== 0) return false;
  let node: Node = range.startContainer;
  while (node !== cell) {
    if (node.previousSibling) return false;
    if (!node.parentNode) return false;
    node = node.parentNode;
  }
  return true;
}

function isAtCellEnd(sel: Selection, cell: HTMLTableCellElement): boolean {
  const range = sel.getRangeAt(0);
  if (!range.collapsed) return false;
  const container = range.endContainer;
  if (container.nodeType === Node.TEXT_NODE) {
    if (range.endOffset !== (container.textContent?.length ?? 0)) return false;
  } else {
    if (range.endOffset !== container.childNodes.length) return false;
  }
  let node: Node = container;
  while (node !== cell) {
    if (node.nextSibling) return false;
    if (!node.parentNode) return false;
    node = node.parentNode;
  }
  return true;
}

function focusCellStart(cell: HTMLTableCellElement) {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.setStart(cell, 0);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

function focusCellEnd(cell: HTMLTableCellElement) {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.selectNodeContents(cell);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

function getAdjacentCell(cell: HTMLTableCellElement, direction: 'up' | 'down' | 'left' | 'right'): HTMLTableCellElement | null {
  const row = cell.parentElement as HTMLTableRowElement | null;
  if (!row) return null;
  const cellIndex = Array.from(row.cells).indexOf(cell);

  switch (direction) {
    case 'left': {
      if (cellIndex > 0) return row.cells[cellIndex - 1];
      // Wrap to last cell of previous row
      const prevRow = row.previousElementSibling as HTMLTableRowElement | null;
      return prevRow ? prevRow.cells[prevRow.cells.length - 1] : null;
    }
    case 'right': {
      if (cellIndex < row.cells.length - 1) return row.cells[cellIndex + 1];
      // Wrap to first cell of next row
      const nextRow = row.nextElementSibling as HTMLTableRowElement | null;
      return nextRow ? nextRow.cells[0] : null;
    }
    case 'up': {
      const prevRow = row.previousElementSibling as HTMLTableRowElement | null;
      return prevRow && cellIndex < prevRow.cells.length ? prevRow.cells[cellIndex] : null;
    }
    case 'down': {
      const nextRow = row.nextElementSibling as HTMLTableRowElement | null;
      return nextRow && cellIndex < nextRow.cells.length ? nextRow.cells[cellIndex] : null;
    }
  }
}
