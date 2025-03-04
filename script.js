function generateImage() {
    const prompt = document.getElementById('prompt').value;
    const style = document.getElementById('style').value;
    const resultDiv = document.getElementById('result');

    if (prompt) {
        // Clear previous results
        resultDiv.innerHTML = '';

        const uniquePrompt = `${style} style: ${prompt}`;
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(uniquePrompt)}`;

        const container = document.createElement('div');
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Generated Image';
        img.className = 'generated-image';

        const button = document.createElement('button');
        button.innerText = 'Download';
        button.className = 'download-btn';
        button.onclick = () => downloadImage(url, 'image.jpg');

        container.appendChild(img);
        container.appendChild(button);
        resultDiv.appendChild(container);
    } else {
        alert('Please enter a prompt!');
    }
}

function downloadImage(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}
