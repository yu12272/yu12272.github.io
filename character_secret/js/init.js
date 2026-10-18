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
if (query.has("shareId")) {
    loadSharedCharacterFromUrl();
} else if (query.has("characterId")) {
    loadCharacterFromAccount();
} else {
    loadFromUrl();
}
