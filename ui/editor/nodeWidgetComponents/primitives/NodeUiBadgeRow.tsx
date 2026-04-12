import type { ReactNode } from 'react';

/** Horizontal wrap of status badges (file label, errors, paths). */
export function NodeUiBadgeRow({ children }: { children: ReactNode }) {
    return <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{children}</div>;
}
