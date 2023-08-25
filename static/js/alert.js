class AlertManager{
    static elementClasses = ['row', 'alert', 'alert-element', 'fade', 'show'];
    static models = {
        'spinner': `<div class="spinner-border spinner-border-sm alert-element-spinner" role="status"><span class="visually-hidden">Loading...</span></div>`
    }

    constructor(rowElement, modalElement){
        this.rowElement = rowElement;
        this.modalElement = modalElement;

        this.alerts = {'modal': false};
        this._initModal();
    }

    _initModal(){
        this.modalElementBody = this.modalElement.querySelector('.modal-body');
        this.modalElementFooter = this.modalElement.querySelector('.modal-footer');
        this.modal = new bootstrap.Modal(this.modalElement, {'backdrop': 'static'});
        this.modalElement.addEventListener('hidden.bs.modal', (e) => this._afterModalHidden());
    }

    _afterModalHidden(){
        this.alerts.modal = false;
    }

    _buildRowAlert(text, bsType, spinner=true){
        const elementId = `alert-${makeRandomId(3, '')}`;
        const element = document.createElement("div");
        element.setAttribute('id', elementId);
        element.setAttribute('role', 'alert');
        for(const cl of AlertManager.elementClasses){
            element.classList.add(cl);
        }
        element.classList.add(`alert-${bsType}`);
        element.innerHTML = `${spinner?AlertManager.models.spinner:''}${text}`;

        return element;
    }

    modalAlert(text, spinner=false, hasOk=false){
        if(this.alerts.modal === true) return;
        this.alerts.modal = true;
        this.modalElementBody.innerHTML = `<div>${spinner?AlertManager.models.spinner:''}${text}</div>`;
        if(hasOk === true){
            this.modalElementFooter.classList.remove('start-hidden');
        }else{
            this.modalElementFooter.classList.add('start-hidden');
        }
        this.modal.show();
    }

    dismissModalAlert(){
        if(this.alerts.modal === false) return;
        this.modal.hide();
    }


    addAlert(text, spinner=false, bsType='info', timer=null){
        const alertElement = this._buildRowAlert(text,bsType, spinner);
        this.rowElement.appendChild(alertElement);

        const elementId = alertElement.getAttribute('id');
        const bsAlert = new bootstrap.Alert(alertElement);
        this.alerts[elementId] = bsAlert;
        this.rowElement.classList.remove('start-hidden');

        if(timer){
            setTimeout(() => {
                this.removeAlert(elementId);
            }, timer);
        }

        return elementId;
    }

    removeAlert(alertId){
        if(!Object.hasOwn(this.alerts, alertId)) return;
        document.getElementById(alertId).addEventListener('closed.bs.alert', (event) => {
            this._alertRemovalCallback(alertId);
        });
        this.alerts[alertId].close();
    }

    _alertRemovalCallback(alertId){
        delete this.alerts[alertId];
        if(Object.keys(this.alerts).length == 0){
            this.rowElement.classList.add('start-hidden');
        }
    }

}


window.loadedModules.push('alert');