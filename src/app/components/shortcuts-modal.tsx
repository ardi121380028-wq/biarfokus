"use client";

type ShortcutsModalProps = {
  onClose: () => void;
};

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  const shortcuts = [
    ["Start/Pause", "Space"],
    ["Reset Timer", "R"],
    ["Skip Session", "S"],
    ["Open Settings", "Ctrl + S"],
    ["Open Tasks", "Ctrl + T"],
    ["Close Modal", "Esc"],
    ["Toggle Shortcuts", "?"],
  ];

  return <div className="modal-backdrop" role="presentation" onClick={onClose}>
    <section className="shortcuts-modal" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Tutup shortcuts">×</button>
      <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
      <p className="shortcut-group">TIMER CONTROLS</p>
      {shortcuts.slice(0, 3).map(([label, key]) => <div className="shortcut-row" key={label}><span>{label}</span><kbd>{key}</kbd></div>)}
      <p className="shortcut-group">NAVIGATION</p>
      {shortcuts.slice(3, 5).map(([label, key]) => <div className="shortcut-row" key={label}><span>{label}</span><kbd>{key}</kbd></div>)}
      <p className="shortcut-group">GENERAL</p>
      {shortcuts.slice(5).map(([label, key]) => <div className="shortcut-row" key={label}><span>{label}</span><kbd>{key}</kbd></div>)}
      <small>Press <kbd>Esc</kbd> or click outside to close</small>
    </section>
  </div>;
}
