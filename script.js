// Global Variables
let isGenerating = false;
let generationHistory = [];
const MAX_HISTORY_ITEMS = 20;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Add animation classes to elements
    animateElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize slider values
    initializeSliders();
    
    // Load history from local storage
    loadHistory();
    
    // Setup gallery preview items
    setupGalleryItems();
});

// Add animation classes to elements
function animateElements() {
    const elements = document.querySelectorAll('.container > *, .gallery-preview');
    elements.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add('animate__animated', 'animate__fadeInUp');
            element.style.animationDelay = `${index * 0.1}s`;
        }, 100);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Enter key in input field
    document.getElementById('prompt').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            generateImage();
        }
    });
    
    // Input field focus effects
    const inputField = document.getElementById('prompt');
    inputField.addEventListener('focus', function() {
        this.parentElement.classList.add('input-focus');
    });
    
    inputField.addEventListener('blur', function() {
        this.parentElement.classList.remove('input-focus');
    });
    
    // History toggle
    document.getElementById('history-toggle').addEventListener('click', function() {
        document.getElementById('history-panel').classList.toggle('open');
    });
    
    // Close history
    document.getElementById('close-history').addEventListener('click', function() {
        document.getElementById('history-panel').classList.remove('open');
    });
    
    // Download all button
    document.getElementById('download-all-btn').addEventListener('click', function() {
        downloadAllImages();
    });
    
    // Creativity slider
    document.getElementById('creativity-slider').addEventListener('input', function() {
        document.getElementById('creativity-value').textContent = `${this.value}%`;
    });
}

// Initialize sliders
function initializeSliders() {
    const creativitySlider = document.getElementById('creativity-slider');
    const creativityValue = document.getElementById('creativity-value');
    creativityValue.textContent = `${creativitySlider.value}%`;
}

// Setup gallery preview items
function setupGalleryItems() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            const style = this.getAttribute('data-style');
            const prompt = this.getAttribute('data-prompt');
            
            // Set the values in the form
            document.getElementById('prompt').value = prompt;
            document.getElementById('style').value = style;
            
            // Scroll to the top to see the form
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            // Highlight the input field
            const inputField = document.getElementById('prompt');
            inputField.parentElement.classList.add('input-focus');
            setTimeout(() => {
                inputField.parentElement.classList.remove('input-focus');
            }, 1500);
        });
    });
}

// Generate image based on input
function generateImage() {
    const promptInput = document.getElementById('prompt');
    const prompt = promptInput.value.trim();
    const style = document.getElementById('style').value;
    const format = document.getElementById('format').value;
    const generateBtn = document.getElementById('generate-btn');
    const resultDiv = document.getElementById('result');
    const hdOption = document.getElementById('hd-option').checked;
    const enhanceDetails = document.getElementById('enhance-details').checked;
    const creativityLevel = document.getElementById('creativity-slider').value;
    
    if (!prompt) {
        showToast('Please enter a description for your image', 'warning');
        shakeElement(promptInput);
        return;
    }
    
    if (isGenerating) {
        return;
    }
    
    // Set generating state
    isGenerating = true;
    
    // Update button state to show loading
    generateBtn.classList.add('loading');
    
    // Clear previous results
    resultDiv.innerHTML = '';
    
    // Add aspect ratio parameter based on format
    let aspectRatio = '';
    switch (format) {
        case 'portrait':
            aspectRatio = '/ar=2:3';
            break;
        case 'landscape':
            aspectRatio = '/ar=3:2';
            break;
        case 'widescreen':
            aspectRatio = '/ar=16:9';
            break;
        default:
            aspectRatio = '/ar=1:1'; // Square
    }
    
    // Add enhancement parameters
    let enhancementParams = '';
    if (hdOption) {
        enhancementParams += '/q=2'; // Higher quality
    }
    if (enhanceDetails) {
        enhancementParams += '/ds=3'; // Enhanced details
    }
    
    // Add creativity parameter (maps to Pollinations "cfg" parameter)
    // Lower creativity value (0) means higher cfg value (20)
    // Higher creativity value (100) means lower cfg value (5)
    const cfgValue = 20 - ((creativityLevel / 100) * 15);
    const creativityParam = `/cfg=${cfgValue.toFixed(1)}`;
    
    // Create the URL with parameters
    const formattedPrompt = `${style} style: ${prompt}`;
    const baseUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(formattedPrompt)}`;
    const imageUrl = baseUrl + aspectRatio + enhancementParams + creativityParam;
    
    // Create image element
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    // Set up image load handlers
    img.onload = function() {
        // Reset generating state
        isGenerating = false;
        generateBtn.classList.remove('loading');
        
        // Save to history
        saveToHistory({
            prompt,
            style,
            format,
            imageUrl,
            timestamp: new Date().toISOString()
        });
        
        // Display the result
        displayResult(img, prompt, style, format, imageUrl);
    };
    
    img.onerror = function() {
        isGenerating = false;
        generateBtn.classList.remove('loading');
        showToast('Failed to generate image. Please try again.', 'error');
    };
    
    // Set image source to start loading
    img.src = imageUrl;
    
    // Timeout in case the image takes too long
    setTimeout(function() {
        if (isGenerating) {
            isGenerating = false;
            generateBtn.classList.remove('loading');
            showToast('Generation timed out. Please try again.', 'error');
        }
    }, 20000);
}

// Display the generated image result
function displayResult(img, prompt, style, format, imageUrl) {
    const resultDiv = document.getElementById('result');
    const resultContainer = document.getElementById('result-container');
    const mainContainer = document.querySelector('.container');
    
    // Create image card
    const imageCard = document.createElement('div');
    imageCard.className = `image-card ${format} animate__animated animate__fadeIn`;
    
    // Add image
    imageCard.appendChild(img);
    
    // Add overlay with info and actions
    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';
    
    // Image info
    const infoDiv = document.createElement('div');
    infoDiv.className = 'image-info';
    
    const title = document.createElement('h3');
    title.textContent = prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt;
    
    const styleText = document.createElement('p');
    styleText.textContent = `Style: ${style}`;
    
    infoDiv.appendChild(title);
    infoDiv.appendChild(styleText);
    
    // Action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'image-actions';
    
    // Download button
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'action-btn';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
    downloadBtn.onclick = () => downloadImage(imageUrl, `dreamscape-${style}-${Date.now()}.jpg`);
    
    // Share button
    const shareBtn = document.createElement('button');
    shareBtn.className = 'action-btn';
    shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
    shareBtn.onclick = () => shareImage(imageUrl, prompt);
    
    // Regenerate button
    const regenerateBtn = document.createElement('button');
    regenerateBtn.className = 'action-btn';
    regenerateBtn.innerHTML = '<i class="fas fa-redo-alt"></i>';
    regenerateBtn.onclick = () => regenerateImage(prompt, style);
    
    actionsDiv.appendChild(downloadBtn);
    actionsDiv.appendChild(shareBtn);
    actionsDiv.appendChild(regenerateBtn);
    
    // Add all to overlay
    overlay.appendChild(infoDiv);
    overlay.appendChild(actionsDiv);
    
    // Add overlay to card
    imageCard.appendChild(overlay);
    
    // Add card to result
    resultDiv.appendChild(imageCard);
    
    // Show result container and hide main container with animation
    mainContainer.classList.remove('animate__fadeIn');
    mainContainer.classList.add('animate__fadeOut');
    
    setTimeout(() => {
        mainContainer.style.display = 'none';
        resultContainer.classList.remove('hidden');
        resultContainer.classList.add('animate__animated', 'animate__fadeIn');
    }, 300);
}

// Regenerate an image with the same parameters
function regenerateImage(prompt, style) {
    document.getElementById('prompt').value = prompt;
    document.getElementById('style').value = style;
    hideResults();
    
    // Wait a little bit for the UI to update before generating
    setTimeout(() => {
        generateImage();
    }, 400);
}

// Download the generated image
function downloadImage(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    showToast('Image downloading...', 'success');
}

// Download all images in the result
function downloadAllImages() {
    const images = document.querySelectorAll('#result img');
    
    if (images.length === 0) {
        showToast('No images to download', 'warning');
        return;
    }
    
    images.forEach((img, index) => {
        setTimeout(() => {
            downloadImage(img.src, `dreamscape-image-${index+1}.jpg`);
        }, index * 500); // Stagger downloads to avoid browser limitations
    });
    
    showToast(`Downloading ${images.length} images...`, 'success');
}

// Share the generated image
function shareImage(url, prompt) {
    // Check if Web Share API is supported
    if (navigator.share) {
        navigator.share({
            title: 'Dreamscape AI Generated Image',
            text: `Check out this AI-generated image: "${prompt}"`,
            url: url
        })
        .then(() => showToast('Shared successfully', 'success'))
        .catch(() => showToast('Share cancelled', 'info'));
    } else {
        // Fallback: Copy URL to clipboard
        navigator.clipboard.writeText(url)
            .then(() => showToast('Image URL copied to clipboard', 'success'))
            .catch(() => showToast('Failed to copy URL', 'error'));
    }
}

// Hide results and go back to main screen
function hideResults() {
    const resultContainer = document.getElementById('result-container');
    const mainContainer = document.querySelector('.container');
    
    resultContainer.classList.remove('animate__fadeIn');
    resultContainer.classList.add('animate__fadeOut');
    
    setTimeout(() => {
        resultContainer.classList.add('hidden');
        resultContainer.classList.remove('animate__fadeOut');
        
        mainContainer.style.display = 'block';
        mainContainer.classList.remove('animate__fadeOut');
        mainContainer.classList.add('animate__fadeIn');
    }, 300);
}

// Save image to history
function saveToHistory(item) {
    // Get existing history or initialize new array
    let history = JSON.parse(localStorage.getItem('dreamscapeHistory')) || [];
    
    // Add new item to the beginning
    history.unshift(item);
    
    // Limit to max items
    if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
    }
    
    // Save back to local storage
    localStorage.setItem('dreamscapeHistory', JSON.stringify(history));
    
    // Update history UI
    updateHistoryUI(history);
    
    // Update global variable
    generationHistory = history;
}

// Load history from local storage
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('dreamscapeHistory')) || [];
    updateHistoryUI(history);
    generationHistory = history;
}

// Update the history panel UI
function updateHistoryUI(history) {
    const historyItems = document.getElementById('history-items');
    historyItems.innerHTML = '';
    
    if (history.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-history';
        emptyMessage.textContent = 'No generation history yet';
        historyItems.appendChild(emptyMessage);
        return;
    }
    
    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        // Create image
        const img = document.createElement('img');
        img.className = 'history-img';
        img.src = item.imageUrl;
        img.alt = item.prompt;
        
        // Create prompt text
        const promptText = document.createElement('p');
        promptText.className = 'history-prompt';
        promptText.textContent = item.prompt;
        
        // Add click handler
        historyItem.onclick = function() {
            // Set form values
            document.getElementById('prompt').value = item.prompt;
            document.getElementById('style').value = item.style;
            document.getElementById('format').value = item.format;
            
            // Close history panel
            document.getElementById('history-panel').classList.remove('open');
            
            // Highlight input
            const inputField = document.getElementById('prompt');
            inputField.parentElement.classList.add('input-focus');
            setTimeout(() => {
                inputField.parentElement.classList.remove('input-focus');
            }, 1500);
        };
        
        // Add elements to history item
        historyItem.appendChild(img);
        historyItem.appendChild(promptText);
        
        // Add history item to container
        historyItems.appendChild(historyItem);
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    // Check if toast container exists, create if not
    let toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate__animated animate__fadeIn`;
    
    // Set icon based on type
    let iconClass = 'info-circle';
    let iconColor = '#3498db';
    
    switch (type) {
        case 'success':
            iconClass = 'check-circle';
            iconColor = '#2ecc71';
            break;
        case 'warning':
            iconClass = 'exclamation-triangle';
            iconColor = '#f39c12';
            break;
        case 'error':
            iconClass = 'times-circle';
            iconColor = '#e74c3c';
            break;
    }
    
    // Add icon
    const icon = document.createElement('i');
    icon.className = `fas fa-${iconClass}`;
    icon.style.marginRight = '10px';
    icon.style.color = iconColor;
    
    // Add message
    const text = document.createElement('span');
    text.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(text);
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Remove after delay
    setTimeout(() => {
        toast.classList.remove('animate__fadeIn');
        toast.classList.add('animate__fadeOut');
        
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Shake element for error feedback
function shakeElement(element) {
    element.classList.add('animate__animated', 'animate__shakeX');
    
    setTimeout(() => {
        element.classList.remove('animate__animated', 'animate__shakeX');
    }, 1000);
}