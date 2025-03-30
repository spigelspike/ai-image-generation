/// Global Variables
let isGenerating = false;
let generationHistory = [];
const MAX_HISTORY_ITEMS = 20;
let nsfwVerified = false;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Add animation classes to elements
    animateElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load history from local storage
    loadHistory();
});

// Add animation classes to elements
function animateElements() {
    const elements = document.querySelectorAll('.container > *');
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
    
    // History tab
    document.getElementById('history-tab').addEventListener('click', function(e) {
        if (!e.target.closest('.history-panel')) {
            this.classList.toggle('open');
        }
    });
    
    // Close history
    document.getElementById('close-history').addEventListener('click', function(e) {
        e.stopPropagation();
        document.getElementById('history-tab').classList.remove('open');
    });
    
    // NSFW toggle
    document.getElementById('nsfw-toggle').addEventListener('change', function() {
        if (this.checked && !nsfwVerified) {
            showAgeVerification();
        }
    });
    
    // Age verification buttons
    document.getElementById('confirm-age').addEventListener('click', function() {
        nsfwVerified = true;
        document.getElementById('age-verification-modal').classList.add('hidden');
    });
    
    document.getElementById('cancel-age').addEventListener('click', function() {
        document.getElementById('nsfw-toggle').checked = false;
        document.getElementById('age-verification-modal').classList.add('hidden');
    });
}

// Show age verification modal
function showAgeVerification() {
    document.getElementById('age-verification-modal').classList.remove('hidden');
}

// Generate image based on input
async function generateImage() {
    const promptInput = document.getElementById('prompt');
    let prompt = promptInput.value.trim();
    let style = document.getElementById('style').value;
    const format = document.getElementById('format').value;
    const generateBtn = document.getElementById('generate-btn');
    const resultDiv = document.getElementById('result');
    const enhancePrompt = document.getElementById('enhance-prompt').checked;
    const nsfwEnabled = document.getElementById('nsfw-toggle').checked;
    
    if (!prompt) {
        showToast('Please enter a description for your image', 'warning');
        shakeElement(promptInput);
        return;
    }
    
    if (nsfwEnabled && !nsfwVerified) {
        showToast('Please complete age verification for NSFW content', 'warning');
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
    
    try {
        // Enhance prompt if enabled
        if (enhancePrompt) {
            prompt = await enhancePromptText(prompt);
        }
        
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
        let formattedPrompt = style === 'none' ? prompt : `${style} style: ${prompt}`;
        if (nsfwEnabled) {
            formattedPrompt += ' (nsfw, mature content)';
        }
        
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
            
            // Save to history
            saveToHistory({
                prompt,
                style,
                format,
                imageUrl,
                timestamp: new Date().toISOString(),
                enhanced: enhancePrompt,
                nsfw: nsfwEnabled
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
    } catch (error) {
        isGenerating = false;
        generateBtn.classList.remove('loading');
        showToast('Error during generation: ' + error.message, 'error');
    }
}

// Enhance prompt using AI
async function enhancePromptText(prompt) {
    try {
        showToast('Enhancing your prompt...', 'info');
        
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: `Improve this image generation prompt while keeping its original meaning: "${prompt}"`,
                max_tokens: 100
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to enhance prompt');
        }
        
        const data = await response.json();
        const enhancedPrompt = data.choices?.[0]?.text?.trim() || prompt;
        
        // Update the input field with enhanced prompt
        document.getElementById('prompt').value = enhancedPrompt;
        
        showToast('Prompt enhanced successfully!', 'success');
        return enhancedPrompt;
    } catch (error) {
        console.error('Prompt enhancement failed:', error);
        showToast('Prompt enhancement failed. Using original.', 'warning');
        return prompt;
    }
}

// ... [rest of the existing functions remain the same, including displayResult, regenerateImage, downloadImage, shareImage, hideResults, saveToHistory, loadHistory, updateHistoryUI, showToast, shakeElement] ...
// Display the generated image result
function displayResult(img, prompt, style, format, imageUrl) {
    const resultDiv = document.getElementById('result');
    const resultContainer = document.getElementById('result-container');
    const mainContainer = document.querySelector('.container');
    
    // Create image card
    const imageCard = document.createElement('div');
    imageCard.className = `image-card ${format} animate__animated animate__fadeIn`;
    
    // Add image
    const imgElement = new Image();
    imgElement.src = imageUrl;
    imgElement.alt = prompt;
    imageCard.appendChild(imgElement);
    
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