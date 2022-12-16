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

    const serialiseForm = function serialiseForm() {
        function isHidden(el) {
            const style = window.getComputedStyle(el);
            return ((style.display === 'none') || (style.visibility === 'hidden') || el.offsetParent === null);
        }

        const form = document.getElementById("entryForm");
        const items = form.querySelectorAll("input, textarea, select");
        const formData = new FormData();
        for (const item of items) {
            if (isHidden(item)) {
                continue;
            }
            if (item.type === "radio" || item.type === "checkbox") {
                if (!item.checked) {
                    continue;
                }
            }
            if (item.type === "file") {
                formData.append('file', item.files[0]);
            } else if (item.value) {
                formData.append(item.name, item.value);
            }
        }
        return formData;
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
        display,
        serialiseForm
    };
}());
