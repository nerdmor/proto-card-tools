class CardList{
    static allowedModes = ['find', 'table'];
    static modeOuterClass = {
        'find': 'finder-card',
        'table': 'table-card-row'
    };

    static filterModels = {
        'statusNullModel': `
            <div class="form-check form-check-inline filter-check-group">
              <input id="filters-status-null" class="form-check-input filter-check filter-check-status" type="checkbox" value="null">
              <label class="form-check-label" for="filters-status-null" aria-label="no status"><i class="bi bi-border"></i></label>
            </div>
        `,
        'statusModel': `
            <div class="form-check form-check-inline filter-check-group">
              <input id="filters-status-%%statusindex%%" class="form-check-input filter-check filter-check-status" type="checkbox" value="%%statusicon%%">
              <label class="form-check-label" for="filters-status-%%statusindex%%" aria-label="no status">%%statusicon%%</label>
            </div>
        `,
        'buttonModel': `
            <button id="filters-status-all" type="button" class="btn btn-sm btn-outline-secondary btn-extra-small"><i class="bi bi-check-all"></i></button>
        `
    };


    constructor(statusList=null, cardMode=null){
        this.cardMode = cardMode || Cardlist.allowedModes[0];
        this.name = makeFunnyName();
        this.cardQueue = [];
        this.cards = {};
        this.sets = {};
        this.statusList = statusList || [];
        this.filters = {};
        this.filteredCards = [];
        this.public = false;
        this.lastUpdate = Math.floor((new Date()).getTime() / 1000);

        // modals
        this.loadingCardsModal = null;
        this.loadingSetsModal = null;
        this.cardSetSelectionModal = null;
        this.cardDetailsModal = null;
        this.loadErrorModal = null;
        this.listPropertiesModal = null;
        this.fileSelectModal = null;
        this.archidektFileImportModal = null;

        this.errors = [];
        this.scryfallClient = null;

        this.changeCallback = null;
        this.loadSuccessCallback = null;

        this.resetFilters();
    }

    initModals(loadingCardsModal, loadingSetsModal, cardSetSelectionModal, cardDetailsModal, loadErrorModal, listPropertiesModal, fileSelectModal, archidektFileImportModal){
        this.loadingCardsModal = loadingCardsModal;
        this.loadingSetsModal = loadingSetsModal;
        this.cardSetSelectionModal = cardSetSelectionModal;
        this.cardDetailsModal = cardDetailsModal;
        this.loadErrorModal = loadErrorModal;
        this.listPropertiesModal = listPropertiesModal;
        this.fileSelectModal = fileSelectModal;
        this.archidektFileImportModal = archidektFileImportModal;

        this.listPropertiesModal.registerCallbacks((s) => this._saveSettings(s));
        this.fileSelectModal.registerCallbacks((fc, ft) => this.ingestFile(fc, ft));
        this.archidektFileImportModal.registerCallbacks(
            (cat) => {this._processArchidektCategoriesSelection(cat)},
            () => { this._callBackClearQueue(); }
        );
    }

    _callLoadSuccessCallBack(){
        if(this.loadSuccessCallback){
            this.loadSuccessCallback(this.draw());
        }
    }

    _saveSettings(settings){
        var changed = false;
        if(settings.name != this.name){
            this.name = settings.name;
            changed = true;
        }

        if(settings.public != this.public){
            this.public = settings.public;
            changed = true;
        }

        if(settings.statusList.length != this.statusList.length){
            this.statusList = settings.statusList;
            changed = true;
        }else{
            for (var i = 0; i < settings.statusList.length; i++) {
                if(settings.statusList[i] != this.statusList[i]){
                    this.statusList = settings.statusList;
                    changed = true;
                    break;
                }
            }
        }

        if(changed == true && this.changeCallback !== null){
            this.changeCallback(this);
        }

    }

    callPropertiesModal(){
        this.listPropertiesModal.call(this);
    }

    callFileSelectModal(loadSuccessCallback=null){
        if(loadSuccessCallback) this.loadSuccessCallback = loadSuccessCallback;
        this.fileSelectModal.call();
    }

    async callCardSelectModal(cardKey, selectionElementQuery, selectionElementPropName, wrapperElementQuery, selectedClass, confirmCallback, cancelCallback){
        const cardBody = this.drawSetSelect(cardKey);
        if(cardBody === null){
            await this.loadSetData();
        }

        this.cardSetSelectionModal.call(
            cardBody,
            selectionElementQuery,
            selectionElementPropName,
            wrapperElementQuery,
            selectedClass,
            (setCode) => {
                this.setCardSelectedSet(cardKey, setCode);
                confirmCallback();
            }, //confirmCallback
            () => {cancelCallback()} // cancelCallback
        );
    }

    callCardDetails(cardKey){
        if(!Object.keys(this.cards).includes(cardKey)) return;
        const html = this.drawCardDetails(cardKey);

        if(!html) return;
        this.cardDetailsModal.call(html);
        return true;
    }

    _filterCards(){
        this.filteredCards = [];
        for(const cardKey of Object.keys(this.cards)){
            if(this.cards[cardKey].matchesFilters(this.filters)){
                this.filteredCards.push(cardKey);
            }
        }
    }

    resetFilters(){
        this.filters = {
            'color': window.constants.colors.slice(),
            'rarity': window.constants.rarities.slice(),
            'status': [...this.statusList.slice(), null]
        };
    }

    addFilter(filterType, value){
        if(Object.hasOwn(this.filters, filterType)){
            if(value === 'null') this.filters[filterType].push(null);
            else this.filters[filterType].push(value);
        }
    }

    _addAllFilters(filterType){
        if(filterType == 'status'){
            this.filters.status = [...this.statusList.slice(), null];
        }else if(filterType == 'color'){
            this.filters.color = window.constants.colors.slice();
        }else if(filterType == 'rarity'){
            this.filters.rarity = window.constants.rarities.slice();
        }
    }

    removeFilter(filterType, value){
        if(!Object.hasOwn(this.filters, filterType)) return;
        if(this.filters[filterType].length == 0) return;

        if(value === 'null') value = null;
        const index = this.filters[filterType].indexOf(value);
        if(index < 0) return;
        this.filters[filterType].splice(index, 1);
    }

    setScryfallClient(client){
        this.scryfallClient = client;
    }

    setCardMode(mode){
        if(!CardList.allowedModes.includes(mode)){
            return false;
        }
        this.cardMode = mode;
    }

    setCardStatus(cardKey, status){
        if(!this.statusList.includes(status) && status != 'next' && card.status !== null) return null;
        if(!Object.keys(this.cards).includes(cardKey)) return null;

        if(status === 'next'){
            status = this._getNextStatus(this.cards[cardKey].status);
        }
        this.cards[cardKey].status = status;
    }

    addCardQuantity(cardKey, newQuant){
        if(!Object.keys(this.cards).includes(cardKey)) return;
        if(this.cards[cardKey].quantity = Math.max(0, this.cards[cardKey].quantity + newQuant));
    }

    setCardQuantity(cardKey, newQuant){
        if(!Object.keys(this.cards).includes(cardKey)) return;
        if(this.cards[cardKey].quantity = Math.max(0, newQuant));
    }

    _getNextStatus(status){
        if(status === null || !this.statusList.includes(status)){
            return this.statusList[0];
        }

        const nextStatus = this.statusList.indexOf(status) + 1;
        if(nextStatus >= this.statusList.length){
            return null;
        }
        return this.statusList[nextStatus];
    }

    _loadSetKeys(){
        for(const cardKey of Object.keys(this.cards)){
            for(const setCode of Object.keys(this.cards[cardKey].sets)){
                if(!this.sets[setCode]){
                    this.sets[setCode] = null;
                }
            }
        }
    }

    async loadSetData(scryfallClient=null, successCallBack=null){
        if(this.scryfallClient == null){
            if(scryfallClient === null){
                throw new Error('a scryfallClient must be provided');
            }
            this.scryfallClient = scryfallClient;
        }

        if(!window.listManager.hasNullSets()){
            if(successCallBack !== null) successCallBack();
            else this._callLoadSuccessCallBack();
            return;
        };

        this.loadingSetsModal.call('Loading Sets');
        const startTimestamp = new Date().getTime();
        var response = null;
        for(const setCode of Object.keys(this.sets)){
            if(this.sets[setCode] === null){
                await delay(100);
                this.loadingSetsModal.update(`set ${setCode.toUpperCase()}`);

                response = await this.scryfallClient.sets(setCode);
                this.sets[setCode] = {
                    'icon_svg_uri': response.icon_svg_uri,
                    'name': response.name
                }
            }
        }

        const elapsedTime = new Date().getTime() - startTimestamp;
        if(elapsedTime < 2000){
            await delay(2000 - elapsedTime);
        }

        this.loadingSetsModal.dismiss(() => {
            if(successCallBack !== null) successCallBack();
            else this._callLoadSuccessCallBack();
            return;
        });
    }

    parseCardLine(text){
        const reWithNum = /^(\d+)( ?[xX]?) (.+)/;
        const reFoil = /^.+ (\[FOIL\])$/;
        const reWithSet = /^(.+) \[([0-9A-Z]{3,4})\]$/;

        var response = {
            'typedName': null,
            'quantity': 1,
            'set': null,
            'foil': false
        };
        text = text.trim();
        if(len(text) < 2){
            return null;
        }

        var match = text.match(reWithNum);
        if(match){
            response.quantity = parseInt(match[1], 10);
            const cutline = `${match[1]}${match[2]||'' }`;
            text = text.substr(text.indexOf(cutline) + cutline.length + 1, 999).trim();
        }

        if(text.match(reFoil)){
            response.foil = true;
            text = text.replaceAll(' [FOIL]', '').trim();
        }

        match = text.match(reWithSet);
        if(match){
            response.set = match[2];
            text = text.substr(0, text.indexOf(` [${match[2]}]`)).trim();
        }

        if(text.length < 2){
            return null;
        }

        text = text.toLowerCase().trim();
        if(text.indexOf('//') > -1){
            text = text.split('//')[0].trim();
        }
        response.typedName = text.replaceAll('\'', '')
                                 .replaceAll(',', '')
                                 .replaceAll(':', '')
                                 .replaceAll('!', '')
                                 .replaceAll('"', '')
                                 .trim()
                                 .toLowerCase();
        return response;
    }

    ingestText(text){
        if(!text) return;
        this.errors = [];

        var typedList = text.split('\n').filter(e => e.length >= 2);
        if(len(typedList) < 1) return;

        this.cardQueue = [];
        var newCard = null;
        var parsedLine = null;
        for (var i = 0; i < typedList.length; i++) {
            if(len(typedList[i]) < 3){
                continue;
            }
            parsedLine = this.parseCardLine(typedList[i]);
            if(!parsedLine){
                this.errors.push({'typedName': typedList[i], 'error': 'could not parse text'});
                continue;
            }

            newCard = new ProtoCard(len(this.cardQueue));
            newCard.buildFromParams({
                typedName: parsedLine.typedName,
                foil: parsedLine.foil,
                selectedSet: parsedLine.set,
                quantity: parsedLine.quantity
            });
            this.cardQueue.push(newCard);
        }

        if (len(this.cardQueue) > 0) return true;
        return false;
    }

    async loadQueueFromScryfall(scryfallClient=null, successCallBack=null, errorCallBack=null){
        if(this.scryfallClient === null){
            if(scryfallClient === null){
                throw new Error('a scryfallClient must be provided');
            }
            this.scryfallClient = scryfallClient;
        }


        this.errors = [];
        if(this.cardQueue.length < 1){
            return;
        }

        this.loadingCardsModal.call();
        const startTimestamp = new Date().getTime();
        await delay(100);

        var newCard = null;
        for (var i = 0; i < this.cardQueue.length; i++) {

            this.loadingCardsModal.update(this.cardQueue[i].typedName);

            await this.cardQueue[i].buildFromScryFall(this.scryfallClient, {'index': i});
            await delay(20);

            newCard = this.cardQueue[i];
            if(newCard.loaded == 2){
                if(Object.keys(this.cards).includes(newCard.key)){
                    this.cards[newCard.key].quantity += newCard.quantity;
                }else{
                    this.cards[newCard.key] = newCard;
                }
            }else{
                if(newCard.errors.length > 0){
                    this.errors = this.errors.concat(newCard.errors);
                }else{
                    this.errors.push({'typedName': newCard.typedName, 'error': 'could not load card from Scryfall'});
                }
            }

            await delay(20);
        }

        const elapsedTime = new Date().getTime() - startTimestamp;
        if(elapsedTime < 2000){
            await delay(2000 - elapsedTime);
        }

        if(this.errors.length > 0){
            this.loadingCardsModal.dismiss(() => {
                errorCallBack(this.errors)
                this.loadErrorModal.call(this.errors);
            });
        }else{
            this.loadingCardsModal.dismiss(() => {
                if(successCallBack) successCallBack();
                else this.loadSetData(null, null);
            });
        }

    }

    ingestFile(fileContents, fileType){
        if(fileType == 'archidekt'){
            this._ingestArchidektFile(fileContents);
        }else if(fileType == 'arena'){

        }else if(fileType == 'mtggoldfish'){

        }else if(fileType == 'mtgotxt'){

        }else if(fileType == 'mtgodek'){

        }else if(fileType == 'mwdeck'){

        }else{
            return;
        }
    }

    // TODO: remove
    ingestArchidektFile(fileList, categoryCallback){
        console.log('this is dead');
        // const reader = new FileReader();
        // reader.onload = (event) => this._ingestArchidektFile(event.target.result.split('\n'), categoryCallback);
        // reader.readAsText(fileList[0]);
    }

    _ingestArchidektFile(splitList){
        console.log(splitList);
        var categories = {};
        var currentCategory = '';

        var newCard = null;
        var match = null;
        const reWithNum = /^(\d+) (.+)/;
        for (const row of splitList) {
            if(row.length < 3) continue;
            match = row.match(reWithNum);
            if(match){
                newCard = new ProtoCard(0);
                newCard.buildFromParams({
                    typedName: match[2],
                    quantity: parseInt(match[1])
                });
                categories[currentCategory].push(newCard);
            }else if(!Object.entries(categories).includes(row)){
                categories[row] = new Array();
                currentCategory = row;
            }
        }

        this.archidektFileImportModal.call(
            categories,
            (cat, par) => {this._processArchidektCategoriesSelection(cat, par)},  // confirmCallback
            () => { this._callBackClearQueue() }  // cancelCallback
        );
    }

    _processArchidektCategoriesSelection(selectedCategories){
        if(!selectedCategories) return;

        this.cardQueue = [];
        for(const catName of Object.keys(selectedCategories)){
            for (var i = 0; i < selectedCategories[catName].length; i++) {
                this.cardQueue.push(selectedCategories[catName][i]);
            }
        }

        if(this.cardQueue.length == 0) return;

        this.loadQueueFromScryfall(
            null,
            () => {  // successCallback
                this.loadSetData(null, null);
            },
            (err) => {}  // errorCallback
        );
    }

    _callBackClearQueue(){
        this.cardQueue = [];
    }

    draw(drawMode = null){
        var html = [];
        drawMode = drawMode || this.cardMode;

        this._filterCards();

        // for(const cardKey of Object.keys(this.cards)){
        for(const cardKey of this.filteredCards){
            html.push(this.cards[cardKey].draw(this.sets, this.cardMode));
        }
        return html.join('\n');
    }

    drawSetSelect(cardKey){
        if(!Object.keys(this.cards).includes(cardKey)) return null;
        if(this.hasNullSets()) return null;
        return this.cards[cardKey].drawSetSelect(this.sets);
    }

    redrawCard(cardKey){
        if(!Object.keys(this.cards).includes(cardKey)) return null;
        const element = document.querySelector(`.${CardList.modeOuterClass[this.cardMode]}[card_key="${cardKey}"]`);
        if(element === null) return null;
        element.innerHTML = this.cards[cardKey].drawInner(this.sets, this.cardMode);
    }

    drawCardDetails(cardKey){
        if(!Object.keys(this.cards).includes(cardKey)) return null;
        return this.cards[cardKey].drawDetails();
    }

    drawStatusFilters(){
        var html = [CardList.filterModels.statusNullModel];
        for (var i = 0; i < this.statusList.length; i++) {
            html.push(CardList.filterModels.statusModel.replaceAll('%%statusindex%%', i)
                                                       .replaceAll('%%statusicon%%', this.statusList[i])
                     );
        }
        // html.push(CardList.filterModels.buttonModel);
        return html.join('\n');
    }

    setCardSelectedSet(cardKey, setCode){
        if(!Object.keys(this.cards).includes(cardKey)){
            return;
        }
        if(!Object.keys(this.sets).includes(setCode)){
            return;
        }
        if(!Object.keys(this.cards[cardKey].sets).includes(setCode)){
            return;
        }
        this.cards[cardKey].selectedSet = setCode;
    }

    removeCard(cardKey){
        if(!Object.keys(this.cards).includes(cardKey)){
            return;
        }

        delete this.cards[cardKey];
    }


    ensureQueueIndex(){
        for (var i = 0; i < this.cardQueue.length; i++) {
            this.cardQueue[i].index = i;
        }
    }

    resetIndex(){
        const keys = Object.entries(this.cards);
        for (var i = 0; i < keys.length; i++) {
            this.cards[keys[i]].index = i;
        }
    }

    resetKeys(){
        const keys = Object.entries(this.cards);
        var newCard = null;
        for (var i = 0; i < keys.length; i++) {
            this.cards[keys[i]].makeKey();
            if(this.cards[keys[i]].key != keys[i]){
                newCard = new ProtoCard(i);
                newCard.buildFromParams(JSON.parse(this.cards[keys[i]].toString()), true);

                delete this.cards[keys[i]];

                this.cards[newCard.key] = newCard;
            }
        }
    }

    hasNullSets(){
        this._loadSetKeys();

        for(const setCode of Object.keys(this.sets)){
            if(this.sets[setCode] === null)
                return true;
        }
        return false;
    }
}