/**
 * Mobile Menu Enhancement
 * Improves the mobile menu experience with smooth animations and better interaction
 */

document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('nav');

    // Create mobile menu container if it doesn't exist
    let mobileMenu = document.querySelector('.mobile-menu');

    // Remove any existing mobile menu to prevent duplicates
    if (mobileMenu) {
        mobileMenu.remove();
    }

    // Create new mobile menu
    mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-menu';

    // Move the navigation items to the mobile menu
    const navItems = nav.querySelector('ul').cloneNode(true);
    mobileMenu.appendChild(navItems);

    // Insert the mobile menu after the navigation
    nav.parentNode.insertBefore(mobileMenu, nav.nextSibling);

    // Toggle mobile menu
    mobileMenuToggle.addEventListener('click', function() {
        mobileMenuToggle.classList.toggle('active');
        mobileMenu.classList.toggle('active');

        // Prevent scrolling when menu is open
        document.body.classList.toggle('menu-open');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!mobileMenu.contains(event.target) && !mobileMenuToggle.contains(event.target) && mobileMenu.classList.contains('active')) {
            mobileMenuToggle.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });

    // Close mobile menu when window is resized to desktop size
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && mobileMenu.classList.contains('active')) {
            mobileMenuToggle.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });

    // Add active class to current page link
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    const navLinks = document.querySelectorAll('nav a, .mobile-menu a');

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href').replace('.html', '');
        if (linkHref === currentPage || (currentPage === '' && linkHref === 'index')) {
            link.classList.add('active');
        }
    });
});
