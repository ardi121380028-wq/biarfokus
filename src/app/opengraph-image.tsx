import { ImageResponse } from "next/og";

export const alt = "BiarFokus — Bantu kamu fokus selesain setiap pekerjaan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#111111",
          color: "#f5f5f5",
          fontFamily: "sans-serif",
          padding: "60px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-150px",
            right: "-150px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(247,127,165,0.35) 0%, rgba(24,117,209,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-150px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(24,117,209,0.35) 0%, rgba(247,127,165,0) 70%)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              backgroundColor: "#f77fa5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px",
            }}
          >
            🍅
          </div>
          <span
            style={{
              fontSize: "64px",
              fontFamily: "serif",
              fontWeight: "bold",
              letterSpacing: "-1px",
              color: "#ffffff",
            }}
          >
            biarfokus
          </span>
        </div>

        <h1
          style={{
            fontSize: "44px",
            textAlign: "center",
            maxWidth: "920px",
            lineHeight: 1.3,
            color: "#f5f5f5",
            margin: "0 0 24px",
            fontWeight: 800,
          }}
        >
          Bantu kamu fokus selesain setiap pekerjaan.
        </h1>

        <p
          style={{
            fontSize: "24px",
            color: "#a9a9a9",
            textAlign: "center",
            maxWidth: "800px",
            margin: "0 0 36px",
          }}
        >
          Pomodoro timer akurat, task management harian, focus streaks, dan suara latar penenang.
        </p>

        <div
          style={{
            display: "flex",
            gap: "18px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#f77fa5",
              color: "#ffffff",
              padding: "12px 28px",
              borderRadius: "999px",
              fontSize: "20px",
              fontWeight: "bold",
            }}
          >
            biarfokus.site
          </div>
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#ffffff",
              padding: "12px 28px",
              borderRadius: "999px",
              fontSize: "20px",
            }}
          >
            Gratis & Tanpa Iklan
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
