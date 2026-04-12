/** Primary file-browse trigger (pairs with a hidden file input). */
export function NodeUiBrowseButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button type="button" className="ui-token-trigger-row" onClick={onClick}>
            <span>{label}</span>
            <span className="ui-token-trigger-row-icon" aria-hidden="true">
                FILE
            </span>
        </button>
    );
}
