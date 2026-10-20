/*
 * モジュール: init.js
 * 役割: 画面の初期生成と初期計算を実行します。各機能スクリプトの後に読み込んでください。
 */

render();
addUniqueMagicDetail();
addTechnique();
addWeapon();
createImageDisplayOptions();
showPortrait();
calculateAll();

const query = new URLSearchParams(location.search);
(async () => {
    if (query.has("shareId")) {
        await loadSharedCharacterFromUrl();
    } else if (query.has("characterId")) {
        await loadCharacterFromAccount();
    } else {
        await loadFromUrl();
    }

    if (query.get("view") === "1") {
        setMode("view");
    }

    if (query.get("output") === "cocofolia") {
        await outputCocofolia();
        document.getElementById("cocofoliaOutput")?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
    markCharacterSaved();

})();
