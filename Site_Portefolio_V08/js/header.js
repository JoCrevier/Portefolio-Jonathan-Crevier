document.addEventListener("DOMContentLoaded", () => {
    const toggleButton = document.querySelector(".nav-toggle");
    const navMenu = document.querySelector(".nav02 ul");

    if (toggleButton && navMenu) {
        toggleButton.addEventListener("click", () => {
            // Alterne l'état actif du bouton (animation + couleur blanche)
            toggleButton.classList.toggle("is-active");
            // Alterne l'affichage du menu
            navMenu.classList.toggle("is-open");
        });

        // Ferme le menu automatiquement si on clique sur un lien du menu (pratique sur mobile)
        navMenu.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                toggleButton.classList.remove("is-active");
                navMenu.classList.remove("is-open");
            });
        });
    }
});