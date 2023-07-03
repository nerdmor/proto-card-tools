class MainController{
	constructor(){
	}

	callSetSelect(event){
		const cardKey = getCardKeyFromParent(event.target);
		if(!cardKey) return false;
		window.cardSetSelectModalHandler(
		    cardKey,
		    (setCode) => { // confirmCallback
		        window.listManager.setCardSelectedSet(cardKey, setCode);
		        window.drawCardList(window.listElement);
		    },
		    () => {} //cancelCallback
		);
		return true;
	}

	deleteCardFromList(event){
		event.target.setAttribute('mouse_down', '1');
		if(!event.target.hasAttribute('mouse_down')){
		    event.target.addEventListener('mouseup',  function(evt){
		        this.setAttribute('mouse_down', '0');
		    });
		}

		setTimeout((element) => {
		    if(element.getAttribute('mouse_down') == '1'){
		        const cardKey = getCardKeyFromParent(event.target);
		        if(cardKey){
		            window.listManager.removeCard(cardKey);
		            // TODO: change this to remove the element, not redraw the whole list
		            window.drawCardList(window.listElement);
		        }
		    }
		}, window.settings.deleteCooldown, event.target);

		return true;
	}

	nextStatus(event){
		const cardKey = getCardKeyFromParent(event.target);
		if(cardKey === null){
		    return false;
		}

		window.listManager.setCardStatus(cardKey, 'next');
		window.listManager.redrawCard(cardKey);
		return true;
	}

	cardQuantityButtons(event){
		const cardKey = getCardKeyFromParent(event.target);
		if(cardKey === null) return false;

		if(matchElementAndParent(event.target, '.table-card-minus')){
		    window.listManager.addCardQuantity(cardKey, -1);
		}else{
		    window.listManager.addCardQuantity(cardKey, 1)
		}

		window.listManager.redrawCard(cardKey);
		return true;
	}

	callCardDetails(event){
		const cardKey = getCardKeyFromParent(event.target);
		if(cardKey === null) return false;

		const html = window.listManager.drawCardDetails(cardKey);
		if(!html) return false;
		window.cardDetailsModal.call(html);
		return true;
	}

	formCardQuantitySubmit(event){
		event.preventDefault();

		const cardKey = getCardKeyFromParent(event.target);
		if(cardKey === null) return false;

		const quantityElement = event.target.querySelector('input.table-card-row-quantity');
		if(!quantityElement) return;
		var newQuantity = null;
		try {
		    newQuantity = parseInt(quantityElement.value);
		} catch(e) {
		    console.log(e);
		    return false;
		}
		window.listManager.setCardQuantity(cardKey, newQuantity);
		window.listManager.redrawCard(cardKey);
		return true;
	}

}