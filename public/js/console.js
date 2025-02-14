document.querySelectorAll('.editButton').forEach((button, index) => {
    button.addEventListener('click', function () {
        const row = button.closest('tr');
        row.querySelector('.urlText').style.display = 'none';
        row.querySelector('.urlInput').style.display = 'inline';
        row.querySelector('.editButton').style.display = 'none';
        row.querySelector('.saveButton').style.display = 'inline';
    });
});




document.querySelectorAll('.saveButton').forEach((button, index) => {
    button.addEventListener('click', function () {
        const row = button.closest('tr');
        const input = row.querySelector('.urlInput');
        const newText = input.value;
        const link = row.querySelector('a');
        fetch('/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ oldShortUrl: row.querySelector('.urlText').textContent, newShortUrl: newText })
        })
            .then(response => {
                if (!response.ok) {
                    throw response;
                }
                return response.json();
            })
            .then(data => {
                row.querySelector('.urlText').textContent = newText;
                row.querySelector('.urlText').style.display = 'inline';
                link.href = newText;
                input.style.display = 'none';
                row.querySelector('.editButton').style.display = 'inline';
                row.querySelector('.saveButton').style.display = 'none';
            })
            .catch(error => {
                if (error.status === 400) {
                    error.json().then(errMessage => {
                        alert(`Error while updating URL: ${errMessage.error}`);
                    });
                } else {
                    console.error('Unexpected error:', error);
                }
            });
    });
});
