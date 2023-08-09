class SessionManager{
    constructor(domain, storageManager){
        this.domain = domain;
        this.storageManager = storageManager;
    }

    async requestLogin(){
        const response = await fetch(`${this.domain}/login`);
        const details = await response.json();

        if(!Object.hasOwn(details, 'authorization_url')) return;

        window.location.href = details.authorization_url;
    }
}
window.loadedModules.push('session');