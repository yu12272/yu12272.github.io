const KEY='trpgSheet_v4';
let portraitData='';

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
    let bt=N('basicMagicTotal'),bu=N('heatMagic')+N('bodyMagic')+N('controlMagic');basicMagicUsed.textContent=bu;basicMagicTotalText.textContent=bt;
    msg('basicMagicMessage',bu>bt?'合計値を超えています。':bu<bt?`あと${bt-bu}点です。`:'一致しています。',bu>bt?'warning':bu===bt?'success':'note');
    let uc=N('uniqueMagicCount'),ch=document.querySelectorAll('[data-unique]:checked').length;
    uniqueMagicCountText.textContent=uc;msg('uniqueMagicMessage',ch>uc?'選択数超過です。':ch<uc?`あと${uc-ch}個です。`:'一致しています。',ch>uc?'warning':ch===uc?'success':'note');
    document.querySelectorAll('[data-live-total]').forEach(
        el=>{
            let card=el.closest('.card'),
            ref=card.querySelector('[data-field=ref]').value,mult=Number(card.querySelector('[data-field=mult]').value||1),
            add=Number(card.querySelector('[data-field=add]').value||0);el.value=(ref==='none'?0:v[ref])*mult+add
        }
    )
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
    basicMagicTotal.value=roll(1,100);
    heatMagic.value=bodyMagic.value=controlMagic.value=0;calculateAll()
}


function rollUniqueMagicCount(){
    uniqueMagicCount.value=roll(1,4);
    document.querySelectorAll('[data-unique]').forEach(x=>x.checked=false);
    calculateAll()
}


function addUniqueMagicDetail(d={}){
    let c=document.createElement('div');
    c.className='card unique-detail';
    c.innerHTML=`<div class="grid two"><div class="field"><label>魔法名</label><input data-field="magicName" value="${E(d.magicName||'')}"></div><div class="field"><label>魔法効果</label><textarea data-field="magicEffect">${E(d.magicEffect||'')}</textarea></div></div><button class="danger" onclick="this.closest('.card').remove()">削除</button>`;
    uniqueMagicDetails.appendChild(c)
}
            

function actionCard(type,d={}){
    let c=document.createElement('div');
    c.className=`card ${type}`;
    let isTech=type==='technique';
    c.innerHTML=`<div class="grid"><div class="field"><label>${isTech?'技':'武器'}の名前</label><input data-field="name" value="${E(d.name||'')}"></div><div class="field"><label>参照ステータス</label><select data-field="ref" onchange="calculateAll()">${options(d.ref||'none')}</select></div><div class="field"><label>倍率</label><input type="number" step="0.1" data-field="mult" value="${E(d.mult??'1')}" oninput="calculateAll()"></div><div class="field"><label>成功値への加算</label><input type="number" data-field="add" value="${E(d.add??'0')}" oninput="calculateAll()"></div><div class="field"><label>最終成功値</label><input data-live-total readonly></div><div class="field"><label>ダメージロール</label><input data-field="damage" value="${E(d.damage||'')}" placeholder="例：1d8+({筋力}/2)"></div>${isTech?`<div class="field"><label>消費MP</label><input type="number" min="0" data-field="mp" value="${E(d.mp||'')}"></div><div><label>維持MP</label><input type="number" min="0" data-field="maintainMp" value="${E(d.maintainMp||'')}"></div>`:''}</div><div class="field"><label>${isTech?'効果':'備考'}</label><textarea data-field="note">${E(d.note||'')}</textarea></div><button class="danger" onclick="this.closest('.card').remove()">削除</button>`;
    (isTech?techniques:weapons).appendChild(c);
    calculateAll()
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
            portraitData=cv.toDataURL('image/jpeg',.82);showPortrait()
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
        '// 特殊技能',
        `${cmd}<={変装割振} 【変装】`,
        `${cmd}<={変声割振}+{正確性} 【変声】`,
        `${cmd}<={交渉割振} 【交渉】`,
        `${cmd}<={権威割振} 【権威】`,
        `${cmd}<={魅了割振}+{容姿} 【魅了】`,
        `${cmd}<={心理学割振}+{思考力} 【心理学】`,
        `${cmd}<={盗み割振}+{正確性} 【盗み】`,
        `${cmd}<={射撃割振} 【射撃】`,
        `${cmd}<={跳躍割振}+{筋力} 【跳躍】`
    ];
    let ts=actionData('.technique'),ws=actionData('.weapon');
    if(ts.length)lines.push('// 技');
    ts.forEach(t=>{
        lines.push(`${cmd}<=${
            refExpr(t.ref,t.mult,t.add)
        } 
        【${t.name||'名称未設定'}】`);
        if(t.damage)lines.push(`${t.damage} 
            【${t.name||'名称未設定'}・ダメージ】`)
        }
    );
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
                `年齢：${age.value||'未設定'}`,
                `職業：${job.value||'未設定'}`,
                `持ち物：${items.value||'未設定'}`,
                `性格：${personality.value||'未設定'}`,
                `メモ：${memo.value||'未設定'}`
            ].join('\n')
        }
    }
}
            

function outputCocofolia(){
    cocofoliaOutput.value=JSON.stringify(cocofolia());
    msg('cocofoliaMessage','生成しました。','success')
}

async function copyCocofolia(){
    if(!cocofoliaOutput.value)outputCocofolia();
    try{
        await navigator.clipboard.writeText(cocofoliaOutput.value)
    }
    catch{
        cocofoliaOutput.select();
        document.execCommand('copy')
    }
    msg('cocofoliaMessage','コピーしました。','success')
}

function downloadCocofoliaJson(){
    if(!cocofoliaOutput.value)outputCocofolia();
    let a=document.createElement('a'),
    u=URL.createObjectURL(new Blob([cocofoliaOutput.value],{type:'application/json'}));
    a.href=u;
    a.download=(charName.value||'ダイス振り男')+'_ccfolia.json';
    a.click();
    URL.revokeObjectURL(u)
}

function collect(){
    let d={portraitData};
    document.querySelectorAll('[data-save]').forEach(e=>d[e.id]=e.type==='checkbox'?e.checked:e.value);
    d.magics=[...document.querySelectorAll('.unique-detail')].map(c=>({magicName:c.querySelector('[data-field=magicName]').value,magicEffect:c.querySelector('[data-field=magicEffect]').value}));
    d.techniques=actionData('.technique');
    d.weapons=actionData('.weapon');
    return d
}

function apply(d){
    portraitData=d.portraitData||'';showPortrait();
    document.querySelectorAll('[data-save]').forEach(e=>{if(d[e.id]!==undefined)e.type==='checkbox'?e.checked=!!d[e.id]:e.value=d[e.id]});
    uniqueMagicDetails.innerHTML='';
    (d.magics||[]).forEach(addUniqueMagicDetail);
    techniques.innerHTML='';
    (d.techniques||[]).forEach(addTechnique);weapons.innerHTML='';
    (d.weapons||[]).forEach(addWeapon);if(!d.magics?.length)addUniqueMagicDetail();
    if(!d.techniques?.length)addTechnique();
    if(!d.weapons?.length)addWeapon();calculateAll()
}

function slots(){
    try{return JSON.parse(localStorage.getItem(KEY))||{}}catch{return {}}
}

function setSlots(s){
    try{
        localStorage.setItem(KEY,JSON.stringify(s))
    }
    catch{
        msg('saveMessage','保存容量を超えました。JSON書き出しをご利用ください。','warning')
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

function createSlot(){
    let n=newSlotName.value.trim()||`スロット${Object.keys(slots()).length+1}`,s=slots();
    s[n]=collect();
    setSlots(s);refresh(n);
    msg('saveMessage',`「${n}」を作成しました。`,'success')
}

function saveSheet(){
    let n=saveSlot.value,s=slots();
    s[n]=collect();setSlots(s);
    msg('saveMessage',`「${n}」に保存しました。`,'success')
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

render();
addUniqueMagicDetail();
addTechnique();
addWeapon();
showPortrait();
refresh();
calculateAll();