/* *****************************************************************************
 * Starters
 **************************************************************************** */
document.addEventListener('DOMContentLoaded', function () {
    window.listElement = document.querySelector('#second-row');
    window.scryfall = new Scryfall();
    window.listManager = new CardList();
    window.listManager.setCardMode('find');
}, false);


/* *****************************************************************************
 * Loading-modal handling functions
 **************************************************************************** */
window.loadQueueFromScryfallModalHandler = async function(){
    window.loadingCardsModal = new LoadingCardsModal(document.querySelector('#loading-cards-modal'));
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
    window.loadingSetsModal = new LoadingCardsModal(document.querySelector('#loading-sets-modal'), 'Loading sets');
    window.loadingSetsModal.call();
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
    const cardBody = window.listManager.drawSetSelect();
    if(cardBody === null){
        window.loadSetsModalHandler(() => {
            window.cardSetSelectModalHandler(cardKey, confirmCallback, cancelCallback)
        });
        return;
    }

    console.log('cardbody was OK, calling the modal!');
    window.cardSetSelectionModal = new CardSetSelectionModal(
        document.querySelector('#select-card-version-modal'), // domElement
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
    window.cardSetSelectionModal.call();
};

/* *****************************************************************************
 * Drawing a list of cards
 **************************************************************************** */
window.drawCardList = async function(element){
    window.listManager.setCardMode('table'); // debug
    window.loadSetsModalHandler(()=>{element.innerHTML = window.listManager.draw()});
}


/* *****************************************************************************
 * Bindings
 **************************************************************************** */
document.addEventListener('DOMContentLoaded', function(){
    // call card version selector from click in the correct elements
    document.querySelector('body').addEventListener('click', (evt) => {
        if(!evt.target.matches('.card-select-set')){
            return;
        }

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



    document.querySelector('#list-import-form').addEventListener('click', function(e){
        window.listManager.ingestText(document.querySelector('#list-input-textarea').value);
        window.loadQueueFromScryfallModalHandler();
    });

    document.querySelector('#archidekt-file').addEventListener('change',
        function(e){
            window.listManager.ingestArchidektFile(
                this.files,
                (cat, confCall, canCall) => {
                    confCall.params.okCallback = () => {window.loadQueueFromScryfallModalHandler()};
                    window.archidektFileImportModal = new ArchidektFileImportModal(document.querySelector('#archidekt-file-import-modal'), cat, confCall, canCall);
                    window.archidektFileImportModal.call();
                }
            );
        },
        false
    );

    document.querySelector('body').addEventListener('mousedown', function(event){
        if(!event.target.matches('.table-card-trash') && !event.target.parentElement.matches('.table-card-trash')){
            return;
        }

        event.target.setAttribute('mouse_down', '1');
        if(!event.target.hasAttribute('mouse_down')){
            event.target.addEventListener('mouseup',  function(evt){
                this.setAttribute('mouse_down', '0');
            });
        }


        setTimeout((element) => {
            if(element.getAttribute('mouse_down') == '1'){
                var parentElement = element.parentElement;
                while(!parentElement.hasAttribute('card_key') && parentElement.tagName != 'BODY'){
                    parentElement = parentElement.parentElement;
                }
                if(parentElement.hasAttribute('card_key')){
                    window.listManager.removeCard(parentElement.getAttribute('card_key'));
                    window.drawCardList(window.listElement);
                }
            }
        }, 1000, event.target)

    });


// end of bindings
}, false);