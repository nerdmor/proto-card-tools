class ProtoModal{
    constructor(domElement){
        this.modal = null;
        this.html = '';
        this.element = domElement;
        this.options = {}
        this.hiddenCallback = null;

        this.element.addEventListener('hidden.bs.modal', (e) => this._afterHidden());
    }

    draw(){
        this.element.innerHTML = this.html;
    }

    call(){
        if(this.html == '' || this.html === null){
            this.draw();
        }
        if(this.modal === null){
            this.modal = new bootstrap.Modal(this.element, this.options);
        }
        this.modal.show();
    }

    dismiss(callback=null){
        if(callback) this.hiddenCallback = callback;
        this.modal.hide();
    }

    async _afterHidden(){
        if(this.hiddenCallback){
            if(this.hiddenCallback.constructor.name === 'AsyncFunction'){
                await this.hiddenCallback();
            }else{
                this.hiddenCallback();
            }
        }
        this.hiddenCallback = null;
        this.html = '';
        this.element.innerHTML = '';
        this.element.style.display = 'none';
    }
}

class LoadingCardsModal extends ProtoModal{
    static modalModel = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-5">%%modal-title%%</h1>
          </div>
          <div id="loading-cards-modal-body" class="modal-body row">
            <div class="col-2">
                <div class="spinner-border text-primary loading-cards-modal-spinner" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            <div class="col-10">
                <p class="loading-cards-modal-text">%%starterText%%</p>
            </div>
          </div>
        </div>
    </div>
    `;

    static cardNameModel = `
        loading <strong>%%cardname%%</strong>
    `;

    constructor(domElement){
        super(domElement);
        this.options = {'backdrop': 'static', 'focus': true, 'keyboard': false};
    }

    call(title=null, starterText=null){
        this.title = title || 'Loading cards';
        this.starterText = starterText || 'loading...';
        super.call();
    }



    draw(){
        this.html = LoadingCardsModal.modalModel.replaceAll('%%modal-title%%', this.title)
                                                .replaceAll('%%starterText%%', this.starterText);
        super.draw();
    }

    update(cardName){
        if(!this.modal) return;
        for(const e of document.querySelectorAll('.loading-cards-modal-text')){
            e.innerHTML = LoadingCardsModal.cardNameModel.replaceAll('%%cardname%%', cardName);
        }
    }

}

class ArchidektFileImportModal extends ProtoModal {
    static modalModel = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">%%modal-title%%</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
            <div class="row">
                <p>We found the following categories. Which ones would you like to import?</p>
            </div>
            <div class="row">
                <div class="col-6">
                    <button id="archidekt-file-modal-all" type="button" class="btn btn-sm btn-secondary">All</button>
                </div>
                <div class="col-6">
                    <button id="archidekt-file-modal-none" type="button" class="btn btn-sm btn-secondary">None</button>
                </div>
            </div>
            <div class="row">
            </div>
          %%switches%%
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button id="archidekt-file-modal-ok" type="button" class="btn btn-primary">OK</button>
        </div>
      </div>
    </div>
    `;

    static switchModel = `
    <div class="form-check form-switch">
      <input class="form-check-input archidekt-file-category-toggle" type="checkbox" role="switch" checked id="archidekt-file-category-%%categoryindex%%">
      <label class="form-check-label" for="archidekt-file-category-%%categoryindex%%">%%categoryname%%</label>
    </div>
    `;

    constructor(domElement){
        super(domElement);
        this.options = {'focus': true};
    }

    call(categories, confirmCallback, cancelCallback, title=null){
        this.title = title || 'Archidekt File Import';
        this.categories = categories;
        this.categoryList = Object.keys(this.categories);
        this.cancelCallback = cancelCallback;
        this.confirmCallback = confirmCallback;
        super.call()
    }

    draw(){
        var toggles = [];
        for (var i = 0; i < this.categoryList.length; i++) {
            toggles.push(ArchidektFileImportModal.switchModel.replaceAll('%%categoryindex%%', i)
                                                             .replaceAll('%%categoryname%%', this.categoryList[i])
                        );
        }
        toggles = toggles.join('\n');
        this.html = ArchidektFileImportModal.modalModel.replaceAll('%%modal-title%%', this.title)
                                                       .replaceAll('%%switches%%', toggles);
        super.draw();
        this.bind();
    }

    bind(){
        this.element.addEventListener('hide.bs.modal', (e) => this._callCancelCallback());
        document.querySelector('#archidekt-file-modal-ok').addEventListener('click', (e) => this._callConfirmCallBack());
        document.querySelector('#archidekt-file-modal-all').addEventListener('click', (e) => this.setAllCategories(true), true);
        document.querySelector('#archidekt-file-modal-none').addEventListener('click', (e) => this.setAllCategories(false), true);
    }

    dismiss(){
        this.element.removeEventListener('hide.bs.modal', (e) => this._callCancelCallback());
        document.querySelector('#archidekt-file-modal-all').removeEventListener('click', (e) => this.setAllCategories(true), true);
        document.querySelector('#archidekt-file-modal-none').removeEventListener('click', (e) => this.setAllCategories(false), true);
        document.querySelector('#archidekt-file-modal-ok').removeEventListener('click', (e) => this._callConfirmCallBack());
        super.dismiss();
    }

    setAllCategories(checked){
        for(const elem of document.querySelectorAll('.archidekt-file-category-toggle')){
            elem.checked = checked;
        }
    }

    _callCancelCallback(){
        this.cancelCallback();
    }

    _callConfirmCallBack(){
        var selectedCategories = {};
        var categoryElementId = '';
        for (var i = 0; i < this.categoryList.length; i++) {
            categoryElementId = `#archidekt-file-category-${i}`;
            if(document.querySelector(categoryElementId).checked){
                selectedCategories[this.categoryList[i]] = this.categories[this.categoryList[i]];
            }
        }

        this.dismiss();
        const confirmCallback = this.confirmCallback['function'];
        confirmCallback(selectedCategories, this.confirmCallback['params']);

    }
}

class CardSetSelectionModal extends ProtoModal {
    static modalModel = `
    <div class="modal-dialog modal-dialog-scrollable modal-fullscreen">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">%%modaltitle%%</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
          <div class="modal-body">
            <div id="card-selection-modal-body" class="row">
                %%modalbody%%
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button id="card-set-select-modal-ok" type="button" class="btn btn-primary">OK</button>
          </div>
        </div>
    </div>
    `;

    constructor(domElement){
        super(domElement);
        this.options = {'focus': true};
    }

    call(cardBody, selectionElementQuery, selectionElementPropName, wrapperElementQuery, selectedClass ,confirmCallback, cancelCallback, title=null){
        this.title = title || 'Select card set/version';
        this.cardBody = cardBody;
        this.selectedSet = null;

        this.selectionElementQuery = selectionElementQuery;
        this.selectionElementPropName = selectionElementPropName;
        this.wrapperElementQuery = wrapperElementQuery;
        this.selectedClass = selectedClass;
        this.cancelCallback = cancelCallback;
        this.confirmCallback = confirmCallback;
        super.call();
    }

    draw(){
        this.html = CardSetSelectionModal.modalModel.replaceAll('%%modaltitle%%', this.title)
                                                    .replaceAll('%%modalbody%%', this.cardBody);
        super.draw()
        this.bind();
    }

    bind(){
        this.element.addEventListener('hide.bs.modal', (e) => this._callCancelCallback());
        document.querySelector('#card-selection-modal-body').addEventListener('click', (e) => this._onSetSelect(e));
        document.querySelector('#card-set-select-modal-ok').addEventListener('click', (e) => this._callConfirmCallBack());
    }

    dismiss(){
        this.element.removeEventListener('hide.bs.modal', (e) => this._callCancelCallback());
        document.querySelector('#card-selection-modal-body').addEventListener('click', (e) => this._onSetSelect(e));
        document.querySelector('#card-set-select-modal-ok').removeEventListener('click', (e) => this._callConfirmCallBack());
        super.dismiss();
    }

    _onSetSelect(event){
        if(!event.target.matches(this.selectionElementQuery)) return;
        for(const cardElement of document.querySelectorAll(`.${this.selectedClass}`)){
            cardElement.classList.remove(this.selectedClass);
        }

        var wrapperElement = event.target.parentElement;
        while(!wrapperElement.matches(this.wrapperElementQuery)){
            wrapperElement = wrapperElement.parentElement;
            if(wrapperElement.tagName == 'BODY'){
                wrapperElement = null;
                break;
            }
        }

        if(wrapperElement){
            wrapperElement.classList.add(this.selectedClass);
        }


        this.selectedSet = event.target.getAttribute(this.selectionElementPropName);
    }

    _callCancelCallback(){
        if(this.cancelCallback) this.cancelCallback();
    }

    _callConfirmCallBack(){
        this.hiddenCallback = () => this.confirmCallback(this.selectedSet);
        this.dismiss();
    }
}

class CardDetailsModal extends ProtoModal{
    static modalModel = `
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-5">Card Details</h1>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body container">
            %%modalbody%%
        </div>
      </div>
    </div>
    `;

    constructor(domElement){
        super(domElement);
        this.options = {'focus': true};
        this.cardBody = null;
    }

    call(cardBody){
        this.cardBody = cardBody;
        super.call();
    }

    draw(){
        this.html = CardDetailsModal.modalModel.replaceAll('%%modalbody%%', this.cardBody);
        super.draw();
    }
}

class SettingsModal extends ProtoModal{
    constructor(domElement, keyElements){
        super(domElement)
        this.options = {'focus': true};
        this.keyElements = keyElements;
        this.settingsKeys = Object.keys(this.keyElements);
        this.globalSettingsKeys = Object.keys(SettingsManager.keys);
        this._bind();
    }

    _bind(){
        for(const key of this.settingsKeys){
            if(!this.globalSettingsKeys.includes(key)) continue;
            if(SettingsManager.keys[key].type == 'boolean'){ // binds all the boolean checkboxes
                this.keyElements[key].addEventListener('change', (event) => {
                    window.settings.setValue(key, event.target.checked);
                });
                continue;
            }

            if(key ==  'cardImgQuality'){
                this.keyElements[key].addEventListener('change', (event) => {
                    if(!SettingsManager.keys.cardImgQuality.possibleValues.includes(event.target.value)) return;
                    window.settings.setValue('cardImgQuality', event.target.value);
                });
                continue;
            }

            if(key == 'deleteCooldown'){
                var formElement = this.keyElements[key].parentElement;
                formElement.addEventListener('submit', (event) => {
                    event.preventDefault();
                    try {
                        const newValue = parseFloat(this.keyElements[key].value) * 1000.0;
                        window.settings.setValue('deleteCooldown', newValue);
                    } catch(e) {
                        console.log(e);
                        return;
                    }
                });
                continue;
            }
        }
    }

    call(){
        this.html = null;
        super.call();
    }

    draw(){
        for(const key of this.settingsKeys){
            console.log(key);
            if(!this.globalSettingsKeys.includes(key)) continue;
            if(SettingsManager.keys[key].type == 'boolean'){
                this.keyElements[key].checked = window.settings[key];
                continue;
            }

            if(key ==  'cardImgQuality'){
                this.keyElements[key].value = window.settings.cardImgQuality;
                continue;
            }

            if(key == 'deleteCooldown'){
                this.keyElements[key].value = String(window.settings.deleteCooldown/1000);
                continue;
            }


        }
    }

    async _afterHidden(){
        if(this.hiddenCallback){
            if(this.hiddenCallback.constructor.name === 'AsyncFunction'){
                await this.hiddenCallback();
            }else{
                this.hiddenCallback();
            }
        }
        this.hiddenCallback = null;
        this.element.style.display = 'none';
    }
}