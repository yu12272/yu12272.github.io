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
    statsGrid.innerHTML=stats.map(([id,n,r])=>`<div class="field"><label>${n}</label><input id="${id}" type="number" min="0" data-save ${r?'readonly':''} oninput="${id === 'str' ? 'hp.value = (Number(this.value) || 0) + 50;' : ''}calculateAll()"></div>`).join('');
    specialSkills.innerHTML=special.map(([id,n,b])=>`<tr><td><b>【${n}】</b></td><td><input class="mini" id="sp_${id}" type="number" min="0" data-save oninput="calculateAll()""></td><td>${b}</td><td class="calc" id="sp_${id}_total">0</td></tr>`).join('');
    uniqueMagicOptions.innerHTML=uniqueNames.map(n=>`<label class="check-card"><input id="unique_${n}" type="checkbox" value="${n}" data-save data-unique onchange="calculateAll()">${n}</label>`).join('')
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
    calculateAll();
}


function calculateAll(){
    let v=vals();
    let total=[
        'str',
        'acc',
        'agi',
        'know',
        'think',
        'looks',
        'luck'
    ].reduce((a,x)=>a+N(x),0);manualTotal.textContent=total;

    msg('statMessage',total>140?'合計が140を超えています。':'合計は範囲内です。',total>140?'warning':'success');
    let c=[
        ['拳','正確性+60'],['蹴り','正確性+30'],
        ['回避','正確性+俊敏性、上限90'],
        ['カウンター','正確性'],
        ['弾き','正確性']
    ];

    combatSkills.innerHTML=c.map(x=>`
        <tr>
            <td><b>【${x[0]}】</b></td>
            <td>${x[1]}</td>
            <td>
                <input
                    class="mini skill-modifier"
                    type="number"
                    step="1"
                    aria-label="${x[0]}の補正値"
                    value="${Number(skillModifiers.combat[x[0]]||0)}"
                    onchange="setSkillModifier('combat','${x[0]}',this.value)"
                >
            </td>
            <td class="calc">${v.combat[x[0]]}</td>
        </tr>
    `).join('');

    let s=[
        ['観察','正確性+40'],
        ['分析','思考力+30'],
        ['幸運','ステータス'],
        ['知識','ステータス×3'],
        ['五感','正確性×3'],
        ['追跡','俊敏性+正確性+幸運']
    ];

    searchSkills.innerHTML=s.map(x=>`
        <tr>
            <td><b>【${x[0]}】</b></td>
            <td>${x[1]}</td>
            <td>
                <input
                    class="mini skill-modifier"
                    type="number"
                    step="1"
                    aria-label="${x[0]}の補正値"
                    value="${Number(skillModifiers.search[x[0]]||0)}"
                    onchange="setSkillModifier('search','${x[0]}',this.value)"
                >
            </td>
            <td class="calc">${v.search[x[0]]}</td>
        </tr>
    `).join('');

    special.forEach(([id,n])=>document.getElementById(`sp_${id}_total`).textContent=v.special[n]);
    let used=special.reduce((a,[id])=>a+N(`sp_${id}`),0);
    specialUsed.textContent=used;msg('specialMessage',used>100?'100点を超えています。':'範囲内です。',used>100?'warning':'success');
    let bt = N('basicMagicTotal');
    let bu =
        N('heatMagic') +
        N('bodyMagic') +
        N('controlMagic');

    document.querySelectorAll('[data-basic-magic-value]').forEach(input => {
        bu += Number(input.value || 0);
    });
    basicMagicUsed.textContent=bu;
    basicMagicTotalText.textContent=bt;
    msg('basicMagicMessage',bu>bt?'合計値を超えています。':bu<bt?`あと${bt-bu}点です。`:'一致しています。',bu>bt?'warning':bu===bt?'success':'note');
    let uc=N('uniqueMagicCount'),ch=document.querySelectorAll('[data-unique]:checked').length;
    uniqueMagicCountText.textContent=uc;msg('uniqueMagicMessage',ch>uc?'選択数超過です。':ch<uc?`あと${uc-ch}個です。`:'一致しています。',ch>uc?'warning':ch===uc?'success':'note');

    document.querySelectorAll('[data-live-total]').forEach(el => {
        const card = el.closest('.card');

        if (!card) return;

        const refInput = card.querySelector('[data-field="ref"]');
        const multInput = card.querySelector('[data-field="mult"]');
        const addInput = card.querySelector('[data-field="add"]');

        if (!refInput || !multInput || !addInput) return;

        const ref = refInput.value;
        const mult = Number(multInput.value || 1);
        const add = Number(addInput.value || 0);

        el.value = (ref === 'none' ? 0 : v[ref]) * mult + add;
    });
}
            
