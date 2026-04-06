import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NodeProps } from '@xyflow/react';
import { isLikelyAudioFile } from '../audioImport';
import { addAssetFromFile, getAssetObjectUrl, listAssets, subscribeAssets, type AudioLibraryAsset } from '../audioLibrary';
import { audioEngine } from '../AudioEngine';
import {
    NodeCheckboxField,
    NodeHandleRow,
    NodeShell,
    NodeTextField,
    NodeValueBadge,
    NodeWidget,
    NodeWidgetTitle,
} from '../components/NodeShell';
import { useAudioGraphStore } from '../store';
import type { ConvolverNodeData } from '../types';

const ConvolverNode = memo(({ id, data, selected }: NodeProps) => {
    const convolverData = data as ConvolverNodeData;
    const updateNodeData = useAudioGraphStore((state) => state.updateNodeData);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [libraryAssets, setLibraryAssets] = useState<AudioLibraryAsset[]>([]);
    const [libraryQuery, setLibraryQuery] = useState('');
    const externalAssetPath = typeof convolverData.assetPath === 'string' ? convolverData.assetPath.trim() : '';
    const selectedImpulseId = typeof convolverData.impulseId === 'string' ? convolverData.impulseId : '';

    const refreshAssets = useCallback(() => {
        listAssets()
            .then((assets) => setLibraryAssets(assets))
            .catch(() => setLibraryAssets([]));
    }, []);

    useEffect(() => {
        refreshAssets();
        return subscribeAssets(refreshAssets);
    }, [refreshAssets]);

    const filteredAssets = useMemo(() => {
        const query = libraryQuery.trim().toLowerCase();
        if (!query) return libraryAssets;
        return libraryAssets.filter((asset) => asset.name.toLowerCase().includes(query));
    }, [libraryAssets, libraryQuery]);

    const applyImpulseUpdate = useCallback((payload: Partial<ConvolverNodeData>) => {
        updateNodeData(id, payload);
        audioEngine.updateNode(id, payload);
    }, [id, updateNodeData]);

    const applyImpulseAsset = useCallback(async (
        assetId: string,
        fallbackName?: string,
        uploadedAsset?: AudioLibraryAsset,
    ) => {
        if (!assetId) {
            setUploadError(null);
            applyImpulseUpdate({
                assetPath: '',
                impulseId: '',
                impulseSrc: '',
                impulseFileName: '',
            });
            return;
        }

        const objectUrl = await getAssetObjectUrl(assetId);
        if (!objectUrl) {
            setUploadError('Cache unavailable');
            return;
        }

        const asset = uploadedAsset ?? libraryAssets.find((entry) => entry.id === assetId);
        setUploadError(null);
        applyImpulseUpdate({
            assetPath: asset?.relativePath || externalAssetPath || (asset?.name ? `impulses/${asset.name}` : undefined),
            impulseId: assetId,
            impulseSrc: objectUrl,
            impulseFileName: asset?.fileName || asset?.name || fallbackName || convolverData.impulseFileName || 'Impulse',
        });
    }, [applyImpulseUpdate, convolverData.impulseFileName, externalAssetPath, libraryAssets]);

    const handleBrowseClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []).filter(isLikelyAudioFile);
        if (files.length === 0) return;

        void (async () => {
            setUploadError(null);
            try {
                let primary: AudioLibraryAsset | undefined;
                for (const file of files) {
                    const asset = await addAssetFromFile(file, { kind: 'impulse' });
                    primary ??= asset;
                }
                if (primary) {
                    await applyImpulseAsset(primary.id, primary.name, primary);
                }
            } catch {
                setUploadError('Upload failed');
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        })();
    }, [applyImpulseAsset]);

    const handleLibrarySelect = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        void applyImpulseAsset(event.target.value);
    }, [applyImpulseAsset]);

    const hasImpulse = Boolean(convolverData.impulseSrc);
    const fileLabel = convolverData.impulseFileName || (hasImpulse ? 'Impulse loaded' : 'No impulse');

    return (
        <NodeShell
            nodeType="convolver"
            title={convolverData.label?.trim() || 'Convolver'}
            selected={selected}
            badge={<NodeValueBadge>{hasImpulse ? 'impulse' : 'empty'}</NodeValueBadge>}
        >
            <NodeHandleRow direction="source" label="out" handleId="out" handleKind="audio" />

            <NodeWidget title={<NodeWidgetTitle icon="convolver">Impulse + normalize</NodeWidgetTitle>}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    title="Select one or more impulse response files"
                />

                <button type="button" className="ui-token-trigger-row" onClick={handleBrowseClick}>
                    <span>Browse impulse</span>
                    <span className="ui-token-trigger-row-icon" aria-hidden="true">FILE</span>
                </button>

                <div className="node-shell__widget-field">
                    <span className="node-shell__widget-field-label">Library</span>
                    <NodeTextField
                        value={libraryQuery}
                        onChange={setLibraryQuery}
                        placeholder="Search assets"
                        title="Search impulse assets"
                    />
                    <select
                        className="node-shell__field"
                        value={selectedImpulseId}
                        onChange={handleLibrarySelect}
                        title="Select cached impulse response"
                    >
                        <option value="">Select cached file</option>
                        {filteredAssets.map((asset) => (
                            <option key={asset.id} value={asset.id}>{asset.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <NodeValueBadge live={hasImpulse}>{fileLabel}</NodeValueBadge>
                    {externalAssetPath && !hasImpulse ? <NodeValueBadge>{externalAssetPath}</NodeValueBadge> : null}
                    {uploadError ? <NodeValueBadge>{uploadError}</NodeValueBadge> : null}
                </div>

                <NodeCheckboxField
                    checked={convolverData.normalize}
                    onChange={(checked) => applyImpulseUpdate({ normalize: checked })}
                    label="Normalize"
                />
            </NodeWidget>

            <NodeHandleRow direction="target" label="in" handleId="in" handleKind="audio" />
        </NodeShell>
    );
});

ConvolverNode.displayName = 'ConvolverNode';
export default ConvolverNode;
