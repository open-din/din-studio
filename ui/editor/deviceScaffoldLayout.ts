import type { DeviceProfile } from './deviceProfileTypes';

const DEFAULT_CELL_W = 120;
const DEFAULT_CELL_H = 100;
const SPLIT_OFFSET = 400;

/**
 * Flow coordinates for each control in `profile.controls` order (matches scaffold node order).
 */
export function computeDeviceScaffoldPositions(
    profile: DeviceProfile,
    anchor: { x: number; y: number },
    options?: { cellW?: number; cellH?: number }
): Array<{ x: number; y: number }> {
    const columns = profile.columns ?? 4;
    const cellW = options?.cellW ?? DEFAULT_CELL_W;
    const cellH = options?.cellH ?? DEFAULT_CELL_H;
    const baseY = anchor.y - 150;

    const groupIndices = new Map<string, number>();
    const positions: Array<{ x: number; y: number }> = [];

    for (const control of profile.controls) {
        const g = control.group;
        const idx = groupIndices.get(g) ?? 0;
        groupIndices.set(g, idx + 1);

        if (profile.layout === 'split-grid' && (g === 'pads-left' || g === 'pads-right')) {
            const baseX = g === 'pads-left' ? anchor.x - SPLIT_OFFSET : anchor.x + SPLIT_OFFSET;
            const col = idx % columns;
            const row = Math.floor(idx / columns);
            positions.push({ x: baseX + col * cellW, y: baseY + row * cellH });
        } else if (g === 'touch-strip-left') {
            positions.push({ x: anchor.x - 320, y: baseY + 4 * cellH + 30 });
        } else if (g === 'touch-strip-right') {
            positions.push({ x: anchor.x + 200, y: baseY + 4 * cellH + 30 });
        } else if (g === 'encoder') {
            positions.push({ x: anchor.x - 40, y: baseY + 4 * cellH + 30 });
        } else {
            const col = idx % columns;
            const row = Math.floor(idx / columns);
            positions.push({ x: anchor.x + col * cellW, y: baseY + row * cellH });
        }
    }

    return positions;
}
