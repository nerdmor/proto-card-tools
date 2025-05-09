async function addRandomCards(quantity){
    const randomCards = await window.apiManager.cardRandom(quantity);
    for(var i in randomCards.data){
        window.listManager.addCardFromObj(randomCards.data[i]);
    }
    return window.listManager.cardList;
}


document.getElementById('form_archidekt_import').addEventListener('submit', async function(e){
    e.preventDefault();
    window.listManager.importArchidekt(document.getElementById('txt_archidekt_import').value);
});