const urlForm = document.querySelector('#urlForm');
const urlInput = document.querySelector('#urlInput');
const codeInput = document.querySelector('#codeInput');
const errorUrl = document.querySelector('.error-url');
const errorCode = document.querySelector('.error-code');
const submitButton = document.querySelector('.submit-button');
const loadingSpinner = document.querySelector('.loading-spinner');

const resultDiv = document.querySelector('.resultDiv');
const resultUrl = document.querySelector('.resultUrl');
const copy_button = document.querySelector('.copy-button');
const icon_copy = document.querySelector('.icon-copy');
const tooltip = document.querySelector(".tooltiptext");

const REDIRECT_URL = window.location.href;
const urlRegex = /.+\..+/;


function copyToClipboard() {
    console.log("copyToClipboard");

    const resultLink = document.querySelector('.resultLink');
    const nouvelleURL = resultLink.innerHTML;

    // Create a textarea to copy the URL
    const textarea = document.createElement('textarea');
    textarea.value = nouvelleURL;
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    document.execCommand('copy');
    document.body.removeChild(textarea);

    icon_copy.innerHTML = "Done";
    tooltip.innerHTML = "Copied!";
}



urlForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorUrl.style.visibility = "hidden";
    errorCode.style.visibility = "hidden";

    // Display loading spinner
    submitButton.style.display = 'none';
    loadingSpinner.style.display = 'block';

    const longUrl = urlInput.value;
    const code = codeInput.value;
    const validUrl = urlRegex.test(longUrl);

    if (!validUrl) {
        resultUrl.innerHTML = "";
        errorUrl.style.visibility = "visible";
        errorUrl.classList.add('shake');
        setTimeout(() => { errorUrl.classList.remove('shake'); }, 1000);
    }
    else {
        // Send the URL to the server
        const response_url = await fetch('/shorten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ longUrl, code }),
        });

        // Check if the code is already used
        if (response_url.status === 400) {
            errorCode.style.visibility = "visible";
            errorCode.classList.add('shake');
            setTimeout(() => { errorCode.classList.remove('shake'); }, 1000);
        }
        else {
            const data = await response_url.json();
            const shortUrl = REDIRECT_URL + data.shortUrl;

            resultUrl.innerHTML = `<a href="${shortUrl}" class="resultLink" target="_blank">${shortUrl}</a>`;
            resultDiv.style.display = "flex";
            icon_copy.innerHTML = "content_copy";
            tooltip.innerHTML = "Copy";
        }
    }

    submitButton.style.display = 'block';
    loadingSpinner.style.display = 'none';
});