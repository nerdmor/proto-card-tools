class SettingsManager{
    static keys = {
        'cardImgQuality': {
            'default': 'normal',
            'type': 'string',
            'possibleValues': ['small', 'normal', 'large', 'png', 'border_crop']
        },
        'deleteCooldown': {
            'default': 1000,
            'type': 'number'
        },
        'enabledStatus': {
            'default': ['✅', '❌', '🔄', '❓'],
            'type': 'Array'
        },
        'sldIsSpecial': {
            'default': true,
            'type': 'boolean'
        },
        'applyFiltersOnFilterChange': {
            'default': true,
            'type': 'boolean'
        },
        'applyFiltersOnStatusChange': {
            'default': false,
            'type': 'boolean'
        },
        'displayMode': {
            'default': 'find',
            'type': 'string',
            'possibleValues': ['find', 'table', 'proxy']
        },
        'useWakeLock': {
            'default': true,
            'type': 'boolean'
        }
    }

    constructor(values=null){
        this.version = '0.1';
        this.validKeys = Object.keys(SettingsManager.keys);
        this.exportKeys = [...this.validKeys, 'version'];
        this.changeTriggers = {};

        if(values===null){
            values = {};
        }
        const valueKeys = Object.keys(values);
        for(const key of this.validKeys){
            if(valueKeys.includes(key)){
                this[key] = values[key];
            }else{
                this[key] = SettingsManager.keys[key].default;
            }
        }
    }

    toString(){
        var result = {};
        for(const key of this.exportKeys){
            result[key] = this[key];
        }
        return JSON.stringify(result);
    }

    setValue(key, value, suppressTriggers=false){
        if(!this.validKeys.includes(key)) return;
        if(SettingsManager.keys[key].type == 'Array' && !Array.isArray(value)) return;
        if(SettingsManager.keys[key].type != typeof(value)) return;
        this[key] = value;

        if(suppressTriggers === true) return;
        if(Object.keys(this.changeTriggers).includes(key)){
            for(const callback of this.changeTriggers[key]){
                callback(key, value);
            }
        }
        if(Object.keys(this.changeTriggers).includes('all')){
            for(const callback of this.changeTriggers['all']){
                callback(key, value);
            }
        }
    }

    loadFromObj(obj, callback=null){
        if(callback){
            const originalValue = this.toString();
        }

        for(const key of Object.keys(obj)){
            this.setValue(key, obj[key], true);
        }

        if(callback){
            const finalValue = this.toString();
            if(originalValue != finalValue) callback(this);
        }
    }



    registerTrigger(key, callback){
        if(!this.validKeys.includes(key) && key != 'all') return;
        if(!Object.keys(this.changeTriggers).includes(key)) this.changeTriggers[key] = [];
        this.changeTriggers[key].push(callback);
    }
}

window.loadedModules.push('settings');