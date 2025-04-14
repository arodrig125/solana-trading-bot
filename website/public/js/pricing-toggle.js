/**
 * Pricing Toggle Functionality
 * Handles switching between monthly and yearly pricing
 */

document.addEventListener('DOMContentLoaded', function() {
    const pricingToggle = document.getElementById('pricing-toggle');
    const monthlyPrices = document.querySelectorAll('.monthly-price');
    const yearlyPrices = document.querySelectorAll('.yearly-price');
    
    // Function to update comparison grid prices based on billing cycle
    function updateComparisonGridPrices(isYearly) {
        const starterPrice = document.querySelector('.plan-column:nth-child(2) .plan-price');
        const proPrice = document.querySelector('.plan-column:nth-child(3) .plan-price');
        const elitePrice = document.querySelector('.plan-column:nth-child(4) .plan-price');
        const institutionalPrice = document.querySelector('.plan-column:nth-child(5) .plan-price');
        
        if (isYearly) {
            starterPrice.innerHTML = '$279<span>/yr</span>';
            proPrice.innerHTML = '$759<span>/yr</span>';
            elitePrice.innerHTML = '$1,899<span>/yr</span>';
            institutionalPrice.innerHTML = '$9,590<span>/yr</span>';
        } else {
            starterPrice.innerHTML = '$29<span>/mo</span>';
            proPrice.innerHTML = '$79<span>/mo</span>';
            elitePrice.innerHTML = '$199<span>/mo</span>';
            institutionalPrice.innerHTML = '$999<span>/mo</span>';
        }
    }
    
    // Initialize billing cycle radio buttons
    const monthlyRadio = document.createElement('input');
    monthlyRadio.type = 'radio';
    monthlyRadio.name = 'billing-cycle';
    monthlyRadio.value = 'monthly';
    monthlyRadio.checked = true;
    monthlyRadio.style.display = 'none';
    document.body.appendChild(monthlyRadio);
    
    const yearlyRadio = document.createElement('input');
    yearlyRadio.type = 'radio';
    yearlyRadio.name = 'billing-cycle';
    yearlyRadio.value = 'yearly';
    yearlyRadio.style.display = 'none';
    document.body.appendChild(yearlyRadio);
    
    // Handle toggle change
    if (pricingToggle) {
        pricingToggle.addEventListener('change', function() {
            if (this.checked) {
                // Yearly billing
                monthlyPrices.forEach(el => el.style.display = 'none');
                yearlyPrices.forEach(el => el.style.display = 'flex');
                yearlyRadio.checked = true;
                updateComparisonGridPrices(true);
            } else {
                // Monthly billing
                monthlyPrices.forEach(el => el.style.display = 'flex');
                yearlyPrices.forEach(el => el.style.display = 'none');
                monthlyRadio.checked = true;
                updateComparisonGridPrices(false);
            }
        });
    }
});
