class ProtoModal{
    constructor(domElement){
        this.modal = null;
        this.html = '';
        this.element = domElement;
        this.options = {}
        this.hiddenCallback = null;
        this.eraseOnDismiss = true;
        this.drawBeforeShow = true;

        this.element.addEventListener('hidden.bs.modal', (e) => this._afterHidden());
    }

    draw(){
        this.element.innerHTML = this.html;
    }

    call(){
        if(this.drawBeforeShow == true && (this.html == '' || this.html === null)){
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

        if(this.eraseOnDismiss == true){
            this.html = '';
            this.element.innerHTML = '';
        }
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

class FileSelectModal extends ProtoModal{
    constructor(domElement, fileImportInputElement, fileImportButtonElement, fileTypeElementName, fileTypeIdPrefix){
        super(domElement);
        this.options = {'focus': true};
        this.eraseOnDismiss = false;
        this.drawBeforeShow = false;

        this.fileImportInputElement = fileImportInputElement;
        this.fileImportButtonElement = fileImportButtonElement;
        this.fileTypeElementName = fileTypeElementName;
        this.fileTypeIdPrefix = fileTypeIdPrefix;
        this.fileIngestCallback = null;

        this.file = null;
        this.selectedFileType = null;

        this._bind();
    }

    registerCallbacks(fileIngestCallback){
        this.fileIngestCallback = fileIngestCallback;
    }

    _bind(){
        this.fileImportInputElement.addEventListener('change', (event) => {
            try {
                this.file = event.target.files[0];
            } catch(e) {
                this.file = null;
            }
        });

        this.fileImportButtonElement.addEventListener('click', (event) => {
            this._processModalConfirm();
        });
    }

    _processModalConfirm(){
        if(this.file === null) return;

        this.selectedFileType = null;
        for(const e of this.element.querySelectorAll(`[name="${this.fileTypeElementName}"]`)){
            if(e.checked == true){
                this.selectedFileType = e.getAttribute('id').replaceAll(this.fileTypeIdPrefix, '');
                break;
            }
        }
        if(this.selectedFileType == null) return;

        const reader = new FileReader();
        reader.onload = (event) => this._processFileRead(event);
        reader.readAsText(this.file);
    }

    _processFileRead(event){
        const fileContents = event.target.result.split('\n');
        this.dismiss(() => {this.fileIngestCallback(fileContents, this.selectedFileType)});
    }
}

class ArchidektFileImportModal extends ProtoModal {
    static switchModel = `
    <div class="form-check form-switch">
      <input class="form-check-input archidekt-file-category-toggle" type="checkbox" role="switch" checked id="archidekt-file-category-%%categoryindex%%" value="%%categoryname%%">
      <label class="form-check-label" for="archidekt-file-category-%%categoryindex%%">%%categoryname%%</label>
    </div>
    `;

    constructor(domElement, okButtonElement, switchWrapperElement, selectAllCategoriesElement, selectNoCategoriesElement){
        super(domElement);
        this.options = {'focus': true};
        this.eraseOnDismiss = false;

        this.okButtonElement = okButtonElement;
        this.switchWrapperElement = switchWrapperElement;
        this.selectAllCategoriesElement = selectAllCategoriesElement;
        this.selectNoCategoriesElement = selectNoCategoriesElement;

        this.confirmCallback = null;
        this.cancelCallback = null;

        this._bind();
    }

    registerCallbacks(confirmCallback, cancelCallback){
        this.confirmCallback = confirmCallback;
        this.cancelCallback = cancelCallback;
    }

    call(categories){
        this.categories = categories;
        this.categoryList = Object.keys(this.categories);
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
        this.switchWrapperElement.innerHTML = toggles;
    }

    _bind(){
        this.element.addEventListener('hide.bs.modal', (e) => this._callCancelCallback());
        this.okButtonElement.addEventListener('click', (e) => this._callConfirmCallBack());
        this.selectAllCategoriesElement.addEventListener('click', (e) => this.setAllCategories(true), true);
        this.selectNoCategoriesElement.addEventListener('click', (e) => this.setAllCategories(false), true);
    }

    dismiss(){
        this.element.removeEventListener('hide.bs.modal', (e) => this._callCancelCallback());
        super.dismiss();
    }

    setAllCategories(checked){
        for(const elem of document.querySelectorAll('.archidekt-file-category-toggle')){
            elem.checked = checked;
        }
    }

    _callCancelCallback(){
        if(this.cancelCallback) this.cancelCallback();
    }

    _callConfirmCallBack(){
        var selectedCategories = {};
        var categoryName = '';
        for(const el of this.element.querySelectorAll('.archidekt-file-category-toggle')){
            if(!el.checked) continue;
            categoryName = el.getAttribute('value');
            if(!this.categoryList.includes(categoryName)) continue;
            selectedCategories[categoryName] = this.categories[categoryName];
        }

        this.dismiss();
        this.confirmCallback(selectedCategories);
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
    constructor(domElement, redrawCallback, keyElements){
        super(domElement)
        this.options = {'focus': true};
        this.keyElements = keyElements;
        this.settingsKeys = Object.keys(this.keyElements);
        this.globalSettingsKeys = Object.keys(SettingsManager.keys);
        this.eraseOnDismiss = false;
        this.redrawCallback = redrawCallback;
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
                    this.redrawCallback();
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

class TextLoadModal extends ProtoModal{
    constructor(domElement, confirmCallback){
        super(domElement);
        this.confirmCallback = confirmCallback;
        this.eraseOnDismiss = false;
        this._bind();
    }

    _bind(){
        document.querySelector('#text-entry-modal-save').addEventListener('click', () =>  this.onSubmit());
    }

    draw(){}

    onSubmit(){
        this.hiddenCallback = () => {this.confirmCallback(document.querySelector('#text-entry-textarea').value)};
        this.modal.hide();
    }
}

class LoadErrorModal extends ProtoModal{
    static errorRowModel = `
    <tr>
      <th scope="row">%%rownum%%</th>
      <td>%%typedname%%</td>
      <td>%%error%%</td>
    </tr>
    `;


    constructor(domElement, errorTableElement, errorTextElement, errorCopyElement){
        super(domElement);
        this.options = {'focus': true};
        this.eraseOnDismiss = false;

        this.errorTableElement = errorTableElement;
        this.errorTextElement = errorTextElement;
        this.errorCopyElement = errorCopyElement;
        this._bind();
    }

    _bind(){
        this.errorCopyElement.addEventListener('click', () => {
            var copyText = this.errorTextElement;
            copyText.select();
            copyText.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(copyText.value);
        });
    }

    draw(errorArray){
        var html = [];
        var txt = [];
        for (var i = 0; i < errorArray.length; i++) {
            html.push(LoadErrorModal.errorRowModel.replaceAll('%%rownum%%', i)
                                                 .replaceAll('%%typedname%%', errorArray[i].typedName)
                                                 .replaceAll('%%error%%', errorArray[i].error)
                     );
            txt.push(errorArray[i].typedName);
        }

        this.errorTableElement.innerHTML = html.join('\n');
        this.errorTextElement.value = txt.join('\n');
        this.html = 'html ok';  // this dodges super.call() trying to call draw()
    }

    call(errorArray){
        this.draw(errorArray);
        super.call();
    }


    onSubmit(){
        this.hiddenCallback = () => {this.confirmCallback(document.querySelector('#text-entry-textarea').value)};
        this.modal.hide();
    }
}

class ListPropertiesModal extends ProtoModal{
    static statusElementModel = `
    <div class="status-button-group-wrapper">
      <div class="btn-group" role="group" status_value="%%status%%" status_index="%%statusindex%%">
        <button type="button" class="btn btn-outline-secondary status-options-btn status-options-btn-display" disabled>%%status%%</button>
        <button type="button" class="btn btn-outline-secondary status-options-btn status-options-btn-up"><i class="bi bi-arrow-up"></i></button>
        <button type="button" class="btn btn-outline-secondary status-options-btn status-options-btn-down"><i class="bi bi-arrow-down"></i></button>
        <button type="button" class="btn btn-outline-secondary status-options-btn status-options-btn-remove"><i class="bi bi-trash-fill"></i></button>
      </div>
    </div>
    `;

    static popOverModel = {
        'title': 'Emoji Only. Suggestions:',
        'button': `<button type="button" class="new-status-suggestion btn btn-sm btn-outline-secondary">%%emoji%%</button>`
    };


    constructor(domElement, listNameElement, listPropertiesPublicElement, listPropertiesLastUpdateElement, listPropertiesStatusListElement, listPropertiesNewStatusFormElement, listPropertiesNewStatusInputElement, listPropertiesAlertElement, listPropertiesSaveElement){
        super(domElement);
        this.options = {'focus': true};
        this.eraseOnDismiss = false;

        this.listNameElement = listNameElement;
        this.listPropertiesPublicElement = listPropertiesPublicElement;
        this.listPropertiesLastUpdateElement = listPropertiesLastUpdateElement;
        this.listPropertiesStatusListElement = listPropertiesStatusListElement;
        this.listPropertiesNewStatusFormElement = listPropertiesNewStatusFormElement;
        this.listPropertiesNewStatusInputElement = listPropertiesNewStatusInputElement;
        this.listPropertiesAlertElement = listPropertiesAlertElement;
        this.listPropertiesSaveElement = listPropertiesSaveElement;

        this.saveCallback = null;
        this.statusList = null;

        this._setPopOver();
        this._bind();
    }

    registerCallbacks(saveCallback){
        this.saveCallback = saveCallback;
    }

    _setPopOver(){
        var html = [];
        for(const emoji of window.constants.emojiSuggestions){
            html.push(ListPropertiesModal.popOverModel.button.replaceAll('%%emoji%%', emoji));
        }
        const popover = new bootstrap.Popover(this.listPropertiesNewStatusInputElement, {
            'html': true,
            'sanitize': false,
            'title': ListPropertiesModal.popOverModel.title,
            'content': html.join('')
        });
    }

    _bind(){
        document.querySelector('body').addEventListener('click', (event) => {
            if(matchElementAndParent(event.target, ['.new-status-suggestion'])){
                this._addStatusToList(event.target.innerHTML);
            }
        });
        this.listPropertiesNewStatusFormElement.addEventListener('submit', (event) => {
            event.preventDefault();
            this._addStatusToList(this.listPropertiesNewStatusInputElement.value);
        });
        this.listPropertiesStatusListElement.addEventListener('click', (event) => {
            var buttonAction = null;
            var parentElement = event.target.parentElement;
            if(event.target.matches('.status-options-btn-up') || parentElement.matches('.status-options-btn-up')){
                buttonAction = 'up';
            }else if(event.target.matches('.status-options-btn-down') || parentElement.matches('.status-options-btn-down')){
                buttonAction = 'down';
            }else if(event.target.matches('.status-options-btn-remove') || parentElement.matches('.status-options-btn-remove')){
                buttonAction = 'remove';
            }
            if(buttonAction === null) return;

            var statusIndex = null;
            if(parentElement.hasAttribute('status_index')){
                statusIndex = parentElement.getAttribute('status_index');
            }else{
                statusIndex = parentElement.parentElement.getAttribute('status_index');
            }

            this._updateStatusList(statusIndex, buttonAction);
        });
        this.listPropertiesSaveElement.addEventListener('click', (event)=>{
            if(this.saveCallback){
                this.dismiss(() => {
                    this.saveCallback({
                        'name': this.listNameElement.value,
                        'public': this.listPropertiesPublicElement.checked,
                        'statusList': this.statusList
                    });
                });
            }else{
                this.dismiss();
            }
        });
    }

    _updateStatusList(statusIndex, buttonAction){
        if(buttonAction == 'remove'){
            if(this.statusList.length == 1){
                this._drawError('There must be at least one status');
                return;
            }
            this.statusList.splice(statusIndex, 1);
        }else{
            const newIndex = buttonAction == 'up' ? statusIndex-1 : statusIndex+1;
            if(newIndex < 0){
                const tmp = this.statusList.shift();
                this.statusList.push(tmp);
            }else{
                arrayMove(this.statusList, statusIndex, newIndex)
            }
        }
        this._drawStatusList();
    }

    _addStatusToList(newStatus){
        if(this.statusList.includes(newStatus)){
            this.listPropertiesNewStatusInputElement.value = '';
            this._drawError('Status already exists');
            return;
        }
        if(!isEmoji(newStatus)){
            this.listPropertiesNewStatusInputElement.value = '';
            this._drawError('Status is not an emoji');
            return;
        }
        this.listPropertiesNewStatusInputElement.value = '';
        this.statusList.push(newStatus);
        this._drawStatusList();
    }

    _drawError(err){
        this.listPropertiesAlertElement.innerHTML = err;
        const removeId = Date.now();
        this.listPropertiesAlertElement.setAttribute('remove_id', removeId);
        this.listPropertiesAlertElement.classList.remove("start-hidden");
        setTimeout(() => {
            if(this.listPropertiesAlertElement.getAttribute('remove_id') == removeId){
                this.listPropertiesAlertElement.innerHTML = '';
                this.listPropertiesAlertElement.classList.add("start-hidden");
            }
        }, 1000);
    }

    _drawStatusList(){
        var html = [];
        for (var i = 0; i < this.statusList.length; i++) {
            html.push(ListPropertiesModal.statusElementModel.replaceAll('%%status%%', this.statusList[i])
                                                            .replaceAll('%%statusindex%%', i));
        }
        this.listPropertiesStatusListElement.innerHTML = html.join('\n');
    }

    draw(cardList){
        this.listNameElement.value = cardList.name;
        this.listPropertiesPublicElement.checked = cardList.public;

        // I hate working with time
        const lastUpdate = new Date(0);
        lastUpdate.setUTCSeconds(cardList.lastUpdate);
        const lastUpdateMonth = `${lastUpdate.getMonth() < 9 ? '0': ''}${lastUpdate.getMonth()+1}`;
        const lastUpdateDay = `${lastUpdate.getDate() < 10 ? '0': ''}${lastUpdate.getDate()}`;
        const lastUpdateHour = `${lastUpdate.getHours() < 10 ? '0': ''}${lastUpdate.getHours()}`;
        const lastUpdateMinute = `${lastUpdate.getMinutes() < 10 ? '0': ''}${lastUpdate.getMinutes()}`;
        const lastUpdateSecond = `${lastUpdate.getSeconds() < 10 ? '0': ''}${lastUpdate.getSeconds()}`;
        this.listPropertiesLastUpdateElement.value = `${lastUpdate.getFullYear()}-${lastUpdateMonth}-${lastUpdateDay} ${lastUpdateHour}:${lastUpdateMinute}:${lastUpdateSecond}`;

        this._drawStatusList();
        this.html = 'html';
    }

    call(cardList){
        this.statusList = cardList.statusList;
        this.draw(cardList);
        super.call();
    }
}