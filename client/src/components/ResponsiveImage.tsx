import { cn } from "@/lib/utils";

type ResponsiveImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
  priority?: boolean;
};

const shouldUseModernSources = (src: string) => {
  if (!src.startsWith("/")) return false;
  const cleanSrc = src.split("?")[0];
  return /\.(png|jpe?g)$/i.test(cleanSrc);
};

const replaceExtension = (src: string, extension: string) => {
  const [path, query] = src.split("?");
  const updatedPath = path.replace(/\.(png|jpe?g)$/i, extension);
  return query ? `${updatedPath}?${query}` : updatedPath;
};

export function ResponsiveImage({
  src,
  alt,
  className,
  sizes,
  width,
  height,
  loading = "lazy",
  decoding = "async",
  priority = false,
}: ResponsiveImageProps) {
  const useModernSources = shouldUseModernSources(src);
  const srcSet = `${src} 1x, ${src} 2x`;
  const resolvedLoading = priority ? "eager" : loading;

  const image = (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={resolvedLoading}
      decoding={decoding}
      className={cn(className)}
    />
  );

  if (!useModernSources) {
    return image;
  }

  return (
    <picture>
      <source srcSet={replaceExtension(src, ".avif")} type="image/avif" />
      <source srcSet={replaceExtension(src, ".webp")} type="image/webp" />
      {image}
    </picture>
  );
}
