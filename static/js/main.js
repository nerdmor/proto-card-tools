document.addEventListener("DOMContentLoaded", (e) => {
    // Initialize managers
    window.apiManager = new ApiManager();
    window.listManager = new ListManager();
    window.sessionManager = new SessionManager();
    window.modalManager = new ModalManager('modal-wrapper');


    /* EVENT BINDINGS *****************************************************************************/

    // Window resize events
    window.addEventListener("resize", (e) => { resizeCards() })

    // Click on menu items events
    document.getElementById('menu-top-user-logout').addEventListener('click', (e) => {
        e.preventDefault();
        window.sessionManager.logout();
    });


    // future elements bindings
    document.querySelector('body').addEventListener('click', (event) => {
        // clicking on card to change status
        if(matchElementAndParent(event.target, [
            '.mtgcard-icon-p',
            '.mtgcard-icon-wrapper',
            '.mtgcard-body'
        ])){
            const cardKey = getCardKeyFromParent(event.target);
            window.listManager.advanceCardIcon(cardKey);
            window.listManager.printOneCard(cardKey);
        }
    });


    /* One-time runs **************************************************************/
    resizeCards();
});


