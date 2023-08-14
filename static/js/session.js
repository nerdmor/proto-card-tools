class SessionManager{
    constructor(domain, storageManager){
        this.domain = domain;
        this.storageManager = storageManager;

        this.token = 0;
        if(this.loadTokenFromUrl() == true){
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.delete('token');
            const newUrl = `${window.location.href.replace(window.location.search, '')}?${urlParams.toString()}`;
            window.location.href = newUrl;
        }else if(this.loadTokenFromCookie()){
            this.refreshToken();
        }else{
            this._setToken(null);
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

    async _apiRequest(urlPath, method='GET', data=null){
        const options = {
            'method': method,
            'headers': {
                "Content-Type": "application/json",
                "x-access-token": this.token
            }
        }

        if(data!==null){
            options['headers']['Content-Type'] = "application/json";
            options['body'] = JSON.stringify(data);
        }

        const response = await fetch(`${this.domain}${urlPath}`, options);
        console.log(response);
        const json = await response.json();
        console.log(json);
        return {'response': response, 'json': json};
    }

    async refreshToken(){
        if(this.token === null) return;
        const response = await this._apiRequest('/login/renew', 'GET');

        if(!response.json || !Object.hasOwn(response.json, 'token')){
            console.error('invalid token refresh');
            return;
        }
        this._setToken(response.json.token);
    }

    logout(){
        this.token = null;
        this.storageManager.removeCookie('pct_jwt');
        this.sessionChangeCallback(this.token);
    }

    async getUserDetails(){
        if(!this.token) return null;
        const response = await this._apiRequest('/user/0', 'GET');

        if(!Object.hasOwn(response.json, 'data')){
            return null;
        }

        console.log(response.json.data);

        return response.json.data;
    }
}
window.loadedModules.push('session');