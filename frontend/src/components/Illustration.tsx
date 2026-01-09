interface IllustrationProps {
  name: string;
  alt: string;
  className?: string;
  width?: number | string;
}

export function Illustration({ name, alt, className = '', width = 200 }: IllustrationProps) {
  return (
    <img
      src={`/illustrations/${name}.svg`}
      alt={alt}
      className={`illustration ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: 'auto',
        maxWidth: '100%'
      }}
      loading="lazy"
    />
  );
}
