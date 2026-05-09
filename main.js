document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    const galleryImages = document.querySelectorAll('.gallery img');

    // Center detection logic
    function updateCenteredImage() {
        let minDistance = Infinity;
        let closestImg = null;
        const viewportCenter = window.innerHeight / 2;

        galleryImages.forEach(img => {
            const rect = img.getBoundingClientRect();
            // Check if image is at least partially in viewport to save calculation
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const imgCenter = rect.top + rect.height / 2;
                const distance = Math.abs(viewportCenter - imgCenter);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestImg = img;
                }
            }
        });

        galleryImages.forEach(img => {
            if (img === closestImg) {
                img.classList.add('centered');
            } else {
                img.classList.remove('centered');
            }
        });
    }

    // Attach scroll and resize listeners for center detection
    window.addEventListener('scroll', updateCenteredImage, { passive: true });
    window.addEventListener('resize', updateCenteredImage, { passive: true });
    
    // Initial calculation
    setTimeout(updateCenteredImage, 100);

    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('a[href^="#"]');

    function switchPage(targetId) {
        const targetPage = document.querySelector(targetId);
        if (!targetPage) return;

        // Reset all images to B&W before transition
        galleryImages.forEach(img => img.classList.remove('centered'));

        // Start transition
        container.classList.add('transitioning');

        // Wait for blur-out
        setTimeout(() => {
            // Switch active class
            pages.forEach(page => page.classList.remove('active'));
            targetPage.classList.add('active');

            // Reset scroll
            window.scrollTo(0, 0);

            // End transition
            container.classList.remove('transitioning');
            
            // Start the color bloom right after the new page is revealed
            setTimeout(updateCenteredImage, 100);
        }, 600);
    }

    // Cinematic Video Logic
    const exitCinematic = (video) => {
        console.log('Exiting cinematic mode');
        document.documentElement.classList.remove('locked');
        document.body.classList.remove('locked', 'cinematic-mode');
        if (video) video.classList.remove('video-playing');
        else {
            document.querySelectorAll('video.video-playing').forEach(v => v.classList.remove('video-playing'));
        }
    };

    let lastPlayTime = 0;

    document.addEventListener('play', (e) => {
        if (e.target.tagName === 'VIDEO') {
            const video = e.target;
            lastPlayTime = Date.now();
            console.log('Video play detected:', video.src);
            
            // Pause other videos
            document.querySelectorAll('video').forEach(v => {
                if (v !== video) v.pause();
            });

            // Lock scroll and enter cinematic mode
            document.documentElement.classList.add('locked');
            document.body.classList.add('locked', 'cinematic-mode');
            video.classList.add('video-playing');

            // Push a history state so back button can exit cinematic mode
            history.pushState({ isCinematic: true }, '');

            // Center video
            setTimeout(() => {
                video.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, true);

    document.addEventListener('pause', (e) => {
        if (e.target.tagName === 'VIDEO') {
            exitCinematic(e.target);
            // If we paused manually and the history state is still there, pop it
            if (history.state && history.state.isCinematic) {
                history.back();
            }
        }
    }, true);

    document.addEventListener('ended', (e) => {
        if (e.target.tagName === 'VIDEO') {
            exitCinematic(e.target);
        }
    }, true);

    // Handle any click/tap in cinematic mode to pause and exit
    document.addEventListener('click', (e) => {
        // Prevent immediate pause if the click was the one that started the video
        if (Date.now() - lastPlayTime < 300) return;

        if (document.body.classList.contains('cinematic-mode')) {
            const playingVideo = document.querySelector('video.video-playing');
            if (playingVideo) {
                playingVideo.pause();
            }
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                switchPage(targetId);
                // Update URL hash without jumping
                history.pushState(null, null, targetId);
            }
        });
    });

    // Handle back/forward buttons
    window.addEventListener('popstate', (e) => {
        // If we were in cinematic mode and the user hit 'back'
        const playingVideo = document.querySelector('video.video-playing');
        if (playingVideo && document.body.classList.contains('cinematic-mode')) {
            playingVideo.pause();
            return; // Stay on the current section
        }

        const hash = window.location.hash || '#home';
        switchPage(hash);
    });

    // Initial load
    const initialHash = window.location.hash || '#home';
    const initialPage = document.querySelector(initialHash);
    if (initialPage) {
        pages.forEach(page => page.classList.remove('active'));
        initialPage.classList.add('active');
    }

    // Email bot protection
    const emailLink = document.querySelector('.email-link');
    if (emailLink) {
        const user = emailLink.getAttribute('data-user');
        const domain = emailLink.getAttribute('data-domain');
        const email = `${user}@${domain}`;
        emailLink.textContent = email;
        emailLink.setAttribute('href', `mailto:${email}`);
    }
});
