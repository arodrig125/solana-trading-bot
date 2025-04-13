/**
 * Breadcrumb Navigation
 * Automatically generates breadcrumb navigation based on the current page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if the breadcrumbs container exists
    const breadcrumbsContainer = document.querySelector('.breadcrumbs-container');
    if (!breadcrumbsContainer) return;
    
    // Get the current page path
    const currentPath = window.location.pathname;
    
    // Remove file extension and trailing slash if present
    let cleanPath = currentPath.replace(/\/$/, '');
    cleanPath = cleanPath.replace(/\.html$/, '');
    
    // Split the path into segments
    const pathSegments = cleanPath.split('/').filter(segment => segment !== '');
    
    // Define page titles (customize this based on your site structure)
    const pageTitles = {
        '': 'Home',
        'index': 'Home',
        'features': 'Features',
        'pricing': 'Pricing',
        'documentation': 'Documentation',
        'contact': 'Contact',
        'blog': 'Blog',
        'login': 'Login',
        'signup': 'Sign Up',
        'dashboard': 'Dashboard',
        'success': 'Success'
    };
    
    // Create breadcrumb items
    let breadcrumbHTML = '';
    let currentUrl = '/';
    
    // Always add Home as the first item
    breadcrumbHTML += `<div class="breadcrumb-item">
        <a href="/">Home</a>
    </div>`;
    
    // Add separator after Home if we have more segments
    if (pathSegments.length > 0 && pathSegments[0] !== 'index' && pathSegments[0] !== '') {
        breadcrumbHTML += `<div class="breadcrumb-separator">
            <i class="fas fa-chevron-right"></i>
        </div>`;
    }
    
    // Add remaining segments
    pathSegments.forEach((segment, index) => {
        // Skip 'index' as it's redundant
        if (segment === 'index') return;
        
        currentUrl += segment + '/';
        const isLast = index === pathSegments.length - 1;
        const title = pageTitles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        
        if (isLast) {
            // Last item is the current page (no link)
            breadcrumbHTML += `<div class="breadcrumb-item">
                <span class="breadcrumb-current">${title}</span>
            </div>`;
        } else {
            // Add intermediate items with links
            breadcrumbHTML += `<div class="breadcrumb-item">
                <a href="${currentUrl}">${title}</a>
            </div>
            <div class="breadcrumb-separator">
                <i class="fas fa-chevron-right"></i>
            </div>`;
        }
    });
    
    // Insert the breadcrumbs into the container
    breadcrumbsContainer.innerHTML = breadcrumbHTML;
});
