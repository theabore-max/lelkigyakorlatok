// api/og.js
const { ImageResponse } = require("@vercel/og"); // npm i @vercel/og

module.exports = async (req, res) => {
  try {
    const { searchParams } = new URL(req.url, "http://localhost");
    const title = searchParams.get("title") || "Lelkigyakorlat";
    const date = searchParams.get("date") || "";
    const place = searchParams.get("place") || "";

    const img = new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            background: "#0b4a6f",
            color: "white",
            padding: "60px",
            fontSize: 48,
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ fontSize: 28, opacity: 0.85, marginBottom: 12 }}>
            Katolikus lelkigyakorlat-kereső
          </div>
          <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
          <div style={{ fontSize: 32, marginTop: 20 }}>
            {date}{place ? " • " + place : ""}
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );

    res.setHeader("Content-Type", "image/png");
    res.status(200).end(img.body);
  } catch (e) {
    res.status(500).send("OG error: " + String(e));
  }
};
