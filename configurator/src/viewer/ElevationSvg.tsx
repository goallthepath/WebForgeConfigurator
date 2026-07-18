import type { RailingGeometry } from '../products/gelaender/geometry';

/**
 * 2D-Frontansicht als SVG – Fallback ohne WebGL und Grundlage für die
 * spätere PDF-Masszeichnung. Rendert dasselbe Geometriemodell wie die
 * 3D-Szene (Segment 1; L-Segmente erscheinen abgewickelt).
 */
export function ElevationSvg({ geometry }: { geometry: RailingGeometry }) {
  const abgewickelt = geometry.bounds.maxX + Math.abs(geometry.bounds.maxZ - geometry.bounds.minZ);
  const wM = Math.max(abgewickelt, 1);
  const hM = geometry.bounds.heightM;
  const pad = 0.35;
  const view = `${-pad} ${-hM - pad} ${wM + 2 * pad} ${hM + 2 * pad}`;

  // Abwicklung: x = Lauflänge entlang der Segmente.
  const unroll = (x: number, z: number) => x + Math.abs(z);

  return (
    <svg
      viewBox={view}
      className="elevation-svg"
      role="img"
      aria-label="Masszeichnung des Geländers (Frontansicht)"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Boden */}
      <line x1={-pad} y1={0} x2={wM + pad} y2={0} stroke="#6b7178" strokeWidth={0.02} />
      {/* Pfosten */}
      {geometry.posts.map((post, i) => {
        const w = post.shape.dM ?? post.shape.wM ?? 0.04;
        const x = unroll(post.x, post.z);
        return (
          <rect
            key={`p-${i}`}
            x={x - w / 2}
            y={-post.heightM}
            width={w}
            height={post.heightM}
            fill="#43484e"
          />
        );
      })}
      {/* Füllstäbe */}
      {geometry.bars.map((bar, i) => {
        const w = bar.shape.dM ?? bar.shape.wM ?? 0.012;
        const x = unroll(bar.x, bar.z);
        return (
          <rect
            key={`b-${i}`}
            x={x - w / 2}
            y={-(bar.yM + bar.heightM)}
            width={w}
            height={bar.heightM}
            fill="#6b7178"
          />
        );
      })}
      {/* Handlauf */}
      {geometry.rails.map((rail, i) => {
        const h = rail.shape.dM ?? rail.shape.hM ?? 0.04;
        const x1 = unroll(rail.start[0], rail.start[2]);
        const x2 = unroll(rail.end[0], rail.end[2]);
        return (
          <rect
            key={`r-${i}`}
            x={Math.min(x1, x2)}
            y={-rail.start[1] - h / 2}
            width={Math.abs(x2 - x1)}
            height={h}
            fill="#1f2124"
          />
        );
      })}
      {/* Masslinien */}
      {geometry.dimensions.map((dim, i) => {
        const horizontal = dim.start[1] === dim.end[1];
        if (horizontal) {
          const x1 = unroll(dim.start[0], dim.start[2]);
          const x2 = unroll(dim.end[0], dim.end[2]);
          return (
            <g key={`d-${i}`} stroke="#a8763e" strokeWidth={0.015}>
              <line x1={x1} y1={0.18} x2={x2} y2={0.18} />
              <line x1={x1} y1={0.12} x2={x1} y2={0.24} />
              <line x1={x2} y1={0.12} x2={x2} y2={0.24} />
              <text
                x={(x1 + x2) / 2}
                y={0.32}
                fontSize={0.13}
                fill="#43484e"
                stroke="none"
                textAnchor="middle"
              >
                {dim.label}
              </text>
            </g>
          );
        }
        return (
          <g key={`d-${i}`} stroke="#a8763e" strokeWidth={0.015}>
            <line x1={-0.22} y1={0} x2={-0.22} y2={-dim.end[1]} />
            <text
              x={-0.3}
              y={-dim.end[1] / 2}
              fontSize={0.13}
              fill="#43484e"
              stroke="none"
              textAnchor="middle"
              transform={`rotate(-90 ${-0.3} ${-dim.end[1] / 2})`}
            >
              {dim.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
