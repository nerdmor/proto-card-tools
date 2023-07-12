class Scryfall{
    static host = 'https://api.scryfall.com';
    static searchMethods = ['fuzzy', 'exact'];

    constructor(){
    }

    async _doFetch(url){
        try {
            const response = await fetch(url);
            const json_result = response.json()
            if(json_result) return json_result;
        } catch(e) {
            console.error('Error:', e);
            return null;
        }
        console.error('Error: ', response);
        return null;
    }

    async sets(setCode, callback=null, passthrough=null){
        const url = `${Scryfall.host}/sets/${setCode}`;
        const response = await this._doFetch(url);
        if(callback){
            callback(response, passthrough);
        }
        return response;
    }

    async cardsNamed(name, method='fuzzy', callback=null, passthrough=null){
        if(!Scryfall.searchMethods.includes(method)){
            throw new Error('invalid value for search method');
        }
        let url = `${Scryfall.host}/cards/named?` + new URLSearchParams({[method]: name});
        const response = await this._doFetch(url);
        if(callback){
            callback(response, passthrough);
        }
        return response;
    }

    async cardsSearch(query, options, callback=null, passthrough=null){
        var url = `${Scryfall.host}/cards/search?`;
        var opts = {'q': query};

        if(options !== null && typeof options === 'object' && !Array.isArray(options)) {
            const validOptions = {
                'unique': ['cards', 'art', 'prints'],
                'order': ['name', 'set', 'released', 'rarity', 'color', 'usd', 'tix', 'eur', 'cmc', 'power', 'toughness', 'edhrec', 'penny', 'artist', 'review'],
                'dir': ['auto', 'asc', 'desc'],
                'include_extras': ['true', 'false'],
                'include_multilingual': ['true', 'false'],
                'include_variations': ['true', 'false'],
                'page': 'number',
                'format': ['csv', 'json'],
                'pretty': ['true', 'false']
            };

            const validOptionKeys = Object.keys(validOptions);
            for (const [key, value] of Object.entries(options)) {
                if(!validOptionKeys.includes(key)) continue;
                if(Array.isArray(validOptions[key])){
                    if(!validOptions[key].includes(value)) continue;
                }else if(typeof value != validOptions[key]) continue;
                opts[key] = value;
            }
        }

        url = url + new URLSearchParams(opts);
        const response = await this._doFetch(url);
        if(callback){
            callback(response, passthrough);
        }
        return response;
    }
}