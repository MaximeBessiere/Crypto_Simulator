import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Pictogramme générique "graphique en hausse" (3 barres ascendantes), neutre
// et sans rapport avec une marque existante — juste les couleurs du thème.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 3,
          paddingBottom: 5,
          background: "#0A0E1A",
        }}
      >
        <div style={{ width: 5, height: 10, background: "#2D7FF9" }} />
        <div style={{ width: 5, height: 16, background: "#2D7FF9" }} />
        <div style={{ width: 5, height: 22, background: "#F5B82E" }} />
      </div>
    ),
    { ...size }
  );
}
