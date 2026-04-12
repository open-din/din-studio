import type { ChangeEvent, ReactNode, RefObject } from 'react';
import type { AudioLibraryAsset } from '../../audioLibrary';
import { NodeTextField } from '../../components/NodeShell';
import { NodeUiBadgeRow } from '../primitives/NodeUiBadgeRow';
import { NodeUiBrowseButton } from '../primitives/NodeUiBrowseButton';

export interface AudioAssetPickerCardProps {
    /** Hidden file input ref + change handler (caller owns `accept`, `multiple`). */
    fileInputRef: RefObject<HTMLInputElement | null>;
    onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onBrowseClick: () => void;
    browseLabel: string;
    libraryQuery: string;
    onLibraryQuery: (value: string) => void;
    libraryPlaceholder: string;
    libraryTitle: string;
    assets: AudioLibraryAsset[];
    selectedAssetId: string;
    onLibrarySelect: (event: ChangeEvent<HTMLSelectElement>) => void;
    selectTitle: string;
    emptyOptionLabel: string;
    badgeRow: ReactNode;
    footer?: ReactNode;
}

/**
 * Shared library search + file browse + dropdown for sampler / convolver style nodes.
 */
export function AudioAssetPickerCard({
    fileInputRef,
    onFileChange,
    onBrowseClick,
    browseLabel,
    libraryQuery,
    onLibraryQuery,
    libraryPlaceholder,
    libraryTitle,
    assets,
    selectedAssetId,
    onLibrarySelect,
    selectTitle,
    emptyOptionLabel,
    badgeRow,
    footer,
}: AudioAssetPickerCardProps) {
    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                onChange={onFileChange}
                style={{ display: 'none' }}
                title={libraryTitle}
            />
            <NodeUiBrowseButton label={browseLabel} onClick={onBrowseClick} />
            <div className="node-shell__widget-field">
                <span className="node-shell__widget-field-label">Library</span>
                <NodeTextField
                    value={libraryQuery}
                    onChange={onLibraryQuery}
                    placeholder={libraryPlaceholder}
                    title={libraryTitle}
                />
                <select className="node-shell__field" value={selectedAssetId} onChange={onLibrarySelect} title={selectTitle}>
                    <option value="">{emptyOptionLabel}</option>
                    {assets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                            {asset.name}
                        </option>
                    ))}
                </select>
            </div>
            <NodeUiBadgeRow>{badgeRow}</NodeUiBadgeRow>
            {footer}
        </>
    );
}
