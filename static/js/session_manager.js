class SessionManager {
    constructor(){
        this.user_id = null;
        this.active = false;
        this.initialize();
    }

    async initialize(){
        await this.getSessionFromCookie();
        this.setDomElements();
    }

    async getSessionFromCookie(){
        const currentCookieStr = Cookies.get('pct_login');
        if(currentCookieStr === null) return;
        const currentCookie = JSON.parse(atob(currentCookieStr.split('.')[1]));

        const cookieValidation = await window.apiManager.loginValidate();
        if(cookieValidation.status != 'success') return;

        this.user_id = currentCookie.user_id;
        this.active = true;
    }

    logout(){
        this.user_id = null;
        this.active = false;
        Cookies.remove('pct_login');
        this.setDomElements();
    }

    setDomElements(){
        // TODO: Make the elements customizable on object initiation
        if(this.active === true){
            document.getElementById('menu-top-login-li').classList.add('hidden');
            document.getElementById('menu-top-user-li').classList.remove('hidden');
        }else{
            document.getElementById('menu-top-login-li').classList.remove('hidden');
            document.getElementById('menu-top-user-li').classList.add('hidden');
        }
    }
}


