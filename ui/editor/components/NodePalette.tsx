import { type DragEvent, type FC, useMemo } from 'react';
import { AudioLines, BarChart3, ChevronDown, Piano, Route, Search, Sigma, Waves } from 'lucide-react';
import type { EditorNodeType } from '../nodeCatalog';
import { loadStudioNodeCatalog, resolveDefaultStudioTitle, type StudioNodeDefinition } from '../studioNodeCatalog';
import { EditorNodeIcon } from './EditorIcons';

interface NodePaletteProps {
    filter: string;
    onFilterChange: (value: string) => void;
    onAddNode?: (nodeType: string) => void;
}

/** Palette chrome for known top-level catalog categories (Studio `category` string). */
const PALETTE_CATEGORY_META: Record<string, { color: string; bg: string }> = {
    Sources: { color: 'text-blue-400', bg: 'bg-blue-500/10' },
    AUDIO: { color: 'text-rose-400', bg: 'bg-rose-500/10' },
    MIDI: { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    Effects: { color: 'text-purple-400', bg: 'bg-purple-500/10' },
    Routing: { color: 'text-amber-400', bg: 'bg-amber-500/10' },
    Math: { color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
};

const PREFERRED_CATEGORY_ORDER: string[] = ['Sources', 'AUDIO', 'MIDI', 'Effects', 'Routing', 'Math'];

const PALETTE_CATEGORY_ICONS: Record<string, typeof AudioLines> = {
    Sources: AudioLines,
    AUDIO: Waves,
    MIDI: Piano,
    Effects: BarChart3,
    Routing: Route,
    Math: Sigma,
};

function sortCategoriesPresent(defs: StudioNodeDefinition[]): string[] {
    const present = [...new Set(defs.map((d) => d.category))];
    return present.sort((a, b) => {
        const ia = PREFERRED_CATEGORY_ORDER.indexOf(a);
        const ib = PREFERRED_CATEGORY_ORDER.indexOf(b);
        if (ia === -1 && ib === -1) {
            return a.localeCompare(b);
        }
        if (ia === -1) {
            return 1;
        }
        if (ib === -1) {
            return -1;
        }
        return ia - ib;
    });
}

function paletteSearchMatch(def: StudioNodeDefinition, query: string): boolean {
    if (query.length === 0) {
        return true;
    }
    const q = query;
    const hay = [
        def.name,
        def.label ?? '',
        def.description,
        def.category,
        def.subcategory,
        ...def.tags,
    ]
        .join('\n')
        .toLowerCase();
    return hay.includes(q);
}

export const NodePalette: FC<NodePaletteProps> = ({ filter, onFilterChange, onAddNode }) => {
    const onDragStart = (event: DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const query = filter.trim().toLowerCase();
    const catalog = useMemo(() => loadStudioNodeCatalog(), []);
    const filteredNodes = useMemo(
        () => catalog.filter((def) => paletteSearchMatch(def, query)),
        [catalog, query],
    );

    const categories = useMemo(() => sortCategoriesPresent(filteredNodes), [filteredNodes]);

    return (
        <div className="flex h-full flex-col bg-transparent">
            <div className="border-b border-[var(--panel-border)] p-4">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-subtle)] transition-colors group-focus-within:text-[var(--accent)]" strokeWidth={1.9} aria-hidden="true" />
                    <input
                        type="text"
                        id="node-search"
                        aria-label="Search nodes"
                        placeholder="Search nodes..."
                        value={filter}
                        onChange={(e) => onFilterChange(e.target.value)}
                        className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel-bg)] py-2 pl-9 pr-4 text-sm font-medium text-[var(--text)] placeholder:text-[var(--text-subtle)] transition-all focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-soft)]"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {categories.map((category) => {
                    const inCategory = filteredNodes.filter((d) => d.category === category);
                    if (inCategory.length === 0) {
                        return null;
                    }
                    const categoryMeta = PALETTE_CATEGORY_META[category] ?? {
                        color: 'text-zinc-400',
                        bg: 'bg-zinc-500/10',
                    };
                    const CategoryIcon = PALETTE_CATEGORY_ICONS[category] ?? AudioLines;
                    const subKeys = [...new Set(inCategory.map((d) => d.subcategory))].sort((a, b) =>
                        a.localeCompare(b),
                    );
                    return (
                        <details key={category} className="group rounded-lg border border-[var(--panel-border)] bg-[var(--panel-bg)]/50 open:shadow-sm" open>
                            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)] [&::-webkit-details-marker]:hidden">
                                <ChevronDown
                                    className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] transition-transform duration-200 group-open:rotate-180"
                                    strokeWidth={2}
                                    aria-hidden="true"
                                />
                                <CategoryIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                                <span>{category}</span>
                            </summary>
                            <div className="space-y-0 border-t border-[var(--panel-border)] px-3 pb-3 pt-2">
                                {subKeys.map((sub, subIdx) => {
                                    const nodes = inCategory.filter((d) => d.subcategory === sub);
                                    if (nodes.length === 0) {
                                        return null;
                                    }
                                    return (
                                        <div key={`${category}-${sub}`}>
                                            {subIdx > 0 && (
                                                <hr className="my-3 border-0 border-t border-[var(--panel-border)]" />
                                            )}
                                            <div className="space-y-2">
                                                {sub !== 'General' && (
                                                    <h4 className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                                                        {sub}
                                                    </h4>
                                                )}
                                                <div className="grid grid-cols-1 gap-2">
                                                    {nodes.map((node) => {
                                                        const title = resolveDefaultStudioTitle(node);
                                                        return (
                                                            <button
                                                                key={node.name}
                                                                className="group/item relative cursor-grab active:cursor-grabbing w-full text-left"
                                                                onClick={() => onAddNode?.(node.name)}
                                                                onDragStart={(event) => onDragStart(event, node.name)}
                                                                draggable
                                                                aria-label={`Add ${title}`}
                                                            >
                                                                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[var(--accent-soft)]/0 to-[var(--accent-soft)]/0 transition-all duration-300 group-hover/item:from-[var(--accent-soft)] group-hover/item:to-transparent" />
                                                                <div className="relative flex items-center gap-3 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-bg)] p-2.5 transition-all hover:bg-[var(--panel-muted)]/60">
                                                                    <div
                                                                        className={`flex h-8 w-8 items-center justify-center rounded-md border border-[var(--panel-border)] ${categoryMeta.bg} transition-colors`}
                                                                    >
                                                                        <EditorNodeIcon
                                                                            type={node.name as EditorNodeType}
                                                                            className={`${categoryMeta.color} h-4 w-4 transition-transform group-hover/item:scale-110`}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs font-semibold text-[var(--text)] transition-colors">{title}</span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </details>
                    );
                })}
            </div>
        </div>
    );
};
