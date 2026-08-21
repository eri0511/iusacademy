import { Outlet } from 'react-router-dom';

import PublicNavbar from '../components/public/PublicNavbar';
import WavesBottom from '../components/shared/WaveBackground';

export default function PublicLayout() {
  return (
    <div className="public-layout">
      <PublicNavbar />

      <div
        className="public-layout__papers"
        aria-hidden="true"
      >
        <span className="public-paper public-paper--1" />
        <span className="public-paper public-paper--2" />
        <span className="public-paper public-paper--3" />
        <span className="public-paper public-paper--4" />
        <span className="public-paper public-paper--5" />
        <span className="public-paper public-paper--6" />
      </div>

      <div
        className="public-layout__background"
        aria-hidden="true"
      />

      <div
        className="public-layout__orb public-layout__orb--right"
        aria-hidden="true"
      />

      <div
        className="public-layout__orb public-layout__orb--left"
        aria-hidden="true"
      />

      <div className="public-layout__content">
        <Outlet />
      </div>

      <WavesBottom height={230} />

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  :root {
    --public-bg: #fbf3e8;
    --public-text: #0f172a;
    --public-soft: #6b6b6b;
    --public-accent: #f18b4b;
    --public-accent-light: #f39a5c;
    --public-accent-dark: #c46a2c;
    --public-gold: #c89a55;
  }

  html {
    scroll-behavior: smooth;
    scroll-padding-top: 96px;
  }

  html,
  body,
  #root {
    min-height: 100%;
    margin: 0;
  }

  * {
    box-sizing: border-box;
  }

  body {
    overflow-x: hidden;
  }

  .public-layout {
    min-height: 100vh;
    min-height: 100dvh;
    position: relative;
    isolation: isolate;
    overflow: hidden;
    padding-bottom: 190px;
    background: var(--public-bg);
    color: var(--public-text);
    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "SF Pro Text",
      "Segoe UI",
      sans-serif;
  }

  .public-layout__content {
    position: relative;
    z-index: 5;
  }

  .public-layout__background {
    position: absolute;
    inset: 0;
    z-index: -5;
    pointer-events: none;
    background:
      radial-gradient(
        circle at 0% 0%,
        rgba(241, 139, 75, 0.13) 0%,
        transparent 47%
      ),
      radial-gradient(
        circle at 88% 2%,
        rgba(245, 158, 11, 0.11) 0%,
        transparent 45%
      );
  }

  .public-layout__orb {
    position: absolute;
    z-index: -4;
    border-radius: 50%;
    pointer-events: none;
    background:
      radial-gradient(
        circle,
        rgba(255, 231, 200, 0.9) 0%,
        rgba(253, 243, 231, 0.7) 58%,
        transparent 75%
      );
    animation:
      publicOrb
      10s
      ease-in-out
      infinite;
  }

  .public-layout__orb--right {
    top: 180px;
    right: -130px;
    width: 460px;
    height: 460px;
  }

  .public-layout__orb--left {
    top: 720px;
    left: -180px;
    width: 480px;
    height: 480px;
    opacity: 0.55;
    animation-delay: -4s;
  }

  .public-layout__papers {
    position: fixed;
    inset: 0;
    z-index: 3;
    overflow: hidden;
    pointer-events: none;
  }

  .public-paper {
    position: absolute;
    width: 26px;
    height: 34px;
    border:
      1px solid
      rgba(148, 163, 184, 0.5);
    border-radius: 5px;
    opacity: 0;
    transform-origin: top left;
    background:
      linear-gradient(
        145deg,
        #ffffff,
        #f9fafb
      );
    box-shadow:
      0 6px 12px
      rgba(15, 23, 42, 0.22);
    animation:
      publicPaperFall
      13s
      linear
      infinite;
  }

  .public-paper::before {
    content: "";
    position: absolute;
    top: 6px;
    left: 6px;
    right: 8px;
    height: 2px;
    border-radius: 999px;
    background:
      rgba(148, 163, 184, 0.6);
  }

  .public-paper::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 10px;
    height: 10px;
    clip-path:
      polygon(
        0 0,
        100% 0,
        0 100%
      );
    background:
      linear-gradient(
        135deg,
        #e5e7eb,
        #ffffff
      );
  }

  .public-paper--1 {
    left: 8%;
    animation-duration: 14s;
  }

  .public-paper--2 {
    left: 24%;
    animation-duration: 12s;
    animation-delay: -4s;
  }

  .public-paper--3 {
    left: 42%;
    animation-duration: 15s;
    animation-delay: -7s;
  }

  .public-paper--4 {
    left: 60%;
    animation-duration: 13s;
    animation-delay: -2s;
  }

  .public-paper--5 {
    left: 78%;
    animation-duration: 16s;
    animation-delay: -9s;
  }

  .public-paper--6 {
    left: 90%;
    animation-duration: 14s;
    animation-delay: -6s;
  }

  .public-layout > .wavesBottom {
    position: absolute;
    inset: auto 0 0;
    z-index: 1;
    overflow: hidden;
    pointer-events: none;
  }

  .public-layout
  .wavesBottom__svg {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 200%;
    height: 100%;
    will-change: transform;
  }

  .public-layout
  .wavesBottom__svg--back {
    animation:
      publicWaveBack
      30s
      linear
      infinite;
  }

  .public-layout
  .wavesBottom__svg--front {
    animation:
      publicWaveFront
      20s
      linear
      infinite;
  }

  @keyframes publicWaveFront {
    from {
      transform: translateX(0);
    }

    to {
      transform: translateX(-50%);
    }
  }

  @keyframes publicWaveBack {
    from {
      transform:
        translateX(0)
        translateY(2px);
    }

    to {
      transform:
        translateX(-50%)
        translateY(2px);
    }
  }

  @keyframes publicOrb {
    0%,
    100% {
      transform:
        translateY(0)
        scale(1);
    }

    50% {
      transform:
        translateY(-10px)
        scale(1.04);
    }
  }

  @keyframes publicPaperFall {
    0% {
      transform:
        translate3d(
          0,
          -120px,
          0
        )
        rotateZ(0deg)
        rotateX(0deg);
      opacity: 0;
    }

    10% {
      opacity: 0.92;
    }

    50% {
      transform:
        translate3d(
          40px,
          50vh,
          0
        )
        rotateZ(35deg)
        rotateX(25deg);
      opacity: 0.85;
    }

    100% {
      transform:
        translate3d(
          -40px,
          115vh,
          0
        )
        rotateZ(-25deg)
        rotateX(55deg);
      opacity: 0;
    }
  }

  @media (max-width: 768px) {
    .public-layout {
      padding-bottom: 145px;
    }

    .public-layout__papers {
      display: none;
    }

    .public-layout > .wavesBottom {
      height: 175px !important;
    }
  }

  @media (
    prefers-reduced-motion:
    reduce
  ) {
    .public-layout *,
    .public-layout *::before,
    .public-layout *::after {
      animation: none !important;
      transition: none !important;
    }
  }
`;