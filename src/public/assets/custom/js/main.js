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

    const submitEntryForm = async function submitEntryForm(ev, endpoint, urlEncoded = false) {
        ev.preventDefault();
        ev.stopPropagation();
        const form = document.getElementById("entryForm");
        const formValue = form.reportValidity();
        if (!formValue) {
            return;
        }
        const formData = serialiseForm(urlEncoded);
        Site.loading(true);
        let response;
        try {
            response = await fetch(`${baseUrl}/submission/${endpoint}`, {
                method: 'POST',
                body: formData
            });
        } catch (e) {
            showError(e.message);
            return false;
        } finally {
            Site.loading(false);
        }

        const responseStatus = response.status;
        if (responseStatus < 200 || responseStatus >= 400) {
            const responseJson = await response.json();
            showError(responseJson.message);
            return false;
        }
        showSuccess();
        return true;
    };

    const showError = function showError(message) {
        const success = document.getElementById("success");
        if (!success.classList.contains("hidden")) {
            display(true, success);
        }
        const error = document.getElementById("error");
        document.getElementById("errorContent").textContent = message.trim();
        display(false, error);
    };

    const showSuccess = function showSuccess() {
        const error = document.getElementById("error");
        const success = document.getElementById("success");
        display(true, error);
        if (success.classList.contains("hidden")) {
            display(false, success);
        }
    };

    const serialiseForm = function serialiseForm(urlEncoded = false) {
        function isHidden(el) {
            if (el instanceof HTMLInputElement && el.type === "hidden") {
                return false;
            }
            const style = window.getComputedStyle(el);
            return ((style.display === 'none') || (style.visibility === 'hidden') || el.offsetParent === null);
        }

        const form = document.getElementById("entryForm");
        const items = form.querySelectorAll("input, textarea, select");
        const formData = urlEncoded ? new URLSearchParams() : new FormData();
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
        serialiseForm,
        submitEntryForm,
        showSuccess,
        showError
    };
}());
