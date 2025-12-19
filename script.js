let isGenerating = false;

// Trigger generation on 'Enter' key
document.getElementById('prompt').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') generateImage();
});

async function generateImage() {
    if (isGenerating) return;

    const promptInput = document.getElementById('prompt');
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
        alert("Please enter a description first!");
        return;
    }

    // UI Updates
    isGenerating = true;
    const btn = document.getElementById('generate-btn');
    btn.classList.add('loading');
    
    // Get Options
    const style = document.getElementById('style').value;
    const format = document.getElementById('format').value;
    const isHD = document.getElementById('hd-option').checked;
    const noLogo = document.getElementById('private-option').checked;

    // Calculate Dimensions
    let width = 1024;
    let height = 1024;
    if (format === 'portrait') { width = 768; height = 1152; }
    else if (format === 'landscape') { width = 1152; height = 768; }
    else if (format === 'widescreen') { width = 1280; height = 720; }

    // Construct the URL
    // We add a random seed to prevent caching!
    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(`${style} style, ${prompt}`);
    
    // Pollinations URL structure
    let imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=${noLogo}`;
    
    if (isHD) {
        imageUrl += "&model=flux"; // Better quality model
    }

    // Create a new image object to pre-load
    const img = new Image();
    
    img.onload = () => {
        displayResult(img.src);
        isGenerating = false;
        btn.classList.remove('loading');
    };

    img.onerror = () => {
        alert("Oops! Server is busy. Try again.");
        isGenerating = false;
        btn.classList.remove('loading');
    };

    // Start loading
    img.src = imageUrl;
}

function displayResult(url) {
    const generatorPanel = document.getElementById('generator-panel');
    const resultContainer = document.getElementById('result-container');
    const imageWrapper = document.getElementById('image-wrapper');
    const downloadBtn = document.getElementById('download-btn');

    // Inject Image
    imageWrapper.innerHTML = `<img src="${url}" alt="Generated Image">`;
    
    // Setup Download Button (Fetching blob to avoid CORS issues)
    downloadBtn.onclick = async () => {
        try {
            downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `dreamscape-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Save';
        } catch (e) {
            console.error(e);
            alert("Could not download automatically. Right click the image to save.");
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Save';
        }
    };

    // Transition Animations
    generatorPanel.classList.add('hidden');
    resultContainer.classList.remove('hidden');
    resultContainer.classList.add('animate__animated', 'animate__fadeInUp');
}

function hideResults() {
    const generatorPanel = document.getElementById('generator-panel');
    const resultContainer = document.getElementById('result-container');

    resultContainer.classList.add('hidden');
    generatorPanel.classList.remove('hidden');
    generatorPanel.classList.add('animate__animated', 'animate__fadeIn');
}

