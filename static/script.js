// Search functionality
function performSearch() {
    const searchTerm = document.getElementById('headerSearch').value.toLowerCase().trim();
    
    if (!searchTerm) {
        alert('Please enter a search term');
        return;
    }
    
    // Search through page content
    const searchResults = [];
    
    // Search in services
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach((card, index) => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            searchResults.push({
                type: 'Service',
                title: card.querySelector('h3').textContent,
                section: 'services'
            });
        }
    });
    
    // Search in about section
    const aboutSection = document.querySelector('#about');
    const aboutText = aboutSection.textContent.toLowerCase();
    if (aboutText.includes(searchTerm)) {
        searchResults.push({
            type: 'About Information',
            title: 'About Our Clinic',
            section: 'about'
        });
    }
    
    // Search in contact information
    const contactSection = document.querySelector('#contact');
    const contactText = contactSection.textContent.toLowerCase();
    if (contactText.includes(searchTerm)) {
        searchResults.push({
            type: 'Contact Information',
            title: 'Contact Details',
            section: 'contact'
        });
    }
    
    // Search in emergency information
    const emergencySection = document.querySelector('#emergency');
    const emergencyText = emergencySection.textContent.toLowerCase();
    if (emergencyText.includes(searchTerm)) {
        searchResults.push({
            type: 'Emergency Information',
            title: '24/7 Emergency Care',
            section: 'emergency'
        });
    }
    
    // Display search results
    displaySearchResults(searchResults, searchTerm);
}

function displaySearchResults(results, searchTerm) {
    if (results.length === 0) {
        alert(`No results found for "${searchTerm}". Try searching for:\n• Emergency\n• Vaccination\n• Treatment\n• Contact\n• Wound care`);
        return;
    }
    
    // If only one result, scroll directly to it
    if (results.length === 1) {
        const target = document.getElementById(results[0].section);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // Highlight the section briefly
            highlightSection(target);
        }
        return;
    }
    
    // Multiple results - show options
    let resultMessage = `Found ${results.length} results for "${searchTerm}":\n\n`;
    results.forEach((result, index) => {
        resultMessage += `${index + 1}. ${result.type}: ${result.title}\n`;
    });
    resultMessage += '\nScrolling to the first result...';
    
    alert(resultMessage);
    
    // Scroll to first result
    const firstTarget = document.getElementById(results[0].section);
    if (firstTarget) {
        firstTarget.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        highlightSection(firstTarget);
    }
}

function highlightSection(element) {
    // Add a temporary highlight effect
    const originalBackground = element.style.backgroundColor;
    element.style.backgroundColor = 'rgba(128, 0, 32, 0.1)';
    element.style.transition = 'background-color 0.3s ease';
    
    setTimeout(() => {
        element.style.backgroundColor = originalBackground;
    }, 2000);
}

// Add Enter key support for search
document.addEventListener('DOMContentLoaded', function() {
    const searchBar = document.getElementById('headerSearch');
    if (searchBar) {
        searchBar.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                performSearch();
            }
        });
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll effect to header
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'linear-gradient(135deg, #5d001a 0%, #4a0015 100%)';
    } else {
        header.style.background = 'linear-gradient(135deg, #800020 0%, #5d001a 100%)';
    }
});
