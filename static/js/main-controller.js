class MainController{
    static alertModels = {
        'alert': `<div %%elementid%% class="row alert alert-%%bstype%% alert-element" role="alert">%%content%%</div>`,
        'spinner': `<div class="spinner-border spinner-border-sm alert-element-spinner" role="status"><span class="visually-hidden">Loading...</span></div>`
    }



    constructor(){
        this.collapsedTop = false;

        // registering listeners
        window.settings.registerTrigger('useWakeLock', (value) => window.wakeLock.setActive(value));

    }

    toggleCollapseTop(setCollapsed = null){
        if(setCollapsed !== null){
            this.collapsedTop = !setCollapsed;
        }else if(this.collapsedTop === null) return;

        if(this.collapsedTop){
            this.collapsedTop = null;
            document.querySelector('#header-collapse').classList.remove('start-hidden');
            document.querySelector('#header-expand').classList.add('start-hidden');
            for(const element of document.querySelectorAll('.header-collapsible')){
                element.classList.remove('start-hidden');
            }
            this.collapsedTop = false;
        }else{
            this.collapsedTop = null;
            document.querySelector('#header-collapse').classList.add('start-hidden');
            document.querySelector('#header-expand').classList.remove('start-hidden');
            for(const element of document.querySelectorAll('.header-collapsible')){
                element.classList.add('start-hidden');
            }
            this.collapsedTop = true;
        }
    }

    quickAdd(){
        const quickValue = document.querySelector('#header-quick-add-txt').value;
        if(quickValue.length < 4) return;
        window.listManager.ingestText(quickValue);
        window.mainController.loadQueueFromScryfallModalHandler();
    }

    redrawStatusFilters(element){
        element.innerHTML = window.listManager.drawStatusFilters();
    }

    callSetSelect(event){
        const cardKey = getCardKeyFromParent(event.target);
        if(!cardKey) return false;
        window.listManager.callCardSelectModal(
            cardKey,
            '.card-select-image', //selectionElementQuery
            'set_code', //selectionSetElementPropName
            'collector_number', //selectionNumElementPropName
            '.select-card-wrapper', //wrapperElementQuery
            'select-card-selected', //selectedClass
            (setCode) => {window.drawCardList(window.listElement);}, // confirmCallback
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
        window.listManager.callCardDetails(cardKey);
        return true;
    }

    formCardQuantitySubmit(event){
        event.preventDefault();

        const cardKey = getCardKeyFromParent(event.target);
        if(cardKey === null) return false;

        const quantityElement = event.target.querySelector('input.card-quantity-control');
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
        window.listManager.loadQueueFromScryfall(
            null,  // scryfallClient
            null,  // successCallback
            (err) => {}  // errorCallback
        );
    }

    ingestTextFromModal(textValue){
        window.listManager.ingestText(textValue);
        this.loadQueueFromScryfallModalHandler();
    }

    async filterSelectAll(filterType, suppressLoad=false, forceValue=null){
        if(filterType == 'all'){
            await this.filterSelectAll('color', true, forceValue);
            await this.filterSelectAll('rarity', true, forceValue);
            filterType = 'status';
        }

        const targets = document.querySelectorAll(`.filter-check-${filterType}`);
        if(!targets) return;

        var allChecked = true;
        if(forceValue === null){
            for(const element of targets){
                if(!element.checked){
                    allChecked = false;
                    break;
                }
            }
        }else{
            allChecked = !forceValue;
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
        const filterChecked = element.checked ? true : false;
        const filterValue = element.value;
        const filterType = element.classList.contains('filter-check-color') ? 'color' :
                           element.classList.contains('filter-check-rarity') ? 'rarity' :
                           element.classList.contains('filter-check-status') ? 'status' : null;
        if(!filterType) return;


        if(filterChecked){
            window.listManager.addFilter(filterType, filterValue);
        }else{
            window.listManager.removeFilter(filterType, filterValue);
        }

        if(window.settings.applyFiltersOnFilterChange){
            window.drawCardList(window.listElement);
        }
    }

    async setInterfaceFilters(){
        var targetElement = null;
        for(const filterType of Object.keys(window.listManager.filters)){
            if(window.listManager.filters[filterType].length == 0){
                await this.filterSelectAll(filterType, true, true);
            }else{
                await this.filterSelectAll(filterType, true, false);
                for(const filterValue of window.listManager.filters[filterType]){
                    targetElement = document.querySelector(`.filter-check-${filterType}[value="${filterValue}"]`);
                    if(targetElement){
                        targetElement.checked = true;
                    }
                }
            }
        }
    }

    changeDrawType(element){
        const drawType = element.checked ? 'find': 'table';
        window.settings.setValue('displayMode', drawType);
        window.listManager.setCardMode(drawType);
        window.drawCardList(window.listElement);
    }

    drawSort(selectElement, buttonIdPrefix){
        if(window.listManager.sortDirection == 'asc'){
            document.querySelector(`#${buttonIdPrefix}desc`).classList.remove('btn-sort-selected');
            document.querySelector(`#${buttonIdPrefix}asc`).classList.add('btn-sort-selected');
        }else{
            document.querySelector(`#${buttonIdPrefix}asc`).classList.remove('btn-sort-selected');
            document.querySelector(`#${buttonIdPrefix}desc`).classList.add('btn-sort-selected');
        }
        selectElement.value = window.listManager.sortField;
    }

    setSortValue(selectElement, buttonIdPrefix){
        const sortDirection = document.querySelector(`#${buttonIdPrefix}desc`).classList.contains('btn-sort-selected') ? 'desc' : 'asc';
        if(window.listManager.setSort(selectElement.value, sortDirection)){
            window.drawCardList(window.listElement);
        }
        this.drawSort(selectElement, buttonIdPrefix);
    }

    setSortDirection(selectElement, buttonElement, buttonIdPrefix){
        const sortDirection = buttonElement.id.replaceAll(buttonIdPrefix, '');
        if(window.listManager.setSort(selectElement.value, sortDirection)){
            window.drawCardList(window.listElement);
        }
        this.drawSort(selectElement, buttonIdPrefix);
    }

}