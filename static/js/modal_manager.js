class ModalManager{
    constructor(wrapperId){
        this.wrapperId = wrapperId;
        this.loaded = false;
        this.modals = {};

        this.loadModalElements();
    }

    async loadModalElements(){
        // putting this here so we can have a separate file with all the modals.
        const modalsHTML = await window.apiManager.htmlContent('modals.html');
        document.getElementById(this.wrapperId).innerHTML = modalsHTML;
        this.loaded = true;
    }

    hideModal(modalId){
        if(this.loaded == false) return;
        if(!modalId in this.modals) return;
        this.modals[modalId].hide();
    }


    emptyListModal(modalElementId, modalOkElementId){
        if(this.loaded == false) return;
        if(!('empty-list' in this.modals)){
            this.modals['empty-list'] = new emptyListModal(modalElementId, modalOkElementId);
        }
        this.modals['empty-list'].show();
    }
}

class baseModal{
    constructor(){
    }

    hide(){
        this.modal.hide();
    }
}

class emptyListModal extends baseModal{
    constructor(modalElementId, modalOkElementId){
        super();
        this.modalOkElementId = modalOkElementId;
        this.modal = new bootstrap.Modal(document.getElementById(modalElementId));
        document.getElementById(modalOkElementId).addEventListener('click', () => {
            window.listManager.clear();
            window.modalManager.hideModal('empty-list');
        });
    }

    show(){
        document.getElementById(this.modalOkElementId).setAttribute('disabled', 'disabled');
        this.modal.show();
        window.setTimeout(() => {
            document.getElementById(this.modalOkElementId).removeAttribute('disabled');
        }, 2500)
    }
}