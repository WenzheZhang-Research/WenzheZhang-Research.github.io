document.addEventListener("DOMContentLoaded", () => {
    const storageKey = "academicProfileData";
    const cvStorageKey = "academicCvData";

    const uploadArea = document.getElementById("uploadArea");
    const cvInput = document.getElementById("cvInput");
    const fileInfo = document.getElementById("fileInfo");
    const fileName = document.getElementById("fileName");
    const fileSize = document.getElementById("fileSize");
    const viewBtn = document.getElementById("viewBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const removeBtn = document.getElementById("removeBtn");

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
    const avatarPreview = document.getElementById("avatarPreview");

    const nameInput = document.getElementById("nameInput");
    const titleInput = document.getElementById("titleInput");
    const bioInput = document.getElementById("bioInput");
    const affiliationInput = document.getElementById("affiliationInput");
    const emailInput = document.getElementById("emailInput");
    const githubInput = document.getElementById("githubInput");
    const avatarInput = document.getElementById("avatarInput");

    let currentCv = null;

    function formatFileSize(bytes) {
        if (bytes < 1024) {
            return bytes + " B";
        }
        if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(1) + " KB";
        }
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }

    function updateCvCard() {
        if (!currentCv) {
            fileInfo.classList.add("hidden");
            uploadArea.classList.remove("hidden");
            return;
        }

        fileName.textContent = currentCv.name;
        fileSize.textContent = formatFileSize(currentCv.size);
        fileInfo.classList.remove("hidden");
        uploadArea.classList.add("hidden");
    }

    function persistCv() {
        if (!currentCv) {
            localStorage.removeItem(cvStorageKey);
            return;
        }
        localStorage.setItem(cvStorageKey, JSON.stringify(currentCv));
    }

    function readFile(file) {
        const validTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

        if (!validTypes.includes(file.type) && !/\.(pdf|doc|docx)$/i.test(file.name)) {
            alert("Please upload a PDF, DOC, or DOCX file.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("Please keep the CV under 5 MB for browser storage.");
            return;
        }

        const reader = new FileReader();
        reader.onload = event => {
            currentCv = {
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: event.target.result
            };
            persistCv();
            updateCvCard();
        };
        reader.readAsDataURL(file);
    }

    if (uploadArea && cvInput) {
        uploadArea.addEventListener("click", () => cvInput.click());
        uploadArea.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                cvInput.click();
            }
        });

        cvInput.addEventListener("change", event => {
            const file = event.target.files[0];
            if (file) {
                readFile(file);
            }
        });

        uploadArea.addEventListener("dragover", event => {
            event.preventDefault();
            uploadArea.classList.add("dragover");
        });

        uploadArea.addEventListener("dragleave", () => {
            uploadArea.classList.remove("dragover");
        });

        uploadArea.addEventListener("drop", event => {
            event.preventDefault();
            uploadArea.classList.remove("dragover");
            const file = event.dataTransfer.files[0];
            if (file) {
                readFile(file);
            }
        });
    }

    if (viewBtn) {
        viewBtn.addEventListener("click", () => {
            if (!currentCv || !currentCv.dataUrl) {
                return;
            }
            window.open(currentCv.dataUrl, "_blank", "noopener,noreferrer");
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            if (!currentCv || !currentCv.dataUrl) {
                return;
            }
            const link = document.createElement("a");
            link.href = currentCv.dataUrl;
            link.download = currentCv.name;
            link.click();
        });
    }

    if (removeBtn && cvInput) {
        removeBtn.addEventListener("click", () => {
            currentCv = null;
            cvInput.value = "";
            persistCv();
            updateCvCard();
        });
    }

    function getInitials(name) {
        return name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0].toUpperCase())
            .join("") || "SZ";
    }

    function applyProfile(data) {
        nameDisplay.textContent = data.name;
        titleDisplay.textContent = data.title;
        bioDisplay.textContent = data.bio;
        affiliationDisplay.textContent = data.affiliation;
        emailLink.textContent = data.email;
        emailLink.href = "mailto:" + data.email;
        githubLink.textContent = data.githubLabel;
        githubLink.href = data.github;

        if (data.avatar) {
            avatarPreview.innerHTML = '<img src="' + data.avatar + '" alt="Profile portrait">';
        } else {
            avatarPreview.innerHTML = "<span>" + getInitials(data.name) + "</span>";
        }
    }

    function saveProfile(data) {
        localStorage.setItem(storageKey, JSON.stringify(data));
        applyProfile(data);
    }

    function openEditor() {
        nameInput.value = nameDisplay.textContent;
        titleInput.value = titleDisplay.textContent;
        bioInput.value = bioDisplay.textContent;
        affiliationInput.value = affiliationDisplay.textContent;
        emailInput.value = emailLink.textContent;
        githubInput.value = githubLink.href;
        editModal.classList.add("active");
        editModal.setAttribute("aria-hidden", "false");
    }

    function closeEditor() {
        editModal.classList.remove("active");
        editModal.setAttribute("aria-hidden", "true");
    }

    editBtn.addEventListener("click", openEditor);
    cancelBtn.addEventListener("click", closeEditor);
    editModal.addEventListener("click", event => {
        if (event.target === editModal) {
            closeEditor();
        }
    });

    saveBtn.addEventListener("click", () => {
        const profile = {
            name: nameInput.value.trim() || "Wenzhe Zhang",
            title: titleInput.value.trim() || "Ph.D. Candidate in Western Economics",
            bio: bioInput.value.trim() || "I am a Ph.D. candidate at Wuhan University with research interests in labor economics, income distribution, and development economics.",
            affiliation: affiliationInput.value.trim() || "School of Economics and Management, Wuhan University",
            email: emailInput.value.trim() || "zhangwenzhe@whu.edu.cn",
            github: githubInput.value.trim() || "https://github.com/WenzheZhang-Research",
            githubLabel: "github.com/WenzheZhang-Research",
            avatar: null
        };

        const existing = JSON.parse(localStorage.getItem(storageKey) || "null");
        if (existing && existing.avatar) {
            profile.avatar = existing.avatar;
        }

        if (avatarInput.files[0]) {
            const reader = new FileReader();
            reader.onload = event => {
                profile.avatar = event.target.result;
                saveProfile(profile);
                closeEditor();
            };
            reader.readAsDataURL(avatarInput.files[0]);
        } else {
            saveProfile(profile);
            closeEditor();
        }
    });

    const savedProfile = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (savedProfile) {
        applyProfile(savedProfile);
    }

    const savedCv = JSON.parse(localStorage.getItem(cvStorageKey) || "null");
    if (savedCv) {
        currentCv = savedCv;
    }
    if (fileInfo && uploadArea) {
        updateCvCard();
    }
});
