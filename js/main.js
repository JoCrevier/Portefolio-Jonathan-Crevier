/* =================================================================
   INITIALISATION ET GESTION DES FILTRES
   ================================================================= */

import { createLightbox, openLightbox } from "./lightbox.js";

const projectContainer = document.querySelector(".listeprojet");
const projectFilterButtons = document.querySelectorAll(".projectfilter");
let normalizedProjects = [];

// Initialisation globale de la lightbox via le module externe
const lightbox = createLightbox();

// Observateur pour animer l'apparition des cartes au défilement
const projectObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        const target = entry.target;
        const top = entry.boundingClientRect.top;

        target.classList.toggle("is-visible", entry.isIntersecting);
        target.classList.toggle("is-scrolled-past", !entry.isIntersecting && top < 0);
    });
}, { root: null, rootMargin: '-50px 0px -50px 0px', threshold: 0.1 });

if (projectContainer) {
    loadProjects();

    projectFilterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const filter = button.dataset.filter || "all";
            projectFilterButtons.forEach((btn) => btn.classList.toggle("is-active", btn === button));
            renderProjects(filter);
        });
    });
}


/* =================================================================
   CHARGEMENT ET RENDU DES PROJETS
   ================================================================= */

async function loadProjects() {
    try {
        const res = await fetch("projet.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const projects = await res.json();
        normalizedProjects = projects.map((p) => ({
            ...p,
            categories: (p.categorie || []).map((c) => c.trim().toLowerCase())
        }));

        renderProjects("all");
    } catch (err) {
        console.error("Erreur de chargement :", err);
        if (projectContainer) {
            projectContainer.innerHTML = '<p class="projectcard__error">Impossible de charger les projets.</p>';
        }
    }
}

function renderProjects(filter) {
    const filtered = filter === "all"
        ? normalizedProjects
        : normalizedProjects.filter((p) => p.categories.includes(filter.trim().toLowerCase()));

    const fragment = document.createDocumentFragment();

    filtered.forEach((project, index) => {
        const card = document.createElement("article");
        card.className = `projectcard ${index % 2 === 0 ? "projectcard--left" : "projectcard--right"}`;

        const imageSrc = resolveImageSource(project.image, index);
        const fallbackSrc = createImage(index);
        const shortDesc = project["court description"] || project.courtDescription || project.description || "";

        card.innerHTML = `
            <div class="projectcard__image">
                <button type="button" class="projectcard__imageButton" data-image="${imageSrc}" data-alt="${escapeHtml(project.name)}">
                    <img src="${imageSrc}" alt="${escapeHtml(project.name)}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='${fallbackSrc}';">
                </button>
            </div>
            <div class="projectcard__content">
                <div class="projectcard__body">
                    <p class="projectcard__number">${String(project.id).padStart(2, "0")}</p>
                    <h3 class="projectcard__title">${escapeHtml(project.name)}</h3>
                    <p class="projectcard__description">${escapeHtml(shortDesc)}</p>
                </div>
                <div class="projectcard__footer">
                    <div class="projectcard__categories">
                        ${project.categorie.map((c) => `<span class="projectcard__category">${formatCategory(c)}</span>`).join("")}
                    </div>
                    <button type="button" class="projectcard__button" data-id="${project.id}">Voir ce projet</button>
                </div>
            </div>
        `;
        fragment.appendChild(card);
    });

    projectContainer.innerHTML = "";
    projectContainer.appendChild(fragment);

    // Écouteurs de clics pour ouvrir la lightbox via le module externe
    projectContainer.querySelectorAll(".projectcard__imageButton").forEach((btn) => {
        btn.addEventListener("click", () => openLightbox(btn.querySelector("img")?.src || btn.dataset.image, btn.dataset.alt));
    });

    // Écouteur pour rediriger vers la page de détails
    projectContainer.querySelectorAll(".projectcard__button").forEach((btn) => {
        btn.addEventListener("click", () => window.location.href = `projet-detail.html?id=${btn.dataset.id}`);
    });

    projectContainer.querySelectorAll(".projectcard").forEach((card) => projectObserver.observe(card));
}


/* =================================================================
   FONCTIONS UTILITAIRES (HELPERS)
   ================================================================= */

/**
 * Valide et résout la source d'une image. | Si l'image du JSON est valide, on l'utilise. Sinon, on génère un SVG de secours.
 */
const resolveImageSource = (image, index) => {
    // Vérifie si l'image fournie est bien du texte (une chaîne de caractères)
    if (typeof image === "string") {
        const trimmed = image.trim(); // Supprime les espaces inutiles au début/fin
        // Si le texte existe et n'est pas le mot "liens", on retourne l'URL encodée proprement
        if (trimmed && trimmed.toLowerCase() !== "liens") return encodeURI(trimmed);
    }
    // Si l'image est absente ou invalide, on génère une image de secours colorée (SVG)
    return createImage(index);
};

/**
 * Met en forme le nom d'une catégorie.
 */
const formatCategory = (category) => {
    const text = String(category).trim(); // Force en texte et nettoie les espaces
    // Si le texte n'est pas vide, met la 1ère lettre en majuscule et le reste tel quel, sinon retourne du vide
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
};

/**
 * Sécurise un texte contre les failles HTML/XSS (caractères spéciaux).
 */
const escapeHtml = (text) => String(text)
    .replace(/&/g, "&amp;")   // Remplace & par son entité HTML sécurisée
    .replace(/</g, "&lt;")   // Remplace < (évite d'injecter du code HTML)
    .replace(/>/g, "&gt;")   // Remplace >
    .replace(/"/g, "&quot;") // Remplace les guillemets doubles
    .replace(/'/g, "&#39;"); // Remplace les guillemets simples

/**
 * Génère dynamiquement une image SVG abstraite (dégradé + formes) 
 * utilisée comme image de secours si le projet n'a pas de visuel.
 */
function createImage(index) {
    // Calcule des teintes de couleurs uniques basées sur l'index du projet (effet arc-en-ciel)
    const hue = (index * 34 + 22) % 360;
    const accent = (hue + 70) % 360;
    
    // Construction du code SVG brut (fond coloré avec des cercles transparents en surimpression)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${hue}, 70%, 58%)"/><stop offset="100%" stop-color="hsl(${accent}, 68%, 28%)"/></linearGradient></defs><rect width="1200" height="900" fill="url(#g)" rx="48"/><circle cx="990" cy="180" r="150" fill="rgba(255,255,255,0.14)"/><circle cx="150" cy="700" r="180" fill="rgba(255,255,255,0.08)"/><circle cx="230" cy="250" r="90" fill="rgba(255,255,255,0.12)"/><circle cx="920" cy="630" r="120" fill="rgba(255,255,255,0.10)"/></svg>`;
    
    // Transforme le code SVG en une URI de données (Data URI) lisible directement par une balise <img src="...">
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}