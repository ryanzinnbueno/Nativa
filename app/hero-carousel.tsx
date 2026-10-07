"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

import { type Banner } from "./banner-data";
import { BannerImage } from "./banner-image";
import { bannerShowsText, bannerNeedsText } from "../lib/banner-presentation";

export default function HeroCarousel({
  onExplore,
  slides,
  seconds = 7,
  autoplay = true,
}: {
  onExplore: (category: string) => void;
  slides: Banner[];
  seconds?: number;
  autoplay?: boolean;
}) {
  const [index, setIndex] = useState(0),
    [paused, setPaused] = useState(false),
    [hovered, setHovered] = useState(false),
    [focused, setFocused] = useState(false),
    [reduced, setReduced] = useState(true),
    [visible, setVisible] = useState(true);
  const touch = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    const visibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  const playing =
    slides.length > 1 &&
    autoplay &&
    !paused &&
    !hovered &&
    !focused &&
    !reduced &&
    visible;
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(
      () => setIndex((i) => (i + 1) % slides.length),
      seconds * 1000,
    );
    return () => clearTimeout(timer);
  }, [index, playing, seconds, slides.length]);
  const go = (i: number) => {
    setIndex((i + slides.length) % slides.length);
    setPaused(true);
  };
  if (!slides.length) return null;
  const current = index % slides.length;
  const slide = slides[current];
  return (
    <section
      className="nativa-carousel"
      aria-roledescription="carrossel"
      aria-label="Inspirações naturais"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(index + 1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(index - 1);
        }
      }}
      onTouchStart={(e) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        if (!touch.current) return;
        const dx = e.changedTouches[0].clientX - touch.current.x,
          dy = e.changedTouches[0].clientY - touch.current.y;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy))
          go(index + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}
    >
      <div
        className={`nativa-banner nativa-banner-${current}${!bannerShowsText(slide, "desktop") ? " banner-image-only banner-desktop-image-only" : ""}${bannerShowsText(slide, "mobile") ? " banner-mobile-text" : " banner-mobile-image-only"}`}
        key={slide.id}
        role="group"
        aria-roledescription="slide"
        aria-label={`${current + 1} de ${slides.length}: ${slide.category}`}
      >
        <BannerImage banner={slide} priority={current === 0} />
        <div className="banner-message">
          {bannerNeedsText(slide) && (
            <>
              <h1>
                {slide.heading} <span>{slide.heading_accent}</span>
              </h1>
              <p>{slide.description}</p>
            </>
          )}
          <button onClick={() => onExplore(slide.category)}>{slide.cta}</button>
        </div>
      </div>
      <button
        disabled={slides.length < 2}
        className="banner-arrow banner-previous"
        aria-label="Conteúdo anterior"
        onClick={() => go(index - 1)}
      >
        <ChevronLeft size={23} />
      </button>
      <button
        disabled={slides.length < 2}
        className="banner-arrow banner-next"
        aria-label="Próximo conteúdo"
        onClick={() => go(index + 1)}
      >
        <ChevronRight size={23} />
      </button>
      <div className="banner-controls">
        <div
          className="banner-indicators"
          role="group"
          aria-label="Escolher banner"
        >
          {slides.map((s, i) => (
            <button
              key={s.id}
              className={i === current ? "selected" : ""}
              aria-label={`Mostrar ${s.category}`}
              aria-pressed={i === current}
              onClick={() => go(i)}
            >
              <span />
            </button>
          ))}
        </div>
        <button
          className="banner-pause"
          aria-label={
            reduced
              ? "Reprodução automática desativada por preferência de movimento"
              : paused
                ? "Retomar carrossel"
                : "Pausar carrossel"
          }
          disabled={reduced || !autoplay || slides.length < 2}
          onClick={() => {
            if (paused) {
              setFocused(false);
              setHovered(false);
            }
            setPaused((p) => !p);
          }}
        >
          {paused || reduced ? <Play size={15} /> : <Pause size={15} />}
        </button>
      </div>
    </section>
  );
}
