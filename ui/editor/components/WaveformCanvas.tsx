import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { audioEngine } from '../AudioEngine';
import { Pause, Play, Repeat } from 'lucide-react';

/** Live waveform viewport height in px. Editor panel uses a taller canvas that includes a time ruler. */
export const WAVEFORM_STEREO_CANVAS_HEIGHT_PX = 104;

export type StereoWaveformColumn = { lMin: number; lMax: number; rMin: number; rMax: number };

export const STEREO_WAVEFORM_BG = 'rgba(24, 24, 27, 0.95)';
const BAR_L = 'rgb(96, 165, 250)';
const BAR_R = 'rgb(147, 197, 253)';

/** Bottom strip height inside the editor canvas for second / time labels. */
const EDITOR_TIME_RULER_PX = 24;

function pickTimeRulerStep(durationSec: number, widthPx: number): number {
    if (durationSec <= 0 || widthPx < 8) return 1;
    const minLabelGapPx = 52;
    const approx = (durationSec * minLabelGapPx) / widthPx;
    const exp = Math.floor(Math.log10(Math.max(approx, 1e-6)));
    const pow = 10 ** exp;
    const m = approx / pow;
    const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
    return nice * pow;
}

function formatRulerLabel(t: number, durationSec: number): string {
    const useMmSs = durationSec >= 90 || t >= 60;
    if (useMmSs) {
        const total = Math.floor(t + 1e-6);
        const mm = Math.floor(total / 60);
        const ss = total % 60;
        return `${mm}:${ss.toString().padStart(2, '0')}`;
    }
    const rounded = Math.round(t * 10) / 10;
    if (Number.isInteger(rounded)) return `${rounded}s`;
    return `${rounded.toFixed(1)}s`;
}

function drawEditorTimeGridAndRuler(
    ctx2d: CanvasRenderingContext2D,
    w: number,
    hWave: number,
    hTotal: number,
    durationSec: number,
): void {
    if (durationSec <= 0 || !Number.isFinite(durationSec)) return;
    const step = pickTimeRulerStep(durationSec, w);

    ctx2d.save();
    for (let t = 0; t <= durationSec + step * 1e-6; t += step) {
        const x = (t / durationSec) * w;
        if (x < -1 || x > w + 1) continue;
        ctx2d.strokeStyle = 'rgba(244, 244, 245, 0.07)';
        ctx2d.lineWidth = 1;
        ctx2d.beginPath();
        ctx2d.moveTo(x, 0);
        ctx2d.lineTo(x, hWave);
        ctx2d.stroke();
    }
    ctx2d.restore();

    ctx2d.fillStyle = 'rgba(15, 15, 18, 0.98)';
    ctx2d.fillRect(0, hWave, w, hTotal - hWave);
    ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx2d.lineWidth = 1;
    ctx2d.beginPath();
    ctx2d.moveTo(0, hWave + 0.5);
    ctx2d.lineTo(w, hWave + 0.5);
    ctx2d.stroke();

    ctx2d.fillStyle = 'rgba(161, 161, 170, 0.95)';
    ctx2d.font = '10px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
    ctx2d.textBaseline = 'middle';

    let lastLabelEnd = -Infinity;
    for (let t = 0; t <= durationSec + step * 1e-6; t += step) {
        const x = (t / durationSec) * w;
        if (x < -1 || x > w + 1) continue;
        ctx2d.strokeStyle = 'rgba(161, 161, 170, 0.5)';
        ctx2d.lineWidth = 1;
        ctx2d.beginPath();
        ctx2d.moveTo(x, hWave);
        ctx2d.lineTo(x, hWave + 5);
        ctx2d.stroke();
        const label = formatRulerLabel(t, durationSec);
        const pad = 3;
        const tx = Math.min(w - 2, Math.max(pad, x + pad));
        const tw = ctx2d.measureText(label).width;
        if (tx < lastLabelEnd + 4) continue;
        ctx2d.fillText(label, tx, hWave + (hTotal - hWave) * 0.55);
        lastLabelEnd = tx + tw;
    }
}

function minMaxChunk(data: Float32Array, start: number, end: number): { min: number; max: number } {
    if (end <= start) return { min: 0, max: 0 };
    let min = 1;
    let max = -1;
    for (let i = start; i < end; i++) {
        const v = data[i];
        if (v < min) min = v;
        if (v > max) max = v;
    }
    return { min, max };
}

/** Build one column per horizontal pixel from buffer (L = ch0, R = ch1 or duplicate mono). */
export function stereoColumnsFromBuffer(buffer: AudioBuffer, widthPx: number): StereoWaveformColumn[] {
    const w = Math.max(1, Math.floor(widthPx));
    const chL = buffer.getChannelData(0);
    const chR = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : chL;
    const bufLen = chL.length;
    const step = Math.max(1, Math.floor(bufLen / w));
    const out: StereoWaveformColumn[] = [];
    for (let x = 0; x < w; x++) {
        const s0 = x * step;
        const s1 = Math.min(bufLen, s0 + step);
        const { min: lMin, max: lMax } = minMaxChunk(chL, s0, s1);
        const { min: rMin, max: rMax } = minMaxChunk(chR, s0, s1);
        out.push({ lMin, lMax, rMin, rMax });
    }
    return out;
}

/**
 * Dual-lane peaks: left channel in the top half (from center upward), right in the bottom half (mirrored).
 */
export function drawStereoPeakColumns(
    ctx2d: CanvasRenderingContext2D,
    w: number,
    h: number,
    columns: StereoWaveformColumn[],
    drawMidLine: boolean,
): void {
    const mid = h / 2;
    const halfH = h / 2;
    const n = columns.length;
    if (n <= 0) return;

    const colW = Math.max(1, w / n);

    for (let i = 0; i < n; i++) {
        const x = (i / n) * w;
        const c = columns[i];

        let y1 = mid - c.lMax * halfH;
        let y2 = mid - c.lMin * halfH;
        let top = Math.min(y1, y2);
        let bot = Math.max(y1, y2);
        top = Math.max(0, Math.min(mid, top));
        bot = Math.max(0, Math.min(mid, bot));
        ctx2d.fillStyle = BAR_L;
        ctx2d.fillRect(x, top, colW, Math.max(1, bot - top));

        y1 = mid + c.rMin * halfH;
        y2 = mid + c.rMax * halfH;
        top = Math.min(y1, y2);
        bot = Math.max(y1, y2);
        top = Math.max(mid, Math.min(h, top));
        bot = Math.max(mid, Math.min(h, bot));
        ctx2d.fillStyle = BAR_R;
        ctx2d.fillRect(x, top, colW, Math.max(1, bot - top));
    }

    if (drawMidLine) {
        ctx2d.strokeStyle = 'rgba(161, 161, 170, 0.4)';
        ctx2d.lineWidth = 1;
        ctx2d.beginPath();
        ctx2d.moveTo(0, mid);
        ctx2d.lineTo(w, mid);
        ctx2d.stroke();
    }
}

/** Downsample one analyser snapshot into several columns (time → x). */
export function stereoColumnsFromTimeData(
    bufL: Float32Array,
    bufR: Float32Array,
    bucketCount: number,
): StereoWaveformColumn[] {
    const k = Math.max(1, Math.floor(bucketCount));
    const len = Math.min(bufL.length, bufR.length);
    const slice = Math.max(1, Math.floor(len / k));
    const out: StereoWaveformColumn[] = [];
    for (let b = 0; b < k; b++) {
        const s0 = b * slice;
        const s1 = b === k - 1 ? len : Math.min(len, (b + 1) * slice);
        const { min: lMin, max: lMax } = minMaxChunk(bufL, s0, s1);
        const { min: rMin, max: rMax } = minMaxChunk(bufR, s0, s1);
        out.push({ lMin, lMax, rMin, rMax });
    }
    return out;
}

export function WaveformCanvasLive(props: { active: boolean }) {
    const { active } = props;
    const activeRef = useRef(active);
    activeRef.current = active;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef(0);
    const liveL = useRef<Float32Array>(new Float32Array(2048));
    const liveR = useRef<Float32Array>(new Float32Array(2048));

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx2d = canvas.getContext('2d');
        if (!ctx2d) return;

        const historyRef = { current: [] as StereoWaveformColumn[] };
        const maxHistory = 520;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const w = container.clientWidth;
            const h = container.clientHeight;
            canvas.width = Math.max(1, Math.floor(w * dpr));
            canvas.height = Math.max(1, Math.floor(h * dpr));
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(container);

        const draw = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            ctx2d.clearRect(0, 0, w, h);
            ctx2d.fillStyle = STEREO_WAVEFORM_BG;
            ctx2d.fillRect(0, 0, w, h);

            let history = historyRef.current;
            if (activeRef.current) {
                audioEngine.getRecordingStereoTimeDomainData(liveL.current, liveR.current);
                const buckets = Math.min(64, Math.max(8, Math.floor(w / 6)));
                const cols = stereoColumnsFromTimeData(liveL.current, liveR.current, buckets);
                history = history.concat(cols);
                if (history.length > maxHistory) {
                    history = history.slice(-maxHistory);
                }
                historyRef.current = history;
            }

            if (history.length > 0) {
                drawStereoPeakColumns(ctx2d, w, h, history, true);
            } else {
                const mid = h / 2;
                ctx2d.strokeStyle = 'rgba(161, 161, 170, 0.4)';
                ctx2d.lineWidth = 1;
                ctx2d.beginPath();
                ctx2d.moveTo(0, mid);
                ctx2d.lineTo(w, mid);
                ctx2d.stroke();
            }

            rafRef.current = requestAnimationFrame(draw);
        };
        rafRef.current = requestAnimationFrame(draw);

        return () => {
            ro.disconnect();
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="h-[104px] w-full min-w-0 rounded-md border border-[var(--panel-border)] overflow-hidden"
        >
            <canvas ref={canvasRef} className="block h-full w-full" aria-hidden />
        </div>
    );
}

const HANDLE_HIT_PX = 16;
const MIN_CROP_SEC = 0.02;

/**
 * Static waveform with play, repeat (loop), and draggable crop handles on the waveform surface.
 */
export function WaveformEditorPanel(props: {
    buffer: AudioBuffer;
    height?: number;
    playhead: number;
    duration: number;
    cropStart: number;
    cropEnd: number;
    isPlaying: boolean;
    loopEnabled: boolean;
    previewDisabled: boolean;
    onCropChange: (start: number, end: number) => void;
    onSeek: (timeSec: number) => void;
    onTogglePlay: () => void;
    onToggleLoop: () => void;
}) {
    const {
        buffer,
        height: heightProp = 128,
        playhead,
        duration,
        cropStart,
        cropEnd,
        isPlaying,
        loopEnabled,
        previewDisabled,
        onCropChange,
        onSeek,
        onTogglePlay,
        onToggleLoop,
    } = props;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const dragKindRef = useRef<'start' | 'end' | null>(null);
    const cropRef = useRef({ start: cropStart, end: cropEnd });
    cropRef.current.start = cropStart;
    cropRef.current.end = cropEnd;

    const [hoverZone, setHoverZone] = useState<'start' | 'end' | 'seek' | null>(null);

    const drawWaveform = useCallback(() => {
        const canvas = canvasRef.current;
        const panel = panelRef.current;
        if (!canvas || !panel) return;
        const ctx2d = canvas.getContext('2d');
        if (!ctx2d) return;

        const TOOLBAR_H = 40;
        const w = panel.clientWidth;
        const hTotal = Math.max(56 + EDITOR_TIME_RULER_PX, heightProp - TOOLBAR_H);
        const hWave = Math.max(48, hTotal - EDITOR_TIME_RULER_PX);
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.floor(w * dpr));
        canvas.height = Math.max(1, Math.floor(hTotal * dpr));
        canvas.style.width = `${w}px`;
        canvas.style.height = `${hTotal}px`;
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

        ctx2d.clearRect(0, 0, w, hTotal);
        ctx2d.fillStyle = STEREO_WAVEFORM_BG;
        ctx2d.fillRect(0, 0, w, hWave);

        const dur = duration > 0 ? duration : 1;
        drawEditorTimeGridAndRuler(ctx2d, w, hWave, hTotal, dur);

        const columns = stereoColumnsFromBuffer(buffer, w);
        drawStereoPeakColumns(ctx2d, w, hWave, columns, true);

        const c0 = cropStart / dur;
        const c1 = cropEnd / dur;
        ctx2d.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx2d.fillRect(0, 0, c0 * w, hWave);
        ctx2d.fillRect(c1 * w, 0, w - c1 * w, hWave);

        ctx2d.fillStyle = 'rgba(234, 179, 8, 0.18)';
        ctx2d.fillRect(c0 * w, 0, Math.max(0, (c1 - c0) * w), hWave);

        ctx2d.strokeStyle = 'rgb(234, 179, 8)';
        ctx2d.lineWidth = 2;
        ctx2d.beginPath();
        ctx2d.moveTo(c0 * w, 0);
        ctx2d.lineTo(c0 * w, hTotal);
        ctx2d.moveTo(c1 * w, 0);
        ctx2d.lineTo(c1 * w, hTotal);
        ctx2d.stroke();

        const hx0 = c0 * w;
        const hx1 = c1 * w;
        const triW = 8;
        const triH = 11;
        ctx2d.fillStyle = 'rgb(250, 204, 21)';
        ctx2d.strokeStyle = 'rgba(69, 26, 3, 0.85)';
        ctx2d.lineWidth = 1;
        ctx2d.beginPath();
        ctx2d.moveTo(hx0 - triW, 0);
        ctx2d.lineTo(hx0 + triW, 0);
        ctx2d.lineTo(hx0, triH);
        ctx2d.closePath();
        ctx2d.fill();
        ctx2d.stroke();
        ctx2d.beginPath();
        ctx2d.moveTo(hx1 - triW, hWave);
        ctx2d.lineTo(hx1 + triW, hWave);
        ctx2d.lineTo(hx1, hWave - triH);
        ctx2d.closePath();
        ctx2d.fill();
        ctx2d.stroke();

        if (dur > 0 && Number.isFinite(playhead)) {
            const px = (playhead / dur) * w;
            ctx2d.save();
            ctx2d.strokeStyle = 'rgb(34, 211, 238)';
            ctx2d.lineWidth = 2;
            ctx2d.shadowColor = 'rgba(0, 0, 0, 0.85)';
            ctx2d.shadowBlur = 4;
            ctx2d.beginPath();
            ctx2d.moveTo(px, 0);
            ctx2d.lineTo(px, hTotal);
            ctx2d.stroke();
            ctx2d.restore();
            ctx2d.fillStyle = 'rgb(34, 211, 238)';
            ctx2d.beginPath();
            ctx2d.moveTo(px - 7, 0);
            ctx2d.lineTo(px + 7, 0);
            ctx2d.lineTo(px, 9);
            ctx2d.closePath();
            ctx2d.fill();
        }
    }, [buffer, heightProp, playhead, duration, cropStart, cropEnd]);

    useEffect(() => {
        drawWaveform();
        const panel = panelRef.current;
        if (!panel) return;
        const ro = new ResizeObserver(() => drawWaveform());
        ro.observe(panel);
        return () => ro.disconnect();
    }, [drawWaveform]);

    const clientXToTime = useCallback(
        (clientX: number) => {
            const canvas = canvasRef.current;
            if (!canvas) return 0;
            const rect = canvas.getBoundingClientRect();
            const ratio = (clientX - rect.left) / Math.max(1, rect.width);
            return Math.max(0, Math.min(duration, ratio * duration));
        },
        [duration],
    );

    const pickZone = useCallback(
        (clientX: number): 'start' | 'end' | 'seek' => {
            const canvas = canvasRef.current;
            if (!canvas || duration <= 0) return 'seek';
            const rect = canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const cw = rect.width;
            const c0 = (cropStart / duration) * cw;
            const c1 = (cropEnd / duration) * cw;
            if (Math.abs(x - c0) <= HANDLE_HIT_PX) return 'start';
            if (Math.abs(x - c1) <= HANDLE_HIT_PX) return 'end';
            return 'seek';
        },
        [duration, cropStart, cropEnd],
    );

    useEffect(() => {
        const onMove = (ev: MouseEvent) => {
            const kind = dragKindRef.current;
            if (!kind) return;
            const t = clientXToTime(ev.clientX);
            const { start, end } = cropRef.current;
            if (kind === 'start') {
                const next = Math.min(t, end - MIN_CROP_SEC);
                onCropChange(Math.max(0, next), end);
            } else {
                const next = Math.max(t, start + MIN_CROP_SEC);
                onCropChange(start, Math.min(duration, next));
            }
        };
        const onUp = () => {
            dragKindRef.current = null;
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [clientXToTime, duration, onCropChange]);

    const onCanvasMouseDown = (e: ReactMouseEvent<HTMLCanvasElement>) => {
        const zone = pickZone(e.clientX);
        if (zone === 'start' || zone === 'end') {
            e.preventDefault();
            dragKindRef.current = zone;
            return;
        }
        if (previewDisabled) return;
        onSeek(clientXToTime(e.clientX));
    };

    const formatSec = (s: number) => (Number.isFinite(s) ? s.toFixed(2) : '—');

    return (
        <div
            ref={panelRef}
            className="w-full min-w-0 overflow-hidden rounded-md border border-[var(--panel-border)] bg-[var(--panel-bg)]"
        >
            <div
                data-waveform-toolbar
                className="flex shrink-0 items-center gap-2 border-b border-[var(--panel-border)] bg-[var(--panel-muted)]/40 px-2 py-1.5"
            >
                <button
                    type="button"
                    disabled={previewDisabled}
                    onClick={onTogglePlay}
                    title={isPlaying ? 'Pause' : 'Play'}
                    aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--panel-border)] bg-[var(--panel-bg)] text-[var(--text)] hover:bg-[var(--accent-soft)] disabled:pointer-events-none disabled:opacity-40"
                >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 pl-0.5" />}
                </button>
                <button
                    type="button"
                    onClick={onToggleLoop}
                    title="Repeat selection"
                    aria-label={loopEnabled ? 'Repeat on' : 'Repeat off'}
                    aria-pressed={loopEnabled}
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--panel-border)] ${
                        loopEnabled
                            ? 'bg-amber-500/25 text-amber-100 ring-1 ring-amber-400/60'
                            : 'bg-[var(--panel-bg)] text-[var(--text-subtle)] hover:bg-[var(--accent-soft)] hover:text-[var(--text)]'
                    }`}
                >
                    <Repeat className="h-4 w-4" />
                </button>
                <span className="ml-auto text-[10px] font-medium tabular-nums text-[var(--text-subtle)]">
                    Crop {formatSec(cropStart)}s → {formatSec(cropEnd)}s
                    <span className="mx-1.5 text-[var(--panel-border)]">|</span>
                    {formatSec(playhead)}s
                </span>
            </div>
            <div
                className="relative cursor-crosshair"
                style={{ height: Math.max(56 + EDITOR_TIME_RULER_PX, heightProp - 40) }}
                onMouseMove={(e) => {
                    const cv = canvasRef.current;
                    if (!cv) return;
                    const rect = cv.getBoundingClientRect();
                    if (e.clientY < rect.top || e.clientY > rect.bottom) {
                        setHoverZone(null);
                        return;
                    }
                    setHoverZone(pickZone(e.clientX));
                }}
                onMouseLeave={() => setHoverZone(null)}
            >
                <canvas
                    ref={canvasRef}
                    className={`block h-full w-full ${hoverZone === 'start' || hoverZone === 'end' ? 'cursor-ew-resize' : ''}`}
                    onMouseDown={onCanvasMouseDown}
                    aria-label="Waveform with time scale: drag crop markers, click to seek"
                />
                <p
                    className="pointer-events-none absolute left-2 right-2 text-[9px] text-zinc-500"
                    style={{ bottom: EDITOR_TIME_RULER_PX + 2 }}
                >
                    Ruler in seconds · Drag markers · Click to seek
                </p>
            </div>
        </div>
    );
}
