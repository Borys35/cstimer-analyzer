import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// iOS home-screen icons must be PNG, so render the SVG logo (same file as
// the favicon, src/app/icon.svg) onto a square tile at build time.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const logo = readFileSync(join(process.cwd(), "src/app/icon.svg"));
const logoSrc = `data:image/svg+xml;base64,${logo.toString("base64")}`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0E11",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={132} height={132} alt="" />
      </div>
    ),
    size,
  );
}
