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

    _makeURL(URLPath){
        const url = [this.domain];
        if(window.location.port != ''){
            url.push(':');
            url.push(window.location.port);
        }
        url.push(URLPath);
        return url.join('');
    }

    async cardsFromUrl(url){
        if(this.token === null) return;
        url = btoa(url).replaceAll('/', '.');
        const response = await this._apiRequest(`/cards/from/${url}`, 'GET');

        if(response.success == false){
            console.error(response.error);
            return {'success': false, 'message': response.error};
        }
        return {'success': true, 'data': response.json.data};
    }

    async requestLogin(){
        const response = await fetch(this._makeURL('/login'));
        const details = await response.json();

        if(!Object.hasOwn(details, 'authorization_url')) return;

        window.location.href = details.authorization_url;
    }

    async _apiRequest(URLPath, method='GET', data=null){
        const options = {
            'method': method,
            'headers': {
                "Content-Type": "application/json",
                "x-access-token": this.token
            }
        }

        if(data!==null){
            options['headers']['Content-Type'] = "application/json";
            options['body'] = typeof data == 'string' ? data : JSON.stringify(data);
        }

        var result = {
            'success': true,
            'response': null,
            'json': null,
            'error': null
        };

        try{
            const response = await fetch(this._makeURL(URLPath), options);
            result.response = response;
        }catch(e){
            console.error(`_apiRequest fetch error: ${typeof e} : ${e.toString()}`);
            result.success = false;
            result.error = e.toString();
            return result;
        }

        try{
            result.json = await result.response.json();
            result.success = result.json.success;
            if(result.json.success == false) result.error = result.json.message;
        }catch(e){
            console.error(`_apiRequest error on parsing: ${e.toString()}`);
            result.json = null;
            result.success = false;
            result.error = e.toString();
            return result;
        }

        return result;
    }

    async refreshToken(){
        if(this.token === null) return;
        const response = await this._apiRequest('/login/renew', 'GET');

        if(response.success === false){
            console.error(`invalid token refresh: ${response.error}`);
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

        if(response.success == false){
            console.error(response.error);
            return {'success': false, 'message': response.error};
        }

        return {'success': true, 'data': response.json.data};
    }

    async updateUser(updateData){
        if(!this.token) return null;
        const response = await this._apiRequest(`/user/${this.user_id}`, 'POST', updateData);

        if(response.success == false){
            console.error(response.error);
            return {'success': false, 'message': response.error};
        }

        return {'success': true, 'message': response.json.message};
    }

    async deleteUser(){
        if(!this.token) return null;
        const response = await this._apiRequest(`/user/${this.user_id}`, 'DELETE');

        if(response.success == false){
            console.error(response.error);
            return {'success': false, 'message': response.error};
        }

        this.logout();
        return {'success': true, 'message': response.json.message};
    }

    async createList(listData){
        if(!this.token) return null;

        if(!Object.hasOwn(listData, 'name')) return {'success': false, 'message': 'list name is empty'};
        listData.user_id = this.user_id;
        if(Object.hasOwn(listData, 'comments') && listData.comments === null) delete listData.comments;
        if(Object.hasOwn(listData, 'body') && listData.body === null) delete listData.body;
        if(Object.hasOwn(listData, 'public') && listData.public === null) delete listData.public;

        const response = await this._apiRequest(`/list`, 'POST', listData);
        if(response.success == false){
            console.error(response.error);
            return {'success': false, 'message': response.error};
        }

        return {'success': true, 'data': response.json.data};
    }

    async updateList(listId, listData){
        if(!this.token) return null;

        if(!Object.hasOwn(listData, 'name') || listData.name === null || listData.name == '') return {'success': false, 'message': 'list name is empty'};
        var listUserId = 0;
        try{
            listUserId = JSON.parse(listData.body).user_id;
        }catch(e){
            return {'success': false, 'message': 'could not get user_id from body'};
        }

        if(listUserId != this.user_id){
            const listDataBody = JSON.parse(listData.body);
            listDataBody.user_id = this.user_id;
            listData.body = JSON.stringify(listDataBody);
            return this.createList(listData);
        }
        if(Object.hasOwn(listData, 'comments') && listData.comments === null) delete listData.comments;
        if(Object.hasOwn(listData, 'body') && listData.body === null) delete listData.body;
        if(Object.hasOwn(listData, 'public') && listData.public === null) delete listData.public;

        const response = await this._apiRequest(`/list/${listId}`, 'POST', listData);
        if(response.success == false){
            console.error(response.error);
            return {'success': false, 'message': response.error};
        }

        return {'success': true, 'data': response.json.data};
    }

    async listLists(){
        if(!this.token) return null;

        const response = await this._apiRequest(`/list/by/${this.user_id}`, 'GET');
        if(response.success == false){
            console.error(response.error);
            return {'success': false, 'message': response.error};
        }

        return {'success': true, 'data': response.json.data};
    }

    async deleteList(listId){
        if(!this.token) return null;

        const response = await this._apiRequest(`/list/${listId}`, 'DELETE');

        if(response.success == false){
            console.error(response.error);
            return {'success': false, 'message': response.error};
        }

        return {'success': true, 'data': response.json.data};
    }

    async getList(listId){
        if(!this.token) return null;
        const response = await this._apiRequest(`/list/${listId}`, 'GET');

        if(response.success == false){
            console.error(response.error);
            return {'success': false, 'message': response.error};
        }

        return {'success': true, 'data': response.json.data};
    }

    async makeListImage(cardlist){
        if(!this.token) return null;
        const response = await this._apiRequest(`/image/wantlist`, 'POST', {'wantlist': cardlist});
        if(response.success == false){
            console.error(response.error);
            return {'success': false, 'message': response.error};
        }

        return {'success': true, 'data': response.json.data};
    }
}
window.loadedModules.push('session');