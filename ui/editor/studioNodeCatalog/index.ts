/**
 * Studio node UI JSON catalog — types, loader, validation, React Flow handle helpers.
 *
 * @see docs_v2/10-studio-node-ui-json-catalog.md
 */
export type {
    RawStudioNodeDefinition,
    StudioNodeDefinition,
    StudioNodePortInterface,
    StudioNodePortSchema,
    StudioNodePortValueType,
    StudioNodeType,
    StudioNodeValidationResult,
} from './types';
export {
    getStudioDspHintForEditorType,
    getStudioDspSource,
    getStudioNodeDefinition,
    loadStudioNodeCatalog,
    resetStudioNodeCatalogCache,
    resolveStudioCustomComponentKey,
} from './catalog';
export { getStudioSourceHandleIds, getStudioTargetHandleIds } from './handles';
export { legacyBootstrapStudioDefinitions, STUDIO_UI_TYPE_BY_EDITOR } from './legacyBootstrap';
export {
    categorySlugToCategoryLabel,
    loadBuiltInNodeRawDefinitions,
    slugToCatalogLabel,
    subcategorySlugToLabel,
} from './loadBuiltInNodeFiles';
export { normalizeStudioNodeDefinition } from './normalize';
export { humanizeStudioNodeName, resolveDefaultStudioTitle } from './title';
export { validateStudioNodeDefinition } from './validate';
