function generateImages() {
    const prompt = document.getElementById('prompt').value;
    const style = document.getElementById('style').value;
    const aspectRatio = document.getElementById('aspectRatio').value;
    const resultDiv = document.getElementById('result');
    const spinner = document.getElementById('spinner');

    if (prompt) {
        // Clear previous results and show spinner
        resultDiv.innerHTML = '';
        spinner.style.display = 'block';

        const uniquePrompt = `${style} style: ${prompt}`;
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(uniquePrompt)}?ar=${aspectRatio}`;

        setTimeout(() => {
            const container = document.createElement('div');

            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Generated Image';

            const button = document.createElement('button');
            button.innerText = 'Download';
            button.className = 'download-btn';
            button.onclick = () => downloadImage(url, 'image.jpg');

            container.appendChild(img);
            container.appendChild(button);
            resultDiv.appendChild(container);

            // Hide spinner after image is loaded
            spinner.style.display = 'none';
        }, 2000); // Simulate loading time
    } else {
        alert('Please enter a prompt!');
    }
}

function downloadImage(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
