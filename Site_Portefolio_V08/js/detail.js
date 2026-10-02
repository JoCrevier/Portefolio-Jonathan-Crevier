/* =================================================================
   INITIALISATION ET RENDU DES DÉTAILS DU PROJET
   ================================================================= */

import { createLightbox, openLightbox } from "./lightbox.js";

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector(".project-detail");
    const projectId = new URLSearchParams(window.location.search).get("id");

    // Initialisation globale de la lightbox via le module externe
    createLightbox();

    if (!projectId) {
        if (container) container.innerHTML = "<p>Aucun projet spécifié.</p>";
        return;
    }

    try {
        const res = await fetch("projet.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const projects = await res.json();
        const project = projects.find((p) => String(p.id) === String(projectId));

        if (!project) {
            if (container) container.innerHTML = "<p>Projet introuvable.</p>";
            return;
        }

        renderProjectDetails(project, projects.indexOf(project));
    } catch (err) {
        console.error("Erreur de chargement :", err);
        if (container) container.innerHTML = '<p class="projectcard__error">Impossible de charger les détails.</p>';
    }
});


/* =================================================================
   RENDU DES DONNÉES
   ================================================================= */

function renderProjectDetails(project, index) {
    // 1. Textes principaux
    setElementText(".project-detail__number", String(project.id).padStart(2, "0"));
    setElementText(".project-detail__title", project.name);
    setElementText(".project-detail__description", project.description || "Aucune description disponible pour ce projet.");

    // 2. Processus créatif
    toggleSection("#project-process-section", ".project-detail__process", project["processus créatif"] || project.processusCreatif);

    // 3. Catégories
    const catContainer = document.querySelector("#project-categories");
    if (catContainer && Array.isArray(project.categorie)) {
        catContainer.innerHTML = project.categorie.map((c) => `<span>${formatTitle(c)}</span>`).join("");
    }

    // 4. Logiciels utilisés
    toggleSection("#project-software", ".project-detail__software-value", project["software used"] || project.softwareUsed);

    // 5. Galerie (Images / Vidéos)
    const galleryContainer = document.querySelector("#project-gallery");
    if (galleryContainer) {
        const items = project.galerie?.length ? project.galerie : [project.image];

        galleryContainer.innerHTML = items.map((item, i) => {
            const isVideo = typeof item === "object" && item?.type === "video";
            const src = isVideo 
                ? (item.poster ? encodeURI(item.poster.trim()) : createFallbackSvg(index + i))
                : ((typeof item === "string" && item.trim() && item.trim().toLowerCase() !== "liens") ? encodeURI(item.trim()) : createFallbackSvg(index + i));
            
            const alt = `${project.name} - ${isVideo ? "Vidéo" : "Image"} ${i + 1}`;

            if (isVideo) {
                return `
                    <div class="project-detail__gallery-item project-detail__gallery-item--video">
                        <button type="button" class="project-detail__galleryButton project-detail__videoButton" data-video-src="${escapeHtml(item.src)}" data-alt="${escapeHtml(alt)}">
                            <img src="${src}" alt="${escapeHtml(alt)}" loading="lazy">
                            <div class="project-detail__play-icon">▶</div>
                        </button>
                    </div>`;
            }

            return `
                <div class="project-detail__gallery-item">
                    <button type="button" class="project-detail__galleryButton" data-image="${src}" data-alt="${escapeHtml(alt)}">
                        <img src="${src}" alt="${escapeHtml(alt)}" loading="lazy">
                    </button>
                </div>`;
        }).join("");

        // Écouteur pour ouvrir la lightbox sur les images de la galerie
        galleryContainer.querySelectorAll(".project-detail__galleryButton:not(.project-detail__videoButton)").forEach((btn) => {
            btn.addEventListener("click", () => openLightbox(btn.dataset.image, btn.dataset.alt));
        });
    }
}


/* =================================================================
   FONCTIONS UTILITAIRES (HELPERS)
   ================================================================= */

/**
 * Modifie le texte d'un élément HTML s'il existe dans la page.
 * @param {string} sel - Le sélecteur CSS de l'élément cible (ex: ".mon-titre")
 * @param {text} text - Le texte à insérer à l'intérieur
 */
const setElementText = (sel, text) => {
    const el = document.querySelector(sel);
    if (el) el.textContent = text; // Change le texte uniquement si l'élément est trouvé
};

/**
 * Affiche ou masque une section entière selon si sa valeur existe ou non.
 * @param {string} sectionSel - Sélecteur CSS du conteneur global de la section
 * @param {string} textSel - Sélecteur CSS de l'élément qui va recevoir le texte
 * @param {any} value - La donnée à vérifier et à afficher
 */
const toggleSection = (sectionSel, textSel, value) => {
    const section = document.querySelector(sectionSel);
    const textEl = document.querySelector(textSel);
    if (!section || !textEl) return; // Arrête la fonction si l'un des deux éléments n'existe pas

    // Si la valeur existe et n'est pas juste du texte vide :
    if (value && String(value).trim() !== "") {
        textEl.textContent = value;     // Injecte le texte
        section.style.display = "block"; // Affiche la section
    } else {
        section.style.display = "none";  // Masque complètement la section si vide
    }
};

/**
 * Met en forme un titre (ou un mot/catégorie).
 * @param {string} text - Le texte brut à formater
 */
const formatTitle = (text) => {
    const str = String(text).trim(); // Supprime les espaces superflus
    // Retourne le texte avec la première lettre en majuscule, ou du vide si rien n'est présent
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
};

/**
 * Sécurise un texte contre les failles HTML/XSS (neutralise les caractères spéciaux).
 * @param {string} text - Le texte brut à sécuriser
 */
const escapeHtml = (text) => String(text)
    .replace(/&/g, "&amp;")  // Remplace & par son entité HTML
    .replace(/</g, "&lt;")   // Remplace < (évite l'injection de balises HTML)
    .replace(/>/g, "&gt;")   // Remplace >
    .replace(/"/g, "&quot;") // Remplace les guillemets doubles
    .replace(/'/g, "&#39;"); // Remplace les guillemets simples

/**
 * Génère dynamiquement une image SVG de secours personnalisée (dégradé + formes). | Utilisée si une image ou un poster vidéo est manquant.
 * @param {number} index - Un nombre permettant de varier les couleurs d'un projet à l'autre
 */
function createFallbackSvg(index) {
    // Calcule des teintes de couleurs uniques (effet arc-en-ciel) basées sur l'index
    const hue = (index * 34 + 22) % 360;
    const accent = (hue + 70) % 360;

    // Construction du code SVG brut (fond en dégradé avec des cercles semi-transparents)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${hue}, 70%, 58%)"/><stop offset="100%" stop-color="hsl(${accent}, 68%, 28%)"/></linearGradient></defs><rect width="1200" height="900" fill="url(#g)" rx="48"/><circle cx="990" cy="180" r="150" fill="rgba(255,255,255,0.14)"/><circle cx="150" cy="700" r="180" fill="rgba(255,255,255,0.08)"/><circle cx="230" cy="250" r="90" fill="rgba(255,255,255,0.12)"/><circle cx="920" cy="630" r="120" fill="rgba(255,255,255,0.10)"/></svg>`;
    
    // Transforme le SVG en Data URI pour qu'il puisse être lu directement dans un attribut "src"
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}