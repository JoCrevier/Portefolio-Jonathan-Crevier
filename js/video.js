document.addEventListener("DOMContentLoaded", () => {
    const videoLightbox = document.getElementById("project-video-lightbox");
    if (!videoLightbox) return;

    const videoElement = videoLightbox.querySelector(".projectlightbox__video-element");

    // Écouteur global pour intercepter les clics sur les boutons vidéo de la galerie
    document.addEventListener("click", (event) => {
        const videoButton = event.target.closest(".project-detail__videoButton");
        if (!videoButton) return;

        const videoSrc = videoButton.dataset.videoSrc;
        if (videoElement && videoSrc) {
            videoElement.src = videoSrc;
            videoLightbox.classList.add("is-open");
            document.body.classList.add("has-lightbox-open");
            videoElement.play().catch(err => console.log("Autoplay bloqué :", err));
        }
    });

    // Fermeture de la lightbox vidéo au clic sur le fond ou la croix
    videoLightbox.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof HTMLElement && (target.dataset.closeVideo === "true" || target.classList.contains("projectlightbox__close-video"))) {
            closeVideoLightbox();
        }
    });

    // Fermeture avec la touche Échap
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeVideoLightbox();
        }
    });

    function closeVideoLightbox() {
        if (!videoLightbox.classList.contains("is-open")) return;

        if (videoElement) {
            videoElement.pause();
            videoElement.currentTime = 0;
            videoElement.src = "";
        }

        videoLightbox.classList.remove("is-open");
        document.body.classList.remove("has-lightbox-open");
    }
});