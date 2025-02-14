function ShortenUrl(longUrl) {

    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let shortCode = '';

    const hashCode = longUrl.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    for (let i = 1; i <= 4; i++) {
        const index = (hashCode + hashCode%(10**i)) % characters.length;
        shortCode += characters.charAt(index);
    }

    return shortCode;
}


function formateDate(timestamp) {
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    };

    const formattedDate = new Date(timestamp).toLocaleDateString('fr-FR', options);
    return formattedDate;
}




module.exports = {
    ShortenUrl: ShortenUrl,
    formateDate: formateDate,
};


