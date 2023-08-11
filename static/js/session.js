class SessionManager{
    constructor(domain, storageManager){
        this.domain = domain;
        this.storageManager = storageManager;

        this.token = 0;
        if(this.loadTokenFromUrl() == false){
            if(this.loadTokenFromCookie()){
                this.refreshToken();
            }else{
                this._setToken(null);
            }
        }

        this.storageManager.setSessionManager(this);
    }

    registerChangeCallback(sessionChangeCallback){
        this.sessionChangeCallback = sessionChangeCallback;
        if(this.token !== 0) this.sessionChangeCallback(this.token);
    }

    _setToken(token){
        if(this.token === token) return;
        this.token = token;
        this.storageManager.setCookie('pct_jwt', token, 29);
        if(this.sessionChangeCallback) this.sessionChangeCallback(this.token);
    }

    loadTokenFromUrl(){
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if(token){
            this._setToken(token);
            return true;
        }
        return false;
    }

    loadTokenFromCookie(){
        const token = this.storageManager.getCookie('pct_jwt');
        if(token){
            this._setToken(token);
            return true;
        }
        return false;
    }

    async requestLogin(){
        const response = await fetch(`${this.domain}/login`);
        const details = await response.json();

        if(!Object.hasOwn(details, 'authorization_url')) return;

        window.location.href = details.authorization_url;
    }

    async refreshToken(){
        if(this.token === null) return;
        const response = await fetch(`${this.domain}/login/renew`, {
            method: "GET",
            headers: {
                 "Content-Type": "application/json",
                 "x-access-token": this.token
            }
        });
        const details = await response.json();

        if(!Object.hasOwn(details, 'token')) return;
        this._setToken(details.token);
    }

    logout(){
        this.token = null;
        this.storageManager.removeCookie('pct_jwt');
        this.sessionChangeCallback(this.token);
    }
}
window.loadedModules.push('session');