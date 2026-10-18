/*
 * モジュール: magic.js
 * 役割: 基礎魔法・固有魔法の編集と、技・武器カードの追加およびデータ取得を担当します。
 */

function roll(c,s){
    let t=0;
    while(c--)t+=Math.floor(Math.random()*s)+1;return t
}
    

function rollStats(){
    ['str','acc','agi','know','think','looks','luck'].forEach(x=>document.getElementById(x).value=roll(5,6));
    emotion.value=roll(10,6);
    mp.value=originSetting.value==='始祖'?roll(1,100)+20:Math.max(0,roll(1,100)-1);
    hp.value=N('str')+50;
    calculateAll()
}


function clearStats(){
    stats.forEach(([id])=>document.getElementById(id).value='');
    calculateAll()
}
    
    
function rollBasicMagic(){
    basicMagicTotal.value = roll(1,100);
    heatMagic.value = bodyMagic.value = controlMagic.value = 0;
    document.querySelectorAll(
        '#basicMagicGrid .custom-basic-magic input[type="number"]'
    ).forEach(input => {
        input.value = 0;
    });

    calculateAll();
}


function addBasicMagic(name = '', value = '') {
    if (!name) {
        name = prompt('追加する基礎魔法の名前を入力してください。');
    }

    if (!name || !name.trim()) return;

    name = name.trim();

    const grid = document.getElementById('basicMagicGrid');

    const exists = [...grid.querySelectorAll('.custom-basic-magic')]
        .some(field => field.dataset.magicName === name) ||
        [...grid.querySelectorAll('.field:not(.custom-basic-magic) label')]
            .some(label => label.textContent.trim() === name);

    if (exists) {
        alert('同じ名前の基礎魔法がすでにあります。');
        return;
    }

    const field = document.createElement('div');
    field.className = 'field custom-basic-magic';
    field.dataset.magicName = name;

    const heading = document.createElement('div');
    heading.className = 'magic-custom-heading';
    const label = document.createElement('label');
    label.textContent = name;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'magic-item-delete danger view-hide-control';
    deleteButton.textContent = '削除';
    deleteButton.setAttribute('aria-label', `${name}を削除`);
    deleteButton.onclick = () => removeBasicMagicField(deleteButton);

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.value = value;
    input.dataset.basicMagicValue = '';
    input.oninput = calculateAll;

    heading.append(label, deleteButton);
    field.appendChild(heading);
    field.appendChild(input);

    grid.appendChild(field);

    calculateAll();
}

// 入力欄から基礎魔法を追加し、追加成功時は入力欄を空にします。
function addBasicMagicFromInput() {
    const input = document.getElementById('basicMagicNameInput');
    const before = document.querySelectorAll('#basicMagicGrid .custom-basic-magic').length;
    if (!input.value.trim()) {
        input.focus();
        return;
    }
    addBasicMagic(input.value);
    if (document.querySelectorAll('#basicMagicGrid .custom-basic-magic').length > before) {
        input.value = '';
        input.focus();
    }
}

function removeBasicMagicField(button) {
    const field = button.closest('.custom-basic-magic');
    if (!field || !confirm(`「${field.dataset.magicName}」を削除しますか？`)) return;
    field.remove();
    calculateAll();
}


function addCustomUniqueMagic(name = '', checked = false) {
    if (!name) {
        name = prompt('追加する固有魔法の名前を入力してください。');
    }

    if (!name || !name.trim()) return;

    name = name.trim();

    const options = document.getElementById('uniqueMagicOptions');

    const exists = [...options.querySelectorAll('.custom-unique-magic')]
        .some(label => label.dataset.magicName === name);

    const existingFixed = [...options.querySelectorAll('.check-card')]
        .some(label =>
            !label.classList.contains('custom-unique-magic') &&
            label.textContent.trim() === name
        );

    if (exists || existingFixed) {
        alert('同じ名前の固有魔法がすでにあります。');
        return;
    }

    const card = document.createElement('div');
    card.className = 'check-card custom-unique-magic';
    card.dataset.magicName = name;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = name;
    input.checked = checked;
    input.dataset.unique = '';
    input.dataset.customUnique = '';
    input.onchange = calculateAll;

    const choiceLabel = document.createElement('label');
    choiceLabel.className = 'custom-unique-choice';
    const nameLabel = document.createElement('span');
    nameLabel.textContent = name;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'magic-item-delete danger view-hide-control';
    deleteButton.textContent = '削除';
    deleteButton.setAttribute('aria-label', `${name}を削除`);
    deleteButton.onclick = () => removeCustomUniqueMagic(deleteButton);

    choiceLabel.append(input, nameLabel);
    card.append(choiceLabel, deleteButton);

    options.appendChild(card);

    calculateAll();
}


// 入力欄から固有魔法を追加し、追加成功時は入力欄を空にします。
function addCustomUniqueMagicFromInput() {
    const input = document.getElementById('uniqueMagicNameInput');
    const before = document.querySelectorAll('#uniqueMagicOptions .custom-unique-magic').length;
    if (!input.value.trim()) {
        input.focus();
        return;
    }
    addCustomUniqueMagic(input.value);
    if (document.querySelectorAll('#uniqueMagicOptions .custom-unique-magic').length > before) {
        input.value = '';
        input.focus();
    }
}

function removeCustomUniqueMagic(button) {
    const card = button?.closest('.custom-unique-magic');
    if (!card || !confirm(`「${card.dataset.magicName}」を削除しますか？`)) return;
    card.remove();
    calculateAll();
}



function rollUniqueMagicCount(){
    uniqueMagicCount.value=roll(1,4);
    document.querySelectorAll('[data-unique]').forEach(x=>x.checked=false);
    calculateAll()
}


function addUniqueMagicDetail(d={}){
    let c=document.createElement('div');
    c.className='card unique-detail';
    c.innerHTML=`
        <div class="grid two">
            <div class="field">
                <label>魔法名</label>
                <input data-field="magicName" value="${E(d.magicName||'')}">
            </div>
            <div class="field">
                <label>魔法効果</label>
                <textarea data-field="magicEffect">${E(d.magicEffect||'')}
                </textarea>
            </div>
        </div>
        <button class="danger magic-delete" onclick="this.closest('.card').remove()">
            削除
        </button>`;
    uniqueMagicDetails.appendChild(c)
    calculateAll();
}
            

function actionCard(type, d = {}) {
    let isTech = type === 'technique';

    let c = document.createElement(isTech ? 'details' : 'div');

    c.className = `card ${type}`;

    if (isTech) {
        c.open = true;
    }

    const techFields = isTech ? `
        <div class="field">
            <label>消費MP</label>
            <input
                type="number"
                min="0"
                data-field="mp"
                value="${E(d.mp || '')}">
        </div>

        <div class="field">
            <label>維持MP</label>
            <input
                type="number"
                min="0"
                data-field="maintainMp"
                value="${E(d.maintainMp || '')}">
        </div>
    ` : '';

    c.innerHTML = `
        ${isTech ? `
            <summary>
                <span class="technique-summary-name">
                    ${E(d.name || '技の設定')}
                </span>
            </summary>
        ` : ''}

        <div class="grid">

            <div class="field">
                <label>
                    ${isTech ? '技' : '武器'}の名前
                </label>
                <input data-field="name" value="${E(d.name || '')}">
            </div>

            <div class="field view-hide-field">
                <label>参照ステータス</label>
                <select data-field="ref" onchange="calculateAll()">
                    ${options(d.ref || 'none')}
                </select>
            </div>

            <div class="field view-hide-field">
                <label>倍率</label>
                <input type="number" step="0.1" data-field="mult" value="${E(d.mult ?? '1')}" oninput="calculateAll()">
            </div>

            <div class="field view-hide-field">
                <label>成功値への加算</label>
                <input
                    type="number"
                    data-field="add"
                    value="${E(d.add ?? '0')}"
                    oninput="calculateAll()">
            </div>

            <div class="field">
                <label>最終成功値</label>
                <input data-live-total readonly>
            </div>

            <div class="field">
                <label>ダメージロール</label>
                <input
                    data-field="damage"
                    value="${E(d.damage || '')}"
                    placeholder="例：1d8+({筋力}/2)">
            </div>

            ${techFields}

        </div>

        <div class="field">
            <label>${isTech ? '効果' : '備考'}</label>
            <textarea data-field="note">${E(d.note || '')}</textarea>
        </div>

        <button
            class="danger action-delete view-hide-control"
            onclick="this.closest('.card').remove()">
            削除
        </button>
    `;

    (isTech ? techniques : weapons).appendChild(c);

    if (isTech) {
        const nameInput = c.querySelector('[data-field="name"]');
        const summaryName = c.querySelector('.technique-summary-name');

        nameInput.addEventListener('input', () => {
            summaryName.textContent =
                nameInput.value.trim() || '技の設定';
        });
    }

    calculateAll();
}
            

function addTechnique(d={}){
    actionCard('technique',d)
}

function addWeapon(d={}){
    actionCard('weapon',d)
}

function actionData(selector){
    return [...document.querySelectorAll(selector)].map(c=>({name:c.querySelector('[data-field=name]').value.trim(),
        ref:c.querySelector('[data-field=ref]').value,
        mult:c.querySelector('[data-field=mult]').value,
        add:c.querySelector('[data-field=add]').value,
        damage:c.querySelector('[data-field=damage]').value.trim(),
        mp:c.querySelector('[data-field=mp]')?.value||'',
        maintainMp:c.querySelector('[data-field=maintainMp]')?.value||'',
        note:c.querySelector('[data-field=note]').value})).filter(x=>x.name||x.damage||x.note||Number(x.add))
}


