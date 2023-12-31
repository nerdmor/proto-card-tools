class MainController{
    static alertModels = {
        'alert': `<div %%elementid%% class="row alert alert-%%bstype%% alert-element" role="alert">%%content%%</div>`,
        'spinner': `<div class="spinner-border spinner-border-sm alert-element-spinner" role="status"><span class="visually-hidden">Loading...</span></div>`
    }



    constructor(){
        if(window.session.token) window.storage.ensureRemoteSettings();

        this.registerListeners();
        this.loadFromStorage();
        window.drawCardList(window.listElement);
    }

    registerListeners(){
        window.settings.registerTrigger('useWakeLock', (key, value) => window.wakeLock.setActive(value));
        window.settings.registerTrigger('all', (k, v) => { window.storage.saveSettings(window.settings.toString()) });

        window.listManager.changeCallback = async (lm) => {
            window.storage.syncItem('listManager', lm.toString())
            this.redrawStatusFilters(window.statusFilterElement);
        };
        window.listManager.loadSuccessCallback = async (html) => {window.listElement.innerHTML = html};

        window.session.registerChangeCallback((token) => this.drawSessionButtons(token));

        window.accountModal.registerCallbacks(
            async (updateData) => {return await window.session.updateUser(updateData)},  // saveCallback
            async () => {return await window.session.deleteUser()}
        );
    }

    async loadFromStorage(){
        const storedList = window.storage.getObject('listManager');
        if(storedList === null) return;
        window.listManager.loadFromStorage(storedList);
        if(storedList.id != null && window.session.token) this.loadFromBackend(storedList.id);
    }

    async loadFromBackend(listId){
        window.alertManager.modalAlert('Loading list...', true, false);

        const listData = await window.session.getList(listId);
        if(listData.success == false){
            window.alertManager.addAlert('Could not load list', false, 'danger', 2000);
            window.alertManager.dismissModalAlert();
            return;
        }

        if(window.listManager.loadFromBackend(listData.data.body) == true){
            window.storage.syncItem('listManager', window.listManager, true);
        }
        window.drawCardList(window.listElement);

        window.alertManager.dismissModalAlert();
    }

    async callListSelectModal(){
        const alertId = window.alertManager.addAlert('Loading lists...', true, 'info');
        const lists = await window.session.listLists();
        window.alertManager.removeAlert(alertId);
        if(lists === null){
            return;
        }
        if(lists.success == false){
            window.alertManager.addAlert('Could not load list of lists', false, 'danger', 2000);
            return;
        }

        window.listSelectModal.call(lists.data);
    }

    async selectList(listId){
        this.loadFromBackend(listId);
    }

    async deleteList(listId){
        const alertId = window.alertManager.addAlert('Deleting list...', true, 'info');
        const deleteResult = await session.deleteList(listId);
        window.alertManager.removeAlert(alertId);

        if(deleteResult.success == false){
            window.alertManager.addAlert('Could not delete list', false, 'danger', 2000);
            return;
        }

        this.callListSelectModal();
    }

    async toggleCollapseTop(setCollapsed=null){
        const headerCollapseButton = document.querySelector('#header-collapse');
        const headerExpandButton = document.querySelector('#header-expand');

        if(setCollapsed===null){
            setCollapsed = headerExpandButton.classList.contains('start-hidden');
        }

        if(setCollapsed){
            headerCollapseButton.classList.add('start-hidden');
            headerExpandButton.classList.remove('start-hidden');
            for(const element of document.querySelectorAll('.header-collapsible')){
                element.classList.add('header-collapsed');
            }
            await delay(450);
            for(const element of document.querySelectorAll('.header-collapsible')){
                element.classList.add('start-hidden');
            }
        }else{
            headerCollapseButton.classList.remove('start-hidden');
            headerExpandButton.classList.add('start-hidden');
            for(const element of document.querySelectorAll('.header-collapsible')){
                element.classList.remove('start-hidden');
                element.classList.remove('header-collapsed');
            }
        }
    }

    async quickAdd(){
        const quickValue = document.querySelector('#header-quick-add-txt').value;
        if(quickValue.length < 4) return;
        window.listManager.quickIngest(quickValue, (cardKey)=>{window.drawCardList(window.listElement);});
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

    deleteVisibleCards(event){
        if(!event.target.hasAttribute('mouse_down')){
            event.target.addEventListener('mouseup', function(evt){
                this.setAttribute('mouse_down', '0');
            });
            event.target.addEventListener('mouseleave', function(evt){
                this.setAttribute('mouse_down', '0');
            });
        }
        event.target.setAttribute('mouse_down', '1');

        setTimeout((element) => {
            if(element.getAttribute('mouse_down') == '1'){
                listManager.removeVisibleCards();
                window.drawCardList(window.listElement);
            }
        }, 3000, event.target);

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

    async importFromUrl(url){
        const response = await window.session.cardsFromUrl(url);
        if(response.success == false){
            window.alertManager.addAlert('Failed to import from url', false, 'danger', 1500);
            return;
        }
        window.listManager.ingestFromUrl(response.data);
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
        if(forceValue !== null){
            allChecked = !forceValue;
        }else{
            for(const element of targets){
                if(!element.checked){
                    allChecked = false;
                    break;
                }
            }
        }

        if(filterType == 'status'){
            window.listManager.setAllStatusFilters(!allChecked, false);
            this.redrawStatusFilters(window.statusFilterElement);
        }else{
            for(const element of targets){
                element.checked = !allChecked;
            }
        }

        if(suppressLoad == false) this.loadFiltersFromInterface();
    }

    async loadFiltersFromInterface(){
        window.listManager.emptyFilters(['color', 'rarity'], true);

        var filterValue = null;
        for(const filterType of ['color', 'rarity']){
            for(const filterBox of document.querySelectorAll(`.filter-check-${filterType}`)){
                if(filterBox.checked == false) continue;
                filterValue = filterBox.checked ? filterBox.value : null;
                window.listManager.addFilter(filterType, filterValue, true);
            }
        }

        if(window.settings.applyFiltersOnFilterChange){
            window.drawCardList(window.listElement);
        }
    }

    async processFilterChange(element){
        const filterChecked = element.checked ? true : false;
        const filterType = element.classList.contains('filter-check-color') ? 'color' :
                           element.classList.contains('filter-check-rarity') ? 'rarity' :
                           element.classList.contains('filter-check-status') ? 'status' : null;
        if(!filterType) return;

        var filterValue = element.value;
        if(filterType == 'status'){
            filterValue = parseInt(element.getAttribute('id').split('-').slice(-1)[0]);
            if(isNaN(filterValue)) filterValue = null;
        }

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
            if(filterType == 'status'){
                this.redrawStatusFilters(window.statusFilterElement);
                continue;
            }
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
        const drawType = element.value;
        if(window.settings.displayMode == drawType) return;

        window.settings.setValue('displayMode', drawType);
        window.listManager.setCardMode(drawType);
        window.drawCardList(window.listElement);
    }

    drawSort(selectElement, buttonIdPrefix, draw=false){
        if(window.listManager.sortDirection == 'asc'){
            document.querySelector(`#${buttonIdPrefix}desc`).classList.remove('btn-sort-selected');
            document.querySelector(`#${buttonIdPrefix}asc`).classList.add('btn-sort-selected');
        }else{
            document.querySelector(`#${buttonIdPrefix}asc`).classList.remove('btn-sort-selected');
            document.querySelector(`#${buttonIdPrefix}desc`).classList.add('btn-sort-selected');
        }
        selectElement.value = window.listManager.sortField;

        if(draw){
            window.drawCardList(window.listElement);
        }
    }

    setSortValue(selectElement, buttonIdPrefix){
        const sortDirection = document.querySelector(`#${buttonIdPrefix}desc`).classList.contains('btn-sort-selected') ? 'desc' : 'asc';
        if(window.listManager.setSort(selectElement.value, sortDirection)){
            window.drawCardList(window.listElement);
        }
        this.drawSort(selectElement, buttonIdPrefix, true);
    }

    setSortDirection(selectElement, buttonElement, buttonIdPrefix){
        const sortDirection = buttonElement.id.replaceAll(buttonIdPrefix, '');
        if(window.listManager.setSort(selectElement.value, sortDirection)){
            window.drawCardList(window.listElement);
        }
        this.drawSort(selectElement, buttonIdPrefix, true);
    }

    exportToClipboard(){
        var field = document.getElementById("transfer-area");

        const textValue = window.listManager.exportCardsToText().join('\n');
        field.value = textValue;

        field.select();
        field.setSelectionRange(0, 9999999); // For mobile devices
        navigator.clipboard.writeText(field.value);
        window.alertManager.addAlert('List copied to clipboard', false, 'warning', 1500);
    }

    async exportToImage(modal){
        if(!window.session.token){
            modal.dismiss();
            alertManager.addAlert('You need to be logged in for that', false, 'warning', 2000);
            return;
        }

        const payload = window.listManager.exportCardsToImage();
        const response = await window.session.makeListImage(payload);
        if(response.success != true){
            modal.dismiss();
            lertManager.addAlert(response.message, false, 'warning', 2000);
            return;
        }
        modal.showImageUrls(response.data);
    }

    clearData(){
        var confirmation = confirm('Are you sure you want to delete all local data?');
        if(confirmation === false) return;
        window.storage.clearAll();
        location.reload();
    }

    async drawSessionButtons(token){
        if(token === null || token == 0){
            document.getElementById('header-account-login').classList.remove('start-hidden');
            document.getElementById('header-account-dropdown').classList.add('start-hidden');
        }else{
            document.getElementById('header-account-login').classList.add('start-hidden');
            document.getElementById('header-account-dropdown').classList.remove('start-hidden');
        }
    }

    newList(){
        window.listManager.newList(window.settings.enabledStatus);
        window.drawCardList(window.listElement);
        window.storage.syncItem('listManager', window.listManager, true);
        window.listManager.callPropertiesModal();
    }

    forceRefresh(){
        window.listManager.loadQueueFromScryfall(
            null,  // scryfallClient
            null,  // successCallback
            (err) => {},  // errorCallback
            true  // forceRefresh
        );
    }

}

window.loadedModules.push('main-controller');