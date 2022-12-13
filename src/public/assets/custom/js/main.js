const Site = (function () {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let isInit = false;

    const loading = function loading(show) {
        const loader = document.getElementById("loader");
        const overlay = document.getElementById("overlay");
        if (show) {
            overlay.classList.remove("hidden");
            loader.classList.remove("hidden");
        } else {
            overlay.classList.add("hidden");
            loader.classList.add("hidden");
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
