export default function Loading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        background: "var(--paper, #ffffff)",
        color: "var(--ink, #111111)",
      }}
      aria-label="Memuat aplikasi BiarFokus..."
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "appLogoPulse 2s ease-in-out infinite",
        }}
      >
        {/* Frontpage Brand Logo */}
        <img
          src="/biarfokus-logo-light.png"
          alt="BiarFokus"
          style={{
            height: "44px",
            width: "auto",
            objectFit: "contain",
          }}
        />
      </div>

      {/* Modern Minimalist Loading Beam */}
      <div
        style={{
          width: "120px",
          height: "3px",
          borderRadius: "999px",
          background: "color-mix(in srgb, var(--ink, #111) 8%, transparent)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: "50%",
            borderRadius: "999px",
            background: "linear-gradient(90deg, transparent, #ec4899, transparent)",
            animation: "appLoadingBeam 1.4s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes appLogoPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.88; }
        }
        @keyframes appLoadingBeam {
          0% { left: -50%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
