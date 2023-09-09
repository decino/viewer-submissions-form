const Site = (function () {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let isInit = false;
    const socket = io(`${mainRul}/submission`, {path: '/socket.io/submission/'});

    let uploadAbortController = null;

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

    window.abortUpload = function abortUpload() {
        if (!uploadAbortController) {
            return;
        }
        uploadAbortController.abort("Unable to upload file. reCAPTCHA has expired while upload was in progress. please email this submission directly");
    };

    const submitEntryForm = async function submitEntryForm(ev, endpoint, urlEncoded = false) {
        ev.preventDefault();
        ev.stopPropagation();
        showError(null);
        const form = document.getElementById("entryForm");
        const formValue = form.reportValidity();
        if (!formValue) {
            return false;
        }
        const reCAPTCHAResponse = grecaptcha.getResponse();
        if (reCAPTCHAResponse === '') {
            showError("Please activate reCAPTCHA.");
            return false;
        }
        if (document?.getElementById("link")?.checked && !document?.getElementById("levelToPlay")?.value) {
            showError("Please fill in the level to play");
            document.getElementById("levelToPlay").focus();
            return;
        }

        const formData = serialiseForm(urlEncoded);
        formData.append("g-recaptcha-response", reCAPTCHAResponse);

        uploadAbortController = new AbortController();
        const signal = uploadAbortController.signal;
        Site.loading(true);
        let response;
        try {
            response = await fetch(`${baseUrl}/submission/${endpoint}`, {
                method: 'POST',
                body: formData,
                signal
            });
        } catch (e) {
            if (e instanceof DOMException && uploadAbortController.signal.aborted) {
                showError(uploadAbortController.signal.reason);
                return;
            }
            showError(e.message);
            return false;
        } finally {
            Site.loading(false);
            grecaptcha.reset();
        }

        const responseStatus = response.status;
        if (responseStatus < 200 || responseStatus >= 400) {
            const responseJson = await response.json();
            showError(responseJson.message);
            return false;
        }
        showSuccess();
        uploadAbortController = null;
        return true;
    };

    const showError = function showError(message) {
        const error = document.getElementById("error");
        if (message === null) {
            document.getElementById("errorContent").textContent = null;
            display(true, error);
            return;
        }
        const success = document.getElementById("success");
        if (!success.classList.contains("hidden")) {
            display(true, success);
        }
        document.getElementById("errorContent").textContent = message.trim();
        display(false, error);
    };

    const onEntry = function onEntry(callBack) {
        socket.on("newSubmission", callBack);
    };

    const onDelete = function onDelete(callBack) {
        socket.on("deleteSubmission", callBack);
    };

    function initWs() {
        socket.on("connect", () => {
            document.getElementById("WSNotConnectedLabel")?.classList.add("hidden");
            document.getElementById("WSConnectedLabel")?.classList.remove("hidden");
        });

        socket.on("disconnect", () => {
            document.getElementById("WSNotConnectedLabel")?.classList.remove("hidden");
            document.getElementById("WSConnectedLabel")?.classList.add("hidden");
        });
    }

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
                if (item.dataset.array) {
                    formData.append(`${item.name}[]`, item.value);
                } else {
                    formData.append(item.name, item.value);
                }
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

    const initPRevSubmissionToggle = function initPRevSubmissionToggle(overload) {
        const allTogglesWrappers = document.getElementsByClassName("allSubmissionSwitchWrapper");
        if (allTogglesWrappers.length > 0) {
            for (let i = 0; i < allTogglesWrappers.length; i++) {
                const wrapper = allTogglesWrappers[i];
                const el = wrapper.querySelector("input");
                if (el) {
                    el.addEventListener("change", ev => {
                        const target = ev.target;
                        const tableWrapper = target.closest(".tab-pane").querySelector(".allSubmissionsToggleWrapper");
                        if (tableWrapper.classList.contains("hidden")) {
                            tableWrapper.classList.remove("hidden");
                        } else {
                            tableWrapper.classList.add("hidden");
                        }
                        if (overload) {
                            overload(el);
                        }
                    });
                }
            }
        }
    };

    const loadPage = function loadPage(anon) {
        // eslint-disable-next-line require-await
        anon.call(this, Site).then(async () => {
            function initTooltips() {
                document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
            }

            function initTabs() {
                const triggerTabList = document.querySelectorAll('#resultTabs button');
                triggerTabList.forEach(triggerEl => {
                    const tabTrigger = new bootstrap.Tab(triggerEl);
                    triggerEl.addEventListener('click', event => {
                        event.preventDefault();
                        tabTrigger.show();
                    });
                });
            }

            function selectLastTab() {
                const lastTab = document.querySelector('#resultTabs li:last-child button');
                if (lastTab) {
                    bootstrap.Tab.getInstance(lastTab).show();
                }
            }

            initWs();
            initTooltips();
            initTabs();
            selectLastTab();
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
        showError,
        onEntry,
        onDelete,
        initPRevSubmissionToggle,
    };
}());
