/**
 * General manager for cardlists. Should do most of what is needed to keep a list sane.
 */
class CardList{
    static allowedModes = ['find', 'table', 'proxy'];
    static modeOuterClass = {
        'find': 'finder-card',
        'table': 'table-card-row'
    };
    static allowedSorts = ['name', 'color', 'manavalue', 'collectornumber'];

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
        this.id = null;
        this.user_id = null;
        this.comments = null;
        this.cardMode = cardMode || Cardlist.allowedModes[0];
        this.name = makeFunnyName();
        this.cardQueue = [];
        this.quickQueue = [];
        this.cards = {};
        this.sets = {};
        this.statusList = statusList || [];
        this.filters = {};
        this.filteredCards = [];
        this.public = false;
        this.lastUpdate = moment.tz();

        this.sortField = 'name';
        this.sortDirection = 'asc';

        this.errors = [];
        this.scryfallClient = null;
        this.alertManager = null;

        // modals
        this.loadingCardsModal = null;
        this.loadingSetsModal = null;
        this.cardSetSelectionModal = null;
        this.cardDetailsModal = null;
        this.loadErrorModal = null;
        this.listPropertiesModal = null;
        this.fileSelectModal = null;
        this.archidektFileImportModal = null;


        this.changeCallback = null;
        this.loadSuccessCallback = null;

        this.resetFilters(true);
    }

    /**
     * Creates a new list by resetting all mutable states.
     *
     * @param   {String[]}  [statusList]  Array of status (emojis) to be used for this list. Defaults to an empty Array.
     *
     * @return  {null}
     */
    newList(statusList=null){
        this.id = null;
        this.user_id = null;
        this.comments = null;
        this.name = makeFunnyName();
        this.cardQueue = [];
        this.quickQueue = [];
        this.cards = {};
        this.sets = {};
        this.statusList = statusList || [];
        this.filters = {};
        this.filteredCards = [];
        this.public = false;
        this.lastUpdate = moment.tz();

        this.sortField = 'name';
        this.sortDirection = 'asc';

        this.errors = [];

        this.resetFilters(true);
    }

    /**
     * Internal function. Loads self characteristics from a given object, prioritizing those that are essential or that need special treatment.
     *
     * @param   {Object}  values    Object to load data from. Keys should match this object's keys. For a reference, please look at the constructor.
     *
     * @return  {null}
     */
    _loadFromObject(values){
        var newCard = null;
        // prioritize statusList
        if(Object.hasOwn(values, 'statusList')){
            if(Array.isArray(values['statusList'])){
                this.statusList = values['statusList'];
            }else{
                try{
                    this.statusList = JSON.parse(base64ToBytes(values['statusList']));
                }catch(e){
                    raise(e);
                    this.statusList = values['statusList'];
                }
            }
        }

        if(Object.hasOwn(values, 'lastUpdate')){
            this.lastUpdate = moment.tz(values['lastUpdate'], 'UTC');
        }else{
            this.lastUpdate = moment.tz();
        }


        for(const key of Object.keys(this)){
            if(!Object.hasOwn(values, key)) continue;
            if(key == 'cards'){
                this.cards = {};
                for(const cardKey of Object.keys(values.cards)){
                    newCard = new ProtoCard(Object.keys(this.cards).length);
                    newCard.buildFromParams(values.cards[cardKey], true);
                    if(newCard.status !== null){
                        if(this.statusList.includes(newCard.status)){
                            newCard.statusIndex = this.statusList.indexOf(newCard.status);
                        }
                        newCard.status = null;
                    }
                    if(newCard.statusIndex >= this.statusList.length){
                        newCard.statusIndex = null;
                    }
                    this.cards[newCard.key] = newCard;
                }
            }else if(key == 'statusList' || key == 'lastUpdate'){
                continue;
            }else{
                this[key] = values[key];
            }
        }
    }

    /**
     * Loads attributes from a given object, as returned from storage, treating any exceptions that happen before calling this._loadFromObject
     *
     * @param   {Object}  values  Object to load data from. Keys should match this object's keys. For a reference, please look at the constructor.
     *
     * @return  {null}
     */
    loadFromStorage(values){
        if(values === null) return;
        if(!Object.hasOwn(values, 'lastUpdate')) return;
        values.lastUpdate = moment.tz(values.lastUpdate, 'UTC');
        this._loadFromObject(values);
        const neededSetKeys = this._getSetKeysInUse();
        if(neededSetKeys.length > 0) this.loadSetData(neededSetKeys);
    }

    /**
     * Loads attributes from a given object, as returned from the backend API, treating any exceptions that happen before calling this.loadFromStorage
     *
     * @param   {Object}  values  Object to load data from. Keys should match this object's keys. For a reference, please look at the constructor.
     *
     * @return  {null}
     */
    loadFromBackend(values){
        const previousValues = {
            'id': this.id,
            'lastUpdate': this.lastUpdate
        };
        this.loadFromStorage(values);
        if(previousValues.id != this.id || previousValues.lastUpdate != this.lastUpdate){
            // TODO: this should treat update mismatches.
            this.lastUpdate = moment.tz();
        }
    }

    /**
     * Internal async function. Updates this.lastUpdate, then tries to and calls this.changeCallback, awaiting if needed.
     *
     * @param   {Boolean}  [updateTime]  If set to false, this.lastUpdate will not be changed. Defaults to true.
     *
     * @return  {null}
     */
    async _callChangeCallback(updateTime=true){
        if(updateTime===true) this.lastUpdate = moment.tz();
        if(this.changeCallback !== null){
            if(this.changeCallback.constructor.name === 'AsyncFunction'){
                await this.changeCallback(this);
            }else{
                this.changeCallback(this);
            }
        }
    }

    /**
     * Casts a simplified version of this object into a JSON-compliant string.
     *
     * @return  {String}  A slightly simplified version of this object, in JSON form.
     */
    toString(){
        var result = {
            'version': window.constants.version,
            'id': this.id,
            'user_id': this.user_id,
            'cardMode': this.cardMode,
            'name': this.name,
            'cards': {},
            'sets': this.sets,
            'statusList': bytesToBase64(JSON.stringify(this.statusList)),
            'filters': this.filters,
            'public': this.public,
            'lastUpdate': this.lastUpdate,
            'sortField': this.sortField,
            'sortDirection': this.sortDirection
        };

        for(const cardKey of Object.keys(this.cards)){
            result.cards[cardKey] = this.cards[cardKey].simplify();
        }

        return JSON.stringify(result);
    }

    /**
     * Initiate the modals used by this object. This should be called right after the class is instantiated. It is separated from the constructor to avoid a monstrous amount of parameters.
     *
     * @param   {LoadingCardsModal}         loadingCardsModal         Instance of LoadingCardsModal to be used by this object.
     * @param   {LoadingSetsModal}          loadingSetsModal          Instance of LoadingSetsModal to be used by this object.
     * @param   {CardSetSelectionModal}     cardSetSelectionModal     Instance of CardSetSelectionModal to be used by this object.
     * @param   {CardDetailsModal}          cardDetailsModal          Instance of CardDetailsModal to be used by this object.
     * @param   {LoadErrorModal}            loadErrorModal            Instance of LoadErrorModal to be used by this object.
     * @param   {ListPropertiesModal}       listPropertiesModal       Instance of ListPropertiesModal to be used by this object.
     * @param   {FileSelectModal}           fileSelectModal           Instance of FileSelectModal to be used by this object.
     * @param   {ArchidektFileImportModal}  archidektFileImportModal  Instance of ArchidektFileImportModal to be used by this object.
     *
     * @return  {null}
     */
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

    /**
     * Sets this.alertManager, which is used to show non-process-stopping notifications.
     *
     * @param   {AlertManager}  alertManager  Instance of AlertManager to be used in this object.
     *
     * @return  {null}
     */
    setAlertManager(alertManager){
        // TODO: set verify that the object to be set is actually an instance of AlertManager
        this.alertManager = this.alertManager || alertManager;
    }

    /**
     * Sets the sorting field and direction for this object when drawing cards.
     *
     * @param   {String}  sortField      Field on which we should base our sorting. Must be included in CardList.allowedSorts.
     * @param   {String}  sortDirection  Direction on which we should sort the cards. Must be either "asc" or "desc".
     *
     * @return  {Boolean}                True if the sorting was correctly set.
     */
    setSort(sortField, sortDirection){
        if(!CardList.allowedSorts.includes(sortField)) return false;
        if(sortDirection != 'asc' && sortDirection != 'desc') return false;
        if(this.sortField == sortField && this.sortDirection == sortDirection) return false;

        this.sortField = sortField;
        this.sortDirection = sortDirection;

        this._callChangeCallback();

        return true;
    }

    /**
     * Internal function. Makes the smallest usable Array that can be used to sort the cards when drawing.
     *
     * @param   {String[]}  keyList        Array of keys of this.cards that will be sorted.
     * @param   {String}    cardAttribute  The attribute that will be used for sorting. Must be an attribute of ProtoCard.
     *
     * @return  {Object[]}                 Array of objects. Each object will have a "key" attribute, with the corresponding key from keyList; the other key will be the one defined in cardAttribute, with the corresponding value.
     */
    _makeSortableArray(keyList, cardAttribute){
        const result = [];
        const cardKeys = Object.keys(this.cards);
        for(const key of keyList){
            if(!cardKeys.includes(key)) continue;
            result.push({
                'key': key,
                [cardAttribute]: this.cards[key][cardAttribute]
            });
        }

        return result;
    }

    /**
     * Internal function. Sorts the cards in this.cards, respecting this.sortField and this.sortDirection.
     *
     * @param   {String[]}  [keyList]  Array of keys of this.cards (cardKeys) to be sorted. Defaults to Object.keys(this.cards).
     *
     * @return  {String[]}             Array of keys of this.cards, after sorting.
     */
    _sortCards(keyList=null){
        if(keyList === null){
            keyList = Object.keys(this.cards);
        }

        var sortList = [];
        if(this.sortField == 'name'){
            sortList = this._makeSortableArray(keyList, 'name');
            sortList.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
        }else if(this.sortField == 'color'){
            sortList = this._makeSortableArray(keyList, 'color');
            sortList.sort(function (a, b) {
                return b.colorSortValue - a.colorSortValue || a.name.localeCompare(b.name);
            });
        }else if(this.sortField == 'manavalue'){
            sortList = this._makeSortableArray(keyList, 'manavalue');
            sortList.sort(function (a, b) {
                return b.cmc - a.cmc || a.name.localeCompare(b.name);
            });
        }else if(this.sortField == 'collectornumber'){
            sortList = this._makeSortableArray(keyList, 'collectornumber');
            sortList.sort(function (a, b) {
                return b.collectorNumber - a.collectorNumber || a.name.localeCompare(b.name);
            });
        }else{
            console.warn('Sorting failed due to improperly set sortField');
        }

        if(this.sortDirection == 'desc'){
            sortList.reverse();
        }

        const returnList = sortList.map((ob) => ob.key);
        return returnList;
    }

    /**
     * Internal function. Calls this.loadSuccessCallback if it is set.
     *
     * @return  {null}
     */
    _callLoadSuccessCallBack(){
        if(this.loadSuccessCallback){
            this.loadSuccessCallback(this.draw());
        }
    }

    /**
     * Internal function. Saves the settings passed in the parameter object and then calls this._callChangeCallback.
     * If this.statusList changes, will update the statusIndex of the cards in this.cards to match the new status.
     *
     * @param   {Object}    settings                Object containing the settings to be applied and saved.
     * @param   {String}    settings.name           Name that will be applied to this.name.
     * @param   {Boolean}   settings.public         If this list will be publicly visible.
     * @param   {String[]}  settings.statusList     Array of strings (emojis) to be used as statuses in this list.
     *
     * @return  {null}
     */
    _saveSettings(settings){
        const initialStatus = {
            'name': this.name,
            'public': this.public,
            'statusList': this.statusList
        };

        for(const k of Object.keys(initialStatus)){
            if(!Object.hasOwn(settings, k)) continue;
            this[k] = settings[k];
        }

        const finalStatus = {
            'name': this.name,
            'public': this.public,
            'statusList': this.statusList
        };

        if(JSON.stringify(initialStatus.statusList) != JSON.stringify(finalStatus.statusList)){
            var stat = null;
            var removedStatus = [];
            var changedIndexes = {};
            var newIndex = null;
            for (var i = 0; i < initialStatus.statusList.length; i++) {
                stat = initialStatus.statusList[i];
                if(!finalStatus.statusList.includes(stat)){
                    removedStatus.push(i);
                    continue;
                }

                newIndex = finalStatus.statusList.indexOf(stat);
                if(newIndex !== i){
                    changedIndexes[i] = newIndex;
                }
            }

            for(const cardKey of Object.keys(this.cards)){
                if(removedStatus.includes(this.cards[cardKey].statusIndex)){
                    this.cards[cardKey].statusIndex = null;
                    continue;
                }

                if(Object.hasOwn(changedIndexes, this.cards[cardKey].statusIndex)){
                    this.cards[cardKey].statusIndex = changedIndexes[this.cards[cardKey].statusIndex];
                }
            }

            this._callChangeCallback();
        }else if(initialStatus.name != finalStatus.name || initialStatus.public != finalStatus.public){
            this._callChangeCallback();
        }
    }

    /**
     * Invokes the modal of this.listPropertiesModal, where an user can change the properties of this list, hopefully by later calling this._saveSettings.
     *
     * @return  {null}
     */
    callPropertiesModal(){
        this.listPropertiesModal.call(this);
    }

    /**
     * Calls the modal of this.fileSelectModal, setting this.loadSuccessCallback if provided.
     *
     * @param   {Function}  [loadSuccessCallback]   Function to be set in this.loadSuccessCallback. TODO: THis should not be set.
     *
     * @return  {null}
     */
    callFileSelectModal(loadSuccessCallback=null){
        if(loadSuccessCallback) this.loadSuccessCallback = loadSuccessCallback;
        this.fileSelectModal.call();
    }

    /**
     * Sets all properties needed and calls this.cardSetSelectionModal. The cards are drawn using this.drawSetSelect, and set data will be loaded using this.loadSetData before actually calling the modal.
     *
     * @param   {String}    cardKey                         Key of this.cards, which we will use to call the modal.
     * @param   {String}    selectionElementQuery           Selection query of the elements that should trigger a version selection.
     * @param   {String}    selectionSetElementPropName     Name of the property in the elements selected by selectionElementQuery that holds the set being selected.
     * @param   {String}    selectionNumElementPropName     Name of the property in the elements selected by selectionElementQuery that holds the card number in set being selected.
     * @param   {String}    wrapperElementQuery             Query that matches the wrapper element to which selectedClass will apply when a given card version is selected.
     * @param   {String}    selectedClass                   Class to be added/removed from an element to show which version is being selected.
     * @param   {Function}  confirmCallback                 Callback to be used when a given version is confirmed. Should accept {String} cardKey, {String} setCode, {String} collectorNumber
     * @param   {Function}  cancelCallback                  Callback to be used when the version selection is cancelled. No parameters.
     *
     * @return  {null}
     */
    async callCardSelectModal(cardKey, selectionElementQuery, selectionSetElementPropName, selectionNumElementPropName, wrapperElementQuery, selectedClass, confirmCallback, cancelCallback){
        var cardBody = this.drawSetSelect(cardKey);
        if(cardBody === null){
            await this.loadSetData(Object.keys(this.cards[cardKey].sets), true);
        }
        cardBody = this.drawSetSelect(cardKey);
        if(cardBody === null){
            console.error("SOMEHOW, we don't have data on a given set...");
            return;
        }

        this.cardSetSelectionModal.call(
            cardBody,
            selectionElementQuery,
            selectionSetElementPropName,
            selectionNumElementPropName,
            wrapperElementQuery,
            selectedClass,
            (setCode, collectorNumber) => {
                this.setCardSelectedSet(cardKey, setCode, collectorNumber);
                confirmCallback();
            }, //confirmCallback
            () => {cancelCallback()} // cancelCallback
        );
    }

    /**
     * Calls this.cardDetailsModal, to show a given card's details, such as name, rules text and links to other sites.
     *
     * @param   {String}    cardKey     Key of this.cards that represents the card that will be shown.
     *
     * @return  {null}
     */
    callCardDetails(cardKey){
        if(!Object.keys(this.cards).includes(cardKey)) return;
        const html = this.drawCardDetails(cardKey);

        if(!html) return;
        this.cardDetailsModal.call(html);
    }

    /**
     * Internal function. Sets this.filteredCards to hold an array of cardKeys matching the active filters.
     *
     * @param   {Boolean}   [sort]  If set to False, will not sort the cards after filtering. Defaults to true.
     *
     * @return  {null}
     */
    _filterCards(sort=true){
        this.filteredCards = [];
        for(const cardKey of Object.keys(this.cards)){
            if(this.cards[cardKey].matchesFilters(this.filters)){
                this.filteredCards.push(cardKey);
            }
        }
        if(sort) this.filteredCards = this._sortCards(this.filteredCards);
    }

    /**
     * Resets filters to their basic status (all selected). Calls this._callChangeCallback.
     *
     * @param   {Boolean}   [suppressChangeCallback]    If set to true, will not call this._callChangeCallback. Defaults to false.
     *
     * @return  {null}
     */
    resetFilters(suppressChangeCallback=false){
        this.filters = {
            'color': window.constants.colors.slice(),
            'rarity': window.constants.rarities.slice(),
            'status': [...this.statusList.slice(), null]
        };
        if(!suppressChangeCallback) this._callChangeCallback();
    }

    /**
     * Empties all filters. Calls this._callChangeCallback.
     *
     * @param   {Boolean}   [suppressChangeCallback]    If set to true, will not call this._callChangeCallback. Defaults to false.
     *
     * @return  {null}
     */
    emptyFilters(suppressChangeCallback=false){
        this.filters = {
            'color': [],
            'rarity': [],
            'status': []
        };
        if(!suppressChangeCallback) this._callChangeCallback();
    }

    /**
     * Adds a given value to a given filter type, then calls this._callChangeCallback.
     *
     * @param   {String}    filterType  The kinds of filter being added. Must be a key in this.filters.
     * @param   {String}    value       The filter to be added.
     *
     * @return  {null}
     */
    addFilter(filterType, value){
        if(!Object.hasOwn(this.filters, filterType)) return;

        if(value === 'null') value = null;
        if(this.filters[filterType].includes(value)) return;

        this.filters[filterType].push(value);
        this._callChangeCallback();
    }

    /**
     * Removes a given filter from the given filter type, then calls this._callChangeCallback.
     *
     * @param   {String}    filterType  The kinds of filter being removed. Must be a key in this.filters.
     * @param   {String}    value       The filter to be removed. Must be in this.filters[filterType].
     *
     * @return  {null}
     */
    removeFilter(filterType, value){
        if(!Object.hasOwn(this.filters, filterType)) return;
        if(this.filters[filterType].length == 0) return;

        if(value === 'null') value = null;

        const index = this.filters[filterType].indexOf(value);
        if(index < 0) return;
        this.filters[filterType].splice(index, 1);
        this._callChangeCallback();
    }

    /**
     * Sets this.scryfallClient.
     *
     * @param   {Scryfall}  client  Scryfall client to be set.
     *
     * @return  {null}
     */
    setScryfallClient(client){
        // TODO: ensure that the given client is of the correct type before setting.
        this.scryfallClient = client;
    }

    /**
     * Sets this.cardMode, which will then be used to draw the cards.
     *
     * @param   {String}    mode    The mode in which the cards will be drawn. Must be in CardList.allowedModes.
     *
     * @return  {null}
     */
    setCardMode(mode){
        if(!CardList.allowedModes.includes(mode)) return;
        this.cardMode = mode;
    }

    /**
     * Sets the status for a given card, then calls this._callChangeCallback.
     * If statusIndex is an int, will set the card to the given status. If it is 'next', will set to the next status in this.statusList.
     *
     * @param   {String}            cardKey      Key of this.cards to indicate the card to be changed.
     * @param   {(String|Number)}   statusIndex  Either an int <= this.statusList.length or 'next'.
     *
     * @return  {null}
     */
    setCardStatus(cardKey, statusIndex){
        if(statusIndex != 'next' && !Number.isInteger(statusIndex)) return;
        if(!Object.keys(this.cards).includes(cardKey)) return;

        var nextStatus = statusIndex;
        if(statusIndex == 'next'){
            nextStatus = this.cards[cardKey].statusIndex;

            if(nextStatus === null){
                nextStatus = 0;
            }else if(nextStatus == this.statusList.length - 1){
                nextStatus = null;
            }else{
                nextStatus += 1;
            }
        }else if(nextStatus >= this.statusList.length){
            return;
        }



        this.cards[cardKey].statusIndex = nextStatus;
        this._callChangeCallback();
    }

    /**
     * Adds a given amount to the quantity of a given card. The amount may be negative. If the new amount is now <= 0, the card will be removed.
     *
     * @param   {String}    cardKey     Key of this.cards to indicate the card to be changed.
     * @param   {Number}    changeAmt   The amount to be added to the card quantity.
     *
     * @return  {null}
     */
    addCardQuantity(cardKey, changeAmt){
        if(!Object.keys(this.cards).includes(cardKey)) return;
        this.cards[cardKey].quantity = Math.max(0, this.cards[cardKey].quantity + changeAmt);

        if(this.cards[cardKey].quantity <= 0){
            this.removeCard(cardKey);
            return;
        }
        this._callChangeCallback();
    }

    /**
     * Sets the quantity of a given number. If the new quantity is <= 0, the card will be removed.
     *
     * @param   {String}    cardKey     Key of this.cards to indicate the card to be changed.
     * @param   {Number}    newQuant    The new quantity to be set.
     *
     * @return  {null}
     */
    setCardQuantity(cardKey, newQuant){
        if(!Object.keys(this.cards).includes(cardKey)) return;
        this.cards[cardKey].quantity = Math.max(0, newQuant);
        if(this.cards[cardKey].quantity <= 0){
            this.removeCard(cardKey);
            return;
        }
        this._callChangeCallback();
    }

    /**
     * Ensures that all sets present in cards in this.cards are represented in this.sets, adding null entries when needed.
     *
     * @return  {null}
     */
    _loadSetKeys(){
        for(const cardKey of Object.keys(this.cards)){
            for(const setCode of Object.keys(this.cards[cardKey].sets)){
                if(!this.sets[setCode]){
                    this.sets[setCode] = null;
                }
            }
        }
    }

    /**
     * Internal function. Lists all set keys that are being used (selected) by cards and are null in this.sets.
     *
     * @param   {Boolean}   [neededOnly]    If set to false, will return all keys, despite them being not null in this.sets.
     *
     * @return  {String[]}                  Array of set codes
     */
    _getSetKeysInUse(neededOnly=true){
        var setsInUse = {};
        for(const cardKey of Object.keys(this.cards)){
            if(this.cards[cardKey].selectedSet === null) continue;
            setsInUse[this.cards[cardKey].selectedSet] = true;
        }

        if(neededOnly == true){
            var deadKeys = [];
            for(const setCode of Object.keys(setsInUse)){
                if(Object.hasOwn(this.sets, setCode) && this.sets[setCode] !== null){
                    deadKeys.push(setCode);
                }
            }

            for(const setCode of deadKeys){
                delete setsInUse[setCode];
            }
        }

        return Object.keys(setsInUse);
    }


    /**
     * Async function. Loads the set data of a list of sets. Calls the modal to prevent interaction.
     *
     * @param   {String[]}  [setList]       List of set codes to load. Defaults to all sets in all cards.
     * @param   {Boolean}   [forceBasics]   If set to true, will load all sets of basic lands too. Defaults to false.
     *
     * @return  {null}
     */
    async loadSetData(setList=null, forceBasics=false){
        if(this.scryfallClient == null){
            if(scryfallClient === null){
                throw new Error('a scryfallClient must be provided');
            }
            this.scryfallClient = scryfallClient;
        }

        if(!this.hasNullSets()){
            this._callLoadSuccessCallBack();
            return;
        };

        if(setList === null){
            var nonBasicSets = [];
            if(forceBasics == true){
                nonBasicSets = Object.keys(this.sets);
            }else{
                for(const cardKey of Object.keys(this.cards)){
                    if(this.cards[cardKey].isBasicLand == false){
                        nonBasicSets = nonBasicSets.concat(Object.keys(this.cards[cardKey].sets));
                    }
                }
                nonBasicSets = onlyUnique(nonBasicSets);
            }

            setList = [];
            for(const setCode of Object.keys(this.sets)){
                if(this.sets[setCode] === null && nonBasicSets.includes(setCode)){
                    setList.push(setCode);
                }
            }
        }


        this.loadingSetsModal.call('Loading Sets');
        const startTimestamp = new Date().getTime();
        var response = null;
        for(const setCode of setList){
            if(this.sets[setCode] !== null) continue;
            await delay(100);
            this.loadingSetsModal.update(`set ${setCode.toUpperCase()}`);

            response = await this.scryfallClient.sets(setCode);
            this.sets[setCode] = {
                'icon_svg_uri': response.icon_svg_uri,
                'name': response.name
            }
        }

        // FOR SOME REASON, if the modal stays up for less than 2 seconds, it crashes on dismiss.
        const elapsedTime = new Date().getTime() - startTimestamp;
        if(elapsedTime < 2000){
            await delay(2000 - elapsedTime);
        }

        this.loadingSetsModal.dismiss(() => {
            this._callLoadSuccessCallBack();
            this._callChangeCallback();
        });
    }

    /**
     * A basic object, containing the data from a parsed line when importing from some source of text.
     * @typedef     {Object}    ParsedCard
     * @property    {String}    typedName   The name typed by the user. May or may not be an actual mtg card name.
     * @property    {Number}    quantity    Quantity of the card.
     * @property    {Number}    set         The 3-5 letter code representing the set.
     * @property    {Boolean}   foil        Describes if the card is desired in foil.
     */

    /**
     * Internal function. Parses a given string as one that would be exported by Magic Arena.
     *
     * @param   {String}    text    String compliant to a MtG Arena export, to be parsed.
     *
     * @return  {ParsedCard}        Representing the parsed text.
     */
    _parseCardLineArena(text){
        text = text.trim();
        if(text.length < 4) return null;

        const reWithNum = /^(\d+) (.+) \(([A-Z0-9]+)\) \d+$/u;
        const match = text.match(reWithNum);
        if(match === null) return null;

        var response = {
            'typedName': match[2].replaceAll('\'', '')
                                 .replaceAll(',', '')
                                 .replaceAll(':', '')
                                 .replaceAll('!', '')
                                 .replaceAll('"', '')
                                 .trim(),
            'quantity': match[1],
            'set': match[3],
            'foil': null
        };

        return response;
    }

    /**
     * Parses the given text as an item in a list of several possible kinds.
     *
     * @param   {String}    text    String compliant to one of several ways to represent a card.
     *
     * @return  {ParsedCard}        Representing the parsed text.
     */
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
            text = text.substring(0, text.indexOf(` [${match[2]}]`)).trim();
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

    /**
     * Internal function. Parses a given multiline text into ProtoCards that can then be sent to this.cardQueue.
     *
     * @param   {String}    text            The blob of text to be parsed.
     * @param   {Boolean}   [trustNames]    If set to true, will trust the names given in the text and skip the initial Scryfall name correction.
     *
     * @return  {Object}                    Object with two keys: {String[]} errors, containing all errors generated during ingestion; {ProtoCard[]} with the cards ready to be sent to loading.
     */
    _digestText(text, trustNames=false){
        if(!text) return;

        const typedList = text.split('\n').filter(e => e.length >= 3);
        if(len(typedList) < 1) return;

        const errors = [];
        const queue = [];

        var newCard = null;
        var parsedLine = null;
        for (var i = 0; i < typedList.length; i++) {
            if(len(typedList[i]) < 3){
                continue;
            }
            parsedLine = this.parseCardLine(typedList[i]);
            if(!parsedLine){
                errors.push({'typedName': typedList[i], 'error': 'could not parse text'});
                continue;
            }

            newCard = new ProtoCard(len(this.cardQueue));
            newCard.buildFromParams({
                typedName: parsedLine.typedName,
                foil: parsedLine.foil,
                selectedSet: parsedLine.set,
                quantity: parsedLine.quantity,
                trustName: trustNames
            });
            queue.push(newCard);
        }

        return {
            'queue': queue,
            'errors': errors
        };
    }

    /**
     * Async function. Ingests a single line of text as a card, processes it with buildFromScryFall, calls _callChangeCallback then the provided successCallback.
     * This uses the alertManager and does not block user interaction.
     *
     * @param   {String}    text                The text to be parsed.
     * @param   {Function}  [successCallback]   Function to be called if the parsing is successfull. Function must accept cardKey as a parameter.
     *
     * @return  {null}
     */
    async quickIngest(text, successCallback=null){
        if(!text) return;
        const ingestedText = this._digestText(text);
        if(ingestedText.errors.length > 0){
            this.alertManager.addAlert(ingestedText.errors.join('<br>'), false, 'danger', 1500);
            return;
        }
        if(ingestedText.queue.length != 1) return;

        const newCard = ingestedText.queue[0];
        newCard.trustName = true;
        const alertId = this.alertManager.addAlert(`adding ${newCard.typedName}`, true, 'info');
        var loaded = await newCard.buildFromScryFall(this.scryfallClient, {'index': this.cards.length});
        if(newCard.loaded == 2){
            if(Object.keys(this.cards).includes(newCard.key)){
                this.cards[newCard.key].quantity += newCard.quantity;
            }else{
                this.cards[newCard.key] = newCard;
            }
        }else{
            if(newCard.errors.length > 0){
                var alertText = [];
                for(const err of newCard.errors){
                    console.log(err);
                    alertText.push(err.error);
                }
                this.alertManager.addAlert(alertText.join('<br>'), false, 'danger', 3000);
            }else{
                this.alertManager.addAlert(`could not load ${newCard.typedName}`, false, 'danger', 3000);
            }
            this.alertManager.removeAlert(alertId);
            return;
        }

        for(const setCode of Object.keys(newCard.sets)){
            if(!Object.hasOwn(this.sets, setCode)) this.sets[setCode] = null;
            if(setCode == newCard.selectedSet && this.sets[setCode] === null){
                const response = await this.scryfallClient.sets(setCode);
                this.sets[setCode] = {
                    'icon_svg_uri': response.icon_svg_uri,
                    'name': response.name
                }
            }
        }

        this.alertManager.removeAlert(alertId);
        if(successCallback){successCallback(newCard.key);}
        this._callChangeCallback();
    }

    /**
     * Async function. Ingests a block of text as cards and adds it to this.cardQueue.
     *
     * @param   {String}    text        The text to be parsed.
     * @param   {Boolean}   trustNames  If set to true, will trust the names given in the text and skip the initial Scryfall name correction.
     *
     * @return  {Boolean}               true if the block added cards to this.cardQueue.
     */
    async ingestText(text, trustNames=false){
        if(!text) return;
        this.errors = [];

        const ingestedText = this._digestText(text, trustNames);
        this.errors = ingestedText.errors;
        if(ingestedText.queue.length == 0){
            this.cardQueue = [];
            return false;
        }

        this.cardQueue = ingestedText.queue;
        return true;
    }

    /**
     * Processes all cards from this.cardQueue, loading data from Scryfall and populating this.cards.
     * Then, if errors are detected, calls this.loadErrorModal. If no errors are detected, calls this.loadSetData, then calls this._callChangeCallback.
     *
     * @param   {Scryfall}  [scryfallClient]    Scryfall client to be used and set to this.scryfallClient.
     * @param   {Function}  [successCallBack]   Function to be called if the loading succeeds. Supplying this will supress calling this.loadSetData
     * @param   {Function}  [errorCallBack]     Function to be called in case of error. Supplying this will supress calling loadErrorModal.
     * @param   {Boolean}   [forceRefresh]      If set to true, will add all cards to this.cardQueue before starting data processing.
     *
     * @return  {null}
     */
    async loadQueueFromScryfall(scryfallClient=null, successCallBack=null, errorCallBack=null, forceRefresh=false){
        if(this.scryfallClient === null){
            if(scryfallClient === null){
                throw new Error('a scryfallClient must be provided');
            }
            this.scryfallClient = scryfallClient;
        }

        if(forceRefresh===true){
            for (const [key, card] of Object.entries(this.cards)){
                this.cardQueue.push(card);
                this.cardQueue[this.cardQueue.length-1].trustName = true;
                this.cardQueue[this.cardQueue.length-1].addQuantity = false;
            }
        }
        if(this.cardQueue.length < 1){
            return;
        }

        this.errors = [];
        this.loadingCardsModal.call();
        const startTimestamp = new Date().getTime();
        await delay(50);

        var i = Object.keys(this.cards).length;
        for (const newCard of this.cardQueue) {
            this.loadingCardsModal.update(newCard.typedName);

            let loaded = await newCard.buildFromScryFall(this.scryfallClient, {'index': i});

            if(newCard.loaded == 2){
                if(forceRefresh == true){
                    this.cards[newCard.key] = newCard;
                }else if(Object.keys(this.cards).includes(newCard.key)){
                    if(Object.hasOwn(newCard, 'addQuantity') && newCard.addQuantity == false){
                        newCard.addQuantity = true;
                    }else{
                        this.cards[newCard.key].quantity += newCard.quantity;
                    }
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

            await delay(100);
            i++;
        }

        // FOR SOME REASON modals have to stay on for at least 2 seconds, or they fail in being dismissed.
        const elapsedTime = new Date().getTime() - startTimestamp;
        if(elapsedTime < 2000){
            await delay(2000 - elapsedTime);
        }

        if(this.errors.length > 0){
            this.loadingCardsModal.dismiss(() => {
                if(errorCallBack){
                    errorCallBack(this.errors);
                }else{
                    this.loadErrorModal.call(this.errors);
                }
            });
        }else{
            this.loadingCardsModal.dismiss(async () => {
                this.cardQueue = [];
                if(successCallBack){
                    successCallBack();
                }else{
                    var setList = [];
                    for(const cardKey of Object.keys(this.cards)){
                        setList.push(this.cards[cardKey].selectedSet);
                    }
                    await this.loadSetData(setList, true);
                };
                this._callChangeCallback();
            });
        }
    }

    /**
     * Ingests data returned by the backend after getting cards from a given valid URL.
     * Then calls this.ingestFile.
     *
     * @param   {String}    contents    The text to be parsed.
     *
     * @return  {null}
     */
    ingestFromUrl(contents){
        var innerContents = [];
        for(const catName of Object.keys(contents)){
            innerContents.push(catName);
            for(const card of contents[catName]){
                innerContents.push(`${card['quantity']} ${card['name']}`);
            }
        }

        this.ingestFile(innerContents, 'archidekt', true);
    }

    /**
     * Ingests an array of strings from a file loaded and parses them to add to this.cardQueue.
     *
     * @param   {String[]}  fileContents    Lines in the file read
     * @param   {String}    fileType        The kind of file to be parsed. Must be one of 'archidekt', 'arena', 'mtggoldfish', 'mtgotxt', 'mtgodek', or 'mwdeck'.
     * @param   {Boolean}   [trustNames]    If set to true, will trust the names given in the text and skip the initial Scryfall name correction.
     *
     * @return  {null}
     */
    ingestFile(fileContents, fileType, trustNames=false){
        if(fileType == 'archidekt'){
            this._ingestArchidektFile(fileContents, trustNames);
        }else if(fileType == 'arena'){
            this._ingestArenaFile(fileContents, trustNames);
        }else if(fileType == 'mtggoldfish'){
            this._ingestMtgGoldFishFile(fileContents, trustNames);
        }else if(fileType == 'mtgotxt'){
            this.ingestText(fileContents.join('\n'), trustNames);
        }else if(fileType == 'mtgodek'){
            this._ingestDek(fileContents.join('\n'), trustNames);
        }else if(fileType == 'mwdeck'){
            this._ingestMwdeck(fileContents, trustNames);
        }else{
            return;
        }
    }

    /**
     * Internal Async function. Processes a block of xml-compliant text as a list of cards and adds them to this.cardQueue, then calls this.loadQueueFromScryfall.
     * This only processes a well-formed decklist as one would see exported from Magic Online.
     *
     * @param   {String}    xmlString       XML to be parsed.
     * @param   {Boolean}   [trustNames]    If set to true, will trust the names given in the text and skip the initial Scryfall name correction.
     *
     * @return  {null}
     */
    async _ingestDek(xmlString, trustNames=false){
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlString, "application/xml");
        if(!xml){
            // TODO: handle this error
            console.error('could not parse XML');
        }

        var newCard = null;
        for(const cardElement of xml.querySelectorAll('Cards')){
            newCard = new ProtoCard(this.cardQueue.length);
            newCard.buildFromParams({
                typedName: cardElement.getAttribute('Name'),
                quantity: cardElement.getAttribute('Quantity'),
                trustName: trustNames
            });
            this.cardQueue.push(newCard);
        }

        if(this.cardQueue.length > 0){
            this.loadQueueFromScryfall(
                null,
                async () => {  // successCallback
                    let setList = [];
                    for(const cardKey of Object.keys(this.cards)){
                        setList.push(this.cards[cardKey].selectedSet);
                    }
                    this.loadSetData(setList, true);
                },
                (err) => {}  // errorCallback
            );
        }
    }

    /**
     * Internal Async Function. Parses an array of Strings, interpreting each item as a card compliant with exports from Magic Workstation
     * Adds them to this.cardQueue, then calls this.loadQueueFromScryfall.
     *
     * @param   {String[]}  splitList       Array with Strings that represents cards
     * @param   {Boolean}   [trustNames]    If set to true, will trust the names given in the text and skip the initial Scryfall name correction.
     *
     * @return  {null}
     */
    async _ingestMwdeck(splitList, trustNames=false){
        var text = '';
        var match = null;
        var newCard = null;
        for(const typedLine of splitList){
            text = typedLine.trim();
            if(text.length < 5) continue;
            if(text.substring(0, 2) == '//') continue;
            if(text.substring(0, 4) == 'SB: ') text = text.substring(4);

            match = text.match(/^(\d+) \[\] (.+)/);
            if(match === null) continue;

            newCard = new ProtoCard(this.cardQueue.length);
            newCard.buildFromParams({
                typedName: match[2],
                quantity: match[1],
                trustName: trustNames
            });
            this.cardQueue.push(newCard);
        }

        if(this.cardQueue.length > 0){
            await this.loadQueueFromScryfall(
                null,
                async () => {  // successCallback
                    var setList = [];
                    for(const cardKey of Object.keys(this.cards)){
                        setList.push(this.cards[cardKey].selectedSet);
                    }
                    await this.loadSetData(setList, true);
                },
                (err) => {}  // errorCallback
            );
        }
    }

    /**
     * Internal Async Function. Parses an array of Strings, interpreting each item as a card compliant with exports from MtgGoldfish
     * Adds them to this.cardQueue, then calls this.loadQueueFromScryfall.
     *
     * @param   {String[]}  splitList       Array with Strings that represents cards
     * @param   {Boolean}   [trustNames]    If set to true, will trust the names given in the text and skip the initial Scryfall name correction.
     *
     * @return  {null}
     */
    async _ingestMtgGoldFishFile(splitList, trustNames=false){
        if(splitList.length < 1) return;

        const reWithExtra = /^(\d+) (.+) (\<.+\>)? \[(.+)\]$/;
        const reNoExtra = /^(\d+) (.+) \[(.+)\]$/;
        var cards = [];
        var parsedLine = null;
        var newCard = null;
        var text = '';
        var match = null;
        for(const typedLine of splitList){
            if(typedLine.length < 5) continue;

            text = typedLine.trim();
            match = text.match(reWithExtra);
            if(match){
                parsedLine = {
                    'typedName': match[2].replaceAll('\'', '')
                                         .replaceAll(',', '')
                                         .replaceAll(':', '')
                                         .replaceAll('!', '')
                                         .replaceAll('"', '')
                                         .trim(),
                    'quantity': match[1],
                    'set': match[4]
                };
            }else{
                match = text.match(reNoExtra);
                if(!match){
                    this.errors.push({'typedName': text, 'error': 'could not parse text'});
                    continue;
                }
                parsedLine = {
                    'typedName': match[2].replaceAll('\'', '')
                                         .replaceAll(',', '')
                                         .replaceAll(':', '')
                                         .replaceAll('!', '')
                                         .replaceAll('"', '')
                                         .trim(),
                    'quantity': match[1],
                    'set': match[3]
                };
            }

            newCard = new ProtoCard(this.cardQueue.length);
            newCard.buildFromParams({
                typedName: parsedLine.typedName,
                selectedSet: parsedLine.set,
                quantity: parsedLine.quantity,
                trustName: trustNames
            });
            this.cardQueue.push(newCard);
        }

        if(this.cardQueue.length > 0){
            await this.loadQueueFromScryfall(
                null,
                async () => {  // successCallback
                    var setList = [];
                    for(const cardKey of Object.keys(this.cards)){
                        setList.push(this.cards[cardKey].selectedSet);
                    }
                    await this.loadSetData(setList, true);
                },
                (err) => {}  // errorCallback
            );
        }
    }

    /**
     * Internal Async Function. Parses an array of Strings, interpreting each item as a card compliant with exports from Magic Arena
     * Adds them to this.cardQueue, then calls this.loadQueueFromScryfall.
     *
     * @param   {String[]}  splitList       Array with Strings that represents cards
     * @param   {Boolean}   [trustNames]    If set to true, will trust the names given in the text and skip the initial Scryfall name correction.
     *
     * @return  {null}
     */
    async _ingestArenaFile(splitList, trustNames=false){
        if(splitList.length < 1) return;
        var cards = [];
        var parsedLine = null;
        var newCard = null;
        for(const typedLine of splitList){
            if(typedLine.length < 5) continue;
            parsedLine = this._parseCardLineArena(typedLine);
            if(!parsedLine){
                this.errors.push({'typedName': typedLine, 'error': 'could not parse text'});
                continue;
            }

            newCard = new ProtoCard(len(this.cardQueue));
            newCard.buildFromParams({
                typedName: parsedLine.typedName,
                selectedSet: parsedLine.set,
                quantity: parsedLine.quantity,
                trustName: trustNames
            });
            this.cardQueue.push(newCard);
        }

        if(this.cardQueue.length > 0){
            await this.loadQueueFromScryfall(
                null,
                async () => {  // successCallback
                    var setList = [];
                    for(const cardKey of Object.keys(this.cards)){
                        setList.push(this.cards[cardKey].selectedSet);
                    }
                    await this.loadSetData(setList, true);
                },
                (err) => {}  // errorCallback
            );
        }
    }

    /**
     * Internal Function. Parses an array of Strings, interpreting each item as a card compliant with exports from Archidekt
     * Adds them to this.cardQueue, then calls this.loadQueueFromScryfall.
     *
     * @param   {String[]}  splitList       Array with Strings that represents cards
     * @param   {Boolean}   [trustNames]    If set to true, will trust the names given in the text and skip the initial Scryfall name correction.
     *
     * @return  {null}
     */
    _ingestArchidektFile(splitList, trustNames=false){
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
                    quantity: parseInt(match[1]),
                    trustName: trustNames
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

    /**
     * Internal function. Processes an object containing protocards, as a result of a selection of categories. Adds the cards to this.cardQueue and then calls loadQueueFromScryfall
     *
     * @param   {Object}    selectedCategories  Objectcontaining the ProtoCards. Each key should be the name of a category, and values should be arrays of ProtoCards.
     *
     * @return  {null}
     */
    _processArchidektCategoriesSelection(selectedCategories){
        if(!selectedCategories) return;

        this.cardQueue = [];
        for(const [catName, catList] of Object.entries(selectedCategories)){
            for(const newCard of catList){
                this.cardQueue.push(newCard);
            }
        }

        if(this.cardQueue.length == 0) return;

        this.loadQueueFromScryfall(
            null,
            async () => {  // successCallback
                var setList = [];
                for(const cardKey of Object.keys(this.cards)){
                    setList.push(this.cards[cardKey].selectedSet);
                }
                await this.loadSetData(setList, true);
            },
            (err) => {}  // errorCallback
        );
    }

    /**
     * Internal placeholder function to clear this.cardQueue.
     *
     * @return  {null}
     */
    _callBackClearQueue(){
        this.cardQueue = [];
    }

    /**
     * Builds an HTML representing the cards, respecting this.cardMode.
     *
     * @param   {String}    [drawMode]  Mode to draw the cards in. Overwrites this.cardMode, if provided.
     *
     * @return  {String}                HTML representing the cards
     */
    draw(drawMode=null){
        var html = [];
        drawMode = drawMode || this.cardMode;

        this._filterCards();

        for(const cardKey of this.filteredCards){
            html.push(this.cards[cardKey].draw(this.sets, this.statusList, this.cardMode));
        }
        return html.join('\n');
    }

    /**
     * Creates the HTML for the set/version select of a given card.
     *
     * @param   {String}    cardKey     Identifier of the card to be drawn. Must be a key of this.cards.
     *
     * @return  {String}                HTML for the set selection.
     */
    drawSetSelect(cardKey){
        if(!Object.keys(this.cards).includes(cardKey)) return null;
        for(const setCode of Object.keys(this.cards[cardKey].sets)){
            if(this.sets[setCode] === null) return null;
        }
        return this.cards[cardKey].drawSetSelect(this.sets);
    }

    /**
     * Redraws a card element, with the card being selected by cardKey and the element being targeted by any element with card_key=
     *
     * @param   {String}    cardKey     Identifier of the card to be drawn. Must be a key of this.cards.
     *
     * @return  {null}
     */
    redrawCard(cardKey){
        if(!Object.keys(this.cards).includes(cardKey)) return null;
        const element = document.querySelector(`.${CardList.modeOuterClass[this.cardMode]}[card_key="${cardKey}"]`);
        if(element === null) return null;
        element.innerHTML = this.cards[cardKey].drawInner(this.sets, this.statusList, this.cardMode);
    }

    /**
     * Creates the HTML for displaying the card details (probably in the modal).
     *
     * @param   {String}    cardKey     Identifier of the card to be drawn. Must be a key of this.cards.
     *
     * @return  {String}                HTML with the card details.
     */
    drawCardDetails(cardKey){
        if(!Object.keys(this.cards).includes(cardKey)) return null;
        return this.cards[cardKey].drawDetails();
    }

    /**
     * Builds the status filters, using CardList.filterModels.statusModel and this.statusList.
     *
     * @return  {String}    HTML with the status filters.
     */
    drawStatusFilters(){
        var html = [CardList.filterModels.statusNullModel];
        for (var i = 0; i < this.statusList.length; i++) {
            html.push(CardList.filterModels.statusModel.replaceAll('%%statusindex%%', i)
                                                       .replaceAll('%%statusicon%%', this.statusList[i])
                     );
        }
        return html.join('\n');
    }

    /**
     * Selects a card version. Acts as a passtrough for ProtoCard.selectVersion, then calls this._callChangeCallback.
     *
     * @param   {String}    cardKey             Identifier of the card to be drawn. Must be a key of this.cards.
     * @param   {String}    setCode             Set code being selected.
     * @param   {String}    collectorNumber     Collector number to be selected.
     *
     * @return  {null}
     */
    setCardSelectedSet(cardKey, setCode, collectorNumber){
        if(!Object.keys(this.cards).includes(cardKey)) return;
        if(!Object.keys(this.sets).includes(setCode))return;

        this.cards[cardKey].selectVersion(setCode, collectorNumber);
        this._callChangeCallback();
    }

    /**
     * Removes a given card from this.cards, then calls this._callChangeCallback.
     *
     * @param   {String}    cardKey     Identifier of the card to be drawn. Must be a key of this.cards.
     *
     * @return  {null}
     */
    removeCard(cardKey){
        if(!Object.keys(this.cards).includes(cardKey)) return;
        delete this.cards[cardKey];
        this._callChangeCallback();
    }

    /**
     * Removes all cards that are currently not filteres out, then calls this._callChangeCallback.
     *
     * @return  {null}
     */
    removeVisibleCards(){
        this._filterCards(false);
        for(const key of this.filteredCards){
            delete this.cards[key];
        }
        this._callChangeCallback();
    }

    /**
     * Checks if there are any sets in this.sets that are currently null.
     *
     * @return  {Boolean}  True if there are any null sets.
     */
    hasNullSets(){
        this._loadSetKeys();

        for(const [setCode, setDetails] of Object.entries(this.sets)){
            if(setDetails === null) return true;
        }
        return false;
    }

    /**
     * Exports all cards in this.cards to text
     *
     * @return  {String}    Text where each row represents a card.
     */
    exportCardsToText(){
        var result = [];
        for(const key of Object.keys(this.cards)){
            result.push(`${this.cards[key].quantity} ${this.cards[key].names.compiled}`);
        }
        return result;
    }

    /**
     * Creates an array of objects to be sent to the image creation API
     *
     * @return  {Object[]}  Each object has a {Number} quantity key, with the quantity of the given card, and a {String} url key, with the card image's URL.
     */
    exportCardsToImage(){
        var result = [];
        for(const key of Object.keys(this.cards)){
            result.push({
                'quantity': this.cards[key].quantity,
                'url': this.cards[key].getSelectedImageUrl()
            });
        }
        return result;
    }
}

// Allows us to habe a basic module loading check.
window.loadedModules.push('cardlist');