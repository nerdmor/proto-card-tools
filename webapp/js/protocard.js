class ProtoCard{
    static allowedModes = [
        'find', 'table'
    ];

    static unsplittedLayouts = [
        'adventure',
        'split'
    ];

    static findModels = {
        innerModel : `
            <div class="card mb-4 rounded-3 shadow-sm">
                <div class="flex-md-row d-inline-flex align-items-center card-header py-1">
                  <div class="icon-group">%%rarity-icons%%</div>
                  <nav class="d-inline-flex mt-2 mt-md-0 ms-md-auto btn-group">
                    <a class="btn btn-outline-secondary btn-sm py-2 link-body-emphasis text-decoration-none card-quantity">%%quantity%%</a>
                    <a class="btn btn-outline-secondary btn-sm py-2 link-body-emphasis text-decoration-none card-burger-menu" href="#"><i class="bi bi-three-dots"></i></a>
                  </nav>
                </div>
                <div class="card-body finder-card-body">
                  <img class="finder-card-image" src="%%card-image-url%%" alt="%%card-name%%">
                </div>
            </div>
            `,
        outerModel : `
            <div class="finder-card col-md-4 col-sm-12" card_key="%%cardkey%%">
                %%inner-model%%
            </div>
            `,
        baseRarityModel : `
            <span class="rarity-icon-wrapper"><img src="img/mtg_%%rarity%%.png" class="rarity-icon"></span>
            `
    };

    static tableModels = {
        innerModel: `
          <div class="col-1 table-card-quantity">
            <div class="input-group" role="group">
              <button type="button" class="btn btn-sm btn-secondary table-card-quantity-control table-card-minus"><i class="bi bi-dash-lg"></i></button>
              <input type="text" class="form-control form-control-sm table-card-row-quantity table-card-quantity-control" value="%%quantity%%">
              <button type="button" class="btn btn-sm btn-secondary table-card-quantity-control table-card-plus"><i class="bi bi-plus-lg"></i></button>
            </div>
          </div>
          <div class="col-3 align-middle">
            <span class="table-card-name align-middle">%%name%%</span>
          </div>
          <div class="col-3 table-card-cost">%%cardcost%%</div>
          <div class="col-1 table-card-set">
            <div class="table-card-set-span">
              <button type="button" class="btn btn-sm btn-light card-select-set">
                <img src="%%seticonurl%%" class="table-card-set-icon card-select-set" alt="%%setname%%">
              </button>
            </div>
          </div>
          <div class="col-2 table-card-rarity">
            <div class="table-card-rarity-span align-middle">
              %%rarityicons%%
            </div>
          </div>
          <div class="col-1 table-card-status-symbol align-middle">
            <button type="button" class="btn btn-sm btn-outline-secondary">✅</button>
          </div>
          <div class="col-1 table-card-control">
            <button type="button" class="table-card-trash"><i class="bi bi-trash"></i></button>
          </div>
        `,
        outerModel: `
            <div id="table-card-key-%%cardkey%%" class="row align-middle table-card-row table-card-%%cardguild%%" card_key="%%cardkey%%">
            %%innermodel%%
            </div>
        `,
        costItemModel: `<i class="ms ms-%%costclass%% ms-cost ms-shadow cost-icon"></i>`,
        rarityIconModel: `<img src="img/mtg_%%rarityletter%%.png" class="table-card-rarity-icon" alt="%%alt%%">`
    };

    static selectModels = {
        cardModel: `
            <div class="select-card col-md-4 col-sm-12 card_key="%%cardkey%%">
              <div class="card mb-4 rounded-3 shadow-sm select-card-wrapper %%selectedClass%%">
                <div class="flex-md-row d-inline-flex align-items-center card-header py-1">
                  <div class="col-10">
                    <h3 class="card-select-set-name">%%setname%%</h3>
                  </div>
                    <div class="col-2">
                      <span class="card-select-set-icon">
                        <img src="%%seticonurl%%" alt="%%setcode%%">
                      </span>
                  </div>
                </div>
                <div class="card-body card-select-body">
                  <img class="card-select-image" set_code="%%setcode%%" src="%%cardimageurl%%" alt="%%cardname%%">
                </div>
              </div>
            </div>
        `
    };


    constructor(index){
        // defined by user
        this.typedName = null;
        this.quantity = null;
        this.foil = false;
        this.selectedSet = null;

        // loaded from Scryfall
        this.name = null;
        this.names = {
            'main': null,
            'faces': [],
            'compiled': null
        };
        this.rarities = [];
        this.img_urls = {};
        this.valid = false;
        this.data = {};
        this.loaded = 0;
        this.cmc = null;
        this.colors = [];
        this.sets = {};
        this.oracleId = null;
        this.typeLine = null;
        this.scryfallUrl = null;
        this.manaCosts = [];

        // calculated from Scryfall
        this.isLand = false;
        this.isMulticolor = false;
        this.isColorless = false;

        // internal Control
        this.errors = [];
        this.scryfallClient = null;
        this.key = null;
        this.index = index;
        this.status = null;
        this.printmode = null;
    }

    toString(){
        return JSON.stringify(this);
    }

    makeKey(){
        this.key = md5(`${this.names.compiled.replaceAll(' ', '')}-${this.selectedSet}-${this.foil?'foil':'nonfoil'}`);
    }

    drawInner(setData, printmode=null){
        if(printmode === null){
            if(this.printmode === null){
                throw new Error('A Printmode must be provided or set');
            }
            printmode = this.printmode;
        }

        if(printmode == 'find')
            return this._drawInnerFind();
        else if(printmode == 'table')
            return this._drawInnerTable();
        throw new Error('Invalid printmode');
    }

    draw(setData, printmode=null){
        if(printmode === null){
            if(this.printmode === null){
                throw new Error('A Printmode must be provided or set');
            }
            printmode = this.printmode;
        }else{
            this.printmode = printmode;
        }

        if(printmode == 'find')
            return this._drawFind(setData);
        else if(printmode == 'table')
            return this._drawTable(setData);
        throw new Error('Invalid printmode');
    }

    _drawInnerFind(){
        var html = ProtoCard.findModels.innerModel.replaceAll('%%quantity%%', String(this.quantity))
                                        .replaceAll('%%card-name%%', this.name)
                                        .replaceAll('%%card-image-url%%', this.sets[this.selectedSet].images[window.settings.cardImgQuality]);
        var rarityIcons = [];
        for (const e of this.rarities) {
            if(window.constants.rarities.includes(e)){
                rarityIcons.push(ProtoCard.findModels.baseRarityModel.replaceAll('%%rarity%%', e.charAt(0).toLowerCase()));
            }
        }
        rarityIcons = rarityIcons.join('');
        html = html.replaceAll('%%rarity-icons%%', rarityIcons);
        return html;
    }

    _drawFind(setData){
        var html = ProtoCard.findModels.outerModel.replaceAll('%%cardkey%%', this.key)
                                                  .replaceAll('%%inner-model%%', this._drawInnerFind(setData));
        return html;
    }

    _makeCostIcons(){
        var totalCost = [];
        var singleCost = [];

        const bigRegex = /({[\dA-Z\/]+})/g;
        const smallRegex = /{(\d+)}/i;
        var subm = '';
        var colorElement = '';
        for(const cost of this.manaCosts){
            singleCost = [];
            for(const symbol of cost.match(bigRegex)){
                subm = symbol.match(smallRegex);
                if(subm){
                    singleCost.push(ProtoCard.tableModels.costItemModel.replaceAll('%%costclass%%', subm[1]));
                }else{
                    colorElement = symbol.replaceAll(/[\{\}\/]/g, '').toLowerCase();
                    singleCost.push(ProtoCard.tableModels.costItemModel.replaceAll('%%costclass%%', colorElement));
                }
            }

            totalCost.push(singleCost.join(''));
        }

        return totalCost.join('&nbsp;//&nbsp;');
    }

    _drawInnerTable(setData){
        var htmlCost = [];
        var singleCost = [];

        var rarityIcons = [];
        for (const e of this.rarities) {
            if(window.constants.rarities.includes(e)){
                rarityIcons.push(ProtoCard.tableModels.rarityIconModel.replaceAll('%%rarityletter%%', e.charAt(0).toLowerCase()));
            }
        }
        rarityIcons = rarityIcons.join('');

        var html = ProtoCard.tableModels.innerModel.replaceAll('%%quantity%%', String(this.quantity))
                                                   .replaceAll('%%name%%', this.names.compiled)
                                                   .replaceAll('%%cardcost%%', this._makeCostIcons())
                                                   .replaceAll('%%rarityicons%%', rarityIcons)
                                                   .replaceAll('%%seticonurl%%', setData[this.selectedSet].icon_svg_uri)
                                                   .replaceAll('%%setname%%', setData[this.selectedSet].name);

        return html;
    }

    _drawTable(setData){
        var html = ProtoCard.tableModels.outerModel.replaceAll('%%cardkey%%', this.key)
                                                   .replaceAll('%%innermodel%%', this._drawInnerTable(setData))
                                                   .replaceAll('%%cardguild%%', this._getColorCombinationName());
        return html;
    }

    _getColorCombinationName(){
        const colors = sortColors(this.colors);
        if(colors == 'wubrg') return 'wubrg';
        if(colors == 'ubrg') return 'notwhite';
        if(colors == 'wbrg') return 'notblue';
        if(colors == 'wurg') return 'notblack';
        if(colors == 'wubg') return 'notred';
        if(colors == 'wubr') return 'notgreen';

        if(colors == 'wub') return 'esper';
        if(colors == 'bur') return 'grixis';
        if(colors == 'brg') return 'jund';
        if(colors == 'rgw') return 'naya';
        if(colors == 'wug') return 'bant';
        if(colors == 'wbg') return 'abzan';
        if(colors == 'brg') return 'temur';
        if(colors == 'ubg') return 'sultai';
        if(colors == 'wur') return 'jeskai';
        if(colors == 'wbr') return 'mardu';

        if(colors == 'wu') return 'azorius';
        if(colors == 'ub') return 'dimir';
        if(colors == 'br') return 'rakdos';
        if(colors == 'rg') return 'gruul';
        if(colors == 'wg') return 'selesnya';
        if(colors == 'wb') return 'orzhov';
        if(colors == 'ur') return 'izzet';
        if(colors == 'bg') return 'golgari';
        if(colors == 'wr') return 'boros';
        if(colors == 'ug') return 'simic';

        if(colors == 'w') return 'white';
        if(colors == 'u') return 'blue';
        if(colors == 'b') return 'black';
        if(colors == 'r') return 'red';
        if(colors == 'g') return 'green';


        if(this.isLand) return 'land';
        if(this.typeLine.indexOf('artifact') > -1) return 'artifact';
        return 'colorless';
    }

    drawSetSelect(setData){
        var cards = [];
        for(const setCode of Object.keys(this.sets)){
            cards.push(ProtoCard.selectModels.cardModel.replaceAll('%%cardkey%%', this.key)
                                                       .replaceAll('%%selectedClass%%', (setCode == this.selectedSet ? 'select-card-selected' : ''))
                                                       .replaceAll('%%setname%%', setData[setCode].name)
                                                       .replaceAll('%%seticonurl%%', setData[setCode].icon_svg_uri)
                                                       .replaceAll('%%setcode%%', setCode)
                                                       .replaceAll('%%cardimageurl%%', this.sets[setCode].images[window.settings.cardImgQuality])
                                                       .replaceAll('%%cardname%%', this.name)
                      );
        }

        return cards.join('\n');
    }

    buildFromParams(params, calculate=false){
        for (const [key, value] of Object.entries(params)) {
            if(Object.hasOwn(this, key)){
                this[key] = value;
            }
        }

        if(calculate){
            this.makeKey();
        }
    }

    buildFromScryFall(client=null, params=null){
        if(this.typedName === null){
            throw new Error('cannot build from Scryfall with an empty name');
        }

        if(this.scryfallClient === null){
            if(client === null) throw new Error('cannot load from scryfall without a client');
            this.scryfallClient = client;
        }

        // step 1: get oracleID from Scryfall
        if(params === null){
            params = {};
        }
        params = {...params, 'page': 0, 'index':this.index};
        client.cardsNamed(this.typedName, (d, p) => {this._scryFallCardsNamed(d, p)}, params);
    }

    async _scryFallCardsNamed(data, params){
        const responseStatus = data.status || 200;
        if(responseStatus != 200){
            console.log(`error finding ${this.typedName}: ${data.details}`);
            this.errors.push(`error finding ${this.typedName}: ${data.details}`);
            return;
        }

        var hasMore = false;
        if(data.object == 'card'){
            data = [data];
        }else if(data.object == 'list'){
            if(data.has_more == true){
                hasMore = true;
            }
            data = data.data;
        }

        var firstFace = {};
        var scrycard = {};
        for (var i = 0; i < data.length; i++) {
            scrycard = data[i];

            // ensuring we don't try to parse weird layouts
            if(window.constants.invalid_layouts.includes(scrycard.layout)){
                console.log(`invalid layout for ${this.typedName}: ${scrycard.layout}`);
                this.errors.push(`invalid layout for ${this.typedName}: ${scrycard.layout}`);
                return;
            }

            if(Object.hasOwn(scrycard, 'card_faces') && scrycard.layout != 'split' && scrycard.layout != 'adventure'){
                firstFace = scrycard.card_faces[0];
            }else{
                firstFace = scrycard;
            }

            if(this.loaded === 0){
                this.loaded = 1;
                this.oracleId = scrycard.oracle_id;
                this.scryfallUrl = scrycard.scryfall_uri;
                this.cmc = scrycard.cmc;
                this.name = firstFace.name;
                this.names.main = firstFace.name;
                this.data = scrycard;

                for (var c = 0; c < firstFace.colors.length; c++) {
                    this.colors.push(firstFace.colors[c].toLowerCase());
                }
                if(this.colors.length > 1) this.isMulticolor = true;
                else if(this.colors.length == 0) this.isColorless = true;


                this.typeLine = onlyUnique(firstFace.type_line.replaceAll(' // ', ' ').replaceAll(' - ', ' ').toLowerCase().split(' '));
                if(firstFace.type_line.indexOf('Land') > -1){
                    this.isLand = true;
                }
            }
            this.sets[scrycard['set']] = {
                'rarity': translateRarity(scrycard['rarity']),
                'images': firstFace.image_uris
            }

            this.rarities.push(scrycard.rarity.toLowerCase());
        }


        // now we search for "all versions"
        await delay(100);
        params['page'] = 1;
        await this.scryfallClient.cardsSearch(`!"${this.name}"`, {'unique': 'prints'}, (d, p) => this._scryFallCardsSearch(d, p), params);
    }

    async _scryFallCardsSearch(data, params){
        const responseStatus = data.status || 200;
        if(responseStatus != 200){
            console.log(`error finding ${this.typedName}: ${data.details}`);
            this.errors.push(`error finding ${this.typedName}: ${data.details}`);
            return;
        }

        var hasMore = false;
        if(data.object == 'card'){
            data = [data];
        }else if(data.object == 'list'){
            if(data.has_more == true){
                hasMore = true;
            }
            data = data.data;
        }

        var currentFace = {};
        var scrycard = {};
        for (var i = 0; i < data.length; i++) {
            scrycard = data[i];

            // ensuring we don't try to parse weird layouts
            if(window.constants.invalid_layouts.includes(scrycard.layout)){
                console.log(`invalid layout for ${this.typedName}: ${scrycard.layout}`);
                this.errors.push(`invalid layout for ${this.typedName}: ${scrycard.layout}`)
                return;
            }

            this.rarities.push(scrycard.rarity.toLowerCase());

            if(!Object.hasOwn(scrycard, 'card_faces')){
                scrycard.card_faces = [scrycard];
            }

            for (var j = 0; j < scrycard.card_faces.length; j++) {
                currentFace = scrycard.card_faces[j];

                if(j == 0){
                    this.sets[scrycard['set']] = {
                        'rarity': translateRarity(scrycard['rarity']),
                        'images': currentFace.image_uris
                    }
                }

                if(!this.names.faces.includes(currentFace.name)){
                    this.names.faces.push(currentFace.name);
                }

                if(!this.manaCosts.includes(currentFace.mana_cost)){
                    this.manaCosts.push(currentFace.mana_cost);
                }
            }
        }

        if(hasMore == true){
            await delay(100);
            params['page'] += 1;
            await this.scryfallClient.cardsSearch(`!"${this.name}"`, {'unique': 'prints', 'page': params.page}, (d, p) => this._scryFallCardsSearch(d, p), params);
        }else{
            this.rarities = onlyUnique(this.rarities);
            this.names.faces = onlyUnique(this.names.faces);
            this.names.compiled = this.names.faces.join(' // ');
            this.loaded = 2;

            if(this.selectedSet === null || !Object.keys(this.sets).includes(this.selectedSet)){
                this.selectedSet = Object.keys(this.sets)[0];
            }

            this.makeKey();

            // if we have a callback, call it
            if(Object.hasOwn(params, 'callback')){
                params['callback'](params);
            }
        }

    }


}