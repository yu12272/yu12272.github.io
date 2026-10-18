/*
 * モジュール: view-mode.js
 * 役割: 編集／閲覧モードの切り替えと、共有URLからのキャラクターデータ読み込みを担当します。
 */

function updateViewMode() {

    const viewing = currentMode === 'view';
    const viewScreen = document.getElementById('viewScreen');
    const characterSheetScreen = document.getElementById('characterSheetScreen');

    if (viewScreen && characterSheetScreen) {
        viewScreen.style.display = viewing ? 'block' : 'none';
        characterSheetScreen.style.display = '';

        document.querySelectorAll('#characterSheetScreen > *').forEach(el => {
            if (
                el.id === 'saveLoadToolbar' ||
                el.id === 'basicInfoPanel' ||
                el.classList.contains('mode-switch')
            ) {
                el.style.display = '';
            } else {
                el.style.display = viewing ? 'none' : '';
            }
        });
    }

    if (viewing) {
        renderViewScreen();
    }


    document.body.classList.toggle('view-mode', viewing);
    
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

async function loadFromUrl(){
    if(!location.hash) return;

    try{
        let base64 = location.hash.substring(1);

        base64 = base64
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        while(base64.length % 4){
            base64 += '=';
        }

        const binary = atob(base64);

        const compressed = Uint8Array.from(
            binary,
            char => char.charCodeAt(0)
        );

        const stream = new Blob([compressed])
            .stream()
            .pipeThrough(new DecompressionStream('gzip'));

        const bytes =
            new Uint8Array(
                await new Response(stream).arrayBuffer()
            );

        const data =
            new TextDecoder().decode(bytes);

        const character = JSON.parse(data);

        character.techniques =
            (character.techniques || []).map(t => ({
                name: t[0],
                ref: t[1],
                mult: t[2],
                add: t[3],
                damage: t[4],
                mp: t[5],
                maintainMp: t[6],
                note: t[7]
            }));

        character.weapons =
            (character.weapons || []).map(w => ({
                name: w[0],
                ref: w[1],
                mult: w[2],
                add: w[3],
                damage: w[4],
                mp: '',
                maintainMp: '',
                note: w[5]
            }));

        character.magics =
            (character.magics || []).map(m => ({
                magicName: m[0],
                magicEffect: m[1]
            }));

        character.customUniqueMagics =
            (character.customUniqueMagics || []).map(m => ({
                name: m[0],
                checked: m[1]
            }));

        character.customBasicMagics =
            (character.customBasicMagics || []).map(m => ({
                name: m[0],
                value: m[1]
            }));

        const basic = character.basic || [];

        character.charName = basic[0] ?? '';
        character.age = basic[1] ?? '';
        character.job = basic[2] ?? '';
        character.originSetting = basic[3] ?? '';


        const stats = character.stats || [];
        character.str = stats[0] ?? '';
        character.acc = stats[1] ?? '';
        character.agi = stats[2] ?? '';
        character.know = stats[3] ?? '';
        character.think = stats[4] ?? '';
        character.looks = stats[5] ?? '';
        character.luck = stats[6] ?? '';
        character.emotion = stats[7] ?? '';
        character.mp = stats[8] ?? '';
        character.hp = stats[9] ?? '';

        const specialSkills = character.specialSkills || [];

        character.sp_disguise = specialSkills[0] ?? '';
        character.sp_voice = specialSkills[1] ?? '';
        character.sp_negotiate = specialSkills[2] ?? '';
        character.sp_authority = specialSkills[3] ?? '';
        character.sp_charm = specialSkills[4] ?? '';
        character.sp_psychology = specialSkills[5] ?? '';
        character.sp_steal = specialSkills[6] ?? '';
        character.sp_shooting = specialSkills[7] ?? '';
        character.sp_jump = specialSkills[8] ?? '';

        const basicMagic = character.basicMagic || [];

        character.basicMagicTotal = basicMagic[0] ?? '';
        character.heatMagic = basicMagic[1] ?? '';
        character.bodyMagic = basicMagic[2] ?? '';
        character.controlMagic = basicMagic[3] ?? '';

        const uniqueMagics = character.uniqueMagics || [];

        character['unique_変身'] = !!uniqueMagics[0];
        character['unique_変化'] = !!uniqueMagics[1];
        character['unique_創造'] = !!uniqueMagics[2];
        character['unique_命令'] = !!uniqueMagics[3];
        character['unique_回復'] = !!uniqueMagics[4];
        character['unique_光'] = !!uniqueMagics[5];
        character['unique_結界'] = !!uniqueMagics[6];
        character['unique_異常発達'] = !!uniqueMagics[7];
        character['unique_冒涜'] = !!uniqueMagics[8];
        character['unique_召喚'] = !!uniqueMagics[9];

        const other = character.other || [];

        character.items = other[0] ?? '';
        character.personality = other[1] ?? '';
        character.memo = other[2] ?? '';
        character.characterMemo = other[3] ?? '';

        apply(character);

        msg(
            'saveMessage',
            '共有URLからキャラクターを読み込みました。',
            'success'
        );

        setMode('view');
    }
    catch(error){
        console.error(error);

        msg(
            'saveMessage',
            '共有URLの読み込みに失敗しました。',
            'warning'
        );
    }
}

