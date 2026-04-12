import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import { isLikelyAudioFile } from '../../audioImport';
import { addAssetFromFile, getAssetObjectUrl, listAssets, subscribeAssets, type AudioLibraryAsset } from '../../audioLibrary';
import { audioEngine } from '../../AudioEngine';
import {
    NodeCheckboxField,
    NodeHandleRow,
    NodeNumberField,
    NodeShell,
    NodeValueBadge,
    NodeWidget,
    NodeWidgetTitle,
} from '../../components/NodeShell';
import { formatConnectedValue, useTargetHandleConnection } from '../../paramConnections';
import { useAudioGraphStore } from '../../store';
import type { SamplerNodeData } from '../../types';
import { AudioAssetPickerCard } from '../audio/AudioAssetPickerCard';

const formatPlaybackRate = (value: number | null) => (value === null ? '--' : `${value.toFixed(2)}x`);
const formatDetune = (value: number | null) => (value === null ? '--' : `${Math.round(value)} c`);

export const SamplerNodeView: React.FC<NodeProps<Node<SamplerNodeData>>> = memo(({ id, data, selected }) => {
    const updateNodeData = useAudioGraphStore((state) => state.updateNodeData);
    const playbackRateConnection = useTargetHandleConnection(id, 'playbackRate');
    const detuneConnection = useTargetHandleConnection(id, 'detune');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [libraryAssets, setLibraryAssets] = useState<AudioLibraryAsset[]>([]);
    const [libraryQuery, setLibraryQuery] = useState('');
    const [libraryError, setLibraryError] = useState<string | null>(null);
    const externalAssetPath = typeof data.assetPath === 'string' ? data.assetPath.trim() : '';
    const selectedSampleId = typeof data.sampleId === 'string' ? data.sampleId : '';

    const refreshAssets = useCallback(() => {
        listAssets()
            .then((assets) => setLibraryAssets(assets))
            .catch(() => setLibraryAssets([]));
    }, []);

    useEffect(() => {
        refreshAssets();
        return subscribeAssets(refreshAssets);
    }, [refreshAssets]);

    useEffect(() => {
        setIsPlaying(false);
    }, [data.src]);

    useEffect(() => {
        return audioEngine.onSamplerEnd(id, () => {
            setIsPlaying(false);
        });
    }, [id]);

    const filteredAssets = useMemo(() => {
        const query = libraryQuery.trim().toLowerCase();
        if (!query) return libraryAssets;
        return libraryAssets.filter((asset) => asset.name.toLowerCase().includes(query));
    }, [libraryAssets, libraryQuery]);

    const applyAssetSelection = useCallback(async (
        assetId: string,
        fallbackName?: string,
        uploadedAsset?: AudioLibraryAsset,
    ) => {
        if (!assetId) {
            updateNodeData(id, {
                src: '',
                assetPath: '',
                sampleId: '',
                fileName: '',
                loaded: false,
            });
            setLibraryError(null);
            return;
        }

        const objectUrl = await getAssetObjectUrl(assetId);
        if (!objectUrl) {
            setLibraryError('Cache unavailable');
            updateNodeData(id, { loaded: false });
            return;
        }

        const asset = uploadedAsset ?? libraryAssets.find((entry) => entry.id === assetId);
        updateNodeData(id, {
            src: objectUrl,
            assetPath: asset?.relativePath || externalAssetPath || (asset?.name ? `samples/${asset.name}` : undefined),
            sampleId: assetId,
            fileName: asset?.fileName || asset?.name || fallbackName || data.fileName || 'Cached sample',
            loaded: true,
        });
        setLibraryError(null);
        audioEngine.loadSamplerBuffer(id, objectUrl);
    }, [data.fileName, externalAssetPath, id, libraryAssets, updateNodeData]);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []).filter(isLikelyAudioFile);
        if (files.length === 0) return;

        void (async () => {
            try {
                let primary: AudioLibraryAsset | undefined;
                for (const file of files) {
                    const asset = await addAssetFromFile(file, { kind: 'sample' });
                    primary ??= asset;
                }
                if (primary) {
                    await applyAssetSelection(primary.id, primary.name, primary);
                }
                setLibraryError(null);
            } catch {
                setLibraryError('Upload failed');
                updateNodeData(id, { loaded: false });
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        })();
    }, [applyAssetSelection, id, updateNodeData]);

    const handleLibrarySelect = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        void applyAssetSelection(event.target.value);
    }, [applyAssetSelection]);

    const handleBrowseClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handlePlayClick = useCallback(() => {
        if (!data.src) return;

        if (isPlaying) {
            audioEngine.stopSampler(id);
            setIsPlaying(false);
            return;
        }

        audioEngine.playSampler(id, data);
        setIsPlaying(true);
    }, [data, id, isPlaying]);

    const handleLoop = useCallback((checked: boolean) => {
        updateNodeData(id, { loop: checked });
    }, [id, updateNodeData]);

    const handlePlaybackRate = useCallback((value: number) => {
        updateNodeData(id, { playbackRate: value });
        audioEngine.updateSamplerParam(id, 'playbackRate', value);
    }, [id, updateNodeData]);

    const handleDetune = useCallback((value: number) => {
        updateNodeData(id, { detune: value });
        audioEngine.updateSamplerParam(id, 'detune', value);
    }, [id, updateNodeData]);

    const hasSample = Boolean(data.src);
    const fileLabel = data.fileName || (hasSample ? 'Loaded sample' : 'No sample');

    return (
        <NodeShell
            nodeType="sampler"
            title={data.label?.trim() || 'Sampler'}
            selected={selected}
            badge={<NodeValueBadge>{hasSample ? 'sample' : 'empty'}</NodeValueBadge>}
        >
            <NodeHandleRow direction="source" label="out" handleId="out" handleKind="audio" />

            <NodeWidget title={<NodeWidgetTitle icon="pianoRoll">Sample + playback</NodeWidgetTitle>}>
                <AudioAssetPickerCard
                    fileInputRef={fileInputRef}
                    onFileChange={handleFileChange}
                    onBrowseClick={handleBrowseClick}
                    browseLabel="Browse sample"
                    libraryQuery={libraryQuery}
                    onLibraryQuery={setLibraryQuery}
                    libraryPlaceholder="Search assets"
                    libraryTitle="Select one or more audio files"
                    assets={filteredAssets}
                    selectedAssetId={selectedSampleId}
                    onLibrarySelect={handleLibrarySelect}
                    selectTitle="Select cached sample"
                    emptyOptionLabel="Select cached file"
                    badgeRow={(
                        <>
                            <NodeValueBadge live={hasSample}>{fileLabel}</NodeValueBadge>
                            {externalAssetPath && !hasSample ? <NodeValueBadge>{externalAssetPath}</NodeValueBadge> : null}
                            {libraryError ? <NodeValueBadge>{libraryError}</NodeValueBadge> : null}
                        </>
                    )}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className={`node-shell__transport-button ${isPlaying ? 'is-live' : ''}`}
                        onClick={handlePlayClick}
                        disabled={!data.src}
                        aria-label={isPlaying ? 'Stop sample' : 'Play sample'}
                    >
                        <span>{isPlaying ? 'STOP' : 'PLAY'}</span>
                    </button>
                    <NodeCheckboxField checked={data.loop} onChange={handleLoop} label="Loop" />
                </div>
            </NodeWidget>

            <NodeHandleRow
                direction="target"
                label="trigger"
                handleId="trigger"
                handleKind="trigger"
                control={<NodeValueBadge live={isPlaying}>{isPlaying ? 'playing' : 'armed'}</NodeValueBadge>}
            />
            <NodeHandleRow
                direction="target"
                label="speed"
                handleId="playbackRate"
                handleKind="control"
                control={playbackRateConnection.connected ? (
                    <NodeValueBadge live>{formatConnectedValue(playbackRateConnection.value, (value) => formatPlaybackRate(value))}</NodeValueBadge>
                ) : (
                    <NodeNumberField
                        className="node-shell__row-field"
                        min={0.25}
                        max={4}
                        step={0.01}
                        value={data.playbackRate}
                        onChange={handlePlaybackRate}
                    />
                )}
            />
            <NodeHandleRow
                direction="target"
                label="detune"
                handleId="detune"
                handleKind="control"
                control={detuneConnection.connected ? (
                    <NodeValueBadge live>{formatConnectedValue(detuneConnection.value, (value) => formatDetune(value))}</NodeValueBadge>
                ) : (
                    <NodeNumberField
                        className="node-shell__row-field"
                        min={-1200}
                        max={1200}
                        step={10}
                        value={data.detune}
                        onChange={handleDetune}
                    />
                )}
            />
        </NodeShell>
    );
});

SamplerNodeView.displayName = 'SamplerNodeView';
