"use client";
import { useState } from "react";
import type { Banner } from "./banner-data";
import { BannerImage, imageFrame, type ImageFrame } from "./banner-image";
import { ImageUpload } from "./image-upload";

export function BannerImageEditor({
  banner,
  onChange,
  onBusy,
  onMobileUploaded,
}: {
  banner: Banner;
  onChange: (banner: Banner) => void;
  onBusy: (busy: boolean) => void;
  onMobileUploaded: (url: string) => void;
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("mobile");
  const frame = imageFrame(banner, device);
  const update = (changes: Partial<ImageFrame>) =>
    onChange({
      ...banner,
      image_settings: {
        desktop: imageFrame(banner, "desktop"),
        mobile: imageFrame(banner, "mobile"),
        ...banner.image_settings,
        [device]: { ...frame, ...changes },
      },
    });
  const mobileImage = (image: string) =>
    onChange({
      ...banner,
      image_settings: {
        desktop: imageFrame(banner, "desktop"),
        mobile: imageFrame(banner, "mobile"),
        ...banner.image_settings,
        mobile_image: image,
      },
    });
  const preview =
    device === "mobile" && banner.image_settings?.mobile_image
      ? { ...banner, image: banner.image_settings.mobile_image }
      : banner;
  return (
    <section
      className="banner-adjustments"
      aria-label="Ajustar imagem do banner"
    >
      <h3>Ajustar imagem</h3>
      <p>
        Escolha o enquadramento para cada tela. As alterações aparecem abaixo e
        serão usadas na loja ao salvar.
      </p>
      <div
        className="banner-device-tabs"
        role="group"
        aria-label="Tela da prévia"
      >
        <button
          type="button"
          aria-pressed={device === "mobile"}
          onClick={() => setDevice("mobile")}
        >
          Celular
        </button>
        <button
          type="button"
          aria-pressed={device === "desktop"}
          onClick={() => setDevice("desktop")}
        >
          Computador
        </button>
      </div>
      <div className={`banner-frame-preview preview-${device}`}>
        <BannerImage
          banner={{
            ...preview,
            image_settings: { desktop: frame, mobile: frame },
          }}
        />
        <div className="preview-banner-content">
          {!banner.image_only && (
            <>
              <strong>
                {banner.heading} {banner.heading_accent}
              </strong>
              <p>{banner.description}</p>
            </>
          )}
          <span>{banner.cta || "Botão do banner"}</span>
        </div>
      </div>
      <label>
        Como mostrar a imagem
        <select
          value={frame.fit}
          onChange={(e) => update({ fit: e.target.value as ImageFrame["fit"] })}
        >
          <option value="contain">Imagem inteira (sem cortar)</option>
          <option value="cover">Preencher o banner (pode cortar)</option>
        </select>
      </label>
      <small>
        Para uma arte vertical no computador, use uma imagem horizontal ou
        escolha preencher e ajuste o enquadramento.
      </small>
      {(
        [
          ["zoom", "Zoom", 100, 200],
          ["x", "Posição horizontal", 0, 100],
          ["y", "Posição vertical", 0, 100],
        ] as const
      ).map(([key, label, min, max]) => (
        <label key={key}>
          {label}: {frame[key]}%
          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={frame[key]}
            onChange={(e) => update({ [key]: Number(e.target.value) })}
          />
        </label>
      ))}
      <button
        type="button"
        className="secondary"
        onClick={() =>
          update({
            fit: banner.image_only ? "contain" : "cover",
            zoom: 100,
            x: 50,
            y: 50,
          })
        }
      >
        Restaurar enquadramento
      </button>
      {device === "mobile" && (
        <div className="mobile-banner-photo">
          <h4>Imagem diferente no celular (opcional)</h4>
          <p>
            Use uma arte vertical no celular e mantenha a horizontal no
            computador.
          </p>
          <ImageUpload
            kind="banner"
            onBusy={onBusy}
            onUploaded={onMobileUploaded}
          />
          <label>
            Endereço da imagem para celular
            <input
              type="url"
              maxLength={1500}
              placeholder="https://…"
              value={banner.image_settings?.mobile_image || ""}
              onChange={(e) => mobileImage(e.target.value)}
            />
          </label>
          {banner.image_settings?.mobile_image && (
            <button
              type="button"
              className="text-button"
              onClick={() => mobileImage("")}
            >
              Usar a mesma imagem nas duas telas
            </button>
          )}
        </div>
      )}
    </section>
  );
}
