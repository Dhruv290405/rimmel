// TypeScript version of the drag-and-drop example (source-only)
// This file can be used with the project's build system or a bundler.
import { rml } from 'rimmel';

export function DraggableMixin() {
  let startX = 0, startY = 0, origX = 0, origY = 0, dragging = false;

  function onPointerDown(e: PointerEvent) {
    const el = e.currentTarget as HTMLElement;
    dragging = true;
    el.setPointerCapture?.(e.pointerId);
    startX = e.clientX;
    startY = e.clientY;
    const rect = el.getBoundingClientRect();
    origX = rect.left - (el.offsetParent as HTMLElement)?.getBoundingClientRect().left || 0;
    origY = rect.top - (el.offsetParent as HTMLElement)?.getBoundingClientRect().top || 0;

    function onMove(ev: PointerEvent) {
      if (!dragging) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      el.style.transform = `translate(${origX + dx}px, ${origY + dy}px)`;
    }

    function onUp(ev: PointerEvent) {
      dragging = false;
      el.releasePointerCapture?.(ev.pointerId);
      window.removeEventListener('pointermove', onMove as any);
      window.removeEventListener('pointerup', onUp as any);
    }

    window.addEventListener('pointermove', onMove as any);
    window.addEventListener('pointerup', onUp as any);
  }

  return {
    onpointerdown: onPointerDown,
    style: { touchAction: 'none', willChange: 'transform' }
  } as const;
}

export const Box = (text: string, x = 20, y = 20) => rml`
  <div class="box" style="transform: translate(${x}px, ${y}px);" ...${DraggableMixin()}>${text}</div>
`;

export default function mount(root: HTMLElement) {
  root.innerHTML = rml`
    ${Box('Drag me', 20, 20)}
    ${Box('Me too', 200, 80)}
  `;
}
