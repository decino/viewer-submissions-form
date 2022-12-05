const Site = (function () {
    let isInit = false;

    const loading = function loading(show) {
        const loader = document.getElementById("loader");
        const overlay = document.getElementById("overlay");
        if (show) {
            overlay.classList.add("overlay");
            loader.classList.remove("hidden");
        } else {
            overlay.classList.remove("overlay");
            loader.classList.add("hidden");
            Site.display(true, loader);
        }
    };

    const display = function display(hide, element) {
        if (hide) {
            element.closest("div").classList.add("hidden");
        } else {
            element.closest("div").classList.remove("hidden");
        }
    };
    const loadPage = function loadPage(anon) {
        anon.call(this, Site).then(async () => {
            isInit = true;
        });
    };
    return {
        loadPage,
        loading,
        display
    };
}());
