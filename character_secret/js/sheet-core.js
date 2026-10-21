/*
 * モジュール: sheet-core.js
 * 役割: 基本状態、定数、入力値の取得、技能計算と初期表示用DOMの生成を担当します。
 */

let portraitData='';
let currentMode = 'edit';

let skillModifiers = {
    combat: {
        拳: 0,
        蹴り: 0,
        回避: 0,
        カウンター: 0,
        弾き: 0
    },
    search: {
        観察: 0,
        分析: 0,
        幸運: 0,
        知識: 0,
        五感: 0,
        追跡: 0
    }
};

let showSpeechListenerAdded = false;

let imageDisplaySettings = {
    unique: [],
    basicDefault: [],
    basic: [],
    technique: []
};

const statOpts=[
    ['none','なし'],
    ['str','筋力'],
    ['acc','正確性'],
    ['agi','俊敏性'],
    ['know','知識'],
    ['think','思考力'],
    ['looks','容姿'],
    ['luck','幸運'],
    ['emotion','感情値']
];


const stats=[
    ['str','筋力'],
    ['acc','正確性'],
    ['agi','俊敏性'],
    ['know','知識'],
    ['think','思考力'],
    ['looks','容姿'],
    ['luck','幸運'],
    ['emotion','感情値'],
    ['mp','総魔力量'],
    ['hp','体力']
];


const uniqueNames=[
    '変身',
    '変化',
    '創造',
    '命令',
    '回復',
    '光',
    '結界',
    '異常発達',
    '冒涜',
    '召喚'
];


const special=[
    ['disguise','変装','なし'],
    ['voice','変声','正確性'],
    ['negotiate','交渉','なし'],
    ['authority','権威','なし'],
    ['charm','魅了','容姿'],
    ['psychology','心理学','思考力'],
    ['steal','盗み','正確性'],
    ['shooting','射撃','なし'],
    ['jump','跳躍','筋力']
];


const N=id=>Number(
    document.getElementById(id)?.value||0
);

const E=s=>String(s).replace(
    /[&<>'"]/g,
    c=>({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        "'":'&#39;',
        '"':'&quot;'
    }[c])
);


function msg(id,t,c='note'){
    let e=document.getElementById(id);
    e.textContent=t;
    e.className=c
}


function options(selected='none'){
    return statOpts.map(([v,n])=>`<option value="${v}" ${v===selected?'selected':''}>${n}</option>`).join('')
}


function statName(id){
    return Object.fromEntries(statOpts)[id]||'なし'
}
            

function render(){
    statsGrid.innerHTML=stats.map(([id,n,r])=>`<div class="field"><label>${n}</label><input id="${id}" type="number" min="0" data-save ${r?'readonly':''} oninput="${id === 'str' ? 'hp.value = (Number(this.value) || 0) + 50;' : ''}calculateAll('stats')"></div>`).join('');
    specialSkills.innerHTML=special.map(([id,n,b])=>`<tr><td><b>【${n}】</b></td><td><input class="mini" id="sp_${id}" type="number" min="0" data-save oninput="calculateAll('special')"></td><td>${b}</td><td class="calc" id="sp_${id}_total">0</td><td></td></tr>`).join('');
    uniqueMagicOptions.innerHTML=uniqueNames.map(n=>`<label class="check-card"><input id="unique_${n}" type="checkbox" value="${n}" data-save data-unique onchange="calculateAll('unique')">${n}</label>`).join('')
}

// 追加特殊技能の行を作成し、割り振り・補正ステータス・削除操作を用意します。
function addCustomSpecialSkill(skill = {}) {
    const row = document.createElement('tr');
    row.dataset.customSpecialSkill = '';
    const base = statOpts.map(([value, label]) =>
        `<option value="${value}" ${value === (skill.base || 'none') ? 'selected' : ''}>${label}</option>`
    ).join('');
    row.innerHTML = `
        <td><input class="mini" type="text" maxlength="40" aria-label="追加特殊技能名" placeholder="技能名" data-custom-special-name value="${E(skill.name || '')}"></td>
        <td><input class="mini" type="number" min="0" aria-label="追加特殊技能の割り振り" data-custom-special-allocation value="${E(skill.allocation ?? '')}"></td>
        <td><select class="mini" aria-label="追加特殊技能の補正ステータス" data-custom-special-base>${base}</select></td>
        <td class="calc" data-custom-special-total>0</td>
        <td><button type="button" class="secondary" aria-label="追加特殊技能を削除">削除</button></td>
    `;
    row.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', () => calculateAll('special'));
    });
    row.querySelector('button').addEventListener('click', () => {
        row.remove();
        calculateAll('special');
    });
    specialSkills.appendChild(row);
    calculateAll('special');
}


function vals(){
    let v={
        str:N('str'),
        acc:N('acc'),
        agi:N('agi'),
        know:N('know'),
        think:N('think'),
        looks:N('looks'),
        luck:N('luck'),
        emotion:N('emotion'),
        mp:N('mp')
    };

    v.hp=N('hp');v.combat={
        拳:v.acc+60+Number(skillModifiers.combat.拳||0),
        蹴り:v.acc+30+Number(skillModifiers.combat.蹴り||0),
        回避:Math.min(v.acc+v.agi,90)+Number(skillModifiers.combat.回避||0),
        カウンター:v.acc+Number(skillModifiers.combat.カウンター||0),
        弾き:v.acc+Number(skillModifiers.combat.弾き||0)
    };

    v.search={
        観察:v.acc+40+Number(skillModifiers.search.観察||0),
        分析:v.think+30+Number(skillModifiers.search.分析||0),
        幸運:v.luck+Number(skillModifiers.search.幸運||0),
        知識:v.know*3+Number(skillModifiers.search.知識||0),
        五感:v.acc*3+Number(skillModifiers.search.五感||0),
        追跡:v.agi+v.acc+v.luck+Number(skillModifiers.search.追跡||0)
    };

    v.special={
        変装:N('sp_disguise'),
        変声:N('sp_voice')+v.acc,
        交渉:N('sp_negotiate'),
        権威:N('sp_authority'),
        魅了:N('sp_charm')+v.looks,
        心理学:N('sp_psychology')+v.think,
        盗み:N('sp_steal')+v.acc,
        射撃:N('sp_shooting'),
        跳躍:N('sp_jump')+v.str
    };
    return v
}

function setSkillModifier(category, skill, value){
    if (!skillModifiers[category] ||
        !(skill in skillModifiers[category])) {
        return;
    }

    skillModifiers[category][skill] = Number(value) || 0;
    calculateAll(category);
}


function calculateAll(...requestedGroups) {
    const groups = new Set();
    if (requestedGroups.length === 0 || requestedGroups.includes('all')) {
        ['status', 'combat', 'search', 'special', 'basic', 'unique', 'actions']
            .forEach(group => groups.add(group));
    } else {
        requestedGroups.forEach(group => {
            if (group === 'stats') {
                ['status', 'combat', 'search', 'special', 'actions'].forEach(item => groups.add(item));
            } else if (group === 'combat' || group === 'search' || group === 'special') {
                groups.add(group);
                groups.add('actions');
            } else if (['basic', 'unique', 'actions', 'status'].includes(group)) {
                groups.add(group);
            }
        });
    }
    if (groups.size === 0) return;
    const value = id => document.getElementById(id)?.value ?? '';
    const customSpecialInputs = groups.has('special')
        ? [...document.querySelectorAll('#specialSkills [data-custom-special-skill]')]
            .map(row => [
                row.querySelector('[data-custom-special-allocation]')?.value ?? '',
                row.querySelector('[data-custom-special-base]')?.value ?? ''
            ])
        : [];
    const customBasicValues = groups.has('basic')
        ? [...document.querySelectorAll('#basicMagicGrid [data-basic-magic-value]')]
            .map(input => input.value)
        : [];
    let v;
    const currentValues = () => v || (v = vals());

    if (groups.has('status')) {
        const total = ['str', 'acc', 'agi', 'know', 'think', 'looks', 'luck']
            .reduce((sum, id) => sum + (Number(value(id)) || 0), 0);
        manualTotal.textContent = total;
        msg(
            'statMessage',
            total > 140 ? '合計が140を超えています。' : '合計は範囲内です。',
            total > 140 ? 'warning' : 'success'
        );
    }

    if (groups.has('combat')) {
        const current = currentValues();
        const rows = [
            ['拳', '正確性+60'], ['蹴り', '正確性+30'],
            ['回避', '正確性+俊敏性、上限90'],
            ['カウンター', '正確性'], ['弾き', '正確性']
        ];
        combatSkills.innerHTML = rows.map(([name, expression]) =>
            '<tr><td><b>【' + name + '】</b></td><td>' + expression +
            '</td><td><input class="mini skill-modifier" type="number" step="1" ' +
            'aria-label="' + name + 'の補正値" value="' +
            Number(skillModifiers.combat[name] || 0) +
            '" onchange="setSkillModifier(\'combat\',\'' + name +
            '\',this.value)"></td><td class="calc"><span class="skill-success-value">' +
            current.combat[name] + '</span></td></tr>'
        ).join('');
    }

    if (groups.has('search')) {
        const current = currentValues();
        const rows = [
            ['観察', '正確性+40'], ['分析', '思考力+30'],
            ['幸運', 'ステータス'], ['知識', 'ステータス×3'],
            ['五感', '正確性×3'], ['追跡', '俊敏性+正確性+幸運']
        ];
        searchSkills.innerHTML = rows.map(([name, expression]) =>
            '<tr><td><b>【' + name + '】</b></td><td>' + expression +
            '</td><td><input class="mini skill-modifier" type="number" step="1" ' +
            'aria-label="' + name + 'の補正値" value="' +
            Number(skillModifiers.search[name] || 0) +
            '" onchange="setSkillModifier(\'search\',\'' + name +
            '\',this.value)"></td><td class="calc"><span class="skill-success-value">' +
            current.search[name] + '</span></td></tr>'
        ).join('');
    }

    if (groups.has('special')) {
        const current = currentValues();
        special.forEach(([id, name]) => {
            document.getElementById('sp_' + id + '_total').textContent = current.special[name];
        });
        document.querySelectorAll('#specialSkills [data-custom-special-skill]').forEach(row => {
            const base = row.querySelector('[data-custom-special-base]').value;
            const baseValue = base === 'none' ? 0 : Number(current[base] ?? 0);
            row.querySelector('[data-custom-special-total]').textContent =
                (Number(row.querySelector('[data-custom-special-allocation]').value) || 0) + baseValue;
        });
        const used = special.reduce((sum, [id]) => sum + (Number(value('sp_' + id)) || 0), 0) +
            customSpecialInputs.reduce((sum, [allocation]) => sum + (Number(allocation) || 0), 0);
        specialUsed.textContent = used;
        msg(
            'specialMessage',
            used > 100 ? '100点を超えています。' : '範囲内です。',
            used > 100 ? 'warning' : 'success'
        );
    }

    if (groups.has('basic')) {
        const total = Number(value('basicMagicTotal')) || 0;
        const used = (Number(value('heatMagic')) || 0) +
            (Number(value('bodyMagic')) || 0) +
            (Number(value('controlMagic')) || 0) +
            customBasicValues.reduce((sum, item) => sum + (Number(item) || 0), 0);
        basicMagicUsed.textContent = used;
        basicMagicTotalText.textContent = total;
        msg(
            'basicMagicMessage',
            used > total ? '合計値を超えています。' :
                used < total ? 'あと' + (total - used) + '点です。' : '一致しています。',
            used > total ? 'warning' : used === total ? 'success' : 'note'
        );
    }

    if (groups.has('unique')) {
        const count = Number(value('uniqueMagicCount')) || 0;
        const selected = document.querySelectorAll('[data-unique]:checked').length;
        uniqueMagicCountText.textContent = count;
        msg(
            'uniqueMagicMessage',
            selected > count ? '選択数超過です。' :
                selected < count ? 'あと' + (count - selected) + '個です。' : '一致しています。',
            selected > count ? 'warning' : selected === count ? 'success' : 'note'
        );
    }

    if (groups.has('actions')) {
        const current = currentValues();
        document.querySelectorAll('[data-live-total]').forEach(element => {
            const card = element.closest('.card');
            const ref = card?.querySelector('[data-field="ref"]')?.value ?? 'none';
            const mult = Number(card?.querySelector('[data-field="mult"]')?.value || 1);
            const add = Number(card?.querySelector('[data-field="add"]')?.value || 0);
            const base = ref === 'none' ? 0 : Number(current[ref] ?? 0);
            element.value = base * mult + add;
        });
    }
}
            
