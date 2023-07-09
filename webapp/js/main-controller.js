class MainController{
    static filterModels = {
        'statusNullModel': `
            <div class="form-check form-check-inline filter-check-group">
              <input id="filters-status-null" class="form-check-input filter-check" type="checkbox" value="null">
              <label class="form-check-label" for="filters-status-null" aria-label="no status"><i class="bi bi-border"></i></label>
            </div>
        `,
        'statusModel': `
            <div class="form-check form-check-inline filter-check-group">
              <input id="filters-status-%%statusindex%%" class="form-check-input filter-check" type="checkbox" value="%%statusindex%%">
              <label class="form-check-label" for="filters-status-%%statusindex%%" aria-label="no status">%%statusicon%%</label>
            </div>
        `,
        'buttonModel': `
            <button id="filters-status-all" type="button" class="btn btn-sm btn-outline-secondary btn-extra-small"><i class="bi bi-check-all"></i></button>
        `
    };


    constructor(){
    }

    redrawStatusFilters(element){
        element.innerHTML = window.listManager.drawStatusFilters();
    }

    callSetSelect(event){
        const cardKey = getCardKeyFromParent(event.target);
        if(!cardKey) return false;
        window.mainController.cardSetSelectModalHandler(
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

        if(matchElementAndParent(event.target, ['.table-card-minus', '.finder-card-minus'])){
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
        console.log('formCardQuantitySubmit called');
        event.preventDefault();

        const cardKey = getCardKeyFromParent(event.target);
        console.log(`cardKey: ${cardKey}`);
        if(cardKey === null) return false;

        const quantityElement = event.target.querySelector('input.card-quantity-control');
        console.log(quantityElement);
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


    /* *****************************************************************************
     * Loading-modal handling functions
     **************************************************************************** */
    async loadQueueFromScryfallModalHandler(){
        window.loadingCardsModal.call();
        await delay(500);

        window.listManager.setScryfallClient(window.scryfall);
        window.listManager.loadQueueFromScryfall(
            window.scryfall,
            (p) => {window.loadingCardsModal.update(p.typedName)},
            async (p) => {
                window.loadingCardsModal.dismiss(()=>window.drawCardList(window.listElement));
            }
        );
    }

    async loadSetsModalHandler(callback){
        if(!window.listManager.hasNullSets()){
            callback();
            return;
        };
        window.loadingSetsModal.call('Loading Sets');
        await delay(500);
        window.listManager.loadSetData(
            window.scryfall,
            (setCode) => {window.loadingSetsModal.update(`set ${setCode.toUpperCase()}`)},
            async () => {
                await delay(200);
                window.loadingSetsModal.dismiss(callback());
            }
        );
    }

    async cardSetSelectModalHandler(cardKey, confirmCallback, cancelCallback){
        const cardBody = window.listManager.drawSetSelect(cardKey);
        if(cardBody === null){
            window.mainController.loadSetsModalHandler(() => {
                window.mainController.cardSetSelectModalHandler(cardKey, confirmCallback, cancelCallback)
            });
            return;
        }

        window.cardSetSelectionModal.call(
            cardBody,
            '.card-select-image', //selectionElementQuery
            'set_code', //selectionElementPropName
            '.select-card-wrapper', //wrapperElementQuery
            'select-card-selected', //selectedClass
            (setCode) => {
                console.log(`callback called with setCode = ${setCode}`);
                confirmCallback(setCode);}, //confircallback
            () => {cancelCallback()} // cancelCallback
        );
    }

    async filterSelectAll(filterType, suppressLoad=false){
        if(filterType == 'all'){
            await this.filterSelectAll('color', true);
            await this.filterSelectAll('rarity', true);
            filterType = 'status';
        }

        const targets = document.querySelectorAll(`.filter-check-${filterType}`);
        if(!targets) return;
        var allChecked = true;
        for(const element of targets){
            if(!element.checked){
                allChecked = false;
                break;
            }
        }

        for(const element of targets){
            element.checked = !allChecked;
        }
        if(!suppressLoad) this.loadFiltersFromInterface()
    }

    async loadFiltersFromInterface(){
        window.listManager.resetFilters();
        var filterValue = null;

        for(const filterType of ['color', 'rarity', 'status']){
            for(const filterBox of document.querySelectorAll(`.filter-check-${filterType}`)){
                filterValue = filterBox.checked ? filterBox.value : null;
                if(filterValue) window.listManager.addFilter(filterType, filterValue);
            }
        }

        if(window.settings.applyFiltersOnFilterChange){
            window.drawCardList(window.listElement);
        }
    }

    async processFilterChange(element){
        const filterValue = element.checked ? element.value : null;
        const filterType = element.classList.contains('filter-check-color') ? 'color' :
                           element.classList.contains('filter-check-rarity') ? 'rarity' :
                           element.classList.contains('filter-check-status') ? 'status' : null;
        if(!filterType) return;
        if(filterValue){
            window.listManager.addFilter(filterType, filterValue);
        }else{
            window.listManager.removeFilter(filterType, filterValue);
        }

        if(window.settings.applyFiltersOnFilterChange){
            window.drawCardList(window.listElement);
        }
    }

    changeDrawType(element){
        const drawType = element.checked ? 'find': 'table';
        window.settings.setValue('displayMode', drawType);
        window.listManager.setCardMode(drawType);
        window.drawCardList(window.listElement);
    }

}