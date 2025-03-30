// Global Variables
let isGenerating = false;
let generationHistory = [];
const MAX_HISTORY_ITEMS = 20;
let nsfwVerified = false;

// Sample random prompts
const RANDOM_PROMPTS = [
    "A futuristic cityscape at sunset with flying cars",
    "Majestic dragon soaring over snow-capped mountains",
    "Cyberpunk street market with neon signs and robots",
    "Surreal landscape with floating islands and waterfalls",
    "Portrait of a steampunk inventor in their workshop",
    "Ancient library filled with magical glowing books",
    "Underwater city with glass domes and mermaids",
    "Post-apocalyptic wasteland with abandoned vehicles",
    "Fantasy castle in the clouds with bridges between towers",
    "Alien jungle with bioluminescent plants and creatures"
];

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
    
    // History toggle
    document.getElementById('history-toggle').addEventListener('click', function() {
        document.getElementById('history-panel').classList.toggle('open');
    });
    
    // Close history
    document.getElementById('close-history').addEventListener('click', function() {
        document.getElementById('history-panel').classList.remove('open');
    });
    
    // NSFW toggle
    document.getElementById('nsfw-toggle').addEventListener('click', function(e) {
        if (this.checked && !nsfwVerified) {
            e.preventDefault(); // Prevent immediate checking
            showAgeVerification();
        }
    });
    
    // Age verification buttons
    document.getElementById('confirm-age').addEventListener('click', function() {
        nsfwVerified = true;
        document.getElementById('nsfw-toggle').checked = true;
        document.getElementById('age-verification-modal').classList.add('hidden');
        showToast('Age verified. NSFW content enabled.', 'success');
    });
    
    document.getElementById('cancel-age').addEventListener('click', function() {
        document.getElementById('nsfw-toggle').checked = false;
        document.getElementById('age-verification-modal').classList.add('hidden');
    });
    
    // Random prompt button
    document.getElementById('random-prompt').addEventListener('click', getRandomPrompt);
}

// Show age verification modal
function showAgeVerification() {
    document.getElementById('age-verification-modal').classList.remove('hidden');
}

// Get random prompt
function getRandomPrompt() {
    const randomPrompt = RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)];
    document.getElementById('prompt').value = randomPrompt;
    showToast('Random prompt generated!', 'success');
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

// ... [rest of the existing functions remain the same] ...