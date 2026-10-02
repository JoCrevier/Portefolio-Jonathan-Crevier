/* =================================================================
   MODULE DE GESTION GLOBAL DE LA LIGHTBOX
   ================================================================= */

let lightboxElement = null;

/**
 * Crée dynamiquement la structure HTML de la lightbox et l'injecte dans le DOM.
 * @returns {HTMLElement} - L'élément conteneur de la lightbox.
 */
export function createLightbox() {
    if (lightboxElement) return lightboxElement;

    lightboxElement = document.createElement("div");
    lightboxElement.className = "projectlightbox";
    lightboxElement.id = "project-lightbox"; // Compatible si l'ID est cherché via getElementById
    lightboxElement.innerHTML = `
        <div class="projectlightbox__backdrop" data-close="true"></div>
        <div class="projectlightbox__panel" role="dialog" aria-modal="true" aria-label="Aperçu de l'image">
            <button type="button" class="projectlightbox__close" aria-label="Fermer">×</button>
            <img class="projectlightbox__image" src="" alt="">
        </div>
    `;

    // Gestion de la fermeture au clic (sur le fond sombre ou la croix)
    lightboxElement.addEventListener("click", (e) => {
        const target = e.target;
        if (target instanceof HTMLElement && (target.dataset.close === "true" || target.classList.contains("projectlightbox__close"))) {
            closeLightbox();
        }
    });

    // Gestion de la fermeture avec la touche "Escape" (Échap)
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeLightbox();
    });

    document.body.appendChild(lightboxElement);
    return lightboxElement;
}

/**
 * Ouvre la lightbox et y affiche l'image demandée.
 * @param {string} src - L'URL ou la source de l'image.
 * @param {string} alt - Le texte alternatif de l'image.
 */
export function openLightbox(src, alt) {
    if (!lightboxElement) createLightbox();
    
    const img = lightboxElement.querySelector(".projectlightbox__image");
    if (!img) return;

    img.src = src;
    img.alt = alt;
    lightboxElement.classList.add("is-open");
    document.body.classList.add("has-lightbox-open");
}

/**
 * Ferme la lightbox si elle est actuellement ouverte et réinitialise ses sources.
 */
export function closeLightbox() {
    if (!lightboxElement?.classList.contains("is-open")) return;
    
    const img = lightboxElement.querySelector(".projectlightbox__image");
    if (img) img.src = img.alt = "";

    lightboxElement.classList.remove("is-open");
    document.body.classList.remove("has-lightbox-open");
}