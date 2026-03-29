document.addEventListener("DOMContentLoaded", () => {
    const storageKey = "academicProfileData";

    const editBtn = document.getElementById("editBtn");
    const editModal = document.getElementById("editModal");
    const saveBtn = document.getElementById("saveBtn");
    const cancelBtn = document.getElementById("cancelBtn");

    const nameDisplay = document.getElementById("nameDisplay");
    const titleDisplay = document.getElementById("titleDisplay");
    const bioDisplay = document.getElementById("bioDisplay");
    const affiliationDisplay = document.getElementById("affiliationDisplay");
    const emailLink = document.getElementById("emailLink");
    const githubLink = document.getElementById("githubLink");

    const nameInput = document.getElementById("nameInput");
    const titleInput = document.getElementById("titleInput");
    const bioInput = document.getElementById("bioInput");
    const affiliationInput = document.getElementById("affiliationInput");
    const emailInput = document.getElementById("emailInput");
    const githubInput = document.getElementById("githubInput");

    function applyProfile(data) {
        if (nameDisplay) nameDisplay.textContent = data.name;
        if (titleDisplay) titleDisplay.textContent = data.title;
        if (bioDisplay) bioDisplay.textContent = data.bio;
        if (affiliationDisplay) affiliationDisplay.textContent = data.affiliation;
        if (emailLink) {
            emailLink.textContent = data.email;
            emailLink.href = "mailto:" + data.email;
        }
        if (githubLink) {
            githubLink.textContent = data.githubLabel;
            githubLink.href = data.github;
        }
    }

    function saveProfile(data) {
        localStorage.setItem(storageKey, JSON.stringify(data));
        applyProfile(data);
    }

    function openEditor() {
        if (!editModal) return;
        nameInput.value = nameDisplay ? nameDisplay.textContent : "";
        titleInput.value = titleDisplay ? titleDisplay.textContent : "";
        bioInput.value = bioDisplay ? bioDisplay.textContent : "";
        affiliationInput.value = affiliationDisplay ? affiliationDisplay.textContent : "";
        emailInput.value = emailLink ? emailLink.textContent : "";
        githubInput.value = githubLink ? githubLink.href : "";
        editModal.classList.add("active");
        editModal.setAttribute("aria-hidden", "false");
    }

    function closeEditor() {
        if (!editModal) return;
        editModal.classList.remove("active");
        editModal.setAttribute("aria-hidden", "true");
    }

    if (editBtn) editBtn.addEventListener("click", openEditor);
    if (cancelBtn) cancelBtn.addEventListener("click", closeEditor);
    if (editModal) {
        editModal.addEventListener("click", event => {
            if (event.target === editModal) closeEditor();
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const profile = {
                name: nameInput.value.trim() || "Wenzhe Zhang",
                title: titleInput.value.trim() || "Ph.D. Candidate in Western Economics",
                bio: bioInput.value.trim() || "I am a Ph.D. candidate at Wuhan University with research interests in labor economics, income distribution, and development economics.",
                affiliation: affiliationInput.value.trim() || "School of Economics and Management, Wuhan University",
                email: emailInput.value.trim() || "zhangwenzhe@whu.edu.cn",
                github: githubInput.value.trim() || "https://github.com/WenzheZhang-Research",
                githubLabel: (githubInput.value.trim() || "https://github.com/WenzheZhang-Research").replace(/^https?:\/\//, "")
            };
            saveProfile(profile);
            closeEditor();
        });
    }

    const savedProfile = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (savedProfile) applyProfile(savedProfile);
});
