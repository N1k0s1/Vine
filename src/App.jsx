import { useEffect, useMemo } from "react";
import sourceHtml from "../code.html?raw";

export default function App() {
  const { bodyClassName, bodyMarkup } = useMemo(() => {
    const doc = new DOMParser().parseFromString(sourceHtml, "text/html");
    doc.body.querySelectorAll("script").forEach((scriptEl) => scriptEl.remove());

    const markup = doc.body.innerHTML.replace(
      'target="_blank"',
      'target="_blank" rel="noreferrer"'
    );

    return {
      bodyClassName: doc.body.className,
      bodyMarkup: markup,
    };
  }, []);

  useEffect(() => {
    const container = document.getElementById("vinyl-container");
    const disc = document.getElementById("vinyl-disc");
    const turntableImage = document.getElementById("turntable-image");
    const vinylRecordImage = document.getElementById("vinyl-record");
    const shuffleButton = document.getElementById("shuffle-tracks-button");
    const nowPlayingFile = document.getElementById("now-playing-file");
    const nowPlayingMeta = document.getElementById("now-playing-meta");
    const nowPlayingLines = Array.from(document.querySelectorAll("[data-now-playing-line]"));
    const playerProgressBar = document.getElementById("player-progress-bar");
    const playerTime = document.getElementById("player-time");
    const muteButton = document.getElementById("mute-audio-button");
    const muteButtonIcon = document.getElementById("mute-audio-icon");
    const muteButtonLabel = document.getElementById("mute-audio-label");
    const wallTrackCards = Array.from(document.querySelectorAll(".wall-track-card"));

    if (!container || !disc || typeof disc.animate !== "function" || wallTrackCards.length === 0) {
      return undefined;
    }

    let isDragging = false;
    let currentRotation = 0;
    let lastPointerAngle = 0;
    let spinAnimation;
    let activeTrackIndex = 0;
    let hasAttachedAutoplayFallback = false;
    let hasRetriedMutedAutoplay = false;

    const audio = new Audio();
    audio.preload = "metadata";
    audio.autoplay = true;
    audio.playsInline = true;

    function updateMuteButtonUi() {
      if (!muteButton) {
        return;
      }

      const isMuted = audio.muted;
      muteButton.setAttribute("aria-pressed", String(isMuted));
      muteButton.setAttribute("aria-label", isMuted ? "Unmute audio" : "Mute audio");

      if (muteButtonIcon) {
        muteButtonIcon.textContent = isMuted ? "volume_off" : "volume_up";
      }

      if (muteButtonLabel) {
        muteButtonLabel.textContent = isMuted ? "UNMUTE" : "MUTE";
      }
    }

    const onAutoplayFallback = () => {
      hasAttachedAutoplayFallback = false;

      if (audio.muted) {
        audio.muted = false;
        const activeTrack = tracks[activeTrackIndex];

        if (activeTrack) {
          updateNowPlaying(activeTrack);
        }

        updateMuteButtonUi();
      }

      playCurrentAudio();
    };

    function attachAutoplayFallback() {
      if (hasAttachedAutoplayFallback) {
        return;
      }

      hasAttachedAutoplayFallback = true;
      document.addEventListener("click", onAutoplayFallback, { once: true });
      document.addEventListener("keydown", onAutoplayFallback, { once: true });
    }

    const onMuteButtonClick = (event) => {
      event.preventDefault();
      audio.muted = !audio.muted;
      updateMuteButtonUi();

      const activeTrack = tracks[activeTrackIndex];

      if (activeTrack) {
        updateNowPlaying(activeTrack);

        if (audio.muted && nowPlayingMeta) {
          nowPlayingMeta.textContent = `# ${activeTrack.artist} • ${activeTrack.title} • muted`;
        }
      }
    };

    const defaultSnippet = [
      "> live_loop :vine do",
      "> sample :bd_haus, amp: 2",
      "> sleep 0.5",
      "> end",
    ];

    const tracks = wallTrackCards.map((card, index) => {
      const artist =
        card.querySelector(".wall-track-artist")?.textContent?.trim() || `@track_${index + 1}`;
      const trackTitle =
        card.dataset.trackTitle?.trim() ||
        card.querySelector(".wall-track-title")?.textContent?.replaceAll('"', "").trim() ||
        `Track ${index + 1}`;
      const source = card.dataset.trackSrc?.trim() || "https://samplelib.com/lib/preview/mp3/sample-6s.mp3";
      const fileName =
        card.dataset.trackFile?.trim() ||
        `${trackTitle.toLowerCase().replace(/[^a-z0-9]+/gi, "_")}.rb`;
      const parsedSnippet = (card.dataset.trackSnippet || "")
        .split("|")
        .map((line) => line.trim())
        .filter(Boolean);

      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `Play ${trackTitle} by ${artist}`);

      return {
        artist,
        card,
        fileName,
        snippet: parsedSnippet.length > 0 ? parsedSnippet : defaultSnippet,
        source,
        title: trackTitle,
      };
    });

    function formatTime(value) {
      if (!Number.isFinite(value)) {
        return "--:--";
      }

      const seconds = Math.max(0, Math.floor(value));
      const minutes = Math.floor(seconds / 60);
      return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    }

    function normalizeAngleDelta(value) {
      let delta = value;

      while (delta > 180) {
        delta -= 360;
      }

      while (delta < -180) {
        delta += 360;
      }

      return delta;
    }

    function updatePlaybackUi() {
      const currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

      if (playerProgressBar) {
        playerProgressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
      }

      if (playerTime) {
        playerTime.textContent = `${formatTime(currentTime)} / ${duration > 0 ? formatTime(duration) : "--:--"}`;
      }
    }

    function updateWallSelectionUi() {
      tracks.forEach((track, index) => {
        const isCurrentTrack = index === activeTrackIndex;
        const isPlayingTrack = isCurrentTrack && !audio.paused;
        const playIcon = track.card.querySelector(".wall-track-play");

        track.card.classList.toggle("is-now-playing", isCurrentTrack);
        track.card.setAttribute("aria-pressed", String(isCurrentTrack));

        if (playIcon) {
          playIcon.textContent = isPlayingTrack ? "equalizer" : "play_circle";
        }
      });
    }

    function updateNowPlaying(track) {
      if (nowPlayingFile) {
        nowPlayingFile.textContent = `# Playing: "${track.fileName}"`;
      }

      if (nowPlayingMeta) {
        nowPlayingMeta.textContent = `# ${track.artist} • ${track.title}`;
      }

      nowPlayingLines.forEach((lineEl, lineIndex) => {
        const nextLine = track.snippet[lineIndex] || defaultSnippet[lineIndex] || "> end";
        lineEl.textContent = nextLine.startsWith(">") ? nextLine : `> ${nextLine}`;
      });

      updateWallSelectionUi();
      updatePlaybackUi();
    }

    function getAngle(x, y) {
      const rect = container.getBoundingClientRect();
      const styles = window.getComputedStyle(disc);
      const xPct = Number.parseFloat(styles.getPropertyValue("--vinyl-x")) || 50;
      const yPct = Number.parseFloat(styles.getPropertyValue("--vinyl-y")) || 50;
      const centerX = rect.left + (xPct / 100) * rect.width;
      const centerY = rect.top + (yPct / 100) * rect.height;
      return Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
    }

    function getCurrentRotation(el) {
      const st = window.getComputedStyle(el, null);
      const tr = st.getPropertyValue("transform");

      if (tr === "none") {
        return 0;
      }

      const values = tr.split("(")[1].split(")")[0].split(",");
      const a = Number.parseFloat(values[0]);
      const b = Number.parseFloat(values[1]);
      return Math.round(Math.atan2(b, a) * (180 / Math.PI));
    }

    function startSpin(fromAngle) {
      if (spinAnimation) {
        spinAnimation.cancel();
      }

      if (audio.paused) {
        disc.style.transform = `rotate(${fromAngle}deg)`;
        return;
      }

      spinAnimation = disc.animate(
        [
          { transform: `rotate(${fromAngle}deg)` },
          { transform: `rotate(${fromAngle + 360}deg)` },
        ],
        {
          duration: 2400,
          iterations: Infinity,
          easing: "linear",
        }
      );
    }

    function pauseSpinAtCurrentAngle() {
      if (!spinAnimation) {
        return;
      }

      currentRotation = getCurrentRotation(disc);
      spinAnimation.cancel();
      spinAnimation = undefined;
      disc.style.transform = `rotate(${currentRotation}deg)`;
    }

    function detectVinylCircle(img) {
      const size = 220;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (!ctx) {
        return null;
      }

      let data;

      try {
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        data = ctx.getImageData(0, 0, size, size).data;
      } catch {
        return null;
      }

      let sumX = 0;
      let sumY = 0;
      let sumWeight = 0;
      const darkPixels = [];

      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const idx = (y * size + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          if (a < 20) {
            continue;
          }

          const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const darkness = 255 - luma;

          if (darkness < 110) {
            continue;
          }

          sumX += x * darkness;
          sumY += y * darkness;
          sumWeight += darkness;
          darkPixels.push({ darkness, x, y });
        }
      }

      if (sumWeight < 5000 || darkPixels.length < 300) {
        return null;
      }

      const cx = sumX / sumWeight;
      const cy = sumY / sumWeight;
      let weightedDistance = 0;
      let distanceWeight = 0;

      darkPixels.forEach((pixel) => {
        const dist = Math.hypot(pixel.x - cx, pixel.y - cy);
        weightedDistance += dist * pixel.darkness;
        distanceWeight += pixel.darkness;
      });

      if (distanceWeight === 0) {
        return null;
      }

      const avgDistance = weightedDistance / distanceWeight;
      const radius = avgDistance * 1.45;
      const minRadius = size * 0.12;
      const maxRadius = size * 0.48;

      if (radius < minRadius || radius > maxRadius) {
        return null;
      }

      return {
        rPct: (radius / size) * 100,
        xPct: (cx / size) * 100,
        yPct: (cy / size) * 100,
      };
    }

    function applyVinylMask() {
      const maskSource =
        vinylRecordImage instanceof HTMLImageElement ? vinylRecordImage : turntableImage;

      if (!(maskSource instanceof HTMLImageElement)) {
        return;
      }

      const detected = detectVinylCircle(maskSource);

      if (!detected) {
        return;
      }

      const x = Math.max(10, Math.min(90, detected.xPct));
      const y = Math.max(10, Math.min(90, detected.yPct));
      const r = Math.max(24, Math.min(46, detected.rPct));
      const labelSize = Math.max(12, Math.min(30, r * 0.52));

      disc.style.setProperty("--vinyl-x", `${x}%`);
      disc.style.setProperty("--vinyl-y", `${y}%`);
      disc.style.setProperty("--vinyl-r", `${r}%`);
      disc.style.setProperty("--vinyl-label-size", `${labelSize}%`);
    }

    function playCurrentAudio() {
      const playPromise = audio.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch((error) => {
          const isAutoplayPolicyBlock =
            error instanceof DOMException && error.name === "NotAllowedError";

          if (isAutoplayPolicyBlock && !hasRetriedMutedAutoplay) {
            hasRetriedMutedAutoplay = true;
            audio.muted = true;
              updateMuteButtonUi();

            const mutedPlayPromise = audio.play();

            if (mutedPlayPromise && typeof mutedPlayPromise.then === "function") {
              mutedPlayPromise
                .then(() => {
                  const activeTrack = tracks[activeTrackIndex];

                  if (nowPlayingMeta && activeTrack) {
                    nowPlayingMeta.textContent = `# ${activeTrack.artist} • ${activeTrack.title} • muted autoplay`;
                  }

                  attachAutoplayFallback();
                })
                .catch(() => {
                  container.classList.remove("is-playing");
                  updateWallSelectionUi();

                  if (nowPlayingMeta) {
                    nowPlayingMeta.textContent = "# Autoplay blocked by browser. Click anywhere to start.";
                  }

                  attachAutoplayFallback();
                });

              return;
            }
          }

          container.classList.remove("is-playing");
          updateWallSelectionUi();

          if (nowPlayingMeta) {
            nowPlayingMeta.textContent = "# Autoplay blocked by browser. Click anywhere to start.";
          }

          attachAutoplayFallback();
        });
      }
    }

    function loadTrack(index, shouldAutoplay) {
      const safeIndex = ((index % tracks.length) + tracks.length) % tracks.length;
      const track = tracks[safeIndex];

      activeTrackIndex = safeIndex;
      audio.src = track.source;
      audio.load();
      audio.currentTime = 0;
      currentRotation = 0;
      disc.style.transform = "rotate(0deg)";
      updateNowPlaying(track);

      if (shouldAutoplay) {
        playCurrentAudio();
      }
    }

    function getRandomTrackIndex(excludedIndex) {
      if (tracks.length < 2) {
        return excludedIndex;
      }

      let randomIndex = excludedIndex;

      while (randomIndex === excludedIndex) {
        randomIndex = Math.floor(Math.random() * tracks.length);
      }

      return randomIndex;
    }

    function playTrackAtIndex(index) {
      if (index === activeTrackIndex && audio.src) {
        playCurrentAudio();
        return;
      }

      loadTrack(index, true);
    }

    const onPointerDown = (e) => {
      isDragging = true;
      container.classList.add("is-dragging");
      container.setPointerCapture(e.pointerId);
      currentRotation = getCurrentRotation(disc);
      lastPointerAngle = getAngle(e.clientX, e.clientY);
      pauseSpinAtCurrentAngle();

      if (!audio.src) {
        loadTrack(activeTrackIndex, false);
      }

      if (audio.muted) {
        audio.muted = false;
        updateMuteButtonUi();

        const activeTrack = tracks[activeTrackIndex];

        if (activeTrack) {
          updateNowPlaying(activeTrack);
        }
      }

      playCurrentAudio();
    };

    const onPointerMove = (e) => {
      if (!isDragging) {
        return;
      }

      const pointerAngle = getAngle(e.clientX, e.clientY);
      const deltaAngle = normalizeAngleDelta(pointerAngle - lastPointerAngle);

      lastPointerAngle = pointerAngle;
      currentRotation += deltaAngle;
      disc.style.transform = `rotate(${currentRotation}deg)`;

      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;

      if (duration > 0) {
        const deltaTime = (deltaAngle / 360) * duration;
        const nextTime = Math.max(0, Math.min(duration, audio.currentTime + deltaTime));
        audio.currentTime = nextTime;
      }

      updatePlaybackUi();
    };

    const endDrag = () => {
      if (!isDragging) {
        return;
      }

      isDragging = false;
      container.classList.remove("is-dragging");

      if (!audio.paused) {
        startSpin(currentRotation);
      }
    };

    const onDragStart = (e) => {
      e.preventDefault();
    };

    const onShuffleClick = () => {
      const nextTrackIndex = getRandomTrackIndex(activeTrackIndex);
      playTrackAtIndex(nextTrackIndex);

      if (shuffleButton && typeof shuffleButton.animate === "function") {
        shuffleButton.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.04)" },
            { transform: "scale(1)" },
          ],
          {
            duration: 260,
            easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
          }
        );
      }
    };

    const onLoadedMetadata = () => {
      updatePlaybackUi();
    };

    const onTimeUpdate = () => {
      updatePlaybackUi();
    };

    const onAudioPlay = () => {
      container.classList.add("is-playing");

      const activeTrack = tracks[activeTrackIndex];

      if (activeTrack) {
        updateNowPlaying(activeTrack);

        if (audio.muted && nowPlayingMeta) {
          nowPlayingMeta.textContent = `# ${activeTrack.artist} • ${activeTrack.title} • muted autoplay`;
        }
      }

      updateWallSelectionUi();
      startSpin(currentRotation);
    };

    const onAudioPause = () => {
      container.classList.remove("is-playing");
      updateWallSelectionUi();
      pauseSpinAtCurrentAngle();
    };

    const onAudioEnded = () => {
      const nextTrackIndex = getRandomTrackIndex(activeTrackIndex);
      loadTrack(nextTrackIndex, true);
    };

    const onAudioError = () => {
      if (nowPlayingMeta) {
        nowPlayingMeta.textContent = "# Missing MP3 source. Update data-track-src on a Wall of Noise card.";
      }

      container.classList.remove("is-playing");
      updateWallSelectionUi();
      pauseSpinAtCurrentAngle();
    };

    const cardListeners = tracks.map((track, index) => {
      const onClick = () => {
        playTrackAtIndex(index);
      };

      const onKeyDown = (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }

        event.preventDefault();
        playTrackAtIndex(index);
      };

      track.card.addEventListener("click", onClick);
      track.card.addEventListener("keydown", onKeyDown);

      return { card: track.card, onClick, onKeyDown };
    });

    const maskSource =
      vinylRecordImage instanceof HTMLImageElement ? vinylRecordImage : turntableImage;

    if (maskSource instanceof HTMLImageElement) {
      if (maskSource.complete) {
        applyVinylMask();
      } else {
        maskSource.addEventListener("load", applyVinylMask, { once: true });
      }
    }

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onAudioPlay);
    audio.addEventListener("pause", onAudioPause);
    audio.addEventListener("ended", onAudioEnded);
    audio.addEventListener("error", onAudioError);

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    window.addEventListener("blur", endDrag);
    container.addEventListener("dragstart", onDragStart);

    if (shuffleButton) {
      shuffleButton.addEventListener("click", onShuffleClick);
    }

    if (muteButton) {
      muteButton.addEventListener("click", onMuteButtonClick);
    }

    updateMuteButtonUi();

    loadTrack(0, true);

    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      window.removeEventListener("blur", endDrag);
      container.removeEventListener("dragstart", onDragStart);

      if (shuffleButton) {
        shuffleButton.removeEventListener("click", onShuffleClick);
      }

      if (muteButton) {
        muteButton.removeEventListener("click", onMuteButtonClick);
      }

      cardListeners.forEach(({ card, onClick, onKeyDown }) => {
        card.removeEventListener("click", onClick);
        card.removeEventListener("keydown", onKeyDown);
      });

      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onAudioPlay);
      audio.removeEventListener("pause", onAudioPause);
      audio.removeEventListener("ended", onAudioEnded);
      audio.removeEventListener("error", onAudioError);
      audio.src = "";

      document.removeEventListener("click", onAutoplayFallback);
      document.removeEventListener("keydown", onAutoplayFallback);

      if (spinAnimation) {
        spinAnimation.cancel();
      }

      if (maskSource instanceof HTMLImageElement) {
        maskSource.removeEventListener("load", applyVinylMask);
      }
    };
  }, []);

  useEffect(() => {
    const tabButtons = Array.from(document.querySelectorAll(".header-tab-button"));
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (tabButtons.length === 0) {
      return undefined;
    }

    const listeners = tabButtons.map((button) => {
      const onClick = (event) => {
        if (typeof button.animate !== "function") {
          return;
        }

        button.animate(
          [
            {
              filter: "brightness(1)",
              boxShadow: "0 0 0 rgba(198,70,61,0)",
            },
            {
              filter: "brightness(1.25)",
              boxShadow: "0 0 0 4px rgba(198,70,61,0.3)",
            },
            {
              filter: "brightness(1)",
              boxShadow: "0 0 0 rgba(198,70,61,0)",
            },
          ],
          {
            duration: 220,
            easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
          }
        );

        const href = button.getAttribute("href");

        if (!href || !href.startsWith("#")) {
          return;
        }

        const target = document.querySelector(href);

        if (!target) {
          return;
        }

        event.preventDefault();

        const header = document.querySelector("header");
        const headerOffset = (header?.getBoundingClientRect().height ?? 0) + 12;
        const targetTop = window.scrollY + target.getBoundingClientRect().top - headerOffset;

        window.scrollTo({
          top: targetTop,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });

        if (window.history && typeof window.history.pushState === "function") {
          window.history.pushState(null, "", href);
        }

        if (!prefersReducedMotion && typeof target.animate === "function") {
          target.animate(
            [
              { transform: "translateY(0)", filter: "brightness(1)" },
              { transform: "translateY(-3px)", filter: "brightness(1.04)" },
              { transform: "translateY(0)", filter: "brightness(1)" },
            ],
            {
              duration: 360,
              easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
            }
          );
        }
      };

      button.addEventListener("click", onClick);
      return { button, onClick };
    });

    return () => {
      listeners.forEach(({ button, onClick }) => {
        button.removeEventListener("click", onClick);
      });
    };
  }, [bodyMarkup]);

  useEffect(() => {
    const generateIdeaButton = document.getElementById("generate-idea-button");
    const output = document.getElementById("idea-generator-output");
    const flavor = document.getElementById("idea-generator-flavor");

    if (!generateIdeaButton || !output || !(output instanceof HTMLElement)) {
      return undefined;
    }

    const moods = [
      "Lo-fi jungle rain",
      "Arcade speedrun panic",
      "Late-night city bus",
      "Alien disco rehearsal",
      "Underwater drum circle",
      "Post-apocalypse sunrise",
      "Robot lullaby",
      "Cyberpunk skate park",
    ];

    const constraints = [
      "using only one sample",
      "at exactly 90 BPM",
      "with no kick drum",
      "with a melody that never repeats exactly",
      "inside two live_loops max",
      "where every 4th bar is silence",
      "using only minor pentatonic notes",
      "that changes synth every 8 beats",
    ];

    const twists = [
      "then reverse the rhythm halfway through",
      "and add a fake radio tuning intro",
      "and finish with a glitchy slow-down",
      "and hide Morse code in the hats",
      "and make the bassline answer the lead",
      "and automate reverb from dry to huge",
      "and add one surprise sample from your room",
      "and end with a single sustained note",
    ];

    const boosts = [
      "Build a tiny 8-bar prototype first.",
      "Start with drums, then sculpt melody.",
      "Keep it simple and make one part excellent.",
      "Record a rough version, then iterate once.",
      "Name your loops like scenes in a movie.",
      "Test on headphones before final export.",
    ];

    let previousIdea = "";

    const pickOne = (items) => items[Math.floor(Math.random() * items.length)];

    const generateIdea = () => {
      let nextIdea = previousIdea;
      let attempts = 0;

      while (nextIdea === previousIdea && attempts < 8) {
        nextIdea = `${pickOne(moods)} ${pickOne(constraints)} ${pickOne(twists)}.`;
        attempts += 1;
      }

      previousIdea = nextIdea;
      output.textContent = nextIdea;

      if (flavor) {
        flavor.textContent = `Tip: ${pickOne(boosts)}`;
      }

      if (typeof output.animate === "function") {
        output.animate(
          [
            { transform: "translateY(4px)", opacity: 0.2 },
            { transform: "translateY(0)", opacity: 1 },
          ],
          {
            duration: 260,
            easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
          }
        );
      }

      if (typeof generateIdeaButton.animate === "function") {
        generateIdeaButton.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.05)" },
            { transform: "scale(1)" },
          ],
          {
            duration: 220,
            easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
          }
        );
      }
    };

    generateIdeaButton.addEventListener("click", generateIdea);
    generateIdea();

    return () => {
      generateIdeaButton.removeEventListener("click", generateIdea);
    };
  }, [bodyMarkup]);

  return (
    <div className={bodyClassName} dangerouslySetInnerHTML={{ __html: bodyMarkup }} />
  );
}
