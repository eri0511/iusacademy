type AulaSkeletonProps = {
  cantidad?: number;
  variante?:
    | 'lista'
    | 'tarjetas';
};

export default function AulaSkeleton({
  cantidad =
    3,
  variante =
    'lista',
}: AulaSkeletonProps) {
  return (
    <div
      className={`aula-skeleton aula-skeleton--${variante}`}
      aria-hidden="true"
    >
      {Array.from({
        length:
          cantidad,
      }).map(
        (
          _,
          indice,
        ) => (
          <article
            key={
              indice
            }
            className="aula-skeleton__item"
          >
            <div className="aula-skeleton__top">
              <span className="aula-skeleton__avatar" />

              <div className="aula-skeleton__meta">
                <span className="aula-skeleton__line aula-skeleton__line--short" />
                <span className="aula-skeleton__line aula-skeleton__line--tiny" />
              </div>
            </div>

            <span className="aula-skeleton__line aula-skeleton__line--title" />
            <span className="aula-skeleton__line" />
            <span className="aula-skeleton__line aula-skeleton__line--medium" />
          </article>
        ),
      )}

      <style>
        {styles}
      </style>
    </div>
  );
}

const styles = `
  .aula-skeleton {
    display: grid;
    gap: 12px;
  }

  .aula-skeleton--tarjetas {
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
  }

  .aula-skeleton__item {
    position: relative;
    overflow: hidden;
    padding: 17px;
    border: 1px solid var(--app-border);
    border-radius: 18px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .aula-skeleton__item::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background:
      linear-gradient(
        90deg,
        transparent,
        color-mix(
          in srgb,
          var(--app-text) 7%,
          transparent
        ),
        transparent
      );
    animation:
      shimmer
      1.35s
      ease-in-out
      infinite;
  }

  .aula-skeleton__top {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .aula-skeleton__avatar {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 13px;
    background: var(--app-surface-disabled);
  }

  .aula-skeleton__meta {
    flex: 1;
    display: grid;
    gap: 7px;
  }

  .aula-skeleton__line {
    height: 9px;
    display: block;
    margin-top: 10px;
    border-radius: 999px;
    background: var(--app-surface-disabled);
  }

  .aula-skeleton__line--short {
    width: 36%;
    margin-top: 0;
  }

  .aula-skeleton__line--tiny {
    width: 22%;
    margin-top: 0;
  }

  .aula-skeleton__line--title {
    width: 58%;
    height: 13px;
    margin-top: 15px;
  }

  .aula-skeleton__line--medium {
    width: 74%;
  }

  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }

  @media (
    max-width: 700px
  ) {
    .aula-skeleton--tarjetas {
      grid-template-columns: 1fr;
    }
  }

  @media (
    prefers-reduced-motion:
    reduce
  ) {
    .aula-skeleton__item::after {
      animation: none;
    }
  }
`;