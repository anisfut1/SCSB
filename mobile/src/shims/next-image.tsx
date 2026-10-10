import type { ImgHTMLAttributes } from "react";

/** `next/image` pour l'app : une simple balise <img> (pas d'optimiseur d'images dans un bundle local). */
type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & { src: string | { src: string }; priority?: boolean; fill?: boolean; quality?: number };

export default function Image({ src, priority: _priority, fill, quality: _quality, style, alt, ...rest }: Props) {
  const url = typeof src === "string" ? src : src.src;
  return <img src={url} alt={alt ?? ""} style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...style } : style} {...rest} />;
}
