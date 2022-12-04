Site.loadPage(async function (site) {
    loadEventListeners();

    function loadEventListeners() {
        function display(hide, element) {
            if (hide) {
                element.closest("div").classList.add("hidden");
            } else {
                element.closest("div").classList.remove("hidden");
            }
        }

        const wadRadios = document.querySelectorAll("#link,#Upload");
        for (const wadRadio of wadRadios) {
            wadRadio.addEventListener("change", evt => {
                const value = evt.target.value;
                const uploadForm = document.getElementById("wadFile");
                const urlForm = document.getElementById("wadUrl");
                if (value === "upload") {
                    display(false, uploadForm);
                    display(true, urlForm);
                    urlForm.value = "";
                } else {
                    display(true, uploadForm);
                    display(false, urlForm);
                    uploadForm.value = "";
                }
            });
        }
        document.getElementById("gameEngine").addEventListener("change", evt => {
            const selectedOption = evt.target.options[evt.target.selectedIndex];
            const selectedValue = selectedOption.dataset.value;
            const gzActionsContainer = document.getElementById("gzActionsContainer");
            if (selectedValue === "GZDoom") {
                display(false, gzActionsContainer);
            } else {
                display(true, gzActionsContainer);
            }
        });

        const distributableRadios = document.querySelectorAll("#authorYes,#authorNo");
        for (const distributableRadio of distributableRadios) {
            distributableRadio.addEventListener("change", evt => {
                const value = evt.target.value;
                const distributableSection = document.getElementById("distributableSection");
                if (value === "yes") {
                    display(false, distributableSection);
                } else {
                    display(true, distributableSection);
                }
            });
        }
    }
});
