/* *****************************************************************************
 * Draws a list of cards
 **************************************************************************** */

const localDelay = (ms) => {return new Promise(res => setTimeout(res, ms))};

window.drawCardList = async function(element){
    element.innerHTML = window.listManager.draw();
}

// ensure that we are in https if not in a local address
if(window.location.protocol == 'http:'){
    const domain_start = window.location.hostname.split('.')[0];
    if(domain_start != '127' && domain_start != '192'){
        window.location.replace(`https${window.location.href.substring(4)}`);
    }
}


document.addEventListener('DOMContentLoaded', async function() {
    const moduleList = ['wakelock', 'alert', 'cardlist', 'constants', 'functions', 'main-controller', 'modals', 'protocard', 'scryfall', 'settings', 'storage', 'session', 'momentjs', 'moment-timezone'];
    var allModulesLoaded = false;
    while(allModulesLoaded == false){
        await localDelay(50);
        allModulesLoaded = true;
        for(const mod of moduleList){
            if(window.loadedModules.includes(mod)) continue;
            allModulesLoaded = false;
            break;
        }
    }


    /* *****************************************************************************
     * Starters
     **************************************************************************** */

    // common elements
    window.listElement = document.getElementById('draw-area');
    window.statusFilterElement = document.getElementById('filter-status-wrapper');
    window.alertElement = document.getElementById('alert-row');


    // storage, so we can load everything from there
    window.storage = new StorageManager();
    window.session = new SessionManager(window.constants.domain, window.storage);


    // settings
    window.settings = new SettingsManager(window.storage.getObject('settings'));

    // modal handlers
    window.listSelectModal = new ListSelectModal(
        document.getElementById('list-select-modal'),  // domElement
        document.getElementById('list-select-modal-body'),  // modalBodyElement
        async (listId) => await window.mainController.selectList(listId),  // selectListCallback
        async (listId) => await window.mainController.deleteList(listId)  // deleteListCallback
    );
    window.textLoadModal = new TextLoadModal(document.querySelector('#text-entry-modal'), (txt) => window.mainController.ingestTextFromModal(txt));
    window.settingsModal = new SettingsModal(
        document.querySelector('#settings-modal'),
        () => {window.drawCardList(window.listElement)},  // redrawCallback
        {
            'cardImgQuality': document.querySelector('#settings-select-cardImgQuality'),
            'deleteCooldown': document.querySelector('#settings-text-deleteCooldown'),
            'sldIsSpecial': document.querySelector('#settings-checkbox-sldIsSpecial'),
            'applyFiltersOnFilterChange': document.querySelector('#settings-checkbox-applyFiltersOnFilterChange'),
            'applyFiltersOnStatusChange': document.querySelector('#settings-checkbox-applyFiltersOnStatusChange'),
            'useWakeLock': document.querySelector('#settings-checkbox-useWakeLock')
        }
    );
    window.accountModal = new AccountModal(
        document.getElementById('account-modal'),  // domElement
        document.getElementById('user-modal-delete'),  // deleteButtonElement
        document.getElementById('user-modal-save'),  // saveButtonElement
        document.getElementById('user-modal-username'),  // usernameElement
        document.getElementById('user-modal-createdat'),  // createdAtElement
        window.session  // sessionManager
    );
    window.listExportModal = new ListExportModal(
        document.getElementById('list-export-modal'), // domElement
        document.getElementById('list-export-modal-clipboard'),  // clipboardButtonElement
        function(){ window.mainController.exportToClipboard(); },  // clipboardCallback
        document.getElementById('list-export-modal-image'),  // imageButtonElement
        function(modal){ window.mainController.exportToImage(modal); } // imageCallback
    );
    window.cardsFromUrlModal = new ImportCardsFromUrlModal(
        document.getElementById('import-card-url-modal'),  // domElement
        document.getElementById('import-card-url-form'),  // formElement
        document.getElementById('import-card-url-txt'),  // urlTxtElement
        (url) => {window.mainController.importFromUrl(url)}  // urlEnterCallback
    );

    // global managers
    window.wakeLock = new WakeLockController();
    window.scryfall = new Scryfall();
    window.alertManager = new AlertManager(window.alertElement, document.getElementById('alert-modal'));
        window.session.registerAlertManager(window.alertManager);

    window.listManager = new CardList(window.settings.enabledStatus, window.settings.displayMode);
    window.listManager.setAlertManager(window.alertManager);
    window.listManager.initModals(
        new LoadingCardsModal(document.querySelector('#loading-cards-modal')),
        new LoadingCardsModal(document.querySelector('#loading-sets-modal')),
        new CardSetSelectionModal(document.querySelector('#select-card-version-modal')),
        new CardDetailsModal(document.querySelector('#card-details-modal')),
        new LoadErrorModal(
                document.querySelector('#import-error-modal'),
                document.querySelector('#import-error-table-body'),
                document.querySelector('#import-error-text'),
                document.querySelector('#import-error-copy')
            ),
        new ListPropertiesModal(
                document.querySelector('#list-properties-modal'),
                document.querySelector('#list-properties-name'),
                document.querySelector('#list-properties-public'),
                document.querySelector('#list-properties-last-update'),
                document.querySelector('#list-properties-status-list'),
                document.querySelector('#list-properties-new-status-form'),
                document.querySelector('#list-properties-new-status-input'),
                document.querySelector('#list-properties-alert'),
                document.querySelector('#list-properties-save')
            ),
        new FileSelectModal(
                document.querySelector('#file-import-modal'),  // domElement
                document.querySelector('#file-import-input'),  // fileImportInputElement
                document.querySelector('#file-import-modal-ok'),  // fileImportButtonElement
                'file-import-type',
                'file-import-type-'
            ),
        new ArchidektFileImportModal(
                document.querySelector('#archidekt-file-import-modal'),
                document.querySelector('#archidekt-file-modal-ok'),  // okButonElement
                document.querySelector('#archidekt-file-modal-switches'), // switchWrapperElement
                document.querySelector('#archidekt-file-modal-all'),  // selectAllCategoriesElement
                document.querySelector('#archidekt-file-modal-none')  // selectNoCategoriesElement
            )
    );
    window.listManager.setScryfallClient(window.scryfall);

    window.mainController = new MainController();

    // drawing/setting dynamic things
    window.mainController.redrawStatusFilters(window.statusFilterElement);
    document.getElementById('header-display-select').value = window.settings.displayMode;
    window.mainController.setInterfaceFilters();



    /* *****************************************************************************
     * Bindings
     * ************************************************************************** */

    // future element bindings
    document.querySelector('body').addEventListener('click', (event) => {
        // call set selector
        if(matchElementAndParent(event.target, ['.card-select-set'])) return window.mainController.callSetSelect(event);

        // next status
        if(matchElementAndParent(event.target, ['.card-status-button', '.finder-card-image', '.finder-card-status'])) return window.mainController.nextStatus(event);

        // card quantity buttons
        if(matchElementAndParent(event.target, ['.table-card-minus', '.table-card-plus', '.finder-card-minus', '.finder-card-plus'])) return window.mainController.cardQuantityButtons(event);

        // card details
        if(matchElementAndParent(event.target, ['.table-card-details', '.finder-card-details'])) return window.mainController.callCardDetails(event);
    });

    document.querySelector('#filter-header').addEventListener('change', (event) => {
        // filters checkboxes
        if(event.target.matches('.filter-check')) return window.mainController.processFilterChange(event.target);
    });

    document.querySelector('body').addEventListener('mousedown', function(event){
        // card deletion, with cooldown :)
        if(matchElementAndParent(event.target, ['.table-card-trash', '.finder-card-trash'])) return window.mainController.deleteCardFromList(event);
    });

    document.querySelector('body').addEventListener('submit', function(event){
        // card quantity form
        if(matchElementAndParent(event.target, ['.table-card-quantity-form', '.finder-card-quantity-form'])) return window.mainController.formCardQuantitySubmit(event);
    });


    // fixed element bindings **************************************************

    // top collapse/show
    for(const btn of document.querySelectorAll('.btn-collapse')){
        btn.addEventListener('click', function(){ window.mainController.toggleCollapseTop(); });
    }
    const resizeObserver = new ResizeObserver((entries) => {
        if(entries[0].contentRect.width >= 960) window.mainController.toggleCollapseTop(false);
    });
    resizeObserver.observe(document.querySelector("body"));

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
    // document.querySelector('#header-display-toggle').addEventListener('change', function(event){
    //     window.mainController.changeDrawType(event.target);
    // });
    document.getElementById('header-display-select').addEventListener('change', function(event){
        window.mainController.changeDrawType(event.target);
    });

    // settings button
    document.querySelector('#header-settings').addEventListener('click', function(event){
        window.settingsModal.call();
    });

    // account buttons
    document.getElementById('header-account-account').addEventListener('click', function(event){
        window.accountModal.call();
    });
    document.getElementById('header-account-logout').addEventListener('click', function(event){
        window.session.logout();
    });



    // call text load modal
    document.querySelector('#header-import-text').addEventListener('click', function(event){
        window.textLoadModal.call();
    });

    // call file load modal
    document.querySelector('#header-import-file').addEventListener('click', function(event){
        window.listManager.callFileSelectModal(
            async (html) => {window.listElement.innerHTML = html;}
        );
    });

    // new list
    document.getElementById('header-list-new').addEventListener('click', function(event){
        window.mainController.newList();
    });

    // list settings modal
    document.querySelector('#header-list-properties').addEventListener('click', function(event){
        window.listManager.callPropertiesModal();
    });

    // open list
    document.getElementById('header-list-open').addEventListener('click', function(event){
        window.mainController.callListSelectModal();
    });

    // export menu
    document.getElementById('header-list-export').addEventListener('click', function(){ window.listExportModal.call(); });

    // import from url
    document.getElementById('header-import-url').addEventListener('click', function(){
        if(!window.session.token){
            alertManager.addAlert('You need to be logged in for that', false, 'warning', 2000);
            return;
        }
        window.cardsFromUrlModal.call()
    });

    // quickadd
    document.querySelector('#header-quick-add-form').addEventListener('submit', function(event){
        event.preventDefault();
        window.mainController.quickAdd();
    });

    // sorting
    document.querySelector('#header-sort').addEventListener('change', function(event) {
        window.mainController.setSortValue(event.target, 'header-sort-');
    });
    for(const element of document.querySelectorAll('.btn-sort')){
        element.addEventListener('click', function(event) {
            const target = matchElementAndParent(event.target, ['.btn-sort']);
            window.mainController.setSortDirection(document.querySelector('#header-sort'), target, 'header-sort-');
        });
    }

    // trash icon
    document.getElementById('header-trash').addEventListener('mousedown', function(event){
        window.mainController.deleteVisibleCards(event);
    });

    // help menu nuke
    document.getElementById('header-help-clear').addEventListener('click', function(event){
        window.mainController.clearData();
    });

    // help menu refresh
    document.getElementById('header-help-refresh').addEventListener('click', function(event){
        window.mainController.forceRefresh();
    });

    //login
    document.getElementById('header-account-login').addEventListener('click', function(event){
        window.session.requestLogin();
    });


    // DEBUG login
    // window.loginModal = new bootstrap.Modal('#login-modal');
    // document.getElementById('header-account-login').addEventListener('click', function(event){
    //     window.loginModal.show();
    // });


// end of bindings
}, false);