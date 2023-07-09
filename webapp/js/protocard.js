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
                  <div class="icon-group">%%rarityicons%%</div>
                  <nav class="d-inline-flex mt-2 mt-md-0 ms-md-auto btn-group">
                    <a class="btn btn-outline-secondary btn-sm py-2 link-body-emphasis text-decoration-none card-quantity">%%quantity%%</a>
                    <a class="btn btn-outline-secondary btn-sm py-2 link-body-emphasis text-decoration-none card-burger-menu" href="#"><i class="bi bi-three-dots"></i></a>
                  </nav>
                </div>
                <div class="card-body finder-card-body">
                  <img class="finder-card-image" src="%%cardimageurl%%" alt="%%cardname%%">
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
          <div class="col-6 col-md-1 table-card-quantity">
              <form class="table-card-quantity-form input-group" role="group">
                <button type="button" class="btn btn-sm btn-secondary table-card-quantity-control table-card-minus"><i class="bi bi-dash-lg"></i></button>
                <input type="text" class="form-control form-control-sm table-card-row-quantity table-card-quantity-control" value="%%quantity%%">
                <button type="button" class="btn btn-sm btn-secondary table-card-quantity-control table-card-plus"><i class="bi bi-plus-lg"></i></button>
              </form>
          </div>
          <div class="col-6 col-md-3 align-middle">
            <span class="table-card-name align-middle">%%name%%</span>
          </div>
          <div class="col-6 col-md-2 table-card-cost">%%cardcost%%</div>
          <div class="col-6 col-md-1 table-card-set">
            <div class="table-card-set-span">
              <button type="button" class="btn btn-sm btn-light card-select-set">
                <img src="%%seticonurl%%" class="table-card-set-icon card-select-set" alt="%%setname%%">
              </button>
            </div>
          </div>
          <div class="col-4 col-md-2 table-card-rarity">
            <div class="table-card-rarity-span align-middle">
              %%rarityicons%%
            </div>
          </div>
          <div class="col-4 col-md-1 table-card-status-symbol align-middle">
            <button type="button" class="btn btn-sm btn-outline-secondary card-status-button table-card-status-button">%%cardstatus%%</button>
          </div>
          <div class="col-4 col-md-2 table-card-control">
            <button type="button" class="btn btn-sm btn-light table-card-details"><i class="bi bi-three-dots"></i></button>
            <button type="button" class="btn btn-sm table-card-trash"><i class="bi bi-trash"></i></button>
          </div>
        `,
        outerModel: `
            <div id="table-card-key-%%cardkey%%" class="row align-middle table-card-row table-card-%%cardguild%%" card_key="%%cardkey%%">
            %%innermodel%%
            </div>
        `,
        costItemModel: `<i class="ms ms-%%costclass%% ms-cost ms-shadow cost-icon"></i>`,
        rarityIconModel: `<span class="table-card-rarity-icon" alt="%%alt%%"> <i class="ms ms-cost ms-shadow ms-grad ms-rarity ms-%%rarityletter%%"></i> </span>`,
        statusNullModel: `<i class="bi bi-border"></i>`
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

    static detailsModels = {
        cardModel: `
            <div class="row card-details-body">
              <div class="col-md-5 col-sm-12 card-details-image-wrapper">
                <img src="%%cardimageurl%%" alt="%%cardname%%">
              </div>
              <div class="col-md-7 col-sm-12 card-details-description">
                <div class="row card-details-row card-details-top">
                  <div class="col-6 card-details-name">%%cardname%%</div>
                  <div class="col-6 card-details-cost">%%cardcost%%</div>
                </div>
                <div class="row card-details-row card-details-type">%%typeline%%</div>
                <div class="row card-details-row card-details-body">%%oracletext%%</div>
                <div class="row card-details-row card-details-stats">
                    <span class="card-details-stats-wrapper">%%cardstats%%</span>
                </div>
                <div class="row card-details-row card-details-links">
                  <div class="col-1">
                    <a class="btn btn-outline-secondary card-details-scryfall-link" target="_blank" href="%%scryfallurl%%">
                      <svg focusable="false" aria-hidden="true" width="460" height="460" viewBox="0 0 460 460" xmlns="http://www.w3.org/2000/svg"><g transform="translate(-60 -58)" fill="none" fill-rule="evenodd"><circle fill="#000" opacity=".09" cx="290" cy="288" r="230"></circle><path fill="#BC979D" d="M279.508 112.547l-.028 361.84 43.137 6.808 56.715-13.23 28.54-72.547-28.044-178.926-31.887-113.004"></path><path fill="#AE7F9C" d="M281.57 100.633l-2.457 383.13-67.972-21.888 13.9-355.852"></path><path d="M207.05 113.316v344.032S87.364 394.5 93.388 283.043C99.41 171.586 207.05 113.316 207.05 113.316z" fill="#786076"></path><path d="M237.375 107.21l-30.603 4.35s-20.682 10.42-37.922 25.5c-75.19 167.948 108.332 115.1-12.725 286.69 50.647 47.86 72.293 41.137 72.293 41.137l8.957-357.676z" fill="#947A92"></path><path d="M343.058 89.985c-109.36-29.303-221.77 35.597-251.073 144.957-29.303 109.36 35.597 221.77 144.957 251.073 109.36 29.303 221.77-35.597 251.073-144.957 29.303-109.36-35.597-221.77-144.957-251.073zM256.342 451.95l.276.71c1.172 3.187 3.562 5.776 6.644 7.2 3.082 1.422 6.603 1.562 9.788.387l48.355-17.774c3.184-1.175 6.706-1.035 9.787.388 3.082 1.424 5.472 4.013 6.644 7.2l.19.56c2.105 5.852-.304 12.37-5.71 15.448-93.23 22.17-187.912-30.724-217.912-121.736s14.67-189.84 102.81-227.453c5.144.502 9.544 3.91 11.32 8.762 2.578 6.977 10.317 10.55 17.3 7.99l15.73-5.803c3.186-1.176 6.707-1.036 9.79.387 3.08 1.423 5.47 4.012 6.643 7.198l.19.56c1.174 3.185 1.034 6.706-.39 9.788-1.422 3.082-4.01 5.472-7.197 6.644l-109.46 40.366c-3.187 1.172-5.777 3.562-7.2 6.644-1.422 3.082-1.562 6.603-.388 9.788l.19.56c1.172 3.186 3.562 5.775 6.643 7.198 3.082 1.423 6.603 1.563 9.788.388l80.06-29.483c3.184-1.174 6.705-1.034 9.787.388 3.082 1.423 5.472 4.013 6.644 7.2l.19.56c1.173 3.184 1.034 6.705-.39 9.787-1.422 3.08-4.01 5.47-7.197 6.643l-127.814 47.08c-3.186 1.17-5.776 3.56-7.2 6.643-1.42 3.082-1.56 6.603-.387 9.788l.19.56c1.172 3.186 3.562 5.775 6.643 7.198 3.08 1.423 6.602 1.563 9.787.388L297.72 226.4c3.184-1.175 6.705-1.036 9.787.387 3.082 1.423 5.472 4.012 6.644 7.198l.467 1.27c1.174 3.186 1.035 6.707-.388 9.79-1.424 3.08-4.014 5.47-7.2 6.643l-113 41.54c-3.187 1.172-5.777 3.562-7.2 6.644-1.422 3.08-1.562 6.603-.387 9.787l.19.56c1.17 3.185 3.56 5.775 6.643 7.198 3.08 1.423 6.603 1.562 9.787.388l51.798-19.06c3.186-1.174 6.707-1.034 9.79.39 3.08 1.422 5.47 4.01 6.643 7.197l.19.56c1.174 3.185 1.034 6.706-.39 9.788-1.422 3.083-4.01 5.473-7.197 6.644l-89.085 32.754c-3.185 1.17-5.774 3.56-7.197 6.643-1.423 3.083-1.562 6.604-.388 9.79l.19.56c1.17 3.185 3.56 5.775 6.643 7.197 3.082 1.423 6.603 1.563 9.788.388L304.563 336.3c3.185-1.173 6.706-1.034 9.788.39 3.083 1.422 5.473 4.01 6.644 7.197l.19.56c1.174 3.185 1.035 6.706-.388 9.788s-4.013 5.472-7.198 6.644l-74.954 27.54c-3.186 1.17-5.776 3.56-7.2 6.643-1.422 3.082-1.56 6.603-.387 9.788l.19.56c1.172 3.187 3.562 5.777 6.643 7.2 3.082 1.422 6.603 1.562 9.788.387l94.147-34.537c3.185-1.175 6.706-1.035 9.788.388s5.472 4.012 6.644 7.198c2.428 6.58-.893 13.887-7.447 16.384l-86.903 33.168c-3.18 1.18-5.764 3.574-7.18 6.658-1.414 3.083-1.547 6.603-.367 9.784l-.018-.09z" fill="#FFF"></path></g></svg>
                    </a>
                  </div>
                  <div class="col-1">
                    <a class="btn btn-outline-secondary card-details-edhrec-link" target="_blank" href="%%edhrecurl%%">
                      <svg focusable="false" aria-hidden="true" width="386" height="351" viewBox="0 0 386 351" xmlns="http://www.w3.org/2000/svg"><g fill-rule="nonzero" fill="#000"><path d="M192.8 87.7L155.5 105l-27.7 12.8.2 147.2 64.8-30.3 64.8 30.3V117.7l-38-17.6"></path><path d="M126.3 43.2l10.7-5 29.3 62.8-10.8 5M248.8 38.2l10.5 5.1-29.1 62.7-10.6-4.9"></path><circle cx="124.2" cy="24.7" r="19.1"></circle><circle cx="261.8" cy="24.7" r="19.1"></circle><path d="M104.3 177.6l-80.8 37.6v98.6l80.8-37.7M281.7 177.5l80.9 37.7v98.5l-80.9-37.6M.1 350.6L193 260.7l192.8 89.7M142.6 39.9l60.7-33.2-.9 14.8L256.6.7l-60.5 33.1 1.2-13.5"></path></g></svg>
                    </a>
                  </div>

                  <div class="col-1">
                    <a class="btn btn-outline-secondary card-details-liga-link" target="_blank" href="%%ligamagicurl%%">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512" xml:space="preserve"> <defs>  <style type="text/css">   .st0{fill:#CA4F1C;}   .st1{fill:#DC8B6A;}   .st2{fill:#FEFEFE;}  </style> </defs> <path class="st0" d="M512.1,236.1v41c-1.1,7-1,14.1-1.7,21.2c-1.5,16.2-6.2,31.7-11.8,46.8c-11,29.6-26.5,56.7-47.4,80.4  c-21.1,23.9-45.4,43.9-73.8,58.7c-20.9,11.1-43.2,19.3-66.3,24.4c-10.3,2.2-20.8,2.2-31.2,3c-1.3,0.1-2.7-0.4-3.8,0.5h-41  c-7-1.1-14.2-1-21.2-1.7c-16.2-1.5-31.7-6.2-46.8-11.8c-29.6-11-56.7-26.5-80.4-47.4c-23.9-21.1-43.9-45.4-58.7-73.8  C17,356.5,8.7,334.2,3.6,311.1c-2.2-10.1-2.1-20.4-3-30.7c-0.1-1.1,0.4-2.3-0.5-3.3v-42c1.1-7,1-14.2,1.7-21.2  c1.5-16.1,6.1-31.4,11.6-46.4C23.3,140.8,36.9,116,55,93.9c22.6-27.4,49.1-50,80.8-66.4c20.2-10.6,41.7-18.6,64-23.6  c12.4-2.7,25-3,37.7-3.3c3.2-0.3,6.4,0.6,9.6-0.5h29c7.4,1,14.8,1,22.2,1.7c16.2,1.5,31.7,6.2,46.8,11.8  c29.6,11,56.7,26.5,80.3,47.5c24,21.2,44.1,45.6,58.9,74.2c11,20.8,19.1,42.9,24.2,65.9c2.2,10.3,2.2,20.8,3,31.2  C511.7,233.5,511.2,234.9,512.1,236.1z"/> <path class="st1" d="M236.9,1c0.1-0.3,0.2-0.6,0.2-0.9h10C243.8,1.6,240.4,1.3,236.9,1z"/> <path class="st2" d="M134.9,340.1c4.2-8.3,8.2-16.3,12.2-24.3c6-11.9,11.8-23.8,18-35.6c1.5-2.8,1.1-4.7-0.9-7  c-17.2-19.7-32.4-41-45.4-63.6c-13.4-23.4-24-47.9-27.2-74.9c-1.9-15.8,1-30.7,13.5-42c7.6-6.9,17.2-9.3,27.2-9.6  c20.2-0.6,39.2,4.7,57.5,12.6c31.8,13.6,59.4,33.8,86.1,55.3c31.3,25.2,59.5,54,84.3,85.7c18.5,23.6,35.2,48.4,47.4,75.9  c8.3,18.8,14.2,38.2,13.7,59.3c-0.6,23.9-16.2,40.3-40.3,41.1c-20.2,0.7-39.2-4.6-57.6-12.4c-32.3-13.8-60.4-34.1-87.2-56.3  c-3.1-2.7-7.1-4.2-11.2-4.1c-28.5,0.2-57,0.1-85.5,0.1C138.2,340.3,136.9,340.2,134.9,340.1z"/> <path class="st0" d="M258,340.3c11.7,0,23.7-0.3,35.6,0.1c4.8,0.2,7.4-1.2,9.5-5.7c5.2-11.3,11-22.3,17-34.2H209.8  c5.5-10.8,10.5-20.9,15.6-30.9c14.3-28.3,28.7-56.6,43-84.9c4-7.8,8-15.7,11.9-23.6c1.3-2.8,2.2-2.3,4.2-0.6  c20.8,17.5,40,36.6,57.6,57.3c19.4,22.9,36.9,47.1,50.4,73.9c10.5,20.8,18.5,42.4,16.7,66.4c-1.4,18.3-14.6,31.5-32.8,32.9  c-20.5,1.7-39.5-4-57.9-12.2c-21.5-9.6-40.9-22.7-59.8-36.6C258,342,257.6,341.2,258,340.3C258,340.4,258,340.3,258,340.3z"/> <path class="st0" d="M174.1,261.5c-21.5-26.7-40.9-53.8-53-85.4c-5.3-13.8-8.7-27.9-8.4-42.8c0.4-24.5,14.5-38.7,39-38.8  c18.6-0.1,36.1,5.3,52.9,13c26,12,49.1,28.4,71.2,46.4c0.2,0.2,0.3,0.5,0.7,1.5h-15.4c-9.7,0-19.3,0.1-29-0.1  c-2.9,0-4.4,0.8-5.8,3.4c-14.4,28.5-28.8,56.9-43.2,85.3C180.2,249.6,177.4,255.2,174.1,261.5z"/> </svg>
                    </a>
                  </div>

                  <div class="col-9"> &nbsp;</div>
                </div>
              </div>
            </div>
        `,
        loyaltyModel: `<i class="ms %%loyaltydirection%% ms-loyalty-%%loyalty%%"></i>`,
        defenseModel: `<i class="ms ms-defense ms-defense-print ms-defense-%%defense%%"></i>`,
        sagaModel: `<i class="ms ms-saga ms-saga-%%chapter%%"></i>`
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
        this.urls = {
            'scryfall': null,
            'ligamagic': null,
            'edhrec': null
        };
        this.manaCosts = [];
        this.oracleText = '';
        this.stats = '';


        // calculated from Scryfall
        this.isLand = false;
        this.isMulticolor = false;
        this.isColorless = false;
        this.statType = null;

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

    matchesFilters(filters){
        var result = true;
        if(Object.hasOwn(filters, 'color') && filters.color.length > 0){
            result = false;
            for(const colorKey of filters.color){
                if(this.colors.includes(colorKey)){
                    result = true;
                    break;
                }
                if(colorKey == 'multi' && this.isMulticolor){
                    result = true;
                    break;
                }
                if(colorKey == 'c' && this.isColorless){
                    result = true;
                    break;
                }
                if(colorKey == 'land' && this.isLand){
                    result = true;
                    break;
                }
            }
            if(result === false) return false;
        }


        if(Object.hasOwn(filters, 'rarity') && filters.rarity.length > 0){
            result = false;
            for(const rarityKey of filters.rarity){
                if(this.rarities.includes(rarityKey)){
                    result = true;
                    break;
                }
            }
            if(result === false) return false;
        }

        if(Object.hasOwn(filters, 'status') && filters.status.length > 0){
            if(filters.status.includes(this.status)){
                result = true;
            }else{
                result = false;
            }
            if(result === false) return false;
        }

        return result;
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
            return this._drawInnerFind(setData);
        else if(printmode == 'table')
            return this._drawInnerTable(setData);
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
                                                  .replaceAll('%%cardname%%', this.name)
                                                  .replaceAll('%%cardimageurl%%', this.sets[this.selectedSet].images[window.settings.cardImgQuality])
                                                  .replaceAll('%%cardstatus%%', this.status === null ? '&nbsp;' : this.status);
        var rarityIcons = [];
        for (const e of this.rarities) {
            if(window.constants.rarities.includes(e)){
                rarityIcons.push(ProtoCard.findModels.baseRarityModel.replaceAll('%%rarity%%', e.charAt(0).toLowerCase()));
            }
        }
        rarityIcons = rarityIcons.join('');
        html = html.replaceAll('%%rarityicons%%', rarityIcons);
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
                rarityIcons.push(ProtoCard.tableModels.rarityIconModel.replaceAll('%%rarityletter%%', e.toLowerCase())
                                                                      .replaceAll('%%alt%%', e)
                                );
            }else{
                console.log(`${e} is not a rarity, it seems`);
            }
        }
        rarityIcons = rarityIcons.join('');

        var html = ProtoCard.tableModels.innerModel.replaceAll('%%quantity%%', String(this.quantity))
                                                   .replaceAll('%%name%%', this.names.compiled)
                                                   .replaceAll('%%cardcost%%', this._makeCostIcons())
                                                   .replaceAll('%%rarityicons%%', rarityIcons)
                                                   .replaceAll('%%seticonurl%%', setData[this.selectedSet].icon_svg_uri)
                                                   .replaceAll('%%setname%%', setData[this.selectedSet].name)
                                                   .replaceAll('%%cardstatus%%', this.status === null ? ProtoCard.tableModels.statusNullModel : this.status);

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
        if(this.typeLine.toLowerCase().indexOf('artifact') > -1) return 'artifact';
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

    drawDetails(){
        var stats = '';
        if(this.statType == 'p/t') stats = this.stats;
        else if(this.statType == 'defense') stats = ProtoCard.detailsModels.defenseModel.replaceAll('%%defense%%', this.stats);
        else if(this.statType == 'loyalty') stats = ProtoCard.detailsModels.loyaltyModel.replaceAll('%%loyaltydirection%%', 'ms-loyalty-start').replaceAll('%%loyalty%%', this.stats);

        var oracleText = this.oracleText.split('\n');
        var tmpText = [];
        var matches = null
        var tmpLine = '';
        if(this.typeLine.indexOf('Planeswalker') > -1){
            for(const line of oracleText){
                matches = line.match(/^([\+\-−]?)(\d+)/i);
                if(!matches){
                    tmpText.push(`<p>${line}</p>`);
                    continue;
                }

                tmpLine = ProtoCard.detailsModels.loyaltyModel;
                if(matches[1] == '-' || matches[1] == '−'){
                    tmpLine = tmpLine.replaceAll('%%loyaltydirection%%', 'ms-loyalty-down').replaceAll('%%loyalty%%', matches[2]);
                }else if(matches[1] == '+'){
                    tmpLine = tmpLine.replaceAll('%%loyaltydirection%%', 'ms-loyalty-up').replaceAll('%%loyalty%%', matches[2]);
                }else{
                    tmpLine = tmpLine.replaceAll('%%loyaltydirection%%', 'ms-loyalty-zero').replaceAll('%%loyalty%%', matches[2]);
                }

                tmpText.push(`<p>${line.replaceAll(matches[0], tmpLine)}</p>`);
            }
            oracleText = tmpText;
        }else{
            var tmpText = [];
            for(const line of oracleText){
                tmpText.push(`<p>${line}</p>`);
            }
            oracleText = tmpText;
        }
        oracleText = oracleText.join('\n');

        return ProtoCard.detailsModels.cardModel.replaceAll('%%cardimageurl%%',this.sets[this.selectedSet].images['normal'])
                                                .replaceAll('%%cardname%%', this.name)
                                                .replaceAll('%%cardcost%%', this._makeCostIcons())
                                                .replaceAll('%%typeline%%', this.typeLine)
                                                .replaceAll('%%oracletext%%', oracleText)
                                                .replaceAll('%%cardstats%%', stats)
                                                .replaceAll('%%scryfallurl%%', this.urls.scryfall)
                                                .replaceAll('%%edhrecurl%%', this.urls.edhrec)
                                                .replaceAll('%%ligamagicurl%%', this.urls.ligamagic);
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

    _addRarity(rarity, setCode){
        if(setCode == 'sld' && window.settings.sldIsSpecial == true){
            this.rarities.push('special');
            return;
        }
        this.rarities.push(rarity.toLowerCase());
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
                this.cmc = scrycard.cmc;
                this.name = firstFace.name;
                this.names.main = firstFace.name;
                this.data = scrycard;
                this.urls.scryfall = scrycard.scryfall_uri;
                if(Object.hasOwn(scrycard, 'related_uris')){
                    if (Object.hasOwn(scrycard.related_uris, 'edhrec')){
                        this.urls.edhrec = scrycard.related_uris.edhrec;
                    }
                }

                for (var c = 0; c < firstFace.colors.length; c++) {
                    this.colors.push(firstFace.colors[c].toLowerCase());
                }
                if(this.colors.length > 1) this.isMulticolor = true;
                else if(this.colors.length == 0) this.isColorless = true;


                // this.typeLine = onlyUnique(firstFace.type_line.replaceAll(' // ', ' ').replaceAll(' - ', ' ').toLowerCase().split(' '));
                this.typeLine = firstFace.type_line;

                this.oracleText = firstFace.oracle_text;
                if(Object.hasOwn(firstFace, 'power')){
                    this.stats = `${firstFace.power}/${firstFace.toughness}`;
                    this.statType = 'p/t';
                }else if(Object.hasOwn(firstFace, 'defense')){
                    this.stats = firstFace.defense;
                    this.statType = 'defense';
                }else if(Object.hasOwn(firstFace, 'loyalty')){
                    this.stats = firstFace.loyalty;
                    this.statType = 'loyalty';
                }

                if(firstFace.type_line.toLowerCase().indexOf('land') > -1) this.isLand = true;
            }
            this.sets[scrycard['set']] = {
                'rarity': translateRarity(scrycard['rarity']),
                'images': firstFace.image_uris
            }

            this._addRarity(scrycard.rarity, scrycard['set']);
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

            this._addRarity(scrycard.rarity, scrycard['set']);

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
            // ordering and setting rarities
            var tmp = [];
            for(const rar of window.constants.rarities){
                if(this.rarities.includes(rar)){
                    tmp.push(rar);
                }
            }
            this.rarities = tmp;

            this.names.faces = onlyUnique(this.names.faces);
            this.names.compiled = this.names.faces.join(' // ');
            this.urls.ligamagic = `https://www.ligamagic.com.br/?view=cards/card&card=${this.names.compiled}`;
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