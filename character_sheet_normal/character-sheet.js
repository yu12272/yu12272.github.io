const KEY='trpgSheet_v4';
let portraitData='';
let currentMode = 'edit';

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
    ['hp','体力',1]
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
    statsGrid.innerHTML=stats.map(([id,n,r])=>`<div class="field"><label>${n}</label><input id="${id}" type="number" min="0" data-save ${r?'readonly':''} oninput="calculateAll()"></div>`).join('');
    specialSkills.innerHTML=special.map(([id,n,b])=>`<tr><td><b>【${n}】</b></td><td><input class="mini" id="sp_${id}" type="number" min="0" data-save oninput="calculateAll()"></td><td>${b}</td><td class="calc" id="sp_${id}_total">0</td></tr>`).join('');
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

    v.hp=v.str+50;v.combat={
        拳:v.acc+60,
        蹴り:v.acc+30,
        回避:Math.min(v.acc+v.agi,90),
        カウンター:v.acc,
        弾き:v.acc
    };

    v.search={
        観察:v.acc+40,
        分析:v.think+30,
        幸運:v.luck,
        知識:v.know*3,
        五感:v.acc*3,
        追跡:v.agi+v.acc+v.luck
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


function calculateAll(){
    let v=vals();
    hp.value=v.hp;
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

    combatSkills.innerHTML=c.map(x=>`<tr><td><b>【${x[0]}】</b></td><td>${x[1]}</td><td class="calc">${v.combat[x[0]]}</td></tr>`).join('');
    let s=[
        ['観察','正確性+40'],
        ['分析','思考力+30'],
        ['幸運','ステータス'],
        ['知識','ステータス×3'],
        ['五感','正確性×3'],
        ['追跡','俊敏性+正確性+幸運']
    ];

    searchSkills.innerHTML=s.map(x=>`<tr><td><b>【${x[0]}】</b></td><td>${x[1]}</td><td class="calc">${v.search[x[0]]}</td></tr>`).join('');
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
            
function roll(c,s){
    let t=0;
    while(c--)t+=Math.floor(Math.random()*s)+1;return t
}
    

function rollStats(){
    ['str','acc','agi','know','think','looks','luck'].forEach(x=>document.getElementById(x).value=roll(5,6));
    emotion.value=roll(10,6);
    mp.value=originSetting.value==='始祖'?roll(1,100)+20:Math.max(0,roll(1,100)-1);
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
        .some(field => field.dataset.magicName === name);

    if (exists) {
        alert('同じ名前の基礎魔法がすでにあります。');
        return;
    }

    const field = document.createElement('div');
    field.className = 'field custom-basic-magic';
    field.dataset.magicName = name;

    const label = document.createElement('label');
    label.textContent = name;

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.value = value;
    input.dataset.basicMagicValue = '';
    input.oninput = calculateAll;

    field.appendChild(label);
    field.appendChild(input);

    grid.appendChild(field);

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

    const label = document.createElement('label');
    label.className = 'check-card custom-unique-magic';
    label.dataset.magicName = name;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = name;
    input.checked = checked;
    input.dataset.unique = '';
    input.dataset.customUnique = '';
    input.onchange = calculateAll;

    label.appendChild(input);
    label.appendChild(document.createTextNode(name));

    options.appendChild(label);

    calculateAll();
}


function removeCustomUniqueMagic() {
    const fields = [
        ...document.querySelectorAll(
            '#uniqueMagicOptions .custom-unique-magic'
        )
    ];

    const container = document.getElementById(
        'customUniqueMagicDeleteOptions'
    );

    if (fields.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        alert('削除できる追加固有魔法がありません。');
        return;
    }

    if (container.style.display === 'flex') {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.innerHTML = '';

    fields.forEach(field => {
        const name = field.dataset.magicName;
        const button = document.createElement('button');

        button.type = 'button';
        button.className = 'danger';
        button.textContent = name;

        button.onclick = () => {
            if (!confirm(`「${name}」を削除しますか？`)) {
                return;
            }
            field.remove();
            container.innerHTML = '';
            container.style.display = 'none';
            calculateAll();
        };
        container.appendChild(button);
    });
    container.style.display = 'flex';
}



function removeBasicMagic() {

    const fields = [
        ...document.querySelectorAll(
            '#basicMagicGrid .custom-basic-magic'
        )
    ];

    const container = document.getElementById(
        'basicMagicDeleteOptions'
    );

    if (fields.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';

        alert('削除できる追加基礎魔法がありません。');
        return;
    }

    if (container.style.display === 'flex') {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.innerHTML = '';
    fields.forEach(field => {
        const name = field.dataset.magicName;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'danger';
        button.textContent = name;
        button.onclick = () => {
            if (!confirm(`「${name}」を削除しますか？`)) {
                return;
            }
            field.remove();
            container.innerHTML = '';
            container.style.display = 'none';
            calculateAll();
        };
        container.appendChild(button);
    });
    container.style.display = 'flex';
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


function loadPortrait(e){
    let f=e.target.files[0];if(!f)return;
    let r=new FileReader();
    r.onload=()=>{let img=new Image();
        img.onload=()=>{let max=900,scale=Math.min(1,max/Math.max(img.width,img.height)),cv=document.createElement('canvas');
            cv.width=Math.round(img.width*scale);
            cv.height=Math.round(img.height*scale);
            cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
            portraitData=cv.toDataURL('image/png');
            showPortrait()
        };
        img.src=r.result
    };
    r.readAsDataURL(f)
}
            
function showPortrait(){
    portraitPreview.style.display=portraitData?'block':'none';portraitEmpty.style.display=portraitData?'none':'grid';
    if(portraitData)portraitPreview.src=portraitData
}

function clearPortrait(){
    portraitData='';
    portraitFile.value='';showPortrait()
}
            

function refExpr(ref,mult,add){
    let base=ref==='none'?'0':`{${statName(ref)}}`,m=Number(mult??1),n=Number(add||0);
    let expr=m===1?base:`(${base})*${m}`;
    if(n!==0) expr+=n>0?`+${n}`:`${n}`;
    return expr;
}

function cocofolia(){
    calculateAll();
    let v=vals(),
    cmd=cocDiceCommand.value,
    params=[
        ['筋力',v.str],
        ['正確性',v.acc],
        ['俊敏性',v.agi],
        ['知識',v.know],
        ['思考力',v.think],
        ['容姿',v.looks],
        ['幸運',v.luck],
        ['感情値',v.emotion],
        ['総魔力量',v.mp],
        ['変装割振',N('sp_disguise')],
        ['変声割振',N('sp_voice')],
        ['交渉割振',N('sp_negotiate')],
        ['権威割振',N('sp_authority')],
        ['魅了割振',N('sp_charm')],
        ['心理学割振',N('sp_psychology')],
        ['盗み割振',N('sp_steal')],
        ['射撃割振',N('sp_shooting')],
        ['跳躍割振',N('sp_jump')]
    ].map(([label,value])=>({label,value:String(value)}));
    let lines=[
        '// ステータス判定',
        `${cmd}<={筋力} 【筋力】`,
        `${cmd}<={正確性} 【正確性】`,
        `${cmd}<={俊敏性} 【俊敏性】`,
        `${cmd}<={知識} 【知識】`,
        `${cmd}<={思考力} 【思考力】`,
        `${cmd}<={容姿} 【容姿】`,
        `${cmd}<={幸運} 【幸運】`,
        `${cmd}<={感情値} 【感情値】`,
        '// 通常戦闘技能',
        `${cmd}<={正確性}+60 【拳】`,
        `${cmd}<={正確性}+30 【蹴り】`,
        `${cmd}<=min({正確性}+{俊敏性},90) 【回避】`,
        `${cmd}<={正確性} 【カウンター】`,
        `${cmd}<={正確性} 【弾き】`,
        `({筋力}/2) 【こぶしダメージ】`,
        '// 探索技能',
        `${cmd}<={正確性}+40 【観察】`,
        `${cmd}<={思考力}+30 【分析】`,
        `${cmd}<={幸運} 【幸運】`,
        `${cmd}<={知識}*3 【知識】`,
        `${cmd}<={正確性}*3 【五感】`,
        `${cmd}<={俊敏性}+{正確性}+{幸運} 【追跡】`,

        ...(() => {
            const specialSkillLines = [
                [N('sp_disguise'), `${cmd}<={変装割振} 【変装】`],
                [N('sp_voice'), `${cmd}<={変声割振}+{正確性} 【変声】`],
                [N('sp_negotiate'), `${cmd}<={交渉割振} 【交渉】`],
                [N('sp_authority'), `${cmd}<={権威割振} 【権威】`],
                [N('sp_charm'), `${cmd}<={魅了割振}+{容姿} 【魅了】`],
                [N('sp_psychology'), `${cmd}<={心理学割振}+{思考力} 【心理学】`],
                [N('sp_steal'), `${cmd}<={盗み割振}+{正確性} 【盗み】`],
                [N('sp_shooting'), `${cmd}<={射撃割振} 【射撃】`],
                [N('sp_jump'), `${cmd}<={跳躍割振}+{筋力} 【跳躍】`]
            ];

            const activeSkills = specialSkillLines
                .filter(([allocation]) => allocation > 0)
                .map(([, line]) => line);

            return activeSkills.length > 0
                ? ['// 特殊技能', ...activeSkills]
                : [];
        })()

    ];

    let ts=actionData('.technique'),ws=actionData('.weapon');
    if(ts.length)lines.push('// 技');
    ts.forEach(t=>{
        const name = t.name || '名称未設定';
        lines.push(`${cmd}<=${refExpr(t.ref,t.mult,t.add)} 【${name}】`);
        if(t.mp !== '') {
            lines.push(`:MP-${t.mp} 【消費MP:${name}】`);
        }
        if(t.maintainMp !== '') {
            lines.push(`:MP-${t.maintainMp} 【維持MP:${name}】`);
        }
        if(t.damage) {
            lines.push(`${t.damage} 【${name}・ダメージ】`);
        }
    });

    if(ws.length)lines.push('// 武器');
    ws.forEach(w=>{
        lines.push(`${cmd}<=${refExpr(w.ref,w.mult,w.add)} 【${w.name||'名称未設定'}】`);
        if(w.damage)lines.push(`${w.damage} 【${w.name||'名称未設定'}・ダメージ】`)
        }
    );
    return {
        kind:'character',
        data:{
            name:charName.value||'ダイス振り男',
            initiative:v.agi,
            externalUrl:null,
            iconUrl:null,
            params,
            status:[
                {label:'HP',value:v.hp,max:v.hp},
                {label:'MP',value:v.mp,max:v.mp},
                {label:'SAN',value:v.emotion,max:v.emotion}
            ],
            commands:lines.join('\n'),
            memo:[
                characterMemo.value
            ].join('\n')
        }
    }
}
            

async function outputCocofolia(){
    cocofoliaOutput.value=JSON.stringify(cocofolia());

    try{
        await navigator.clipboard.writeText(cocofoliaOutput.value);
        msg('cocofoliaMessage','生成してコピーしました。','success');
    }
    catch{
        cocofoliaOutput.select();
        document.execCommand('copy');
        msg('cocofoliaMessage','生成してコピーしました。','success');
    }
}

function collect(){
    let d={portraitData};
    document.querySelectorAll('[data-save]').forEach(e=>
        d[e.id]=e.type==='checkbox'?e.checked:e.value
    );

    d.magics=[
        ...document.querySelectorAll('.unique-detail')
    ].map(c=>({
        magicName:c.querySelector('[data-field=magicName]').value,
        magicEffect:c.querySelector('[data-field=magicEffect]').value
    }));

    d.customUniqueMagics = [
        ...document.querySelectorAll(
            '#uniqueMagicOptions .custom-unique-magic'
        )
    ].map(label => ({
        name: label.dataset.magicName,
        checked: label.querySelector('[data-custom-unique]').checked
    }));


    d.customBasicMagics=[
        ...document.querySelectorAll('#basicMagicGrid .custom-basic-magic')
    ].map(field=>({
        name:field.dataset.magicName,
        value:field.querySelector('input').value
    }));
    d.techniques=actionData('.technique');
    d.weapons=actionData('.weapon');
    return d;
}

function apply(d){
    portraitData=d.portraitData||'';
    showPortrait();
    document.querySelectorAll('[data-save]').forEach(e=>{if(d[e.id]!==undefined)e.type==='checkbox'?e.checked=!!d[e.id]:e.value=d[e.id]});
    document.querySelectorAll(
        '#uniqueMagicOptions .custom-unique-magic'
    ).forEach(field => field.remove());

    (d.customUniqueMagics || []).forEach(magic => {
        addCustomUniqueMagic(magic.name, magic.checked);
    });

    document.querySelectorAll('#basicMagicGrid .custom-basic-magic')
        .forEach(field => field.remove());
    (d.customBasicMagics || []).forEach(magic => {
        addBasicMagic(magic.name, magic.value);
    });
    uniqueMagicDetails.innerHTML='';
    (d.magics||[]).forEach(addUniqueMagicDetail);
    techniques.innerHTML='';
    (d.techniques||[]).forEach(addTechnique);
    weapons.innerHTML='';
    (d.weapons||[]).forEach(addWeapon);
    if(!d.magics?.length)addUniqueMagicDetail();
    if(!d.techniques?.length)addTechnique();
    if(!d.weapons?.length)addWeapon();
    calculateAll()
}

function slots(){
    try{return JSON.parse(localStorage.getItem(KEY))||{}}catch{return {}}
}

function setSlots(s) {
    try {
        localStorage.setItem(KEY, JSON.stringify(s));
        return true;
    } catch {
        msg(
            'saveMessage',
            '保存容量を超えました。JSON書き出しをご利用ください。',
            'warning'
        );
        return false;
    }
}

function refresh(sel){
    let s=slots(),n=Object.keys(s);
    if(!n.length){s['スロット1']=collect();setSlots(s);
        n=['スロット1']
    }
    saveSlot.innerHTML=n.map(x=>`<option>${E(x)}</option>`).join('');
    if(sel)saveSlot.value=sel
}

function createSlot() {
    const n =
        newSlotName.value.trim() ||
        `スロット${Object.keys(slots()).length + 1}`;

    const s = slots();
    s[n] = collect();

    if (setSlots(s)) {
        refresh(n);
        msg('saveMessage', `「${n}」を作成しました。`, 'success');
    }
}

function saveSheet() {
    const n = saveSlot.value;
    const s = slots();

    s[n] = collect();

    if (setSlots(s)) {
        msg('saveMessage', `「${n}」に保存しました。`, 'success');
    }
}

function loadSheet(){
    let s=slots();
    if(s[saveSlot.value])apply(s[saveSlot.value])
}

function deleteSlot(){
    let n=saveSlot.value;if(!confirm(`「${n}」を削除しますか？`))return;
    let s=slots();delete s[n];setSlots(s);refresh()
}

function exportJson(){
    let d=collect(),a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));
    a.href=u;a.download=(charName.value||'character')+'.json';a.click();URL.revokeObjectURL(u)
}

function importJson(e){
    let r=new FileReader();
    r.onload=()=>{try{
        apply(JSON.parse(r.result));
        msg('saveMessage','読み込みました。','success')
    }
    catch{
        msg(
            'saveMessage',
            '読み込みに失敗しました。',
            'warning')
        }
    };
    if(e.target.files[0])r.readAsText(e.target.files[0])
}

function updateViewMode() {
    const viewing = currentMode === 'view';

    document.body.classList.toggle('view-mode', viewing);
    document.querySelectorAll('details').forEach(detail => {
        detail.open = !viewing;
    });

    editModeButton.classList.toggle('active', !viewing);
    viewModeButton.classList.toggle('active', viewing);

    document.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.dataset.originalReadonly === undefined) {
            el.dataset.originalReadonly = el.readOnly ? '1' : '0';
        }

        if (el.dataset.originalDisabled === undefined) {
            el.dataset.originalDisabled = el.disabled ? '1' : '0';
        }

        const viewModeEditableIds = [
            'saveSlot',
            'newSlotName',
            'importFile'
        ];

        if (viewing) {
            if (
                el.id === 'cocDiceCommand' ||
                viewModeEditableIds.includes(el.id)
            ){
                el.disabled = false;
                el.readOnly = false;
            }
            else if (
                el.tagName === 'SELECT' ||
                el.type === 'checkbox' ||
                el.type === 'file'
            ) {
                el.disabled = true;
            }
            else {
                el.readOnly = true;
            }
        }
        else {
            el.disabled = el.dataset.originalDisabled === '1';
            el.readOnly = el.dataset.originalReadonly === '1';
        }
    });

    document.querySelectorAll('#combatSkills tr, #searchSkills tr').forEach(row => {
            const value = Number(row.querySelector('.calc')?.textContent || 0);

            row.classList.toggle('view-hidden',viewing && value === 0);
    });

    document.querySelectorAll('#specialSkills tr').forEach(row => {
        const allocation = Number(
            row.querySelector('input.mini')?.value || 0
        );
        row.classList.toggle('view-hidden', viewing && allocation === 0);
    });

    document.querySelectorAll('#uniqueMagicOptions .check-card').forEach(card => {
        const checked = card.querySelector('[data-unique]')?.checked;

        card.classList.toggle('view-hidden', viewing && !checked);
    });


    document.querySelectorAll(
        '#uniqueMagicDetails .unique-detail'
    ).forEach(card => {
        card.classList.remove('view-hidden');
    });
}

function setMode(mode) {
    currentMode = mode === 'view' ? 'view' : 'edit';
    updateViewMode();
}



async function exportCharacterImage() {

    const speech = prompt('画像に表示するセリフを入力してください。');

    if (speech === null) return;

    calculateAll();

    const canvas = document.createElement('canvas');
    canvas.width = 1408;
    canvas.height = 1056;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#c5d5da';

    for (let x = 0; x < canvas.width; x += 102) {
        for (let y = 0; y < canvas.height; y += 102) {
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function text(str, x, y, size = 24, color = '#252525') {
        ctx.fillStyle = color;
        ctx.font = `${size}px "Yu Gothic", Meiryo, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(String(str), x, y);
    }

    function box(x, y, w, h, title, color) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 2;

        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, 42);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px "Yu Gothic", Meiryo, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(title, x + w / 2, y + 21);
        ctx.textAlign = 'left';
    }

    function wrapText(str, x, y, maxWidth, lineHeight,size = 22, color = '#252525') {

        ctx.fillStyle = color;
        ctx.font = `${size}px "Yu Gothic", Meiryo, sans-serif`;
        ctx.textBaseline = 'top';

        const lines = [];
        let line = '';

        for (const char of String(str)) {

            if (char === '\n') {
                lines.push(line);
                line = '';
                continue;
            }

            const test = line + char;

            if (ctx.measureText(test).width > maxWidth) {
                lines.push(line);
                line = char;
            } else {
                line = test;
            }
        }

        if (line) lines.push(line);

        lines.forEach((line, i) => {
            ctx.fillText(line, x, y + i * lineHeight);
        });

        return y + lines.length * lineHeight;
    }

    const name = charName.value || '';
    const race = originSetting.value || '';
    const jobName = job.value || '';

    const uniqueMagic = [
        ...document.querySelectorAll('#uniqueMagicOptions [data-unique]:checked')
    ].map(el => el.value);

    const magicDetails = [
        ...document.querySelectorAll('.unique-detail')
    ].map(card => ({
        name: card.querySelector('[data-field="magicName"]').value,
        effect: card.querySelector('[data-field="magicEffect"]').value
    })).filter(m => m.name || m.effect);

    const techniqueNames = [
        ...document.querySelectorAll('#techniques .technique')
    ].map(card => card.querySelector('[data-field="name"]').value.trim())
     .filter(Boolean);

    const specialValues = special
        .filter(([id]) => N(`sp_${id}`) > 0)
        .map(([id, skillName]) => ({
            name: skillName,
            value: document.getElementById(`sp_${id}_total`).textContent
        }));

    const magicValues = [
        ['熱魔法', N('heatMagic')],
        ['身体強化魔法', N('bodyMagic')],
        ['操作魔法', N('controlMagic')],
        ['総魔力量', N('mp')]
    ];

    const statValues = [
        ['筋力', N('str')],
        ['正確性', N('acc')],
        ['俊敏性', N('agi')],
        ['知識', N('know')],
        ['思考力', N('think')],
        ['容姿', N('looks')],
        ['幸運', N('luck')]
    ];

    ctx.fillStyle = '#252525';
    ctx.fillRect(0, 18, 868, 121);

    text(name, 110, 55, 38, '#ffffff');

    text(`種族：${race}`, 665, 40, 22, '#ffffff');
    text(`職業：${jobName}`, 665, 95, 22, '#ffffff');

    box(22, 160, 675, 480, '固有魔法', '#252525');

    text('固有魔法適正：', 37, 214, 21);

    wrapText(
        uniqueMagic.join('　'),
        210, 214, 420, 28, 21
    );

    let magicY = 245;

    magicDetails.forEach(magic => {

        if (magic.name) {
            magicY = wrapText(
                magic.name,
                52, magicY, 560, 20, 18
            );
        }

        if (magic.effect) {
            magicY = wrapText(
                magic.effect,
                52, magicY + 2, 560, 18, 16
            );
        }

        magicY += 2;

    });

    const techniqueTitleY = magicY + 8;
    ctx.fillStyle = '#dddddd';
    ctx.fillRect(37, techniqueTitleY, 600, 1);
    text('技一覧', 45, techniqueTitleY + 8, 20);

    const techniqueTop = techniqueTitleY + 38;

    const rowsPerColumn = Math.ceil(techniqueNames.length / 2);

    techniqueNames.forEach((name, i) => {
        const col = i < rowsPerColumn ? 0 : 1;
        const row = col === 0
            ? i
            : i - rowsPerColumn;

        const x = 45 + col * 290;
        const y = techniqueTop + row * 28;

        wrapText(name, x, y, 270, 22, 18);
    });

    box(22, 665, 282, 210, '基礎魔法適性', '#ed4380');

    const barValues = [
        ['熱魔法', N('heatMagic'), 99],
        ['身体強化', N('bodyMagic'), 99],
        ['操作魔法', N('controlMagic'), 99],
        ['総魔力量', N('mp'), 120]
    ];

    const chartTop = 718;
    const chartBottom = 833;
    const chartHeight = chartBottom - chartTop;
    const barWidth = 38;
    const barGap = 25;
    const firstBarX = 39;

    barValues.forEach(([label, value, max], i) => {
        const x = firstBarX + i * (barWidth + barGap);
        const height = chartHeight * Math.min(value, max) / max;
        const y = chartBottom - height;

        ctx.fillStyle = '#eeeeee';
        ctx.fillRect(x, chartTop, barWidth, chartHeight);

        ctx.fillStyle = '#252525';
        ctx.fillRect(x, y, barWidth, height);

        ctx.textAlign = 'center';
        text(value, x + barWidth / 2, chartBottom + 5, 14);

        text(label, x + barWidth / 2, chartBottom + 24, 12);
    });

    ctx.textAlign = 'left';

    box(22, 888, 282, 150, '特殊技能', '#ff9018');

    specialValues.forEach((skill, i) => {
        const col = i < 5 ? 0 : 1;
        const row = i < 5 ? i : i - 5;

        const x = 35 + col * 130;
        const y = 940 + row * 20;

        text(skill.name, x, y, 15);
        text(skill.value, x + 98, y, 15);
    });

    box(317, 665, 380, 373, 'STATUS', '#3199df');

    const cx = 507;
    const cy = 865;
    const radius = 105;
    const maxStat = 30;
    const count = statValues.length;

    ctx.strokeStyle = '#acaaaa';
    ctx.lineWidth = 1;

    for (let level = 1; level <= 4; level++) {
        const r = radius * level / 4;

        ctx.beginPath();

        for (let i = 0; i < count; i++) {
            const angle = -Math.PI / 2 + i * Math.PI * 2 / count;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.stroke();
    }

    for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + i * Math.PI * 2 / count;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
            cx + Math.cos(angle) * radius,
            cy + Math.sin(angle) * radius
        );
        ctx.stroke();
    }

    ctx.beginPath();

    statValues.forEach(([label, value], i) => {
        const angle = -Math.PI / 2 + i * Math.PI * 2 / count;
        const r = radius * Math.min(value, maxStat) / maxStat;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.closePath();
    ctx.fillStyle = 'rgba(49,153,223,0.25)';
    ctx.fill();
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 3;
    ctx.stroke();

    statValues.forEach(([label, value], i) => {
        const angle = -Math.PI / 2 + i * Math.PI * 2 / count;
        const x = cx + Math.cos(angle) * (radius + 35);
        const y = cy + Math.sin(angle) * (radius + 35);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        text(`${label} ${value}`, x, y, 14);
    });

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    if (portraitData) {
        const img = new Image();
        await new Promise(resolve => {
            img.onload = () => {

                const x = 715;
                const y = 165;
                const w = 677;
                const h = 660;
                const scale = Math.min(
                    w / img.width,
                    h / img.height
                );
                const drawW = img.width * scale;
                const drawH = img.height * scale;
                ctx.drawImage(
                    img,
                    x + (w - drawW) / 2,
                    y + (h - drawH) / 2,
                    drawW,
                    drawH
                );
                resolve();
            };
            img.onerror = resolve;
            img.src = portraitData;
        });
    }
    if (speech.trim()) {
        ctx.fillStyle = 'rgba(37,37,37,0.95)';
        ctx.fillRect(715, 837, 677, 201);
        ctx.strokeStyle = '#aaaaaa';
        ctx.lineWidth = 2;
        ctx.strokeRect(715, 837, 677, 201);
        wrapText(
            '「' + speech + '」',
            750, 865, 610, 36, 25, '#ffffff'
        );
    }

    const link = document.createElement('a');
    link.download = `${name || 'character'}_画像.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}




render();
addUniqueMagicDetail();
addTechnique();
addWeapon();
showPortrait();
refresh();
calculateAll();