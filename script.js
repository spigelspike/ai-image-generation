// Global Variables
let isGenerating = false;
let currentPrompt = '';
let currentStyle = '';
let currentFormat = '';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Add animation classes to elements
    animateElements();
    
    // Set up event listeners
    setupEventListeners();
});

// Add animation classes to elements
function animateElements() {
    const elements = document.querySelectorAll('.container, h1, .subtitle, .input-group, .options-panel, button');
    elements.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add('animate__animated', 'animate__fadeInUp');
        }, index * 100);
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
}

// Generate image based on input
function generateImage() {
    const promptInput = document.getElementById('prompt');
    const prompt = promptInput.value.trim();
    const style = document.getElementById('style').value;
    const format = document.getElementById('format').value;
    const generateBtn = document.getElementById('generate-btn');
    
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
    currentPrompt = prompt;
    currentStyle = style;
    currentFormat = format;
    
    // Update button state
    generateBtn.classList.add('loading');
    
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
    
    // Create the URL with parameters
    const formattedPrompt = `${style} style: ${prompt}`;
    const baseUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(formattedPrompt)}`;
    const imageUrl = baseUrl + aspectRatio;
    
    // Create image element
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    // Set up image load handlers
    img.onload = function() {
        // Reset generating state
        isGenerating = false;
        generateBtn.classList.remove('loading');
        
        // Display the result
        displayResult(img, prompt, style, imageUrl);
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
function displayResult(img, prompt, style, imageUrl) {
    const resultDiv = document.getElementById('result');
    const resultContainer = document.getElementById('result-container');
    const mainContainer = document.querySelector('.container');
    
    // Clear previous results
    resultDiv.innerHTML = '';
    
    // Create image card
    const imageCard = document.createElement('div');
    imageCard.className = 'image-card animate__animated animate__fadeIn';
    
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
    downloadBtn.onclick = () => downloadImage(imageUrl, 'dreamscape-image.jpg');
    
    // Share button
    const shareBtn = document.createElement('button');
    shareBtn.className = 'action-btn';
    shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
    shareBtn.onclick = () => shareImage(imageUrl, prompt);
    
    actionsDiv.appendChild(downloadBtn);
    actionsDiv.appendChild(shareBtn);
    
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

// Download the generated image
function downloadImage(url, filename) {
    // Create link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    showToast('Image downloading...', 'success');
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

// Show toast notification
function showToast(message, type = 'info') {
    // Check if toast container exists, create if not
    let toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '1000';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate__animated animate__fadeIn`;
    toast.style.backgroundColor = 'rgba(20, 20, 20, 0.9)';
    toast.style.color = 'white';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.marginTop = '10px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    toast.style.backdropFilter = 'blur(5px)';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.width = 'auto';
    toast.style.maxWidth = '300px';
    
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
        toast.classList.remove('animate__fade