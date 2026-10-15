/* =================================================================
    INITIALISATION ET GESTION DES FILTRES
   ================================================================= */

import { createLightbox, openLightbox } from "./lightbox.js"; // Importe les fonctions de la lightbox depuis le module externe

const projectContainer = document.querySelector(".listeprojet"); // Sélectionne le conteneur principal des projets
const projectFilterButtons = document.querySelectorAll(".projectfilter"); // Sélectionne tous les boutons de filtrage
let normalizedProjects = []; // Initialise un tableau vide pour stocker les données normalisées des projets

const lightbox = createLightbox(); // Crée et initialise l'instance de la lightbox

const projectObserver = new IntersectionObserver((entries) => { // Crée l'observateur d'intersection
    entries.forEach((entry) => { // Parcourt chaque élément observé
        const target = entry.target; // Récupère l'élément HTML cible
        const top = entry.boundingClientRect.top; // Récupère sa position par rapport au haut de l'écran

        target.classList.toggle("is-visible", entry.isIntersecting); // Ajoute/retire la classe selon la visibilité à l'écran
        target.classList.toggle("is-scrolled-past", !entry.isIntersecting && top < 0); // Ajoute une classe si l'élément a défilé vers le haut
    });
}, { root: null, rootMargin: '-50px 0px -50px 0px', threshold: 0.1 }); // Configure les options de l'observateur

if (projectContainer) { // Vérifie si le conteneur des projets existe sur la page
    loadProjects(); // Charge les projets

    projectFilterButtons.forEach((button) => { // Parcourt chaque bouton de filtre
        button.addEventListener("click", () => { // Écoute le clic sur un bouton de filtre
            const filter = button.dataset.filter || "all"; // Récupère la valeur du filtre
            projectFilterButtons.forEach((btn) => btn.classList.toggle("is-active", btn === button)); // Met à jour l'état actif
            renderProjects(filter); // Affiche les projets filtrés
        });
    });
}

/* =================================================================
    CHARGEMENT ET RENDU DES PROJETS
   ================================================================= */

async function loadProjects() { // Déclare la fonction asynchrone de chargement
    try { // Démarre le bloc try pour gérer les erreurs
        const res = await fetch("projet.json"); // Récupère le fichier JSON
        if (!res.ok) throw new Error(`HTTP ${res.status}`); // Vérifie si la requête a réussi

        const projects = await res.json(); // Convertit la réponse en objet/tableau JavaScript
        normalizedProjects = projects.map((p) => ({ // Normalise chaque projet
            ...p, // Conserve les propriétés d'origine
            categories: (p.categorie || []).map((c) => c.trim().toLowerCase()) // Nettoie et met en minuscules les catégories
        }));

        renderProjects("all"); // Affiche tous les projets par défaut
    } catch (err) { // Attrape les erreurs éventuelles
        console.error("Erreur de chargement :", err); // Affiche l'erreur dans la console
        if (projectContainer) { // Vérifie si le conteneur existe
            projectContainer.innerHTML = '<p class="projectcard__error">Impossible de charger les projets.</p>'; // Affiche un message d'erreur visuel
        }
    }
}

function renderProjects(filter) { // Déclare la fonction de rendu des projets
    const filtered = filter === "all" // Vérifie si le filtre sélectionné est "all"
        ? normalizedProjects // Si oui, prend tous les projets
        : normalizedProjects.filter((p) => p.categories.includes(filter.trim().toLowerCase())); // Sinon, filtre selon la catégorie

    const fragment = document.createDocumentFragment(); // Crée un fragment pour optimiser les performances du DOM

    filtered.forEach((project, index) => { // Parcourt chaque projet filtré
        const card = document.createElement("article"); // Crée l'élément HTML <article>
        card.className = `projectcard ${index % 2 === 0 ? "projectcard--left" : "projectcard--right"}`; // Attribue une classe alternée

        const imageSrc = resolveImageSource(project.image, index); // Résout l'URL de l'image
        const fallbackSrc = createImage(index); // Génère une image de secours
        const shortDesc = project["court description"] || project.courtDescription || project.description || ""; // Récupère la description courte

        // ATTENTION : Pas de commentaires "//" à l'intérieur de ce bloc HTML pour éviter qu'ils s'affichent sur le site
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
        fragment.appendChild(card); // Ajoute la carte au fragment
    });

    projectContainer.innerHTML = ""; // Vide le conteneur principal
    projectContainer.appendChild(fragment); // Insère toutes les cartes d'un coup dans le DOM

    projectContainer.querySelectorAll(".projectcard__imageButton").forEach((btn) => { // Sélectionne les boutons d'image
        btn.addEventListener("click", () => openLightbox(btn.querySelector("img")?.src || btn.dataset.image, btn.dataset.alt)); // Ouvre la lightbox au clic
    });

    projectContainer.querySelectorAll(".projectcard__button").forEach((btn) => { // Sélectionne les boutons de détails
        btn.addEventListener("click", () => window.location.href = `projet-detail.html?id=${btn.dataset.id}`); // Redirige vers la page de détails
    });

    projectContainer.querySelectorAll(".projectcard").forEach((card) => projectObserver.observe(card)); // Enregistre chaque carte auprès de l'observateur
}

/* =================================================================
    FONCTIONS UTILITAIRES (HELPERS)
   ================================================================= */

const resolveImageSource = (image, index) => { // Valide et résout la source de l'image
    if (typeof image === "string") { // Vérifie si l'image est du texte
        const trimmed = image.trim(); // Nettoie les espaces
        if (trimmed && trimmed.toLowerCase() !== "liens") return encodeURI(trimmed); // Retourne l'URL si valide
    }
    return createImage(index); // Sinon, retourne l'image de secours
};

const formatCategory = (category) => { // Formate le nom d'une catégorie
    const text = String(category).trim(); // Convertit et nettoie le texte
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : ""; // Met la 1ère lettre en majuscule
};

const escapeHtml = (text) => String(text) // Sécurise un texte contre les failles HTML/XSS
    .replace(/&/g, "&amp;") // Remplace le &
    .replace(/</g, "&lt;") // Remplace le <
    .replace(/>/g, "&gt;") // Remplace le >
    .replace(/"/g, "&quot;") // Remplace les guillemets doubles
    .replace(/'/g, "&#39;"); // Remplace les guillemets simples

function createImage(index) { // Génère une image SVG abstraite de secours
    const hue = (index * 34 + 22) % 360; // Calcule une teinte de couleur principale
    const accent = (hue + 70) % 360; // Calcule une teinte secondaire
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${hue}, 70%, 58%)"/><stop offset="100%" stop-color="hsl(${accent}, 68%, 28%)"/></linearGradient></defs><rect width="1200" height="900" fill="url(#g)" rx="48"/><circle cx="990" cy="180" r="150" fill="rgba(255,255,255,0.14)"/><circle cx="150" cy="700" r="180" fill="rgba(255,255,255,0.08)"/><circle cx="230" cy="250" r="90" fill="rgba(255,255,255,0.12)"/><circle cx="920" cy="630" r="120" fill="rgba(255,255,255,0.10)"/></svg>`; // Construit le code SVG brut
    
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`; // Convertit le SVG en URL de données
}
