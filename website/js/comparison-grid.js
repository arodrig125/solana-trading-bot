document.addEventListener('DOMContentLoaded', function() {
    // Make header sticky on scroll
    const comparisonHeader = document.querySelector('.comparison-header');
    if (comparisonHeader) {
        const headerOffset = comparisonHeader.offsetTop;
        
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > headerOffset) {
                comparisonHeader.classList.add('sticky-header');
            } else {
                comparisonHeader.classList.remove('sticky-header');
            }
        });
    }
    
    // Highlight row on hover
    const featureRows = document.querySelectorAll('.feature-row');
    featureRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'rgba(153, 69, 255, 0.05)';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
    });
    
    // Mobile-friendly tooltips
    const tooltips = document.querySelectorAll('.info-tooltip');
    tooltips.forEach(tooltip => {
        // For touch devices
        tooltip.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent row click
            
            // Hide all other tooltips
            tooltips.forEach(t => {
                if (t !== tooltip) {
                    t.classList.remove('active-tooltip');
                }
            });
            
            // Toggle current tooltip
            tooltip.classList.toggle('active-tooltip');
        });
    });
    
    // Close tooltips when clicking elsewhere
    document.addEventListener('click', function() {
        tooltips.forEach(tooltip => {
            tooltip.classList.remove('active-tooltip');
        });
    });
    
    // Add animation to recommended column
    const recommendedColumn = document.querySelector('.plan-column.recommended');
    if (recommendedColumn) {
        setTimeout(() => {
            recommendedColumn.style.transition = 'transform 0.5s ease, box-shadow 0.5s ease';
            recommendedColumn.style.transform = 'translateY(-5px)';
            recommendedColumn.style.boxShadow = '0 8px 15px rgba(153, 69, 255, 0.15)';
            
            setTimeout(() => {
                recommendedColumn.style.transform = '';
                recommendedColumn.style.boxShadow = '';
                
                setTimeout(() => {
                    recommendedColumn.style.transition = '';
                }, 500);
            }, 1000);
        }, 1000);
    }
});
