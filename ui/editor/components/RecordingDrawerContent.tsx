import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Square, Download, Library } from 'lucide-react';
import { useAudioGraphStore } from '../store';
import { WaveformCanvasLive, WaveformEditorPanel } from './WaveformCanvas';
import { encodeMp3FromBuffer, encodeWavFromBuffer, encodeWebmFromBuffer } from '../audioExport';
import { addAssetFromBlob } from '../audioLibrary';

function triggerDownload(blob: Blob, filename: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function RecordingDrawerContent() {
    const recording = useAudioGraphStore((s) => s.recording);
    const armRecording = useAudioGraphStore((s) => s.armRecording);
    const cancelOrStopRecording = useAudioGraphStore((s) => s.cancelOrStopRecording);
    const dismissRecording = useAudioGraphStore((s) => s.dismissRecording);
    const setRecordingCrop = useAudioGraphStore((s) => s.setRecordingCrop);
    const toggleRecordingLoop = useAudioGraphStore((s) => s.toggleRecordingLoop);
    const setRecordingPreviewState = useAudioGraphStore((s) => s.setRecordingPreviewState);

    const [exportBusy, setExportBusy] = useState<string | null>(null);
    const [libraryBusy, setLibraryBusy] = useState(false);
    const [libraryKind, setLibraryKind] = useState<'sample' | 'impulse'>('sample');
    const [libraryLabel, setLibraryLabel] = useState('recording');

    const audioRef = useRef<HTMLAudioElement>(null);
    const objectUrl = useMemo(() => {
        if (!recording.blob || recording.blob.size === 0) return null;
        return URL.createObjectURL(recording.blob);
    }, [recording.blob]);

    useEffect(() => () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
    }, [objectUrl]);

    const duration = recording.audioBuffer?.duration ?? recording.durationSec ?? 0;
    const cropStart = recording.cropStart ?? 0;
    const cropEnd = recording.cropEnd ?? duration;

    const syncPreviewFromStore = useCallback(() => {
        const el = audioRef.current;
        if (!el) return;
        setRecordingPreviewState({ playbackPosition: el.currentTime, isPlayingBack: !el.paused });
    }, [setRecordingPreviewState]);

    useEffect(() => {
        const el = audioRef.current;
        if (!el || recording.phase !== 'stopped') return;
        el.loop = recording.loopEnabled;
        const onTime = () => {
            if (!recording.loopEnabled) {
                if (cropEnd > cropStart && el.currentTime >= cropEnd - 0.02) {
                    el.pause();
                    el.currentTime = cropStart;
                    setRecordingPreviewState({ isPlayingBack: false, playbackPosition: cropStart });
                    return;
                }
            } else {
                if (cropEnd > cropStart && el.currentTime >= cropEnd - 0.02) {
                    el.currentTime = cropStart;
                }
            }
            syncPreviewFromStore();
        };
        el.addEventListener('timeupdate', onTime);
        el.addEventListener('play', syncPreviewFromStore);
        el.addEventListener('pause', syncPreviewFromStore);
        return () => {
            el.removeEventListener('timeupdate', onTime);
            el.removeEventListener('play', syncPreviewFromStore);
            el.removeEventListener('pause', syncPreviewFromStore);
        };
    }, [recording.phase, recording.loopEnabled, cropStart, cropEnd, setRecordingPreviewState, syncPreviewFromStore]);

    const togglePreviewPlay = () => {
        const el = audioRef.current;
        if (!el || !objectUrl) return;
        if (el.paused) {
            if (el.currentTime < cropStart || el.currentTime >= cropEnd - 0.01) {
                el.currentTime = cropStart;
            }
            void el.play();
        } else {
            el.pause();
        }
    };

    const seekPreview = useCallback(
        (timeSec: number) => {
            const el = audioRef.current;
            if (el) {
                el.currentTime = timeSec;
            }
            setRecordingPreviewState({ playbackPosition: timeSec });
        },
        [setRecordingPreviewState],
    );

    const handleExport = async (format: 'wav' | 'mp3' | 'webm' | 'original') => {
        if (recording.phase !== 'stopped') return;
        setExportBusy(format);
        try {
            const base = libraryLabel.replace(/[^\w\-./]+/g, '_') || 'recording';
            if (format === 'original' && recording.blob) {
                const ext = recording.mimeType.includes('webm') ? 'webm' : recording.mimeType.includes('ogg') ? 'ogg' : 'audio';
                triggerDownload(recording.blob, `${base}.${ext}`);
                return;
            }
            if (!recording.audioBuffer) {
                if (recording.blob) triggerDownload(recording.blob, `${base}.capture`);
                return;
            }
            if (format === 'wav') {
                triggerDownload(
                    encodeWavFromBuffer(recording.audioBuffer, cropStart, cropEnd),
                    `${base}.wav`,
                );
            } else if (format === 'mp3') {
                triggerDownload(await encodeMp3FromBuffer(recording.audioBuffer, cropStart, cropEnd), `${base}.mp3`);
            } else {
                triggerDownload(await encodeWebmFromBuffer(recording.audioBuffer, cropStart, cropEnd), `${base}.webm`);
            }
        } finally {
            setExportBusy(null);
        }
    };

    const handleExportLibrary = async () => {
        if (recording.phase !== 'stopped' || !recording.audioBuffer) return;
        setLibraryBusy(true);
        try {
            const wav = encodeWavFromBuffer(recording.audioBuffer, cropStart, cropEnd);
            const safe = `${(libraryLabel || 'recording').replace(/[^\w\-./]+/g, '_')}.wav`;
            await addAssetFromBlob(wav, safe, { kind: libraryKind });
        } finally {
            setLibraryBusy(false);
        }
    };

    if (recording.phase === 'idle') {
        return (
            <div className="flex h-full min-h-[120px] flex-col gap-3 text-[13px] text-[var(--text-subtle)]">
                <p>
                    Arm recording with the record button on the canvas, then press Play to capture the graph output. Pause
                    pauses capture; Stop ends capture without stopping playback.
                </p>
                <button
                    type="button"
                    onClick={() => armRecording()}
                    className="inline-flex w-fit items-center gap-2 rounded-md border border-[var(--panel-border)] bg-[var(--panel-muted)] px-3 py-2 text-[var(--text)] hover:bg-[var(--panel-muted)]/80"
                >
                    <Circle className="h-4 w-4 text-red-500" />
                    Arm recording
                </button>
            </div>
        );
    }

    if (recording.phase === 'armed' || recording.phase === 'recording' || recording.phase === 'paused') {
        const live = recording.phase === 'recording';
        return (
            <div className="flex h-full min-h-[160px] flex-col gap-3 overflow-auto text-[13px]">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span
                            className={`h-2 w-2 rounded-full ${
                                recording.phase === 'armed'
                                    ? 'animate-pulse bg-amber-400'
                                    : recording.phase === 'recording'
                                        ? 'bg-red-500'
                                        : 'bg-zinc-500'
                            }`}
                        />
                        <span className="font-semibold text-[var(--text)]">
                            {recording.phase === 'armed' && 'Armed — press Play to record'}
                            {recording.phase === 'recording' && 'Recording…'}
                            {recording.phase === 'paused' && 'Recording paused (transport paused)'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => void cancelOrStopRecording()}
                        className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-red-500"
                    >
                        <Square className="h-3.5 w-3.5" />
                        Stop
                    </button>
                </div>
                <WaveformCanvasLive active={live} />
                <p className="text-[11px] text-[var(--text-subtle)]">
                    Waveform builds from the live output while transport is running.
                </p>
            </div>
        );
    }

    // stopped
    return (
        <div className="flex h-full min-h-[200px] flex-col gap-4 overflow-auto text-[13px]">
            {recording.decodeError && (
                <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-amber-200">
                    Could not decode for editing: {recording.decodeError}. You can still download the original capture.
                </p>
            )}
            <audio ref={audioRef} src={objectUrl ?? undefined} preload="auto" className="hidden" />
            {recording.audioBuffer ? (
                <WaveformEditorPanel
                    buffer={recording.audioBuffer}
                    duration={duration}
                    playhead={recording.playbackPosition}
                    cropStart={cropStart}
                    cropEnd={cropEnd}
                    height={168}
                    isPlaying={recording.isPlayingBack}
                    loopEnabled={recording.loopEnabled}
                    previewDisabled={!objectUrl}
                    onCropChange={setRecordingCrop}
                    onSeek={seekPreview}
                    onTogglePlay={togglePreviewPlay}
                    onToggleLoop={toggleRecordingLoop}
                />
            ) : (
                <div className="rounded-md border border-dashed border-[var(--panel-border)] p-4 text-[var(--text-subtle)]">
                    No waveform preview (decode failed). Use original download.
                </div>
            )}

            <div className="flex flex-col gap-2 border-t border-[var(--panel-border)] pt-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">Export</span>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        disabled={Boolean(exportBusy) || !recording.audioBuffer}
                        onClick={() => void handleExport('wav')}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--panel-border)] bg-[var(--panel-muted)] px-2 py-1 text-[12px] hover:bg-[var(--panel-muted)]/80 disabled:opacity-40"
                    >
                        <Download className="h-3.5 w-3.5" />
                        {exportBusy === 'wav' ? '…' : 'WAV'}
                    </button>
                    <button
                        type="button"
                        disabled={Boolean(exportBusy) || !recording.audioBuffer}
                        onClick={() => void handleExport('mp3')}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--panel-border)] bg-[var(--panel-muted)] px-2 py-1 text-[12px] hover:bg-[var(--panel-muted)]/80 disabled:opacity-40"
                    >
                        <Download className="h-3.5 w-3.5" />
                        {exportBusy === 'mp3' ? '…' : 'MP3'}
                    </button>
                    <button
                        type="button"
                        disabled={Boolean(exportBusy) || !recording.audioBuffer}
                        onClick={() => void handleExport('webm')}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--panel-border)] bg-[var(--panel-muted)] px-2 py-1 text-[12px] hover:bg-[var(--panel-muted)]/80 disabled:opacity-40"
                    >
                        <Download className="h-3.5 w-3.5" />
                        {exportBusy === 'webm' ? '…' : 'WebM'}
                    </button>
                    <button
                        type="button"
                        disabled={Boolean(exportBusy) || !recording.blob}
                        onClick={() => void handleExport('original')}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--panel-border)] bg-[var(--panel-muted)] px-2 py-1 text-[12px] hover:bg-[var(--panel-muted)]/80 disabled:opacity-40"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Original
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-[var(--panel-border)] pt-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">Export to library</span>
                <div className="flex flex-wrap items-end gap-2">
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-[var(--text-subtle)]">Label</span>
                        <input
                            value={libraryLabel}
                            onChange={(e) => setLibraryLabel(e.target.value)}
                            className="rounded border border-[var(--panel-border)] bg-[var(--panel-bg)] px-2 py-1 text-[12px] text-[var(--text)]"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-[var(--text-subtle)]">Kind</span>
                        <select
                            value={libraryKind}
                            onChange={(e) => setLibraryKind(e.target.value as 'sample' | 'impulse')}
                            className="rounded border border-[var(--panel-border)] bg-[var(--panel-bg)] px-2 py-1 text-[12px] text-[var(--text)]"
                        >
                            <option value="sample">Audio sample</option>
                            <option value="impulse">Impulse (IR)</option>
                        </select>
                    </label>
                    <button
                        type="button"
                        disabled={libraryBusy || !recording.audioBuffer}
                        onClick={() => void handleExportLibrary()}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-[12px] font-semibold text-white hover:bg-blue-500 disabled:opacity-40"
                    >
                        <Library className="h-4 w-4" />
                        {libraryBusy ? 'Saving…' : 'Add to library'}
                    </button>
                </div>
            </div>

            <button
                type="button"
                onClick={() => dismissRecording()}
                className="mt-2 w-fit text-[11px] text-[var(--text-subtle)] underline hover:text-[var(--text)]"
            >
                Clear recording session
            </button>
        </div>
    );
}
