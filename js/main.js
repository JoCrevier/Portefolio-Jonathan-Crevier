/* =================================================================
   INITIALISATION ET GESTION DES FILTRES
   ================================================================= */

import { createLightbox, openLightbox } from "./lightbox.js"; // Importe les fonctions de la lightbox depuis le module externe

const projectContainer = document.querySelector(".listeprojet"); // Sélectionne le conteneur principal des projets
const projectFilterButtons = document.querySelectorAll(".projectfilter"); // Sélectionne tous les boutons de filtrage
let normalizedProjects = []; // Initialise un tableau vide pour stocker les données normalisées des projets

// Initialisation globale de la lightbox via le module externe
const lightbox = createLightbox(); // Crée et initialise l'instance de la lightbox

// Observateur pour animer l'apparition des cartes au défilement
const projectObserver = new IntersectionObserver((entries) => { // Crée l'observateur d'intersection
    entries.forEach((entry) => { // Parcourt chaque élément observé
        const target = entry.target; // Récupère l'élément HTML cible
        const top = entry.boundingClientRect.top; // Récupère sa position par rapport au haut de l'écran

        target.classList.toggle("is-visible", entry.isIntersecting); // Ajoute/retire la classe selon la visibilité à l'écran
        target.classList.toggle("is-scrolled-past", !entry.isIntersecting && top < 0); // Ajoute une classe si l'élément a défilé vers le haut (hors champ)
    });
}, { root: null, rootMargin: '-50px 0px -50px 0px', threshold: 0.1 }); // Configure les options de l'observateur (marges et seuil de déclenchement à 10%)

if (projectContainer) { // Vérifie si le conteneur des projets existe sur la page
    loadProjects(); // Charge les projets (fonction définie ailleurs)

    projectFilterButtons.forEach((button) => { // Parcourt chaque bouton de filtre
        button.addEventListener("click", () => { // Écoute le clic sur un bouton de filtre
            const filter = button.dataset.filter || "all"; // Récupère la valeur du filtre (attribut data-filter) ou "all" par défaut
            projectFilterButtons.forEach((btn) => btn.classList.toggle("is-active", btn === button)); // Met à jour l'état actif uniquement sur le bouton cliqué
            renderProjects(filter); // Affiche les projets en appliquant le filtre sélectionné
        });
    });
}

/* =================================================================
   CHARGEMENT ET RENDU DES PROJETS
   ================================================================= */

async function loadProjects() { // Déclare une fonction asynchrone pour charger les projets depuis un fichier JSON
    try { // Démarre un bloc try/catch pour gérer les erreurs potentielles
        const res = await fetch("projet.json"); // Récupère le fichier JSON contenant les données des projets
        if (!res.ok) throw new Error(`HTTP ${res.status}`); // Vérifie si la requête a réussi, sinon déclenche une erreur

        const projects = await res.json(); // Convertit la réponse HTTP en objet/tableau JavaScript
        normalizedProjects = projects.map((p) => ({ // Normalise chaque projet pour uniformiser les données
            ...p, // Conserve toutes les propriétés d'origine du projet
            categories: (p.categorie || []).map((c) => c.trim().toLowerCase()) // Nettoie et met en minuscules les catégories du projet
        }));

        renderProjects("all"); // Affiche tous les projets par défaut une fois chargés
    } catch (err) { // Attrape les erreurs survenues lors du chargement ou de la conversion
        console.error("Erreur de chargement :", err); // Affiche l'erreur dans la console du navigateur
        if (projectContainer) { // Vérifie si le conteneur des projets existe sur la page
            projectContainer.innerHTML = '<p class="projectcard__error">Impossible de charger les projets.</p>'; // Affiche un message d'erreur dans le conteneur
        }
    }
}

function renderProjects(filter) { // Déclare la fonction d'affichage des projets en fonction d'un filtre
    const filtered = filter === "all" // Vérifie si le filtre sélectionné est "all"
        ? normalizedProjects // Si oui, utilise tous les projets normalisés
        : normalizedProjects.filter((p) => p.categories.includes(filter.trim().toLowerCase())); // Sinon, filtre les projets dont les catégories incluent le filtre

    const fragment = document.createDocumentFragment(); // Crée un fragment de document pour optimiser les performances d'insertion DOM

    filtered.forEach((project, index) => { // Parcourt chaque projet filtré avec son index
        const card = document.createElement("article"); // Crée un élément HTML <article> pour la carte du projet
        card.className = `projectcard ${index % 2 === 0 ? "projectcard--left" : "projectcard--right"}`; // Attribue une classe de style alternée (gauche/droite) selon l'index pair ou impair

        const imageSrc = resolveImageSource(project.image, index); // Résout le chemin de l'image principale du projet
        const fallbackSrc = createImage(index); // Génère une image de secours si nécessaire
        const shortDesc = project["court description"] || project.courtDescription || project.description || ""; // Récupère la description courte selon différentes clés possibles

        card.innerHTML = ` // Injecte le code HTML structuré de la carte du projet
            <div class="projectcard__image"> // Conteneur de l'image du projet
                <button type="button" class="projectcard__imageButton" data-image="${imageSrc}" data-alt="${escapeHtml(project.name)}"> // Bouton cliquable ouvrant l'image dans la lightbox
                    <img src="${imageSrc}" alt="${escapeHtml(project.name)}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='${fallbackSrc}';"> // Image du projet avec chargement différé et gestion d'erreur de source
                </button>
            </div>
            <div class="projectcard__content"> // Conteneur du contenu textuel de la carte
                <div class="projectcard__body"> // Corps principal contenant les informations textuelles
                    <p class="projectcard__number">${String(project.id).padStart(2, "0")}</p> // Affiche l'identifiant du projet formaté sur 2 chiffres (ex: 01)
                    <h3 class="projectcard__title">${escapeHtml(project.name)}</h3> // Affiche le nom sécurisé du projet
                    <p class="projectcard__description">${escapeHtml(shortDesc)}</p> // Affiche la description courte sécurisée
                </div>
                <div class="projectcard__footer"> // Pied de page de la carte (catégories et bouton d'action)
                    <div class="projectcard__categories"> // Conteneur des étiquettes de catégories
                        ${project.categorie.map((c) => `<span class="projectcard__category">${formatCategory(c)}</span>`).join("")} // Génère un badge HTML pour chaque catégorie du projet
                    </div>
                    <button type="button" class="projectcard__button" data-id="${project.id}">Voir ce projet</button> // Bouton pour accéder à la page de détails du projet
                </div>
            </div>
        `;
        fragment.appendChild(card); // Ajoute la carte générée au fragment de document
    });

    projectContainer.innerHTML = ""; // Vide le conteneur principal avant d'insérer les nouveaux éléments
    projectContainer.appendChild(fragment); // Insère d'un seul coup toutes les cartes de projets dans le DOM pour de meilleures performances

    // Écouteurs de clics pour ouvrir la lightbox via le module externe
    projectContainer.querySelectorAll(".projectcard__imageButton").forEach((btn) => { // Sélectionne tous les boutons d'image de projet
        btn.addEventListener("click", () => openLightbox(btn.querySelector("img")?.src || btn.dataset.image, btn.dataset.alt)); // Ouvre la lightbox au clic avec l'image et son texte alternatif
    });

    // Écouteur pour rediriger vers la page de détails
    projectContainer.querySelectorAll(".projectcard__button").forEach((btn) => { // Sélectionne tous les boutons "Voir ce projet"
        btn.addEventListener("click", () => window.location.href = `projet-detail.html?id=${btn.dataset.id}`); // Redirige l'utilisateur vers la page de détails avec l'ID du projet en paramètre URL
    });

    projectContainer.querySelectorAll(".projectcard").forEach((card) => projectObserver.observe(card)); // Enregistre chaque nouvelle carte auprès de l'observateur d'intersection pour les animations au défilement
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
