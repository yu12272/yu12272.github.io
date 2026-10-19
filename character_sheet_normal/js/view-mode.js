/*
 * モジュール: view-mode.js
 * 役割: 編集／閲覧モードの切り替えを担当します。
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
