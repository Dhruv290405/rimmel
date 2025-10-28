import { rml } from 'rimmel';
import { BehaviorSubject } from 'rxjs';

const ROW_COUNT = 500;
const COL_COUNT = 6;
const ROW_HEIGHT = 32;

// Create a per-row BehaviorSubject with an array of cell values
const rows = Array.from({ length: ROW_COUNT }, (_, i) =>
  new BehaviorSubject(Array.from({ length: COL_COUNT }, (__, c) => `R${i}C${c}`))
);

function createRowElement(index: number) {
  const row$ = rows[index];

  // render the row as an rml template bound to the row$ BehaviorSubject
  const node = document.createElement('div');
  node.className = 'row';
  node.style.position = 'absolute';
  node.style.height = `${ROW_HEIGHT}px`;
  node.style.left = '0';
  node.style.right = '0';

  // Mount the reactive template into the row element
  const render = () => {
    node.innerHTML = rml`
      <div style="transform: translateY(${index * ROW_HEIGHT}px); display:flex; align-items:center; height:${ROW_HEIGHT}px;">
        ${row$.value.map((cellValue: string, col: number) => rml`<div class="cell" style="padding:4px 8px; flex:1" data-col="${col}" data-row="${index}">${cellValue}</div>`)}
      </div>
    `;

    // Add click-to-edit handlers for cells
    node.querySelectorAll('.cell').forEach((el) => {
      const e = el as HTMLElement;
      e.onclick = () => {
        const col = Number(e.dataset.col);
        const current = row$.value.slice();
        const input = document.createElement('input');
        input.value = current[col];
        input.style.width = '100%';
        e.innerHTML = '';
        e.appendChild(input);
        input.focus();

        function commit() {
          current[col] = input.value;
          row$.next(current);
          render();
        }

        input.onblur = commit;
        input.onkeydown = (ev) => {
          if (ev.key === 'Enter') commit();
          if (ev.key === 'Escape') render();
        };
      };
    });
  };

  // initial render
  render();
  // subscribe to changes
  row$.subscribe(() => render());

  return node;
}

function Grid() {
  const container = document.createElement('div');
  container.id = 'grid';
  container.style.height = '400px';
  container.style.overflow = 'auto';
  container.style.position = 'relative';

  const viewport = document.createElement('div');
  viewport.style.position = 'relative';
  viewport.style.height = `${ROW_COUNT * ROW_HEIGHT}px`;
  container.appendChild(viewport);

  const pool: Record<number, HTMLElement> = {};

  function render() {
    const scrollTop = container.scrollTop;
    const clientHeight = container.clientHeight || 400;
    const start = Math.floor(scrollTop / ROW_HEIGHT);
    const visible = Math.ceil(clientHeight / ROW_HEIGHT) + 3;

    const end = Math.min(ROW_COUNT, start + visible);

    // remove nodes out of range
    for (const idxStr of Object.keys(pool)) {
      const idx = Number(idxStr);
      if (idx < start || idx >= end) {
        viewport.removeChild(pool[idx]);
        delete pool[idx];
      }
    }

    // add visible nodes
    for (let i = start; i < end; i++) {
      if (!pool[i]) {
        const el = createRowElement(i);
        pool[i] = el;
        viewport.appendChild(el);
      }
    }
  }

  container.addEventListener('scroll', () => requestAnimationFrame(render));
  render();
  return container;
}

// inject some lightweight styles (keeps index.html minimal)
const style = document.createElement('style');
style.textContent = `
  .row { box-sizing: border-box; }
  .cell { border-right: 1px solid #eee; }
`;
document.head.appendChild(style);

document.getElementById('grid-root')!.appendChild(Grid());

export {};
