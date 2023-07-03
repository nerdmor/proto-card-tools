/* *****************************************************************************
 * Starters
 **************************************************************************** */
document.addEventListener('DOMContentLoaded', function () {
    window.listElement = document.querySelector('#second-row');

    // global managers
    window.scryfall = new Scryfall();
    window.listManager = new CardList(window.settings.enabledStatus, 'table');
    window.mainController = new MainController();

    // modal handlers
    window.loadingCardsModal = new LoadingCardsModal(document.querySelector('#loading-cards-modal'));
    window.loadingSetsModal = new LoadingCardsModal(document.querySelector('#loading-sets-modal'));
    window.archidektFileImportModal = new ArchidektFileImportModal(document.querySelector('#archidekt-file-import-modal'));
    window.cardSetSelectionModal = new CardSetSelectionModal(document.querySelector('#select-card-version-modal'));
    window.cardDetailsModal = new CardDetailsModal(document.querySelector('#card-details-modal'));

}, false);


/* *****************************************************************************
 * Loading-modal handling functions
 **************************************************************************** */
window.loadQueueFromScryfallModalHandler = async function(){
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
};

window.loadSetsModalHandler = async function(callback){
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
};

window.cardSetSelectModalHandler = async function(cardKey, confirmCallback, cancelCallback){
    const cardBody = window.listManager.draw('sets');
    if(cardBody === null){
        window.loadSetsModalHandler(() => {
            window.cardSetSelectModalHandler(cardKey, confirmCallback, cancelCallback)
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
};

/* *****************************************************************************
 * Drawing a list of cards
 **************************************************************************** */
window.drawCardList = async function(element){
    window.loadSetsModalHandler(()=>{element.innerHTML = window.listManager.draw()});
}


/* *****************************************************************************
 * Bindings
 **************************************************************************** */
document.addEventListener('DOMContentLoaded', function(){
    document.querySelector('body').addEventListener('click', (event) => {
        // call set selector
        if(matchElementAndParent(event.target, ['.card-select-set'])) return window.mainController.callSetSelect(event);

        // next status
        if(matchElementAndParent(event.target, ['.card-status-button'])) return window.mainController.nextStatus(event);

        // card quantity buttons
        if(matchElementAndParent(event.target, ['.table-card-minus', '.table-card-plus'])) return window.mainController.cardQuantityButtons(event);

        // card details
        if(matchElementAndParent(event.target, ['.table-card-details'])) return window.mainController.callCardDetails(event);
    });

    // card deletion, with cooldown :)
    document.querySelector('body').addEventListener('mousedown', function(event){
        if(matchElementAndParent(event.target, ['.table-card-trash'])) return window.mainController.deleteCardFromList(event);
    });

    // card quantity form
    document.querySelector('body').addEventListener('submit', function(event){
        if(matchElementAndParent(event.target, ['.table-card-quantity-form'])) return window.mainController.formCardQuantitySubmit(event);
    });


    // DEBUG load cards from text area
    document.querySelector('#list-import-form').addEventListener('click', function(e){
        window.listManager.ingestText(document.querySelector('#list-input-textarea').value);
        window.loadQueueFromScryfallModalHandler();
        // TODO: add error handling
    });

    // DEBUG load archidekt file
    // TODO: add handling of other kinds of files. Split logic from cardlist
    document.querySelector('#archidekt-file').addEventListener('change',
        function(e){
            window.listManager.ingestArchidektFile(
                this.files,
                (cat, confCall, canCall) => {
                    confCall.params.okCallback = () => {window.loadQueueFromScryfallModalHandler()};
                    window.archidektFileImportModal.call(cat, confCall, canCall);
                }
            );
        },
        false
    );


// end of bindings
}, false);