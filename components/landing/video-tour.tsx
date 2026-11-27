"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Clapperboard, Play } from "lucide-react";
import { TOUR_VIDEO } from "@/lib/landing-content";
import styles from "./warm.module.css";

const stamp = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * The product tour. The video loads only its metadata until someone presses
 * play. If no video file is published yet, the poster stays with a short note,
 * so the page never shows a broken player.
 */
export function VideoTour() {
  const video = useRef<HTMLVideoElement>(null);
  const failed = useRef(0);
  const [started, setStarted] = useState(false);
  const [missing, setMissing] = useState(false);
  const [chapter, setChapter] = useState(-1);

  // A missing file can fail before hydration attaches the error listeners,
  // so also ask the element whether it found any playable source.
  useEffect(() => {
    const element = video.current;
    if (element && element.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) setMissing(true);
  }, []);

  const play = (at?: number) => {
    const element = video.current;
    if (!element || missing) return;
    if (typeof at === "number") element.currentTime = at;
    setStarted(true);
    void element.play().catch(() => {
      if (element.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
        setStarted(false);
        setMissing(true);
      }
    });
  };

  const onSourceError = () => {
    failed.current += 1;
    if (failed.current >= TOUR_VIDEO.sources.length) setMissing(true);
  };

  const onTime = () => {
    const now = video.current?.currentTime ?? 0;
    let current = -1;
    TOUR_VIDEO.chapters.forEach((item, index) => { if (now >= item.at) current = index; });
    setChapter(current);
  };

  return (
    <section id="tour" className={`${styles.tourBand} scroll-mt-24`}>
      <div className={`${styles.section} ${styles.shell} ${styles.tour}`}>
        <div>
          <p className="eyebrow">Product tour</p>
          <h2 className={`${styles.title} mt-3`}>See it in <em>ninety seconds.</em></h2>
          <p className={styles.lede}>A short walk through a sample household, from net worth to a plain-language answer.</p>

          <ol className={styles.chapters}>
            {TOUR_VIDEO.chapters.map((item, index) => (
              <li key={item.label}>
                <button
                  type="button"
                  className={styles.chapter}
                  onClick={() => play(item.at)}
                  disabled={missing}
                  aria-current={chapter === index ? "true" : undefined}
                >
                  <time>{stamp(item.at)}</time>
                  <span>
                    <b>{item.label}</b>
                    <span>{item.body}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <Link href="/sign-up" className={styles.btn}>Start free</Link>
        </div>

        <div className={styles.player} data-started={started}>
          <video
            ref={video}
            poster={TOUR_VIDEO.poster}
            preload="metadata"
            playsInline
            controls={started}
            onTimeUpdate={onTime}
            onEnded={() => setChapter(-1)}
            aria-label="Finlio product tour"
          >
            {TOUR_VIDEO.sources.map((source) => (
              <source key={source.src} src={source.src} type={source.type} onError={onSourceError} />
            ))}
            {TOUR_VIDEO.captions ? <track kind="captions" src={TOUR_VIDEO.captions} srcLang="en" label="English" default /> : null}
          </video>

          {!started && !missing ? (
            <button type="button" className={styles.playOverlay} onClick={() => play()} aria-label="Play the product tour">
              <span className={styles.playButton}><Play size={30} fill="currentColor" /></span>
              <span className={styles.playMeta}>
                <span>Finlio in a minute and a half<small>Sample data, real product</small></span>
                <span className={styles.duration}>{TOUR_VIDEO.length}</span>
              </span>
            </button>
          ) : null}

          {missing ? (
            <p className={styles.soon} role="status">
              <Clapperboard size={18} /> The tour video is on its way. Until then, start free and explore with sample data.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
