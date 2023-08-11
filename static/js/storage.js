class StorageManager{
    constructor(){
        this.storageEnabled = this._storageAvailable();
        this._setUserCookie();
        this.sessionManager = null;
        this.syncQueue = {};
    }

    setSessionManager(sessionManager){
        this.sessionManager = this.sessionManager || sessionManager;
    }

    setCookie(name, value, duration=null){
        var options = { 'SameSite': 'Strict' };
        if(duration){
            options['expires'] = duration;
        }
        Cookies.set(name, value, options);
    }

    getCookie(name){
        return Cookies.get(name);
    }

    removeCookie(name){
        Cookies.remove(name);
    }

    setItem(key, value){
        if(!this.storageEnabled) return;
        return localStorage.setItem(key, value);
    }

    getItem(key){
        if(!this.storageEnabled) return null;
        return localStorage.getItem(key);
    }

    getObject(key){
        if(!this.storageEnabled) return null;
        var stored = localStorage.getItem(key);
        if(stored === null) return null;
        try{
            return JSON.parse(stored);
        }catch(e){
            return null;
        }
        return null;
    }

    clear(){
        if(!this.storageEnabled) return;
        localStorage.clear();
    }

    clearCookies(){
        for(const k of Object.keys(Cookies.get())){
            Cookies.remove(k);
        }
    }

    clearAll(){
        this.clear();
        this.clearCookes();
    }

    syncItem(itemType, item){
        item = item.toString();
        if(itemType == 'listManager'){
            this.setItem(itemType, item);
            this._addToSyncQueue(itemType, item);
        }
    }

    async _addToSyncQueue(itemType, item){
        if(this.sessionManager === null || this.sessionManager.token === null) return;
        const timestamp = (new Date()).getTime();
        this.syncQueue[itemType] = {
            'timestamp': timestamp,
            'value': item
        }

        setTimeout((tp, ts) => {
            if(this.syncQueue[tp].timestamp == ts)
                this._triggerSync(tp);
        }, 5000, itemType, timestamp);
    }

    async _triggerSync(itemType){
        // TODO: call the API and save the list to the backend
        console.log(this.syncQueue[itemType]);
    }

    _setUserCookie(){
        var userCookie = Cookies.get('pct_user');
        if(!userCookie){
            userCookie = makeRandomId(5,'-');
        }
        this.setCookie('pct_user', userCookie, 364);
    }

    _storageAvailable() {
        let storage;
        try {
            storage = window['localStorage'];
            const x = "__storage_test__";
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch (e) {
            return (
                e instanceof DOMException && (e.code === 22 || e.code === 1014 || e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED") && storage && storage.length !== 0
            );
        }
    }
}


window.loadedModules.push('storage');