const Site = (function () {
    let isInit = false;
    const loadPage = function loadPage(anon) {
        anon.call(this, Site).then(async () => {
            isInit = true;
        });
    };
    return {
        loadPage
    };
}());
