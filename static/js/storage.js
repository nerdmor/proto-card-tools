class StorageManager{
    constructor(){
        this.enabled = this._storageAvailable();
    }

    setCookie(name, value, duration=null){
        var options = { 'SameSite': 'Strict' };
        if(duration){
            options['expires'] = duration;
        }
        Cookies.set(name, value, options);
    }

    setItem(key, value){
        if(!this.enabled) return;
        return localStorage.setItem(key, value);
    }

    getItem(key){
        if(!this.enabled) return null;
        return localStorage.getItem(key);
    }

    getObject(key){
        if(!this.enabled) return null;
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
        localStorage.clear();
        for(k of Object.keys(Cookies.get())){
            Cookies.remove(k);
        }
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