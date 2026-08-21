type WavesBottomProps = {
  height?: number;
};

export default function WavesBottom({
  height = 240,
}: WavesBottomProps) {
  return (
    <div
      className="wavesBottom"
      aria-hidden="true"
      style={{
        height: `${height}px`,
      }}
    >
      <svg
        className="wavesBottom__svg wavesBottom__svg--back"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill="rgba(250, 204, 158, 0.78)"
          d="
            M0,220
            C180,150 360,265 560,205
            C760,145 980,260 1180,205
            C1290,175 1380,188 1440,180
            L1440,320
            L0,320
            Z
          "
        />
      </svg>

      <svg
        className="wavesBottom__svg wavesBottom__svg--front"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill="rgba(244, 166, 106, 0.97)"
          d="
            M0,250
            C180,185 380,290 610,225
            C840,165 1060,285 1260,232
            C1350,210 1410,220 1440,214
            L1440,320
            L0,320
            Z
          "
        />
      </svg>
    </div>
  );
}