// Enhanced animations for SolarBot website
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Intersection Observer for fade-in-up animations
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Add visible class when element is in viewport
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Unobserve after animation is triggered
                fadeObserver.unobserve(entry.target);
            }
        });
    }, {
        root: null, // viewport
        threshold: 0.1, // 10% of element must be visible
        rootMargin: '0px 0px -50px 0px' // trigger slightly before element is in view
    });

    // Observe all elements with fade-in-up class
    document.querySelectorAll('.fade-in-up').forEach(element => {
        fadeObserver.observe(element);
    });

    // Initialize Intersection Observer for animate-on-scroll class
    const animateObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Add animation class when element is in viewport
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                // Unobserve after animation is triggered
                animateObserver.unobserve(entry.target);
            }
        });
    }, {
        root: null, // viewport
        threshold: 0.1, // 10% of element must be visible
        rootMargin: '0px 0px -50px 0px' // trigger slightly before element is in view
    });

    // Observe all elements with animate-on-scroll class
    document.querySelectorAll('.animate-on-scroll').forEach(element => {
        animateObserver.observe(element);
    });

    // Add staggered animation for feature lists
    document.querySelectorAll('.features-list').forEach(list => {
        const items = list.querySelectorAll('li');
        items.forEach((item, index) => {
            item.classList.add('fade-in-up');
            item.classList.add(`delay-${(index % 4) + 1}`);
            fadeObserver.observe(item);
        });
    });

    // Add staggered animation for other lists
    document.querySelectorAll('.staggered-list').forEach(list => {
        const items = list.querySelectorAll('li');
        items.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
        });
    });

    // Add hover animations for cards
    document.querySelectorAll('.feature-card, .pricing-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)';
            this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
        });
    });

    // Add counter animation for stats
    document.querySelectorAll('.stat-number').forEach(stat => {
        // Check if data-value attribute exists
        if (!stat.hasAttribute('data-value') && !stat.hasAttribute('data-target')) {
            // Store the original text as data-value
            const originalValue = stat.textContent;
            stat.setAttribute('data-value', originalValue);
        }

        const targetAttr = stat.hasAttribute('data-target') ? 'data-target' : 'data-value';
        const target = parseInt(stat.getAttribute(targetAttr).replace(/,/g, ''));

        if (!isNaN(target)) {
            // Reset the content to 0
            stat.textContent = '0';

            const counterObserver = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    // Start counting animation
                    const duration = 2000; // 2 seconds
                    const frameDuration = 1000 / 60; // 60fps
                    const totalFrames = Math.round(duration / frameDuration);
                    const countIncrement = target / totalFrames;

                    let currentCount = 0;
                    let frame = 0;

                    const counter = setInterval(() => {
                        frame++;
                        currentCount += countIncrement;

                        if (currentCount >= target) {
                            clearInterval(counter);
                            stat.textContent = stat.getAttribute(targetAttr);
                        } else {
                            stat.textContent = Math.floor(currentCount).toLocaleString();
                        }

                        if (frame === totalFrames) {
                            clearInterval(counter);
                            stat.textContent = stat.getAttribute(targetAttr);
                        }
                    }, frameDuration);

                    counterObserver.unobserve(entries[0].target);
                }
            }, { threshold: 0.5 });

            counterObserver.observe(stat);
        }
    });

    // Add parallax effect to hero section
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        window.addEventListener('scroll', function() {
            const scrollPosition = window.scrollY;
            if (scrollPosition < 600) {
                heroSection.style.backgroundPositionY = `${scrollPosition * 0.5}px`;
            }
        });
    }

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Adjust for header height
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add typing effect for hero headline
    const heroHeadline = document.querySelector('.hero-content h1');
    if (heroHeadline && !heroHeadline.classList.contains('typing-done')) {
        const text = heroHeadline.textContent;
        heroHeadline.textContent = '';
        heroHeadline.classList.add('typing-done');

        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                heroHeadline.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        };

        setTimeout(typeWriter, 500);
    }
});
