/*
 * モジュール: image-editor.js
 * 役割: 画像編集画面、表示項目、立ち絵や吹き出しの操作・再描画を担当します。
 */

let speechBoxX = 715;
let speechBoxY = 837;

const speechBoxWidth = 677;
const speechBoxHeight = 201;

let isDraggingSpeechBox = false;
let speechDragOffsetX = 0;
let speechDragOffsetY = 0;

let characterBaseCanvas = null;
let redrawRequest = false;

let portraitImageX = 715;
let portraitImageY = 165;

const portraitBaseWidth = 677;
const portraitBaseHeight = 660;

let portraitScale = 1.0;

let portraitCanvasImage = null;

let portraitDrawX = 0;
let portraitDrawY = 0;
let portraitDrawWidth = 0;
let portraitDrawHeight = 0;

let isDraggingPortrait = false;

let portraitDragOffsetX = 0;
let portraitDragOffsetY = 0;

async function openImageEditor() {
    document.getElementById('characterSheetScreen').hidden = true;
    document.getElementById('pageHeader').hidden = true;
    document.getElementById('pageFooter').hidden = true;
    document.getElementById('imageEditorScreen').hidden = false;
    document.body.style.overflow = 'hidden';

    createImageDisplayOptions();

    characterBaseCanvas = null;
    await renderCharacterImage(true);
    setupSpeechBoxDragging();
}

function closeImageEditor() {
    document.getElementById('imageEditorScreen').hidden = true;
    document.getElementById('characterSheetScreen').hidden = false;
    document.getElementById('pageHeader').hidden = false;
    document.getElementById('pageFooter').hidden = false;
    document.body.style.overflow = '';
}

function downloadCharacterImage() {
    const canvas = document.getElementById('imagePreviewCanvas');

    const link = document.createElement('a');
    link.download = 'character.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

document.addEventListener('DOMContentLoaded', () => {
    const speechInput =
        document.getElementById('imageSpeechText');
    const portraitSize =
        document.getElementById('portraitSize');
    const portraitSizeValue =
        document.getElementById('portraitSizeValue');

    speechInput.addEventListener('input', () => {
        renderCharacterImage(false);
    });

    portraitSize.addEventListener('input', () => {
        portraitScale = Number(portraitSize.value);
        portraitSizeValue.textContent =
            Math.round(portraitScale * 100) + '%';
        renderCharacterImage(false);
    });
});

function requestRedraw() {

    if (redrawRequest) return;
    redrawRequest = true;
    requestAnimationFrame(() => {
        redrawRequest = false;
        renderCharacterImage(false);
    });
}

function setupSpeechBoxDragging() {

    const canvas = document.getElementById('imagePreviewCanvas');

    if (!canvas) return;

    canvas.onpointerdown = (event) => {

        const rect = canvas.getBoundingClientRect();

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        if (
            x >= speechBoxX &&
            x <= speechBoxX + speechBoxWidth &&
            y >= speechBoxY &&
            y <= speechBoxY + speechBoxHeight
        ) {

            isDraggingSpeechBox = true;

            speechDragOffsetX =
                x - speechBoxX;

            speechDragOffsetY =
                y - speechBoxY;

            canvas.setPointerCapture(event.pointerId);

            return;
        }

        if (portraitData) {
            if (
                x >= portraitDrawX &&
                x <= portraitDrawX + portraitDrawWidth &&
                y >= portraitDrawY &&
                y <= portraitDrawY + portraitDrawHeight
            ) {
                isDraggingPortrait = true;
                portraitDragOffsetX = x - portraitImageX;
                portraitDragOffsetY = y - portraitImageY;
                canvas.setPointerCapture(event.pointerId);
            }
        }
    };


    canvas.onpointermove = (event) => {

        const rect = canvas.getBoundingClientRect();

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        if (isDraggingSpeechBox) {
            speechBoxX =
                x - speechDragOffsetX;
            speechBoxY =
                y - speechDragOffsetY;
            speechBoxX = Math.max(
                0,
                Math.min(
                    canvas.width - speechBoxWidth,
                    speechBoxX
                )
            );
            speechBoxY = Math.max(
                0,
                Math.min(
                    canvas.height - speechBoxHeight,
                    speechBoxY
                )
            );
            requestRedraw();
            return;
        }

        if (isDraggingPortrait) {
            portraitImageX =
                x - portraitDragOffsetX;
            portraitImageY =
                y - portraitDragOffsetY;
            requestRedraw();
        }
    };

    canvas.onpointerup = (event) => {
        isDraggingSpeechBox = false;
        isDraggingPortrait = false;
        if (canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
        }
    };

    canvas.onpointercancel = () => {
        isDraggingSpeechBox = false;
        isDraggingPortrait = false;
    };
}

function createImageDisplayOptions() {

    const uniqueContainer =
        document.getElementById('uniqueMagicDisplayOptions');
    
    const uniqueDetailContainer =
        document.getElementById('uniqueMagicDetailDisplayOptions');

    const basicContainer =
        document.getElementById('basicMagicDisplayOptions');

    const techniqueContainer =
        document.getElementById('techniqueDisplayOptions');

    if (!uniqueContainer ||
        !uniqueDetailContainer ||
        !basicContainer ||
        !techniqueContainer) {
        return;
    }

    uniqueContainer
        .querySelectorAll('label')
        .forEach(label => label.remove());

    uniqueDetailContainer
        .querySelectorAll('label')
        .forEach(label => label.remove());

    basicContainer
        .querySelectorAll('label')
        .forEach(label => label.remove());

    techniqueContainer
        .querySelectorAll('label')
        .forEach(label => label.remove());


    const uniqueItems =
        document.querySelectorAll(
            '#uniqueMagicOptions [data-unique]:checked'
        );

    uniqueItems.forEach(item => {

        const label =
            document.createElement('label');

        const checkbox =
            document.createElement('input');

        checkbox.type = 'checkbox';
        checkbox.checked = true;

        checkbox.dataset.imageDisplay =
            'unique';

        checkbox.dataset.index =
            [...document.querySelectorAll(
                '#uniqueMagicOptions [data-unique]'
            )].indexOf(item);

        label.appendChild(checkbox);

        label.appendChild(
            document.createTextNode(
                item.value
            )
        );

        uniqueContainer.appendChild(label);
    });

    const uniqueDetailItems =
        document.querySelectorAll('.unique-detail');

    uniqueDetailItems.forEach((card, index) => {

        const nameInput =
            card.querySelector(
                '[data-field="magicName"]'
            );

        if (!nameInput || !nameInput.value.trim()) {
            return;
        }

        const label =
            document.createElement('label');

        const checkbox =
            document.createElement('input');

        checkbox.type = 'checkbox';

        checkbox.checked =
            imageDisplaySettings.uniqueDetail?.[index] !== false;

        checkbox.dataset.imageDisplay =
            'unique-detail';

        checkbox.dataset.index =
            index;

        label.appendChild(checkbox);

        label.appendChild(
            document.createTextNode(
                nameInput.value
            )
        );

        uniqueDetailContainer.appendChild(label);
    });

    const defaultBasicMagics = [
        '熱魔法',
        '身体強化',
        '操作魔法',
        '総魔力量'
    ];

    defaultBasicMagics.forEach((name, index) => {

        const label =
            document.createElement('label');

        const checkbox =
            document.createElement('input');

        checkbox.type = 'checkbox';
        checkbox.checked = imageDisplaySettings.basicDefault?.[index] !== false;

        checkbox.dataset.imageDisplay =
            'basic-default';

        checkbox.dataset.index =
            index;

        label.appendChild(checkbox);

        label.appendChild(
            document.createTextNode(name)
        );

        basicContainer.appendChild(label);
    });

    document
        .querySelectorAll(
            '#basicMagicGrid .custom-basic-magic'
        )
        .forEach((field, index) => {

            const name =
                field.dataset.magicName;

            const label =
                document.createElement('label');

            const checkbox =
                document.createElement('input');

            checkbox.type = 'checkbox';
            checkbox.checked = imageDisplaySettings.basic?.[index] !== false;

            checkbox.dataset.imageDisplay =
                'basic';

            checkbox.dataset.index =
                index;

            label.appendChild(checkbox);
            label.appendChild(
                document.createTextNode(
                    name
                )
            );

            basicContainer.appendChild(label);
        });

    document
        .querySelectorAll(
            '#techniques .technique'
        )
        .forEach((card, index) => {

            const nameInput =
                card.querySelector(
                    '[data-field="name"]'
                );

            if (!nameInput) return;

            const label =
                document.createElement('label');

            const checkbox =
                document.createElement('input');

            checkbox.type = 'checkbox';
            checkbox.checked = imageDisplaySettings.technique?.[index] !== false;

            checkbox.dataset.imageDisplay =
                'technique';

            checkbox.dataset.index =
                index;

            label.appendChild(checkbox);
            label.appendChild(
                document.createTextNode(
                    nameInput.value
                )
            );

            techniqueContainer.appendChild(label);
        });

    document
        .querySelectorAll(
            '#imageDisplayOptions input[type="checkbox"]'
        )
        .forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const type = checkbox.dataset.imageDisplay;
                const index = Number(checkbox.dataset.index);

                if (type === 'unique') {
                    imageDisplaySettings.unique[index] =
                        checkbox.checked;
                }

                if (type === 'unique-detail') {
                    if (!imageDisplaySettings.uniqueDetail) {
                        imageDisplaySettings.uniqueDetail = [];
                    }

                    imageDisplaySettings.uniqueDetail[index] =
                        checkbox.checked;
                }

                if (type === 'basic-default') {
                    imageDisplaySettings.basicDefault[index] =
                        checkbox.checked;
                }

                if (type === 'basic') {
                    imageDisplaySettings.basic[index] =
                        checkbox.checked;
                }

                if (type === 'technique') {
                    imageDisplaySettings.technique[index] =
                        checkbox.checked;
                }

                 characterBaseCanvas = null;
                renderCharacterImage(true);
            });
        });
    const showSpeech = document.getElementById('showSpeech');

    if (showSpeech) {
        if(!showSpeechListenerAdded){
            showSpeech.addEventListener('change', () => {
                renderCharacterImage(false);
            });
            showSpeechListenerAdded = true;
        }
    }

}

