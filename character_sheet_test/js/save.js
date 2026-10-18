/*
 * モジュール: save.js
 * 役割: キャラクターデータの収集、JSON保存・読み込み、および共有URLの生成を担当します。
 */

function collect(){
    let d={
        portraitData,
        skillModifiers: JSON.parse(JSON.stringify(skillModifiers))
    };

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
    portraitData = d.portraitData || '';

    skillModifiers = {
        combat: {
            拳: 0,
            蹴り: 0,
            回避: 0,
            カウンター: 0,
            弾き: 0,
            ...(d.skillModifiers?.combat || {})
        },
        search: {
            観察: 0,
            分析: 0,
            幸運: 0,
            知識: 0,
            五感: 0,
            追跡: 0,
            ...(d.skillModifiers?.search || {})
        }
    };

    portraitCanvasImage = null;
    characterBaseCanvas = null;

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
    updateViewMode();
}

function exportJson(){
    let d=collect(),a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));
    a.href=u;
    a.download=(charName.value||'character')+'.json';a.click();
    URL.revokeObjectURL(u)
}

async function shareByUrl(){
    const data = collect();
    delete data.portraitData;

    data.techniques = (data.techniques || []).map(t => [
        t.name,
        t.ref,
        t.mult,
        t.add,
        t.damage,
        t.mp,
        t.maintainMp,
        t.note
    ]);

    data.weapons = (data.weapons || []).map(w => [
        w.name,
        w.ref,
        w.mult,
        w.add,
        w.damage,
        w.note
    ]);

    data.magics = (data.magics || []).map(m => [
        m.magicName,
        m.magicEffect
    ]);

    data.customUniqueMagics = (data.customUniqueMagics || []).map(m => [
        m.name,
        m.checked
    ]);

    data.customBasicMagics = (data.customBasicMagics || []).map(m => [
        m.name,
        m.value
    ]);

    data.basic = [
        data.charName,
        data.age,
        data.job,
        data.originSetting
    ];

    delete data.charName;
    delete data.age;
    delete data.job;
    delete data.originSetting;

    data.stats = [
        data.str,
        data.acc,
        data.agi,
        data.know,
        data.think,
        data.looks,
        data.luck,
        data.emotion,
        data.mp,
        data.hp
    ];

    delete data.str;
    delete data.acc;
    delete data.agi;
    delete data.know;
    delete data.think;
    delete data.looks;
    delete data.luck;
    delete data.emotion;
    delete data.mp;
    delete data.hp;

    data.specialSkills = [
        data.sp_disguise,
        data.sp_voice,
        data.sp_negotiate,
        data.sp_authority,
        data.sp_charm,
        data.sp_psychology,
        data.sp_steal,
        data.sp_shooting,
        data.sp_jump
    ];

    delete data.sp_disguise;
    delete data.sp_voice;
    delete data.sp_negotiate;
    delete data.sp_authority;
    delete data.sp_charm;
    delete data.sp_psychology;
    delete data.sp_steal;
    delete data.sp_shooting;
    delete data.sp_jump;

    data.basicMagic = [
        data.basicMagicTotal,
        data.heatMagic,
        data.bodyMagic,
        data.controlMagic
    ];

    delete data.basicMagicTotal;
    delete data.heatMagic;
    delete data.bodyMagic;
    delete data.controlMagic;

    data.uniqueMagics = [
        data['unique_変身'],
        data['unique_変化'],
        data['unique_創造'],
        data['unique_命令'],
        data['unique_回復'],
        data['unique_光'],
        data['unique_結界'],
        data['unique_異常発達'],
        data['unique_冒涜'],
        data['unique_召喚']
    ];

    delete data['unique_変身'];
    delete data['unique_変化'];
    delete data['unique_創造'];
    delete data['unique_命令'];
    delete data['unique_回復'];
    delete data['unique_光'];
    delete data['unique_結界'];
    delete data['unique_異常発達'];
    delete data['unique_冒涜'];
    delete data['unique_召喚'];

    data.other = [
        data.items,
        data.personality,
        data.memo,
        data.characterMemo
    ];

    delete data.items;
    delete data.personality;
    delete data.memo;
    delete data.characterMemo;



    function removeEmpty(value){
        if(Array.isArray(value)){
            return value
                .map(removeEmpty)
                .filter(item => item !== undefined);
        }
        if(value && typeof value === 'object'){
            const result = {};
            Object.entries(value).forEach(([key, item]) => {
                const cleaned = removeEmpty(item);
                if(
                    cleaned !== undefined &&
                    cleaned !== ''
                ){
                    result[key] = cleaned;
                }
            });
            return result;
        }
        return value;
    }

    const compactData = removeEmpty(data);
    const json = JSON.stringify(compactData);

    const stream = new Blob([json])
        .stream()
        .pipeThrough(new CompressionStream('gzip'));

    const compressed =
        new Uint8Array(
            await new Response(stream).arrayBuffer()
        );

    let binary = '';
    const chunkSize = 0x8000;

    for(let i = 0; i < compressed.length; i += chunkSize){
        binary += String.fromCharCode(
            ...compressed.subarray(i, i + chunkSize)
        );
    }

    const encoded = btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const url =
        location.origin +
        location.pathname +
        '#' +
        encoded;

    navigator.clipboard.writeText(url)
        .then(() => {
            msg(
                'saveMessage',
                '共有URLをコピーしました。',
                'success'
            );
        })
        .catch(() => {
            prompt(
                '共有URLをコピーしてください。',
                url
            );
        });
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

