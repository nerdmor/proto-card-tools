class Scryfall{
    static host = 'https://api.scryfall.com';
    static searchMethods = ['fuzzy', 'exact'];

    constructor(){
    }

    async sets(setCode, callback, passthrough){
        const url = `${Scryfall.host}/sets/${setCode}`;
        await fetch(url)
            .then((response) => response.json())
            .then((data) => {
                callback(data, passthrough);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    async cardsNamed(name, callback, passthrough, method='fuzzy'){
        if(!Scryfall.searchMethods.includes(method)){
            throw new Error('invalid value for search method');
        }
        let url = `${Scryfall.host}/cards/named?` + new URLSearchParams({[method]: name});
        await fetch(url)
            .then((response) => response.json())
            .then((data) => {
                callback(data, passthrough);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    async cardsSearch(query, options, callback, passthrough){
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
        await fetch(url)
            .then((response) => response.json())
            .then((data) => {
                callback(data, passthrough);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }
}