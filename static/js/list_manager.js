class ListManager{
    constructor(){
        this.reset();
    }

    reset(){
        this.id = null;
        this.name = null;
        this.cardList = {};
        this.icons = ['✅', '💲', '❓', '♻', '❌'];
    }

    async importArchidekt(url){
        const apiResp = await window.apiManager.importArchidekt(url);
        // TODO: this should call a window for us to select the categories that will actually be imported.
        // but, for now, this works as a testing bench
        for(var oid in apiResp.data.cards){
            this.addCardFromObj(apiResp.data.cards[oid]);
        }
    }

    async addCardFromOracleId(oracleId, quantity=1, selectedVariant=null, addToExisting=true){
        var cardData = window.apiManager.cardOracleId(oracleId);
        var newCard = new Card(cardData);
        newCard.quantity = quantity;
        if(selectedVariant !== null){
            newCard.selectVariant(selectedVariant);
        }
        if(addToExisting == false){
            newCard.pileNumber = this.findPileNumberByOracleId(newCard.oracleId) + 1;
            newCard.updateKey();
        }
        if(Object.keys(this.cardList).includes(newCard.cardKey)){
            this.cardList[newCard.cardKey].quantity = this.cardList[newCard.cardKey].quantity + newCard.quantity;
        }else{
            this.cardList[newCard.cardKey] = newCard;
        }
        return newCard.cardKey;
    }

    async addCardFromObj(cardObj, quantity=1, selectedVariant=null, addToExisting=true){
        var newCard = new Card(JSON.parse(JSON.stringify(cardObj)));
        newCard.quantity = quantity;
        if(selectedVariant !== null){
            newCard.selectVariant(selectedVariant);
        }
        if(addToExisting == false){
            newCard.pileNumber = this.findPileNumberByOracleId(newCard.oracleId) + 1;
            newCard.updateKey();
        }
        if(Object.keys(this.cardList).includes(newCard.cardKey)){
            this.cardList[newCard.cardKey].quantity = this.cardList[newCard.cardKey].quantity + newCard.quantity;
        }else{
            this.cardList[newCard.cardKey] = newCard;
        }
    }

    findPileNumberByOracleId(oracleId){
        var maxPileNum = 0;
        for(const cardKey in this.cardList){
            if(this.cardList[cardKey].oracleId == oracleId){
                maxPileNum = Math.max(response, this.cardList[cardKey].pileNumber);
            }
        }
        return maxPileNum;
    }

    printAllCards(){
        var htmlList = [];
        for(const cardKey in this.cardList){
            htmlList.push(this.cardList[cardKey].makeOuterHTML());
        }

        document.getElementById('main_container').innerHTML = htmlList.join('\n');
    }

    printOneCard(cardKey, addIfNotFound=false){
        if(!cardKey in this.cardList) return;
        const cardElement = document.getElementById(`card_${cardKey}`);
        if(cardElement === null){
            if(addIfNotFound === false) return;
            document.getElementById('main_container').innerHTML = document.getElementById('main_container').innerHTML + this.cardList[cardKey].makeOuterHTML();
        }else{
            cardElement.innerHTML = this.cardList[cardKey].makeInnerHTML();
        }
    }

    advanceCardIcon(cardKey){
        if(!cardKey in this.cardList) return;
        const currentCardIcon = this.cardList[cardKey].icon;
        if(!currentCardIcon in this.icons){
            this.cardList[cardKey].icon = null;
            return;
        }
        if(currentCardIcon == null){
            this.cardList[cardKey].icon = this.icons[0];
            return;
        }
        const currentCardIconIndex = this.icons.indexOf(currentCardIcon);
        if(currentCardIconIndex == this.icons.length - 1){
            this.cardList[cardKey].icon = null;
            return;
        }
        this.cardList[cardKey].icon = this.icons[currentCardIconIndex + 1];
    }
}

window.listManager = new ListManager();