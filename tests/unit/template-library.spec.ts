import { describe, expect, it } from 'vitest';
import {
    createTemplateGraphDocument,
    EDITOR_TEMPLATES,
    getEditorTemplateDefinition,
} from '../../ui/editor/templateLibrary';

describe('EDITOR_TEMPLATES', () => {
    it('includes the three expected templates', () => {
        const ids = EDITOR_TEMPLATES.map((t) => t.id);
        expect(ids).toContain('atmospheric-breakbeat-arc');
        expect(ids).toContain('medieval-strategy-longform');
        expect(ids).toContain('westcoast-gfunk-64');
    });

    it('every template has a non-empty name, description, and accentColor', () => {
        for (const template of EDITOR_TEMPLATES) {
            expect(template.name.length).toBeGreaterThan(0);
            expect(template.description.length).toBeGreaterThan(0);
            expect(template.accentColor).toMatch(/^#[0-9a-f]{6}$/i);
        }
    });
});

describe('getEditorTemplateDefinition', () => {
    it('returns the definition for a known template id', () => {
        const def = getEditorTemplateDefinition('westcoast-gfunk-64');
        expect(def).not.toBeNull();
        expect(def?.id).toBe('westcoast-gfunk-64');
        expect(def?.name).toBe('West Coast GFunk 64');
    });

    it('returns null for an unknown id', () => {
        expect(getEditorTemplateDefinition('does-not-exist')).toBeNull();
    });
});

describe('createTemplateGraphDocument', () => {
    it('creates a valid graph document from the westcoast-gfunk-64 template', () => {
        const doc = createTemplateGraphDocument('westcoast-gfunk-64', 2);
        expect(doc.name).toBe('West Coast GFunk 64');
        expect(doc.order).toBe(2);
        expect(doc.nodes.length).toBeGreaterThan(0);
        expect(doc.id).toBeTruthy();
        expect(doc.createdAt).toBeGreaterThan(0);
        expect(doc.updatedAt).toBeGreaterThan(0);
    });

    it('creates a valid graph document from the atmospheric-breakbeat-arc template', () => {
        const doc = createTemplateGraphDocument('atmospheric-breakbeat-arc');
        expect(doc.nodes.length).toBeGreaterThan(0);
        expect(doc.edges.length).toBeGreaterThan(0);
    });

    it('creates a valid graph document from the medieval-strategy-longform template', () => {
        const doc = createTemplateGraphDocument('medieval-strategy-longform');
        expect(doc.nodes.length).toBeGreaterThan(0);
    });

    it('throws for an unknown template id', () => {
        expect(() => createTemplateGraphDocument('unknown-template')).toThrow(
            /Unknown DIN editor template/,
        );
    });

    it('clones the template graph so documents are independent', () => {
        const a = createTemplateGraphDocument('westcoast-gfunk-64');
        const b = createTemplateGraphDocument('westcoast-gfunk-64');
        expect(a.id).not.toBe(b.id);
        // Mutating one should not affect the other
        if (a.nodes[0]) {
            (a.nodes[0].data as Record<string, unknown>).__test__ = true;
        }
        expect((b.nodes[0]?.data as Record<string, unknown>).__test__).toBeUndefined();
    });
});
