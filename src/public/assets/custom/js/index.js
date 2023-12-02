// eslint-disable-next-line require-await
Site.loadPage(async function (site) {

    Site.loading = function loading(show) {
        const submitButton = document.getElementById("submit");
        if (show) {
            document.getElementById("loading").classList.remove("hidden");
            document.getElementById("submitEntry").classList.add("hidden");
            submitButton.setAttribute("disabled", "");
        } else {
            document.getElementById("loading").classList.add("hidden");
            document.getElementById("submitEntry").classList.remove("hidden");
            submitButton.removeAttribute("disabled");
        }
    };

    loadEventListeners();

    function loadEventListeners() {

        site.initPRevSubmissionToggle();

        function getUrl(string) {
            let url;
            try {
                url = new URL(string);
            } catch {
                return null;
            }
            return url.protocol === "http:" || url.protocol === "https:" ? url : null;
        }

        site.onDelete(ids => {
            const table = document.getElementsByClassName("submissionsTable")[0];
            for (const id of ids) {
                table?.querySelector(`tbody tr[data-id="${id}"]`)?.remove();
            }
        });

        site.onEntry(data => {
            const table = document.getElementsByClassName("submissionsTable")[0];
            const no = table.querySelectorAll("tbody tr").length + 1;
            const tbody = table.querySelector("tbody");
            const newRow = `
                <tr data-id="${data.id}">
                    <td>${no}</td>
                    <td><u><span>${data.wadName}</span></u></td>
                    <td>${data.wadLevel}</td>
                </tr>
            `;
            tbody.innerHTML += newRow;
        });
        document.getElementById("wadFile")?.addEventListener("change", async ev => {
            const file = ev.currentTarget.files[0];
            const fileSizeAlert = document.getElementById("fileSizeError");
            const uploadFile = ev.target;
            if (file && file.size > fileSizeLimit) {
                Site.display(false, fileSizeAlert);
                uploadFile.value = null;
            } else {
                Site.display(true, fileSizeAlert);
            }
            const ext = file.name?.split(".")?.pop()?.toLowerCase();
            const select = document.getElementById("levelToPlaySelect");
            select.innerHTML = null;
            const input = document.getElementById("levelToPlay");
            if (ext === "wad") {
                let wadMapAnalyser;
                let maps = [];
                try {
                    wadMapAnalyser = await WadMapAnalyser.create(file);
                    maps = wadMapAnalyser.mapNames;
                } catch (e) {
                    console.error(e);
                }
                if (!maps || maps.length === 0) {
                    select.classList.add("hidden");
                    input.classList.remove("hidden");
                    return;
                }
                input.classList.add("hidden");
                select.classList.remove("hidden");
                const list = maps.map(mapName => `<option>${mapName}</option>`);
                select.innerHTML = list.join();
            } else {
                select.classList.add("hidden");
                input.classList.remove("hidden");
            }
        });
        const wadRadios = document.querySelectorAll("#link,#Upload");
        const fileSizeAlert = document.getElementById("fileSizeError");
        const uploadForm = document.getElementById("wadFile");
        const urlForm = document.getElementById("wadUrl");
        const select = document.getElementById("levelToPlaySelect");
        const input = document.getElementById("levelToPlay");
        for (const wadRadio of wadRadios) {
            wadRadio.addEventListener("change", evt => {
                const value = evt.target.value;
                if (value === "upload") {
                    site.display(false, uploadForm);
                    site.display(true, urlForm);
                    urlForm.value = "";
                    uploadForm.setAttribute("required", "");
                    urlForm.removeAttribute("required");
                    document.getElementById("wadName").removeAttribute("disabled");
                    select.classList.remove("hidden");
                    input.classList.add("hidden");
                } else {
                    site.display(true, uploadForm);
                    site.display(false, urlForm);
                    Site.display(true, fileSizeAlert);
                    uploadForm.value = "";
                    urlForm.setAttribute("required", "");
                    uploadForm.removeAttribute("required");
                    input.classList.remove("hidden");
                    select.classList.add("hidden");
                }
            });
        }
        document.getElementById("wadUrl")?.addEventListener("change", async ev => {
            const value = ev.target.value;
            const wadNameInput = document.getElementById("wadName");
            if (!value) {
                wadNameInput.removeAttribute("disabled");
                wadNameInput.value = "";
            }
            const url = getUrl(value);
            if (!url) {
                return;
            }
            if (!(url.hostname.includes("doomworld.com") && url.pathname.includes("idgames"))) {
                return;
            }
            site.loading(true);
            wadNameInput.setAttribute("placeholder", "Attempting to obtain name from url...");
            wadNameInput.setAttribute("disabled", "true");
            const proxyURl = new URL(`${baseUrl}/utils/corsProxy?url=${url}`);
            let result;
            try {
                result = await fetch(proxyURl);
            } catch {
                return;
            } finally {
                wadNameInput.removeAttribute("placeholder");
                wadNameInput.removeAttribute("disabled");
                site.loading(false);
            }
            if (result.status !== 200) {
                console.error(`Unable to load resource at ${url}`);
                return;
            }
            const htmlText = await result.text();
            const domParser = new DOMParser();
            const doomWorldDOc = domParser.parseFromString(htmlText, "text/html");
            const wadName = doomWorldDOc.getElementsByClassName("filelist")[0]?.querySelector("tbody > tr > td:nth-child(2)")?.textContent?.trim() ?? null;
            if (!wadName) {
                wadNameInput.removeAttribute("disabled");
                wadNameInput.value = "";
                site.loading(false);
                return;
            }
            wadNameInput.setAttribute("disabled", "");
            wadNameInput.value = wadName;
            site.loading(false);
        });
        document.getElementById("gameEngine")?.addEventListener("change", evt => {
            const selectedOption = evt.target.options[evt.target.selectedIndex];
            const selectedValue = selectedOption.dataset.value;
            const gzActionsContainer = document.getElementById("gzActionsContainer");
            if (selectedValue === "GZDoom") {
                site.display(false, gzActionsContainer);
            } else {
                site.display(true, gzActionsContainer);
            }
        });
        ((() => {
            const cardBody = document.getElementById("resultsCardBody");
            if (!cardBody) {
                return;
            }
            const resizeListener = new ResizeObserver(entries => {
                const formCardBodyObserver = entries[0];
                const formCardBodyOffsetHeight = formCardBodyObserver.target.offsetHeight;
                cardBody.style.height = `${formCardBodyOffsetHeight}px`;
            });
            const formCardBody = document.getElementById("formCardBody");
            resizeListener.observe(formCardBody);
        })());
        const distributableRadios = document.querySelectorAll("#authorYes,#authorNo");
        if (distributableRadios) {
            for (const distributableRadio of distributableRadios) {
                distributableRadio.addEventListener("change", evt => {
                    const value = evt.target.value;
                    const distributableSection = document.getElementById("distributableSection");
                    if (value === "true") {
                        site.display(false, distributableSection);
                    } else {
                        site.display(true, distributableSection);
                    }
                });
            }
        }

        document.getElementById("submit")?.addEventListener("click", async ev => {
            await site.submitEntryForm(ev, "addEntry");
        });
    }
});
