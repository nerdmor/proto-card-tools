/* *****************************************************************************
 * Starters
 **************************************************************************** */
document.addEventListener('DOMContentLoaded', function () {
    window.listElement = document.querySelector('#second-row');

    // global managers
    window.scryfall = new Scryfall();
    window.listManager = new CardList(window.settings.enabledStatus, 'table');

    // modal handlers
    window.loadingCardsModal = new LoadingCardsModal(document.querySelector('#loading-cards-modal'));
    window.loadingSetsModal = new LoadingCardsModal(document.querySelector('#loading-sets-modal'));
    window.archidektFileImportModal = new ArchidektFileImportModal(document.querySelector('#archidekt-file-import-modal'));
    window.cardSetSelectionModal = new CardSetSelectionModal(document.querySelector('#select-card-version-modal'));

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
    // call card version selector from click in the correct elements
    document.querySelector('body').addEventListener('click', (evt) => {
        if(!matchElementAndParent(evt.target, ['.card-select-set'])) return;

        var parentElement = evt.target.parentElement;
        while(!parentElement.hasAttribute('card_key')){
            parentElement = parentElement.parentElement;
            if(parentElement.tagName == 'BODY'){
                parentElement = null;
                break;
            }
        }

        if(!parentElement){
            return;
        }

        const cardKey = parentElement.getAttribute('card_key');
        window.cardSetSelectModalHandler(
            cardKey,
            (setCode) => { // confirmCallback
                window.listManager.setCardSelectedSet(cardKey, setCode);
                window.drawCardList(window.listElement);
            },
            () => {} //cancelCallback
        );
    });


    // load cards from text area
    document.querySelector('#list-import-form').addEventListener('click', function(e){
        window.listManager.ingestText(document.querySelector('#list-input-textarea').value);
        window.loadQueueFromScryfallModalHandler();
        // TODO: add error handling
    });

    // load archidekt file
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

    // card deletion, with cooldown :)
    document.querySelector('body').addEventListener('mousedown', function(event){
        if(!matchElementAndParent(event.target, ['.table-card-trash'])) return;

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
        }, window.settings.deleteCooldown, event.target)

    });

    // next status
    document.querySelector('body').addEventListener('click', function(event){
        if(!matchElementAndParent(event.target, ['.card-status-button'])) return;

        const cardKey = getCardKeyFromParent(event.target);
        if(cardKey === null){
            return;
        }

        window.listManager.setCardStatus(cardKey, 'next');
        window.listManager.redrawCard(cardKey);
    });

    // card quantity buttons
    document.querySelector('body').addEventListener('click', function(event){
        if(!matchElementAndParent(event.target, ['.table-card-minus', '.table-card-plus'])) return;

        const cardKey = getCardKeyFromParent(event.target);
        if(cardKey === null){ return; }

        if(matchElementAndParent(event.target, '.table-card-minus')){
            window.listManager.addCardQuantity(cardKey, -1);
        }else{
            window.listManager.addCardQuantity(cardKey, 1)
        }

        window.listManager.redrawCard(cardKey);
    });

    // card quantity form
    document.querySelector('body').addEventListener('submit', function(event){
        if(!matchElementAndParent(event.target, ['.table-card-quantity-form'])) return;
        event.preventDefault();

        const cardKey = getCardKeyFromParent(event.target);
        if(cardKey === null){ return; }

        const quantityElement = event.target.querySelector('input.table-card-row-quantity');
        if(!quantityElement) return;
        var newQuantity = null;
        try {
            newQuantity = parseInt(quantityElement.value);
        } catch(e) {
            console.log(e);
            return;
        }
        window.listManager.setCardQuantity(cardKey, newQuantity);
        window.listManager.redrawCard(cardKey);
    });


// end of bindings
}, false);