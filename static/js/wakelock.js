class WakeLockController{
    constructor(){
        this.wakeLock = false;
        this.relock = false;
        this.mode = null;
        this.active = false;

        // option 1: window.wakelock exists
        if('WakeLock' in window && 'request' in window.WakeLock){
            this.mode = 'window';
            this.wakeLock = null;

        // option 2: navigator.wakelock exists
        }else if ('wakeLock' in navigator && 'request' in navigator.wakeLock) {
            this.mode = 'navigator';
            this.wakeLock = null;
        }else{
            console.error('Wake Lock API not supported.');
        }
    }

    async requestWakeLock(){
        if(this.active == false) return;
        if(this.mode == 'window'){
            this.wakeLock = new AbortController();
            const signal = this.wakeLock.signal;
            window.WakeLock.request('screen', {signal}).catch((e) => {
                if (e.name === 'AbortError') {
                    console.log('Wake Lock was aborted');
                } else {
                    console.error(`${e.name}, ${e.message}`);
                }
            });
            this.relock = true;
            console.log('Wake Lock is active');
        }else if(this.mode == 'navigator'){
            try {
                this.wakeLock = await navigator.wakeLock.request('screen');
                this.wakeLock.addEventListener('release', (e) => {
                    console.log('Wake Lock was released');
                });
                this.relock = true;
                console.log('Wake Lock is active');
            }catch(e){
                console.error(`${e.name}, ${e.message}`);
            }
        }
    }

    setActive(value){
        if(this.active == value) return;
        this.active = value;
        if(value == true){
            this.requestWakeLock();
            this.addEventListeners();
        }else{
            this.abortWakeLock();
            this.removeEventListeners();
        }
    }

    async abortWakeLock() {
        if(this.mode == 'window'){
            this.wakeLock.abort();
            this.wakeLock = null;
            this.relock = false;
            console.log('Wake Lock released');
        }else if(this.mode == 'navigator'){
            this.wakeLock.release();
            this.wakeLock = null;
            this.relock = false;
            console.log('Wake Lock released');
        }
    };

    async handleVisibilityChange(){
        if(this.wakeLock !== null && (this.mode == 'window' || this.mode == 'navigator')){
            if (document.visibilityState === 'visible' && this.relock == true) {
                await this.requestWakeLock();
            }
        }
    };

    addEventListeners(){
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        document.addEventListener('fullscreenchange', () => this.handleVisibilityChange());
    }

    removeEventListeners(){
        document.removeEventListener('visibilitychange', () => this.handleVisibilityChange());
        document.removeEventListener('fullscreenchange', () => this.handleVisibilityChange());
    }

}

window.loadedModules.push('wakelock');