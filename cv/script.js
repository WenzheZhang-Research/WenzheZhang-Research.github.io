document.addEventListener("DOMContentLoaded", () => {
    const storageKey = "academicProfileData";

    const nameDisplay = document.getElementById("nameDisplay");
    const titleDisplay = document.getElementById("titleDisplay");
    const bioDisplay = document.getElementById("bioDisplay");
    const affiliationDisplay = document.getElementById("affiliationDisplay");
    const emailLink = document.getElementById("emailLink");
    const githubLink = document.getElementById("githubLink");

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

    const savedProfile = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (savedProfile) {
        applyProfile(savedProfile);
    }
});
