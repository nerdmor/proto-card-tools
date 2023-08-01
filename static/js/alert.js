class AlertManager{
    static elementClasses = ['row', 'alert', 'alert-element', 'fade', 'show'];
    static models = {
        'spinner': `<div class="spinner-border spinner-border-sm alert-element-spinner" role="status"><span class="visually-hidden">Loading...</span></div>`
    }

    constructor(rowElement){
        this.rowElement = rowElement;
        this.alerts = {};
    }

    _buildAlert(text, bsType, spinner=true){
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


    addAlert(text, spinner=false, bsType='info', timer=false){
        const alertElement = this._buildAlert(text,bsType, spinner);
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