// Update the reading progress bar when scrolling
window.addEventListener('scroll', () => {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;

  const myBar = document.getElementById("myBar");
  if (myBar) {
    myBar.style.width = scrolled + "%";
  }

  // Toggle .is-at-top on body
  if (winScroll < 10) {
    document.body.classList.add("is-at-top");
  } else {
    document.body.classList.remove("is-at-top");
  }

  // -------------------------------------------------------------
  // TITRE INTRO : taille dynamique selon le scroll
  const isMobile = window.innerWidth <= 780;

  // Sur mobile : on adapte le diviseur selon la langue pour que "l'hétérotopie" rentre !
  const mobileDivider = document.body.classList.contains("lang-fr") ? 9.5 : 8.0;
  const tailleInitiale = isMobile
    ? Math.round(window.innerWidth / mobileDivider)
    : 130;
  const tailleReduite = isMobile ? 18 : 28;
  const positionHaute = 0;
  // -------------------------------------------------------------

  const scalePercentage = Math.min(1, 1 - Math.min(1, document.documentElement.scrollTop / window.innerHeight));
  const fontSize = tailleReduite + (tailleInitiale - tailleReduite) * scalePercentage;
  document.getElementById("intro-inner").style.fontSize = fontSize + "px";

  // Dessin intro : disparaît très vite dès que l'on commence à scroller
  const drawing = document.getElementById("intro-drawing");
  if (drawing) {
    // Fade out dans les premiers 15% du scroll (très rapide)
    const drawingOpacity = Math.max(0, 1 - (document.documentElement.scrollTop / (window.innerHeight * 0.15)));
    drawing.style.opacity = drawingOpacity;
  }



  // Gérer le passage sur une seule ligne du titre uniquement à la fin de l'animation
  if (scalePercentage > 0.05) {
    document.body.classList.add("title-is-expanded");
  } else {
    document.body.classList.remove("title-is-expanded");
  }

  // Animation fluide du titre : Reste au milieu mais monte pour s'insérer pile dans la ligne du haut
  const title = document.getElementById("intro-title");
  if (title) {
    const positionBasse = (62 - tailleReduite) / 2;
    const currentY = positionBasse + (positionHaute - positionBasse) * scalePercentage;

    if (isMobile) {
      // Pleine largeur + text-align: center gèrent déjà le centrage X parfait !
      title.style.transform = `translateY(${currentY}px)`;
    } else {
      title.style.transform = `translateX(calc(50vw - 50%)) translateY(${currentY}px)`;
    }
  }

  // Lock columns from inner scrolling until they reach the top (under header)
  // Désactivé sur mobile (pas de colonnes)
  if (!isMobile) {
    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 62;
    const chapterBlocks = document.querySelectorAll('.chapter-block');

    chapterBlocks.forEach(block => {
      const rect = block.getBoundingClientRect();
      if (rect.top <= headerHeight + 5) {
        block.classList.add('is-at-top');
      } else {
        block.classList.remove('is-at-top');
      }
    });
  }
});


window.scrollTop = 0;


// LINKING THE SCROLL-POSITION OF THE PHOTOS COLUMN TO THAT OF THE TEXT-COLUMN
// Uniquement sur desktop (les colonnes sont masquées sur mobile)
const isMobileLayout = () => window.innerWidth <= 780;

const colPhotos = document.querySelector('.col-photos');
const colText = document.querySelector('.col-main');
const colNotes = document.querySelector('.col-sub');
const chaptersList = colText
  ? colText.querySelectorAll('.chapter')
  : [];
let currentChapterIndex = -1;

let previousTextScroll = 0;

// On mobile, check if we need to sync manually
if (colText) {
  colText.addEventListener('scroll', () => {
    if (isMobileLayout()) return; // Pas de sync sur mobile

    let maxScroll = colText.scrollHeight - colText.clientHeight;
    let currentScroll = Math.max(0, Math.min(colText.scrollTop, maxScroll));

    let deltaText = currentScroll - previousTextScroll;
    previousTextScroll = currentScroll;

    let effectiveScrollHeight = maxScroll;
    const biblioNode = document.getElementById('bibliography');
    if (biblioNode) {
      effectiveScrollHeight = Math.max(1, biblioNode.offsetTop - colText.clientHeight + 100);
    }

    let deltaPercentage = deltaText / effectiveScrollHeight;
    if (colPhotos) {
      const maxPhotosDist = colPhotos.scrollHeight - colPhotos.clientHeight;
      colPhotos.scrollTop += (deltaPercentage * maxPhotosDist);
    }

    updateActiveChapterNotes();
  });
}

if (colPhotos) {
  colPhotos.addEventListener('scroll', () => {
    // Optionnel : sync notes depuis scroll photos
  });
}

function updateActiveChapterNotes(isInitial = false) {
  let newActiveIndex = 0;

  chaptersList.forEach((chap, index) => {
    // offsetTop donne la position absolue dans le conteneur scrollable — beaucoup plus fiable que getBoundingClientRect !
    let chapOffsetTop = chap.offsetTop;

    // Le chapitre devient actif dès qu'il entre dans la zone visible de la colonne (avec une petite marge haute)
    if (chapOffsetTop <= colText.scrollTop + 180) {
      newActiveIndex = index;
    }
  });

  // Forcer l'activation du dernier bloc si on a scrollé tout en bas
  if (Math.ceil(colText.scrollTop + colText.clientHeight) >= colText.scrollHeight - 10) {
    newActiveIndex = chaptersList.length - 1;
  }

  // Vérifier si l'utilisateur est descendu jusqu'à la bibliographie
  const biblioNode = document.getElementById('bibliography');
  if (biblioNode) {
    let biblioOffset = biblioNode.offsetTop;
    if (colText.scrollTop + colText.clientHeight * 0.4 >= biblioOffset) {
      newActiveIndex = -2; // Index "hors texte"
    }
  }

  if (newActiveIndex !== currentChapterIndex) {
    let isFirstLoad = (currentChapterIndex === -1);
    currentChapterIndex = newActiveIndex;

    // Masquer toutes les notes par défaut
    colNotes.querySelectorAll(':scope p[data-footnote]').forEach(p => {
      p.style.opacity = '0';
      p.style.pointerEvents = 'none';
      p.style.transition = 'none';
    });

    // Si on est dans le texte classique (index >= 0), on affiche ses notes
    if (newActiveIndex >= 0) {
      let activeChapterNode = chaptersList[newActiveIndex];
      let anchors = activeChapterNode.querySelectorAll('sup[data-footnote]');
      anchors.forEach(a => {
        let idx = a.dataset.footnote;
        let footnoteBlock = colNotes.querySelector(`p[data-footnote="${idx}"]`);
        if (footnoteBlock) {
          footnoteBlock.style.opacity = '1';
          footnoteBlock.style.pointerEvents = 'auto';
        }
      });

      // On scrolle jusqu'à l'ancrage calculé et sauvegardé pour ce chapitre
      let targetTop = 0;
      if (chaptersList[newActiveIndex].hasAttribute('data-notes-top')) {
        targetTop = parseFloat(chaptersList[newActiveIndex].getAttribute('data-notes-top'));
      }

      colNotes.scrollTo({
        top: Math.max(0, targetTop - 20),
        behavior: 'auto'
      });
    }
  }
}

const syncFootnoteColumn = () => {
  const footnoteAnchors = colText ? colText.querySelectorAll('sup[data-footnote]') : [];
  let lastBottom = 0;
  let currentChapterForPlacement = null;

  // SÉCURITÉ : On masque d'abord TOUTES les notes de la colonne gauche.
  // Celles qui n'ont pas de numéro dans votre texte resteront invisibles.
  colNotes.querySelectorAll('p[data-footnote]').forEach(p => {
    p.style.display = 'none';
  });

  footnoteAnchors.forEach(anchor => {
    const footnoteIndex = anchor.dataset.footnote;
    const footnoteBlock = colNotes.querySelector(`p[data-footnote="${footnoteIndex}"]`);

    if (footnoteBlock) {
      // La note existe et a été appelée, on l'affiche !
      footnoteBlock.style.display = 'block';

      // Trouver le div du chapitre qui englobe cette citation
      let chapterDiv = anchor.closest('.chapter');

      // Si on passe à un nouveau chapitre, on ajoute l'espace inter-chapitres et on mémorise sa position
      if (chapterDiv !== currentChapterForPlacement) {
        if (currentChapterForPlacement !== null) {
          lastBottom += 140; // Espace un peu grand entre chaque chapitre de notes
        }
        currentChapterForPlacement = chapterDiv;

        // On sauvegarde la position de ce chapitre pour pouvoir scroller dessus automatiquement !
        chapterDiv.setAttribute('data-notes-top', lastBottom);
      }

      let anchorTop = lastBottom;

      footnoteBlock.style.top = `${anchorTop}px`;

      // Mettre à jour la limite du bas pour la prochaine note (18px d'espace pile entre elles)
      lastBottom = anchorTop + footnoteBlock.offsetHeight + 18;
    }
  });

  // On donne la bonne hauteur au container pour qu'on puisse scroller manuellement jusqu'en bas,
  // sans utiliser la taille "géante" de la colonne du milieu qu'y provoquait le grand vide.
  if (colNotes.firstElementChild) {
    colNotes.firstElementChild.style.height = (lastBottom + colNotes.clientHeight * 0.8) + 'px';
  }
}

window.addEventListener('resize', () => {
  syncFootnoteColumn();
  updateActiveChapterNotes(true);
});

// RE-CALCUL OBLIGATOIRE APRES LE CHARGEMENT DES POLICES / IMAGES
window.addEventListener('load', () => {
  syncFootnoteColumn();
  updateActiveChapterNotes(true);
});
if (document.fonts) {
  document.fonts.ready.then(() => {
    syncFootnoteColumn();
    // Forcer le rafraîchissement d'état
    const prev = currentChapterIndex;
    currentChapterIndex = -1;
    updateActiveChapterNotes(true);
  });
}

// Initial calls
syncFootnoteColumn();
updateActiveChapterNotes(true);

// Force l'animation du titre d'intro à s'appliquer instantanément au chargement de la page
window.dispatchEvent(new Event('scroll'));

// ── LIGHTBOX ──────────────────────────────────────────────────────────────
(function () {
  const overlay = document.getElementById('lightbox-overlay');
  const lbImg = document.getElementById('lightbox-img');
  const lbCaption = document.getElementById('lightbox-caption');
  const btnClose = document.getElementById('lightbox-close');
  const btnPrev = document.getElementById('lightbox-prev');
  const btnNext = document.getElementById('lightbox-next');
  const colPhotos = document.querySelector('.col-photos');

  if (!overlay || !colPhotos) return;

  // Collecter toutes les images principales (selon écran)
  function getImages() {
    if (window.innerWidth <= 780) {
      return Array.from(document.querySelectorAll('.mobile-inline-img img'));
    }
    return Array.from(colPhotos.querySelectorAll('figure img.main-img, figure > img:not(.hover-img)'));
  }

  let images = [];
  let current = 0;

  // Re-collecter après chargement complet (images lazy, etc.)
  window.addEventListener('load', function () {
    images = getImages();
  });
  images = getImages();

  function getCaptionFor(imgEl) {
    const fig = imgEl.closest('figure');
    if (!fig) return '';
    const cap = fig.querySelector('figcaption');
    return cap ? cap.textContent.trim() : '';
  }

  function showImage(index) {
    // Clamp cyclique
    const n = images.length;
    current = ((index % n) + n) % n;

    // Remplacement direct — pas d'animation pour éviter toute superposition
    lbImg.src = images[current].src;
    lbImg.alt = images[current].alt || '';
    lbCaption.textContent = getCaptionFor(images[current]);
  }

  function openLightbox(startIndex) {
    images = getImages(); // Rafraîchir au cas où
    current = startIndex || 0;
    lbImg.src = images[current].src;
    lbImg.alt = images[current].alt || '';
    lbCaption.textContent = getCaptionFor(images[current]);
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden'; // Bloque le scroll de la page
  }

  function closeLightbox() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    lbImg.src = '';
  }

  // Clic n'importe où dans la colonne → ouvrir sur l'image la plus proche du point de clic
  colPhotos.addEventListener('click', function (e) {
    // Ne pas ouvrir sur mobile via cette colonne
    if (window.innerWidth <= 780) return;

    images = getImages();
    if (images.length === 0) return;

    // Trouver l'image cliquée ou la plus proche verticalement
    const clickedImg = e.target.closest('figure img:not(.hover-img)');
    let startIndex = 0;
    if (clickedImg) {
      const idx = images.indexOf(clickedImg);
      if (idx !== -1) startIndex = idx;
    } else {
      // Trouver la figure la plus proche du clic (par position Y)
      const figures = Array.from(colPhotos.querySelectorAll('figure'));
      let minDist = Infinity;
      figures.forEach(function (fig, i) {
        const rect = fig.getBoundingClientRect();
        const centerY = (rect.top + rect.bottom) / 2;
        const dist = Math.abs(e.clientY - centerY);
        if (dist < minDist) {
          minDist = dist;
          // Trouver l'image correspondante
          const imgEl = fig.querySelector('img.main-img, img:not(.hover-img)');
          if (imgEl) startIndex = images.indexOf(imgEl);
        }
      });
    }
    openLightbox(Math.max(0, startIndex));
  });

  // Clic direct sur une image intégrée sur mobile
  document.addEventListener('click', function (e) {
    if (window.innerWidth <= 780) {
      const clickedImg = e.target.closest('.mobile-inline-img img');
      if (clickedImg) {
        images = getImages();
        const startIndex = Math.max(0, images.indexOf(clickedImg));
        openLightbox(startIndex);
      }
    }
  });

  // Fermer en cliquant en dehors de l'image et des flèches (overlay ou zone noire autour)
  overlay.addEventListener('click', function (e) {
    const inner = document.getElementById('lightbox-inner');
    if (!inner.contains(e.target)) closeLightbox();
  });

  btnClose.addEventListener('click', closeLightbox);

  btnPrev.addEventListener('click', function (e) {
    e.stopPropagation();
    showImage(current - 1);
  });

  btnNext.addEventListener('click', function (e) {
    e.stopPropagation();
    showImage(current + 1);
  });

  // Navigation clavier
  document.addEventListener('keydown', function (e) {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showImage(current - 1);
    if (e.key === 'ArrowRight') showImage(current + 1);
  });

  // Swipe tactile (mobile)
  let touchStartX = 0;
  overlay.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  overlay.addEventListener('touchend', function (e) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) showImage(current + 1); // swipe gauche → suivant
      else showImage(current - 1); // swipe droite → précédent
    }
  }, { passive: true });

})();

// ── TEXT POPUP ──────────────────────────────────────────────────────────────
(function () {
  const btnOpen = document.getElementById('info-btn');
  const btnClose = document.getElementById('text-popup-close');
  const popupOverlay = document.getElementById('text-popup-overlay');
  const popupInner = document.getElementById('text-popup-inner');

  if (!btnOpen || !popupOverlay) return;

  function openPopup() {
    popupOverlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closePopup() {
    popupOverlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  btnOpen.addEventListener('click', openPopup);
  if (btnClose) btnClose.addEventListener('click', closePopup);

  popupOverlay.addEventListener('click', function (e) {
    if (!popupInner.contains(e.target)) {
      closePopup();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && popupOverlay.classList.contains('is-open')) {
      closePopup();
    }
  });
})();

// ── MOBILE FOOTNOTE POPUP  ──────────────────────────────────────────────────
(function () {
  const overlay = document.getElementById('footnote-popup-overlay');
  const inner = document.getElementById('footnote-popup-inner');
  const content = document.getElementById('footnote-popup-content');

  if (!overlay || !content) return;

  function closePopup() {
    if (overlay.classList.contains('is-open')) {
      overlay.classList.remove('is-open');
    }
  }

  document.body.addEventListener('click', (e) => {
    // Uniquement sur la version mobile
    if (window.innerWidth <= 780) {
      const sup = e.target.closest('sup[data-footnote]');
      if (sup) {
        e.preventDefault();
        e.stopPropagation();

        const ref = sup.getAttribute('data-footnote');
        const noteNode = document.querySelector(`.col-sub p[data-footnote="${ref}"]`);

        if (noteNode) {
          content.innerHTML = noteNode.innerHTML;

          // Largeur aléatoire entre 50vw et 85vw pour donner un aspect varié / brut au layout
          const randomWidth = Math.floor(Math.random() * 36) + 50;
          inner.style.width = randomWidth + 'vw';

          overlay.classList.add('is-open');

          // Position relative à l'écran
          const rect = sup.getBoundingClientRect();

          // Gauche initiale proche du numéro
          let leftPos = rect.left - 20;
          if (leftPos < 15) leftPos = 15;
          inner.style.left = leftPos + 'px';

          // Haut par défaut (en dessous du numéro)
          let topPos = rect.bottom + 15;
          inner.style.top = topPos + 'px'; // Temporaire pour obtenir la hauteur

          // Ajustement fin après le rendu (pour vérifier qu'on ne dépasse pas à droite ou en bas)
          requestAnimationFrame(() => {
            const innerRect = inner.getBoundingClientRect();

            // Correction droite
            if (innerRect.right > window.innerWidth - 15) {
              inner.style.left = (window.innerWidth - innerRect.width - 15) + 'px';
            }

            // Correction bas
            if (topPos + innerRect.height > window.innerHeight - 15) {
              topPos = rect.top - innerRect.height - 15;
              inner.style.top = topPos + 'px';
            }
          });

          // Fini le blocage de scroll ! Le scroll fermera au contraire la bulle.
        }
      }
    }
  });

  // Fermer quand la bulle est ouverte et qu'on scroll ou qu'on tape ailleurs
  document.addEventListener('click', function (e) {
    if (overlay.classList.contains('is-open') && !inner.contains(e.target)) {
      closePopup();
    }
  });

  window.addEventListener('scroll', function () {
    if (overlay.classList.contains('is-open')) {
      closePopup();
    }
  }, { passive: true });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePopup();
  });
})();

/* ==========================================================================
   TRANSLATION / LANG TOGGLE (EN/FR)
   ========================================================================== */
function initLanguageToggle() {
  const btnEn = document.getElementById('lang-en');
  const btnFr = document.getElementById('lang-fr');
  if (!btnEn || !btnFr) return;

  function setLanguage(lang) {
    // Update active class on buttons
    if (lang === 'fr') {
      btnFr.classList.add('active');
      btnEn.classList.remove('active');
    } else {
      btnEn.classList.add('active');
      btnFr.classList.remove('active');
    }

    if (lang === 'fr') {
      document.body.classList.add('lang-fr');
    } else {
      document.body.classList.remove('lang-fr');
    }

    // Apply translations
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      
      // Save English text the first time
      if (!el.dataset.enOriginal) {
        el.dataset.enOriginal = el.innerHTML;
      }

      // Restore French or English
      if (lang === 'fr' && window.TRANSLATIONS && window.TRANSLATIONS.fr && window.TRANSLATIONS.fr[key]) {
        el.innerHTML = window.TRANSLATIONS.fr[key];
      } else {
        el.innerHTML = el.dataset.enOriginal;
      }
    });

    // Translate images that have a data-src-fr attribute
    document.querySelectorAll('img[data-src-fr]').forEach(img => {
      // Save English source the first time
      if (!img.dataset.enOriginal) {
        img.dataset.enOriginal = img.src;
      }

      if (lang === 'fr') {
        const frSrc = img.getAttribute('data-src-fr');
        if (frSrc) {
          img.src = frSrc;
        }
      } else {
        img.src = img.dataset.enOriginal;
      }
    });

    // Re-calculer les hauteurs et l'espacement des notes après traduction
    // parce que le texte français n'a pas forcément la même longueur (et donc hauteur) que l'anglais !
    requestAnimationFrame(() => {
      if (typeof syncFootnoteColumn === 'function') {
        syncFootnoteColumn();
      }
      if (typeof updateActiveChapterNotes === 'function') {
        // On force à -1 pour bypasser le cache du scroll et obliger l'affichage des notes
        if (typeof currentChapterIndex !== 'undefined') {
          currentChapterIndex = -1;
        }
        updateActiveChapterNotes(true);
      }
    });
  }

  btnEn.addEventListener('click', () => setLanguage('en'));
  btnFr.addEventListener('click', () => setLanguage('fr'));
}

// Init when everything is loaded
document.addEventListener('DOMContentLoaded', initLanguageToggle);