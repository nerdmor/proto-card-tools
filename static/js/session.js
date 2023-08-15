class SessionManager{
    constructor(domain, storageManager){
        this.domain = domain;
        this.storageManager = storageManager;

        this.token = 0;
        this.user_id = null;
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

        if(this.token !== null){
            this.storageManager.setCookie('pct_jwt', token, 29);
            this.user_id = JSON.parse(atob(this.token.split('.')[1])).user_id;
        }else{
            this.storageManager.removeCookie('pct_jwt');
            this.user_id = null;
        }
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
        const json = await response.json();
        return {'response': response, 'json': json};
    }

    async refreshToken(){
        if(this.token === null) return;
        const response = await this._apiRequest('/login/renew', 'GET');

        if(!response.json || !Object.hasOwn(response.json, 'token')){
            console.error('invalid token refresh');
            if(response.response.status == 401) this.logout();
            return;
        }
        this._setToken(response.json.token);
    }

    logout(){
        this._setToken(null);
    }

    async getUserDetails(){
        if(!this.token) return null;
        const response = await this._apiRequest(`/user/${this.user_id}`, 'GET');

        if(!Object.hasOwn(response.json, 'data')){
            if(Object.hasOwn(response.json, 'error')){
                console.error(response.json.error);
                return {'success': false, 'message': response.json.error};
            }
            console.error('failed getting user details. Failed getting errors.');
            console.error(response.response);
            return {'success': false, 'message': 'failed getting user details'};
        };

        return {'success': true, 'data': response.json.data};
    }

    async updateUser(updateData){
        if(!this.token) return null;
        const response = await this._apiRequest(`/user/${this.user_id}`, 'POST', updateData);

        if(!Object.hasOwn(response.json, 'message')){
            if(Object.hasOwn(response.json, 'error')){
                console.error(response.json.error);
                return {'success': false, 'message': response.json.error};
            }
            console.error('failed updating user. Failed getting errors.');
            console.error(response.response);
            return {'success': false, 'message': 'failed updating user'};
        };

        return {'success': true, 'message': response.json.message};
    }

    async deleteUser(){
        if(!this.token) return null;
        const response = await this._apiRequest(`/user/${this.user_id}`, 'DELETE');

        if(!Object.hasOwn(response.json, 'message')){
            if(Object.hasOwn(response.json, 'error')){
                console.error(response.json.error);
                return {'success': false, 'message': response.json.error};
            }
            console.error('failed updating user. Failed getting errors.');
            console.error(response.response);
            return {'success': false, 'message': 'failed updating user'};
        };

        this.logout();
        return {'success': true, 'message': response.json.message};
    }
}
window.loadedModules.push('session');