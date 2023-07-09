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
            'default': ['🔄', '❓', '✅', '❌'],
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
        }
    }

    constructor(values=null){
        this.validKeys = Object.keys(SettingsManager.keys);
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

    setValue(key, value){
        if(!this.validKeys.includes(key)) return;
        if(SettingsManager.keys[key].type == 'Array' && !Array.isArray(value)) return;
        if(SettingsManager.keys[key].type != typeof(value)) return;
        this[key] = value;
        console.log(this);
    }
}