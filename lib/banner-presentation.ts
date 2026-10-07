type Presentation = {
  image_only?: boolean;
  image_settings?: {
    desktop?: { show_text?: boolean };
    mobile?: { show_text?: boolean };
  } | null;
};
export function bannerShowsText(
  banner: Presentation,
  device: "desktop" | "mobile",
) {
  return banner.image_settings?.[device]?.show_text ?? !banner.image_only;
}
export function bannerNeedsText(banner: Presentation) {
  return (
    bannerShowsText(banner, "desktop") || bannerShowsText(banner, "mobile")
  );
}
