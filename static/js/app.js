/* *****************************************************************************
 * Draws a list of cards
 **************************************************************************** */
window.drawCardList = async function(element){
    window.mainController.loadSetsModalHandler(()=>{element.innerHTML = window.listManager.draw()});
}


document.addEventListener('DOMContentLoaded', function () {
    /* *****************************************************************************
     * Starters
     **************************************************************************** */

    // settings
    window.settings = new SettingsManager();

    // common elements
    window.listElement = document.querySelector('#second-row');  // DEBUG
    window.statusFilterElement = document.querySelector('#filter-status-wrapper');

    // global managers
    window.scryfall = new Scryfall();
    window.listManager = new CardList(window.settings.enabledStatus, window.settings.displayMode); // TODO: change the list print type
    window.mainController = new MainController();

    // modal handlers
    window.loadingCardsModal = new LoadingCardsModal(document.querySelector('#loading-cards-modal'));
    window.loadingSetsModal = new LoadingCardsModal(document.querySelector('#loading-sets-modal'));
    window.archidektFileImportModal = new ArchidektFileImportModal(document.querySelector('#archidekt-file-import-modal'));
    window.cardSetSelectionModal = new CardSetSelectionModal(document.querySelector('#select-card-version-modal'));
    window.cardDetailsModal = new CardDetailsModal(document.querySelector('#card-details-modal'));
    window.settingsModal = new SettingsModal(document.querySelector('#settings-modal'), {
        'cardImgQuality': document.querySelector('#settings-select-cardImgQuality'),
        'deleteCooldown': document.querySelector('#settings-text-deleteCooldown'),
        'sldIsSpecial': document.querySelector('#settings-checkbox-sldIsSpecial'),
        'applyFiltersOnFilterChange': document.querySelector('#settings-checkbox-applyFiltersOnFilterChange'),
        'applyFiltersOnStatusChange': document.querySelector('#settings-checkbox-applyFiltersOnStatusChange')
    });


    // drawing/setting dynamic things
    window.mainController.redrawStatusFilters(window.statusFilterElement);
    document.querySelector('#header-display-toggle').checked = window.settings.displayMode == 'find' ? true : false;
    window.mainController.setInterfaceFilters();



    /* *****************************************************************************
     * Bindings
     **************************************************************************** */
    document.querySelector('body').addEventListener('click', (event) => {
        // call set selector
        if(matchElementAndParent(event.target, ['.card-select-set'])) return window.mainController.callSetSelect(event);

        // next status
        if(matchElementAndParent(event.target, ['.card-status-button'])) return window.mainController.nextStatus(event);

        // card quantity buttons
        if(matchElementAndParent(event.target, ['.table-card-minus', '.table-card-plus', '.finder-card-minus', '.finder-card-plus'])) return window.mainController.cardQuantityButtons(event);

        // card details
        if(matchElementAndParent(event.target, ['.table-card-details', '.finder-card-details'])) return window.mainController.callCardDetails(event);
    });

    document.querySelector('body').addEventListener('change', (event) => {
        // filters checkboxes
        if(event.target.matches('.filter-check')) return window.mainController.processFilterChange(event.target);
    });

    // card deletion, with cooldown :)
    document.querySelector('body').addEventListener('mousedown', function(event){
        if(matchElementAndParent(event.target, ['.table-card-trash'])) return window.mainController.deleteCardFromList(event);
    });

    // card quantity form
    document.querySelector('body').addEventListener('submit', function(event){
        if(matchElementAndParent(event.target, ['.table-card-quantity-form', '.finder-card-quantity-form'])) return window.mainController.formCardQuantitySubmit(event);
    });

    // filters 'select all'
    document.querySelector('#filters-color-all').addEventListener('click', function(){
        window.mainController.filterSelectAll('color');
    });
    document.querySelector('#filters-rarity-all').addEventListener('click', function(){
        window.mainController.filterSelectAll('rarity');
    });
    document.querySelector('#filters-status-all').addEventListener('click', function(){
        window.mainController.filterSelectAll('status');
    });

    // change draw type
    document.querySelector('#header-display-toggle').addEventListener('change', function(event){
        window.mainController.changeDrawType(event.target);
    });

    // settings button
    document.querySelector('#header-settings').addEventListener('click', function(event){
        window.settingsModal.call();
    });

    // quickadd
    document.querySelector('#header-quick-add-form').addEventListener('submit', function(event){
        const quickValue = document.querySelector('#header-quick-add-txt').value;
        if(quickValue.length < 4) return;
        window.listManager.ingestText(quickValue);
        window.mainController.loadQueueFromScryfallModalHandler();
    });


    // DEBUG load cards from text area
    document.querySelector('#list-import-form').addEventListener('click', function(e){
        window.listManager.ingestText(document.querySelector('#list-input-textarea').value);
        window.mainController.loadQueueFromScryfallModalHandler();
        // TODO: add error handling
    });

    // DEBUG load archidekt file
    // TODO: add handling of other kinds of files. Split logic from cardlist
    document.querySelector('#archidekt-file').addEventListener('change',
        function(e){
            window.listManager.ingestArchidektFile(
                this.files,
                (cat, confCall, canCall) => {
                    confCall.params.okCallback = () => {window.mainController.loadQueueFromScryfallModalHandler()};
                    window.archidektFileImportModal.call(cat, confCall, canCall);
                }
            );
        },
        false
    );


// end of bindings
}, false);