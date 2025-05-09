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
}

window.listManager = new ListManager();