class ApiManager {
    constructor(){
        this.domain = `${window.location.protocol}//${window.location.host}`;
    }

    async fetchJson(url){
        const response = await fetch(url, {
            method: "GET",
            cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
            headers: {
                "Content-Type": "application/json",
            }
        });
        return response.json();
    }

    async cardOracleId(oid){
        const url = `${this.domain}/card/oracle_id/${oid}`;
        const response = await this.fetchJson(url);
        return response;
    }

    async importArchidekt(archidektUrl){
        const url = `${this.domain}/import/archidekt`;

        var data = {
            'url': archidektUrl
        };

        const response = await fetch(url, {
            method: "POST", // *GET, POST, PUT, DELETE, etc.
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data)
        });
        return response.json();
    }

    async cardRandom(quantity){
        const url = `${this.domain}/card/random/${quantity}`;
        const response = await this.fetchJson(url);
        return response;
    }

    async loginValidate(){
        const url = `${this.domain}/login/validate`;
        const response = await this.fetchJson(url);
        return response;
    }

    async loginRenew(){
        const url = `${this.domain}/login/renew`;
        const response = await this.fetchJson(url);
        return response;
    }
}