let wooAudio: HTMLAudioElement | null = null;

/** Plays the "Woooo!" sound effect every time a card is moved. */
export function playWoo() {
  if (typeof window === "undefined") return;
  if (!wooAudio) {
    wooAudio = new Audio("/ric-flair-woo.mp3");
  }
  wooAudio.currentTime = 0;
  void wooAudio.play().catch(() => {});
}
