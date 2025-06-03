class Card{
    constructor(obj=null){
        this.cardKey = '';
        this.pileNumber = 1;
        this.icon = '';
        this.props = {
            'oracle_id': 'oracleId',
            'name': 'name',
            'names': 'names',
            'cmc': 'cmc',
            'color_identity': 'colorIdentity',
            'colors': 'colors',
            'type_line': 'typeLine',
            'types': 'types',
            'number_faces': 'numberFaces',
            'is_white': 'isWhite',
            'is_blue': 'isBlue',
            'is_black': 'isBlack',
            'is_red': 'isRed',
            'is_green': 'isGreen',
            'is_multicolor': 'isMulticolor',
            'is_colorless': 'isColorless',
            'is_land': 'isLand',
            'scryfall_id': 'scryfallId',
            'rarities': 'rarities',
            'set_codes': 'setCodes',
            'number_faces': 'numberFaces',
            'type_line': 'typeLine',
            'types': 'types',
            'selected_variant': 'selectedVariant',
            'quantity': 'quantity',
            'variants': 'variants'
        };

        this.optionalProps = [
            'quantity',
            'selectedVariant'
        ];

        var propInternalName;
        for(const propName in this.props){
            propInternalName = this.props[propName];
            this[propInternalName] = null;
        }

        if(obj!==null){
            this.buildFromObject(obj);
        }
    }

    buildFromObject(obj){
        var propInternalName;
        for(const propName in this.props){
            propInternalName = this.props[propName]
            if(Object.hasOwn(obj, propName)){
                this[propInternalName] = obj[propName];
            }else if(Object.hasOwn(obj, propInternalName)){
                this[propInternalName] = obj[propInternalName];
            }
        }

        if(this.selectedVariant === null || !Object.hasOwn(this.variants, this.selectedVariant)){
            this.selectedVariant = Object.keys(this.variants)[0];
        }
        this.updateKey()
    }

    validate(){
        var propInternalName;
        for(const propName in this.props){
            propInternalName = this.props[propName]
            if(this[propInternalName] === null && !this.optionalProps.includes(propInternalName)){
                return false;
            }
        }
        return true;
    }

    selectVariant(variant=null){
        if(variant === null){
            variant = Object.keys(this.variants)[0];
        }
        if(Object.hasOwn(this.variants, variant)){
            this.selectedVariant = variant;
        }
    }

    updateKey(){
        this.cardKey = this.oracleId + '.' + this.selectedVariant + '.' + this.pileNumber;
    }

    makeOuterHTML(){
        const cardHtml = cardOuterHtmlModel.replaceAll('{{card_key}}', this.cardKey)
                                           .replaceAll('{{innerHTML}}', this.makeInnerHTML());
        return cardHtml;
    }

    makeInnerHTML(){
        return `${this.makeHeaderHTML()}\n${this.makeBodyHTML()}`;
    }

    makeHeaderHTML(){
        return cardHeaderHtmlModel.replaceAll('{{card_key}}', this.cardKey);
    }

    makeBodyHTML(){
        const cardImgUrl = this.variants[this.selectedVariant].image_uri.replaceAll('https://cards.scryfall.io/', `${window.location.protocol}//${window.location.host}/cardimg/`);
        return cardBodyHtmlModel.replaceAll('{{card_key}}', this.cardKey)
                                .replaceAll('{{image_url}}', cardImgUrl)
                                .replaceAll('{{card_icon}}', this.icon);
    }



}