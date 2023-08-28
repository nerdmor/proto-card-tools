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

    async ensureRemoteSettings(){
        if(this.sessionManager === null) return;
        const userDetails = await this.sessionManager.getUserDetails();
        if(userDetails === null || userDetails.success === false) return;
        if(userDetails.data.settings === null){
            this.saveSettings(window.settings.toString());
        }
    }

    saveSettings(settings){
        if(this.sessionManager === null) return;
        if(typeof settings !== 'string') settings = JSON.stringify(settings);
        this.setItem('settings', settings);
        if(this.sessionManager.token) this.sessionManager.updateUser({'settings': settings});
    }

    setCookie(name, value, duration=null){
        var options = { 'SameSite': 'Strict' };
        if(duration){
            options['expires'] = duration;
        }
        Cookies.set(name, value, options);
    }

    getCookie(name){
        const cookie = Cookies.get(name);
        if(cookie == 'null') return null;
        return cookie;
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
        this.clearCookies();
    }

    syncItem(itemType, item, suppressApi=false){
        // item = item.toString();
        if(itemType == 'listManager'){
            this.setItem(itemType, item);
            if(suppressApi == false) this._addToSyncQueue(itemType, item);
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
        if(itemType == 'listManager'){
            if(!Object.hasOwn(this.syncQueue, itemType)) return;
            await this._syncList(this.syncQueue[itemType].value);
            delete this.syncQueue[itemType];
        }
    }


    async _syncList(list){
        const listDetails = {
            'name': list.name,
            'comments': list.comments,
            'body': list.toString(),
            'public': list.public
        };
        var response = null
        if(list.id === null){
            response = await this.sessionManager.createList(listDetails);
            if(response.success == true){
                list.id = response.data.id;
                list.user_id = this.sessionManager.user_id;
            }else{
                // TODO: improve this
                console.error(response.error);
            }
        }else{
            response = await this.sessionManager.updateList(list.id, listDetails);
            // TODO: continue from here
        }
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