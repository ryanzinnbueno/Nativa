import type { CSSProperties } from "react";
import type { Banner } from "./banner-data";

export type ImageFrame = {
  fit: "contain" | "cover";
  zoom: number;
  x: number;
  y: number;
};
export type BannerImageSettings = {
  desktop: ImageFrame;
  mobile: ImageFrame;
  mobile_image?: string;
};
export function imageFrame(
  banner: Banner,
  device: "desktop" | "mobile",
): ImageFrame {
  return (
    banner.image_settings?.[device] ?? {
      fit: banner.image_only ? "contain" : "cover",
      zoom: 100,
      x: 50,
      y: 50,
    }
  );
}
export function BannerImage({
  banner,
  priority = false,
}: {
  banner: Banner;
  priority?: boolean;
}) {
  const desktop = imageFrame(banner, "desktop"),
    mobile = imageFrame(banner, "mobile");
  const style = {
    "--image-fit": desktop.fit,
    "--image-position": `${desktop.x}% ${desktop.y}%`,
    "--image-zoom": desktop.zoom / 100,
    "--mobile-image-fit": mobile.fit,
    "--mobile-image-position": `${mobile.x}% ${mobile.y}%`,
    "--mobile-image-zoom": mobile.zoom / 100,
  } as CSSProperties;
  return (
    <picture className="banner-picture" style={style}>
      {banner.image_settings?.mobile_image && (
        <source
          media="(max-width:760px)"
          srcSet={banner.image_settings.mobile_image}
        />
      )}
      <img
        className="banner-image banner-image-configured"
        src={banner.image}
        alt={banner.alt}
        fetchPriority={priority ? "high" : "auto"}
      />
    </picture>
  );
}
