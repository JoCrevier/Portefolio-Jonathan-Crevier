/* =================================================================
    INITIALISATION ET RENDU DES DÉTAILS DU PROJET
   ================================================================= */

import { createLightbox, openLightbox } from "./lightbox.js"; // Importe les fonctions de la lightbox depuis le module externe

document.addEventListener("DOMContentLoaded", async () => { // Attend que le HTML de la page soit entièrement chargé avant d'exécuter le code
    const container = document.querySelector(".project-detail"); // Sélectionne le conteneur principal de la page de détail
    const projectId = new URLSearchParams(window.location.search).get("id"); // Récupère l'identifiant du projet présent dans l'URL (ex: ?id=3)

    createLightbox(); // Initialise la lightbox globale via le module externe

    if (!projectId) { // Vérifie si aucun identifiant de projet n'est présent dans l'URL
        if (container) container.innerHTML = "<p>Aucun projet spécifié.</p>"; // Affiche un message d'erreur si le conteneur existe
        return; // Stoppe l'exécution du script
    }

    try { // Démarre un bloc try pour gérer les erreurs potentielles de chargement
        const res = await fetch("projet.json"); // Récupère le fichier JSON contenant les données de tous les projets
        if (!res.ok) throw new Error(`HTTP ${res.status}`); // Vérifie si la requête réseau a réussi, sinon lève une erreur
        
        const projects = await res.json(); // Convertit la réponse HTTP en objet/tableau JavaScript
        const project = projects.find((p) => String(p.id) === String(projectId)); // Recherche le projet correspondant à l'ID de l'URL

        if (!project) { // Vérifie si le projet recherché n'a pas été trouvé dans le JSON
            if (container) container.innerHTML = "<p>Projet introuvable.</p>"; // Affiche un message d'erreur si absent
            return; // Stoppe l'exécution
        }

        renderProjectDetails(project, projects.indexOf(project)); // Lance la fonction pour afficher les détails du projet trouvé
    } catch (err) { // Attrape et gère les erreurs survenues (réseau, fichier introuvable, etc.)
        console.error("Erreur de chargement :", err); // Affiche l'erreur dans la console du navigateur
        if (container) container.innerHTML = '<p class="projectcard__error">Impossible de charger les détails.</p>'; // Affiche un message d'erreur textuel à l'utilisateur
    }
});


/* =================================================================
    RENDU DES DONNÉES
   ================================================================= */

function renderProjectDetails(project, index) { // Déclare la fonction principale de rendu des détails du projet
    // 1. Textes principaux
    setElementText(".project-detail__number", String(project.id).padStart(2, "0")); // Affiche l'ID formaté sur 2 chiffres (ex: 01)
    setElementText(".project-detail__title", project.name); // Affiche le nom du projet
    setElementText(".project-detail__description", project.description || "Aucune description disponible pour ce projet."); // Affiche la description ou un texte par défaut

    // 2. Processus créatif
    toggleSection("#project-process-section", ".project-detail__process", project["processus créatif"] || project.processusCreatif); // Affiche ou masque la section du processus créatif selon sa présence

    // 3. Catégories
    const catContainer = document.querySelector("#project-categories"); // Sélectionne le conteneur des catégories
    if (catContainer && Array.isArray(project.categorie)) { // Vérifie si le conteneur existe et si les catégories sont bien un tableau
        catContainer.innerHTML = project.categorie.map((c) => `<span>${formatTitle(c)}</span>`).join(""); // Génère les balises HTML des catégories formatées
    }

    // 4. Logiciels utilisés
    toggleSection("#project-software", ".project-detail__software-value", project["software used"] || project.softwareUsed); // Affiche ou masque la section des logiciels utilisés

    // 5. Galerie (Images / Vidéos)
    const galleryContainer = document.querySelector("#project-gallery"); // Sélectionne le conteneur de la galerie d'images/vidéos
    if (galleryContainer) { // Vérifie si le conteneur de la galerie existe sur la page
        const items = project.galerie?.length ? project.galerie : [project.image]; // Utilise la galerie si elle existe et n'est pas vide, sinon utilise l'image principale

        galleryContainer.innerHTML = items.map((item, i) => { // Parcourt chaque élément de la galerie pour générer son HTML
            const isVideo = typeof item === "object" && item?.type === "video"; // Vérifie si l'élément courant est une vidéo
            const src = isVideo 
                ? (item.poster ? encodeURI(item.poster.trim()) : createFallbackSvg(index + i)) // Si c'est une vidéo, utilise son poster ou un SVG de secours
                : ((typeof item === "string" && item.trim() && item.trim().toLowerCase() !== "liens") ? encodeURI(item.trim()) : createFallbackSvg(index + i)); // Si c'est une image, valide l'URL ou génère un SVG de secours
            
            const alt = `${project.name} - ${isVideo ? "Vidéo" : "Image"} ${i + 1}`; // Crée un texte alternatif descriptif pour l'accessibilité

            // ATTENTION : Aucun commentaire "//" à l'intérieur de ces blocs HTML pour éviter qu'ils s'affichent sur le site
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
        }).join(""); // Assemble tous les éléments HTML générés en une seule chaîne de caractères

        // Écouteur pour ouvrir la lightbox sur les images de la galerie
        galleryContainer.querySelectorAll(".project-detail__galleryButton:not(.project-detail__videoButton)").forEach((btn) => { // Sélectionne uniquement les boutons d'images (exclut les vidéos)
            btn.addEventListener("click", () => openLightbox(btn.dataset.image, btn.dataset.alt)); // Ouvre la lightbox au clic avec l'image et son texte alternatif
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
const setElementText = (sel, text) => { // Déclare la fonction utilitaire pour modifier du texte
    const el = document.querySelector(sel); // Sélectionne l'élément dans le DOM selon le sélecteur fourni
    if (el) el.textContent = text; // Modifie le texte de l'élément uniquement s'il a été trouvé
};

/**
 * Affiche ou masque une section entière selon si sa valeur existe ou non.
 * @param {string} sectionSel - Sélecteur CSS du conteneur global de la section
 * @param {string} textSel - Sélecteur CSS de l'élément qui va recevoir le texte
 * @param {any} value - La donnée à vérifier et à afficher
 */
const toggleSection = (sectionSel, textSel, value) => { // Déclare la fonction pour gérer l'affichage dynamique des sections
    const section = document.querySelector(sectionSel); // Sélectionne le conteneur global de la section
    const textEl = document.querySelector(textSel); // Sélectionne l'élément textuel à l'intérieur de la section
    if (!section || !textEl) return; // Stoppe la fonction si l'un des deux éléments est introuvable

    if (value && String(value).trim() !== "") { // Vérifie si la valeur existe et n'est pas juste une chaîne vide
        textEl.textContent = value; // Insère le texte dans l'élément
        section.style.display = "block"; // Affiche la section complète en modifiant son style CSS
    } else {
        section.style.display = "none"; // Masque complètement la section si la donnée est vide
    }
};

/**
 * Met en forme un titre (ou un mot/catégorie).
 * @param {string} text - Le texte brut à formater
 */
const formatTitle = (text) => { // Déclare la fonction de formatage de texte
    const str = String(text).trim(); // Convertit en chaîne de caractères et retire les espaces superflus
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : ""; // Met la première lettre en majuscule si le texte n'est pas vide, sinon retourne du vide
};

/**
 * Sécurise un texte contre les failles HTML/XSS (neutralise les caractères spéciaux).
 * @param {string} text - Le texte brut à sécuriser
 */
const escapeHtml = (text) => String(text) // Déclare la fonction d'échappement HTML pour la sécurité
    .replace(/&/g, "&amp;") // Remplace le caractère &
    .replace(/</g, "&lt;") // Remplace le chevron ouvrant <
    .replace(/>/g, "&gt;") // Remplace le chevron fermant >
    .replace(/"/g, "&quot;") // Remplace les guillemets doubles
    .replace(/'/g, "&#39;"); // Remplace les guillemets simples

/**
 * Génère dynamiquement une image SVG de secours personnalisée (dégradé + formes). | Utilisée si une image ou un poster vidéo est manquant.
 * @param {number} index - Un nombre permettant de varier les couleurs d'un projet à l'autre
 */
function createFallbackSvg(index) { // Déclare la fonction de génération d'image de secours SVG
    const hue = (index * 34 + 22) % 360; // Calcule une teinte de couleur principale unique basée sur l'index
    const accent = (hue + 70) % 360; // Calcule une teinte de couleur secondaire pour le dégradé

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${hue}, 70%, 58%)"/><stop offset="100%" stop-color="hsl(${accent}, 68%, 28%)"/></linearGradient></defs><rect width="1200" height="900" fill="url(#g)" rx="48"/><circle cx="990" cy="180" r="150" fill="rgba(255,255,255,0.14)"/><circle cx="150" cy="700" r="180" fill="rgba(255,255,255,0.08)"/><circle cx="230" cy="250" r="90" fill="rgba(255,255,255,0.12)"/><circle cx="920" cy="630" r="120" fill="rgba(255,255,255,0.10)"/></svg>`; // Construit le code brut du SVG
    
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`; // Convertit le code SVG en Data URI lisible directement dans un attribut src
}
