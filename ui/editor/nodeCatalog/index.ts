export {
    getEditorNodeCatalog,
    humanizeStudioNodeName,
    mapStudioCategoryToPaletteCategory,
    MATH_OPERATION_INPUT_LABELS,
    NODE_CATEGORY_ORDER,
    PATCH_AUDIO_INPUT_HANDLE,
    PATCH_AUDIO_OUTPUT_HANDLE,
    PATCH_INPUT_HANDLE_PREFIX,
    PATCH_OUTPUT_HANDLE_PREFIX,
} from './data';
export { getNodeHandleDescriptors } from './dynamic';
export { buildAgentNodeCatalogMarkdown, getNodeCatalogEntry, groupCatalogByCategory } from './presentation';
export { getNodeTaxonomy, NODE_TAXONOMY } from '../faust/taxonomy';
export type {
    EditorNodeType,
    HandleDescriptor,
    HandleDirection,
    NodeCatalogEntry,
    PaletteCategory,
} from './types';
export type { NodeTaxonomy, StructuralNodeType } from '../faust/taxonomy';

/** Studio node UI catalog (§10): types, loader, validation, React Flow handle helpers. */
export type {
    RawStudioNodeDefinition,
    StudioNodeDefinition,
    StudioNodePortInterface,
    StudioNodePortSchema,
    StudioNodePortValueType,
    StudioNodeType,
    StudioNodeValidationResult,
} from './definition';
export {
    getStudioDspHintForEditorType,
    getStudioDspSource,
    getStudioNodeDefinition,
    loadStudioNodeCatalog,
    resetStudioNodeCatalogCache,
    resolveStudioCustomComponentKey,
} from './catalog';
export {
    getStudioSourceHandleIds,
    getStudioTargetHandleIds,
    humanizeStudioPortName,
    studioDefinitionToHandleDescriptors,
} from './handles';
export { descriptorToHandleKind, portValueTypeToHandleKind, type PortHandleKind } from './portHandleKind';
export { legacyBootstrapStudioDefinitions, STUDIO_UI_TYPE_BY_EDITOR } from './legacyBootstrap';
export {
    categorySlugToCategoryLabel,
    loadBuiltInNodeRawDefinitions,
    slugToCatalogLabel,
    subcategorySlugToLabel,
} from './loadBuiltInNodeFiles';
export { normalizeStudioNodeDefinition } from './normalize';
export { resolveDefaultStudioTitle } from './title';
export { validateStudioNodeDefinition } from './validate';
