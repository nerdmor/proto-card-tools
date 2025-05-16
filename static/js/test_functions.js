async function addRandomCards(quantity){
    if(quantity == null){
        return null;
    }
    const randomCards = await window.apiManager.cardRandom(quantity);
    for(var i in randomCards.data){
        window.listManager.addCardFromObj(randomCards.data[i]);
    }

    return window.listManager.cardList;
}

function testScryfallImport(url){
    if(url == null){
        url = 'https://archidekt.com/decks/12982598/super_bunny_round';
    }
    window.listManager.importArchidekt(url);
}

