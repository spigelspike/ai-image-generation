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

        const basePrompt = `${style} style: ${prompt}`;
        const fragment = document.createDocumentFragment();

        setTimeout(() => {
            for (let i = 0; i < 3; i++) {
                const uniquePrompt = `${basePrompt} ${i + 1}`;
                const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(uniquePrompt)}?ar=${aspectRatio}`;
                const container = document.createElement('div');

                const img = document.createElement('img');
                img.src = url;
                img.alt = `Generated Image ${i + 1}`;

                const button = document.createElement('button');
                button.innerText = 'Download';
                button.className = 'download-btn';
                button.onclick = () => downloadImage(url, `image_${i + 1}.jpg`);

                container.appendChild(img);
                container.appendChild(button);
                fragment.appendChild(container);
            }

            resultDiv.appendChild(fragment);
            // Hide spinner after images are loaded
            spinner.style.display = 'none';
        }, 2000); // Simulate loading time
    } else {
        alert('Please enter a prompt!');
    }
}
