const revealItems = document.querySelectorAll(".reveal");
const navLinks = document.querySelectorAll(".site-nav a");
const sections = [...document.querySelectorAll("main section[id]")];
const header = document.querySelector(".site-header");
const educationCards = document.querySelectorAll(".education-interactive-card");
const clickSoundTargets = document.querySelectorAll(".btn, .work-link, .certificate-action, .image-modal-close");
const modalTriggers = document.querySelectorAll("[data-modal-target]");
const modalCloseTriggers = document.querySelectorAll("[data-modal-close]");
const modalTitle = document.getElementById("preview-modal-title");
const modalImage = document.querySelector("#preview-modal .image-modal-figure img");
const modalFigure = document.querySelector("#preview-modal .image-modal-figure");
const modalGallery = document.querySelector("#preview-modal .image-modal-gallery");
const educationSound = document.getElementById("education-sound") || new Audio("assets/images/open.mp3");
const clickSound = document.getElementById("click-sound") || new Audio("assets/images/click.mp3");
const hoverCapable = window.matchMedia("(hover: hover)").matches;
const isMobileViewport = window.matchMedia("(max-width: 640px)").matches;
const modalAssetCache = new Map();
let ticking = false;
let audioUnlocked = false;
let activeModalRequest = 0;

educationSound.preload = "auto";
clickSound.preload = "auto";

const resetSound = sound => {
  sound.pause();
  sound.currentTime = 0;
};

const unlockAudio = () => {
  if (audioUnlocked) {
    return;
  }

  audioUnlocked = true;

  [educationSound, clickSound].forEach(sound => {
    const previousMuted = sound.muted;
    const previousVolume = sound.volume;

    sound.muted = true;
    sound.volume = 0;
    resetSound(sound);
    sound.play()
      .then(() => {
        resetSound(sound);
      })
      .catch(() => {})
      .finally(() => {
        sound.muted = previousMuted;
        sound.volume = previousVolume;
      });
  });
};

const playSound = sound => {
  sound.volume = 1;
  resetSound(sound);
  sound.play().catch(() => {});
};

const preloadModalAsset = src => {
  if (!src) {
    return Promise.resolve("");
  }

  if (modalAssetCache.has(src)) {
    return modalAssetCache.get(src);
  }

  const promise = new Promise(resolve => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(src);
    image.onerror = () => resolve(src);
    image.src = src;
  });

  modalAssetCache.set(src, promise);
  return promise;
};

const warmModalAssets = () => {
  const assets = new Set();

  modalTriggers.forEach(trigger => {
    if (trigger.dataset.modalImage) {
      assets.add(trigger.dataset.modalImage);
    }

    if (trigger.dataset.modalImages) {
      trigger.dataset.modalImages
        .split("|")
        .map(src => src.trim())
        .filter(Boolean)
        .forEach(src => assets.add(src));
    }
  });

  assets.forEach(src => {
    preloadModalAsset(src);
  });
};

const closeEducationCards = () => {
  educationCards.forEach(item => item.classList.remove("is-open"));
};

const openEducationCard = (card, shouldPlaySound = false) => {
  if (isMobileViewport) {
    return;
  }
  if (card.classList.contains("is-open")) {
    return;
  }

  closeEducationCards();
  card.classList.add("is-open");

  if (shouldPlaySound) {
    playSound(educationSound);
  }
};

const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  {
    threshold: 0.16,
    rootMargin: "0px 0px -10% 0px"
  }
);

revealItems.forEach(item => revealObserver.observe(item));

const setScrollProgress = () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  document.body.style.setProperty("--scroll-progress", `${progress}%`);
};

const setActiveLink = () => {
  let activeId = "";

  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 150 && rect.bottom >= 180) {
      activeId = section.id;
    }
  });

  navLinks.forEach(link => {
    const isActive = link.getAttribute("href") === `#${activeId}`;
    link.classList.toggle("is-active", isActive);
  });
};

const syncHeader = () => {
  header.classList.remove("is-scrolled");
};

const syncUI = () => {
  setScrollProgress();
  setActiveLink();
  syncHeader();
  ticking = false;
};

const requestSync = () => {
  if (ticking) {
    return;
  }

  ticking = true;
  window.requestAnimationFrame(syncUI);
};

educationCards.forEach(card => {
  if (hoverCapable) {
    card.addEventListener("pointerenter", () => {
      openEducationCard(card, audioUnlocked);
    });
  }

  card.addEventListener("pointerdown", unlockAudio, { passive: true });

  card.addEventListener("click", () => {
    const isOpen = card.classList.contains("is-open");

    if (!isOpen) {
      openEducationCard(card, !hoverCapable);
      return;
    }

    closeEducationCards();
  });

  card.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    if (!card.classList.contains("is-open")) {
      openEducationCard(card, true);
      return;
    }

    closeEducationCards();
  });
});

clickSoundTargets.forEach(target => {
  target.addEventListener("click", () => {
    playSound(clickSound);
  });

  target.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    playSound(clickSound);
  });
});

const openModal = modalId => {
  const modal = document.getElementById(modalId);
  if (!modal) {
    return;
  }

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  window.requestAnimationFrame(() => {
    modal.classList.add("is-ready");
  });
};

const closeModal = modal => {
  activeModalRequest += 1;
  modal.classList.remove("is-ready");
  modal.classList.remove("is-open");
  modal.classList.remove("is-loading");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
};

const setModalLoading = (modal, isLoading) => {
  modal.classList.toggle("is-loading", isLoading);
};

const resetModalContent = () => {
  if (modalGallery) {
    modalGallery.innerHTML = "";
    modalGallery.hidden = true;
  }

  if (modalFigure) {
    modalFigure.hidden = true;
  }

  if (modalImage) {
    modalImage.removeAttribute("src");
    modalImage.alt = "";
  }
};

modalTriggers.forEach(trigger => {
  trigger.addEventListener("click", async () => {
    const modal = document.getElementById(trigger.dataset.modalTarget);
    if (!modal) {
      return;
    }

    const requestId = ++activeModalRequest;

    if (modalTitle && trigger.dataset.modalTitle) {
      modalTitle.textContent = trigger.dataset.modalTitle;
    }

    resetModalContent();
    openModal(trigger.dataset.modalTarget);
    setModalLoading(modal, true);

    if (modalImage && trigger.dataset.modalImages) {
      const images = trigger.dataset.modalImages
        .split("|")
        .map(src => src.trim())
        .filter(Boolean);

      await Promise.all(images.map(preloadModalAsset));

      if (requestId !== activeModalRequest) {
        return;
      }

      if (modalGallery) {
        images.forEach((src, index) => {
          const figure = document.createElement("figure");
          const image = document.createElement("img");
          image.src = src;
          image.alt = `${trigger.dataset.modalTitle || "Preview"} ${index + 1}`;
          image.loading = "lazy";
          figure.appendChild(image);
          modalGallery.appendChild(figure);
        });
        modalGallery.hidden = false;
      }
    } else if (modalImage && trigger.dataset.modalImage) {
      await preloadModalAsset(trigger.dataset.modalImage);

      if (requestId !== activeModalRequest) {
        return;
      }

      modalImage.src = trigger.dataset.modalImage;
      modalImage.alt = trigger.dataset.modalTitle || "Preview image";
      if (modalFigure) {
        modalFigure.hidden = false;
      }
    }

    setModalLoading(modal, false);
  });
});

modalCloseTriggers.forEach(trigger => {
  trigger.addEventListener("click", () => {
    const modal = trigger.closest(".image-modal");
    if (modal) {
      closeModal(modal);
    }
  });
});

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") {
    return;
  }

  const openModalElement = document.querySelector(".image-modal.is-open");
  if (openModalElement) {
    closeModal(openModalElement);
  }
});

window.addEventListener("scroll", requestSync, { passive: true });
window.addEventListener("resize", requestSync, { passive: true });
window.addEventListener("load", () => {
  syncUI();

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(warmModalAssets, { timeout: 1200 });
    return;
  }

  window.setTimeout(warmModalAssets, 220);
});
window.addEventListener("pointerdown", unlockAudio, { passive: true });
window.addEventListener("wheel", unlockAudio, { passive: true });
window.addEventListener("touchstart", unlockAudio, { passive: true });
window.addEventListener("keydown", unlockAudio);
