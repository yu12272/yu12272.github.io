/*
 * モジュール: save.js
 * 役割: キャラクターデータの収集とJSON保存・読み込みを担当します。
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
    d.customSpecialSkills = [
        ...document.querySelectorAll('#specialSkills [data-custom-special-skill]')
    ].map(row => ({
        name: row.querySelector('[data-custom-special-name]').value,
        allocation: row.querySelector('[data-custom-special-allocation]').value,
        base: row.querySelector('[data-custom-special-base]').value
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
    document.querySelectorAll('#specialSkills [data-custom-special-skill]').forEach(row => row.remove());
    (d.customSpecialSkills || []).forEach(addCustomSpecialSkill);
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

