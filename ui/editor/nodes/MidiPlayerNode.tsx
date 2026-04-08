import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import { isLikelyMidiFile } from '../audioImport';
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
import type { MidiPlayerNodeData } from '../types';

const MidiPlayerNode = memo(({ id, data, selected }: NodeProps<Node<MidiPlayerNodeData>>) => {
    const updateNodeData = useAudioGraphStore((state) => state.updateNodeData);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [libraryError, setLibraryError] = useState<string | null>(null);
    const [libraryAssets, setLibraryAssets] = useState<AudioLibraryAsset[]>([]);
    const [libraryQuery, setLibraryQuery] = useState('');
    const [playingStep, setPlayingStep] = useState<number>(-1);

    const externalAssetPath = typeof data.assetPath === 'string' ? data.assetPath.trim() : '';
    const selectedMidiId = typeof data.midiFileId === 'string' ? data.midiFileId : '';

    useEffect(() => {
        return audioEngine.subscribeStep((step) => {
            setPlayingStep(step);
        });
    }, []);

    const refreshAssets = useCallback(() => {
        listAssets()
            .then((assets) => setLibraryAssets(assets))
            .catch(() => setLibraryAssets([]));
    }, []);

    useEffect(() => {
        refreshAssets();
        return subscribeAssets(refreshAssets);
    }, [refreshAssets]);

    const midiLibraryAssets = useMemo(
        () => libraryAssets.filter((a) => a.kind === 'midi'),
        [libraryAssets],
    );

    const filteredAssets = useMemo(() => {
        const query = libraryQuery.trim().toLowerCase();
        if (!query) return midiLibraryAssets;
        return midiLibraryAssets.filter((asset) => asset.name.toLowerCase().includes(query));
    }, [midiLibraryAssets, libraryQuery]);

    const applyMidiSelection = useCallback(async (
        assetId: string,
        fallbackName?: string,
        uploadedAsset?: AudioLibraryAsset,
    ) => {
        if (!assetId) {
            updateNodeData(id, {
                midiFileId: '',
                midiFileName: '',
                assetPath: '',
                loaded: false,
            });
            audioEngine.updateNode(id, { loaded: false, midiFileId: '', assetPath: '' });
            setLibraryError(null);
            return;
        }

        const asset = uploadedAsset ?? midiLibraryAssets.find((entry) => entry.id === assetId);
        await getAssetObjectUrl(assetId).catch(() => null);

        setLibraryError(null);
        updateNodeData(id, {
            assetPath: asset?.relativePath || externalAssetPath || (asset?.name ? `midi/${asset.name}` : undefined),
            midiFileId: assetId,
            midiFileName: asset?.fileName || asset?.name || fallbackName || data.midiFileName || 'clip.mid',
            loaded: true,
        });
        audioEngine.updateNode(id, {
            loaded: true,
            midiFileId: assetId,
            assetPath: asset?.relativePath || externalAssetPath,
            loop: data.loop,
        });
    }, [data.loop, data.midiFileName, externalAssetPath, id, midiLibraryAssets, updateNodeData]);

    const handleBrowseClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []).filter(isLikelyMidiFile);
        if (files.length === 0) return;

        void (async () => {
            try {
                let primary: AudioLibraryAsset | undefined;
                for (const file of files) {
                    const asset = await addAssetFromFile(file, { kind: 'midi' });
                    primary ??= asset;
                }
                if (primary) {
                    await applyMidiSelection(primary.id, primary.name, primary);
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
    }, [applyMidiSelection, id, updateNodeData]);

    const handleLibrarySelect = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        void applyMidiSelection(event.target.value);
    }, [applyMidiSelection]);

    const handleLoop = useCallback((checked: boolean) => {
        updateNodeData(id, { loop: checked });
        audioEngine.updateNode(id, { loop: checked });
    }, [id, updateNodeData]);

    const hasMidi = Boolean(data.midiFileId) && data.loaded;
    const fileLabel = data.midiFileName || (hasMidi ? 'MIDI loaded' : 'No MIDI file');

    return (
        <NodeShell
            nodeType="midiPlayer"
            title={data.label?.trim() || 'MIDI Player'}
            selected={selected}
            badge={<NodeValueBadge>{hasMidi ? 'midi' : 'empty'}</NodeValueBadge>}
        >
            <NodeHandleRow direction="source" label="trigger" handleId="trigger" handleKind="trigger" />

            <NodeWidget title={<NodeWidgetTitle icon="pianoRoll">MIDI file</NodeWidgetTitle>}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mid,.midi,.smf,audio/midi"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    title="Select Standard MIDI files"
                />

                <button type="button" className="ui-token-trigger-row" onClick={handleBrowseClick}>
                    <span>Browse MIDI</span>
                    <span className="ui-token-trigger-row-icon" aria-hidden="true">FILE</span>
                </button>

                <div className="node-shell__widget-field">
                    <span className="node-shell__widget-field-label">Library</span>
                    <NodeTextField
                        value={libraryQuery}
                        onChange={setLibraryQuery}
                        placeholder="Search MIDI assets"
                        title="Search MIDI library"
                    />
                    <select
                        className="node-shell__field"
                        value={selectedMidiId}
                        onChange={handleLibrarySelect}
                        title="Select MIDI file from library"
                    >
                        <option value="">Select cached file</option>
                        {filteredAssets.map((asset) => (
                            <option key={asset.id} value={asset.id}>{asset.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <NodeValueBadge live={hasMidi}>{fileLabel}</NodeValueBadge>
                    {externalAssetPath && !hasMidi ? <NodeValueBadge>{externalAssetPath}</NodeValueBadge> : null}
                    {libraryError ? <NodeValueBadge>{libraryError}</NodeValueBadge> : null}
                </div>

                <NodeCheckboxField checked={data.loop} onChange={handleLoop} label="Loop" />
            </NodeWidget>

            <NodeHandleRow
                direction="target"
                label="transport"
                handleId="transport"
                handleKind="trigger"
                control={<NodeValueBadge live={playingStep >= 0}>{playingStep >= 0 ? 'synced' : 'idle'}</NodeValueBadge>}
            />
        </NodeShell>
    );
});

MidiPlayerNode.displayName = 'MidiPlayerNode';
export default MidiPlayerNode;
