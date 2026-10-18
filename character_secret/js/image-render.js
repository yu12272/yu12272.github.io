/*
 * モジュール: image-render.js
 * 役割: キャラクター画像のキャンバス描画、文字・立ち絵・吹き出しの描画を担当します。
 */

function wrapCanvasText(
    ctx,
    str,
    x,
    y,
    maxWidth,
    lineHeight,
    size = 22,
    color = '#252525'
) {
    ctx.fillStyle = color;
    ctx.font = `${size}px "Yu Gothic", Meiryo, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

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

    if (line) {
        lines.push(line);
    }

    lines.forEach((line, i) => {
        ctx.fillText(
            line,
            x,
            y + i * lineHeight
        );
    });

    return y + lines.length * lineHeight;
}


async function drawPortrait(ctx) {

    if (!portraitData) {
        portraitDrawWidth = 0;
        portraitDrawHeight = 0;
        return;
    }

    if (!portraitCanvasImage) {
        portraitCanvasImage = new Image();

        await new Promise(resolve => {
            portraitCanvasImage.onload = resolve;
            portraitCanvasImage.onerror = resolve;
            portraitCanvasImage.src = portraitData;
        });
    }

    if (
        portraitCanvasImage.complete &&
        portraitCanvasImage.naturalWidth > 0
    ) {
        const scale =
            Math.min(
                portraitBaseWidth / portraitCanvasImage.width,
                portraitBaseHeight / portraitCanvasImage.height
            ) * portraitScale;

        const drawW =
            portraitCanvasImage.width * scale;

        const drawH =
            portraitCanvasImage.height * scale;

        portraitDrawX = portraitImageX;
        portraitDrawY = portraitImageY;
        portraitDrawWidth = drawW;
        portraitDrawHeight = drawH;

        ctx.drawImage(
            portraitCanvasImage,
            portraitImageX,
            portraitImageY,
            drawW,
            drawH
        );
    }
}


function drawSpeech(ctx, speech) {

    ctx.fillStyle = 'rgba(37,37,37,0.95)';

    ctx.fillRect(
        speechBoxX,
        speechBoxY,
        speechBoxWidth,
        speechBoxHeight
    );

    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 2;

    ctx.strokeRect(
        speechBoxX,
        speechBoxY,
        speechBoxWidth,
        speechBoxHeight
    );

    if (speech.trim()) {
        wrapCanvasText(
            ctx,
            '「' + speech + '」',
            speechBoxX + 35,
            speechBoxY + 28,
            speechBoxWidth - 70,
            36,
            25,
            '#ffffff'
        );
    }
}


async function renderCharacterImage(forceFull = true) {

    const speech =
        document.getElementById('imageSpeechText').value;

    const canvas =
        document.getElementById('imagePreviewCanvas');

    if (!canvas) return;

    if (forceFull || !characterBaseCanvas) {

        calculateAll();

        canvas.width = 1408;
        canvas.height = 1056;

        const baseCtx = canvas.getContext('2d');

        baseCtx.fillStyle = '#ffffff';
        baseCtx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        baseCtx.fillStyle = '#c5d5da';

        for (
            let x = 0;
            x < canvas.width;
            x += 102
        ) {
            for (
                let y = 0;
                y < canvas.height;
                y += 102
            ) {
                baseCtx.beginPath();

                baseCtx.arc(
                    x,
                    y,
                    7,
                    0,
                    Math.PI * 2
                );

                baseCtx.fill();
            }
        }


        function text(
            str,
            x,
            y,
            size = 24,
            color = '#252525'
        ) {
            baseCtx.fillStyle = color;
            baseCtx.font =
                `${size}px "Yu Gothic", Meiryo, sans-serif`;
            baseCtx.fillText(
                String(str),
                x,
                y
            );
        }


        function box(
            x,
            y,
            w,
            h,
            title,
            color
        ) {
            baseCtx.fillStyle = '#ffffff';
            baseCtx.strokeStyle = '#222222';
            baseCtx.lineWidth = 2;

            baseCtx.fillRect(
                x,
                y,
                w,
                h
            );

            baseCtx.strokeRect(
                x,
                y,
                w,
                h
            );

            baseCtx.fillStyle = color;

            baseCtx.fillRect(
                x,
                y,
                w,
                42
            );

            baseCtx.fillStyle = '#ffffff';
            baseCtx.font =
                'bold 22px "Yu Gothic", Meiryo, sans-serif';

            baseCtx.textBaseline = 'middle';
            baseCtx.textAlign = 'center';

            baseCtx.fillText(
                title,
                x + w / 2,
                y + 21
            );

            baseCtx.textAlign = 'left';
            baseCtx.textBaseline = 'top';
        }

        const name =
            charName.value || '';

        const race =
            originSetting.value || '';

        const jobName =
            job.value || '';


        const uniqueMagic =
            [...document.querySelectorAll(
                '#uniqueMagicOptions [data-unique]'
            )]
            .filter((el, index) => {
                const checkbox =
                    document.querySelector(
                        `#uniqueMagicDisplayOptions input[data-image-display="unique"][data-index="${index}"]`
                    );

                return checkbox?.checked;
            })
            .map(el => el.value);


        const magicDetails = [
            ...document.querySelectorAll('.unique-detail')
        ]
        .map((card, index) => {
            const checkbox =
                document.querySelector(
                    `#uniqueMagicDetailDisplayOptions input[data-image-display="unique-detail"][data-index="${index}"]`
                );
            if (!checkbox?.checked) {
                return null;
            }
            return {
                name:
                    card.querySelector(
                        '[data-field="magicName"]'
                    ).value,

                effect:
                    card.querySelector(
                        '[data-field="magicEffect"]'
                    ).value
            };
        })
        .filter(
            m => m && (m.name || m.effect)
        );

        const techniqueNames = [
            ...document.querySelectorAll(
                '#techniques .technique'
            )
        ]
        .map((card, index) => {
            const checkbox =
                document.querySelector(
                    `#techniqueDisplayOptions input[data-image-display="technique"][data-index="${index}"]`
                );
            const input =
                card.querySelector(
                    '[data-field="name"]'
                );
            if (
                !checkbox?.checked ||
                !input
            ) {
                return '';
            }
            return input.value.trim();
        })
        .filter(Boolean);

        const specialValues = special
            .filter(
                ([id]) =>
                    N(`sp_${id}`) > 0
            )
            .map(
                ([id, skillName]) => ({
                    name: skillName,
                    value:
                        document.getElementById(
                            `sp_${id}_total`
                        ).textContent
                })
            );

        const statValues = [
            ['筋力', N('str')],
            ['正確性', N('acc')],
            ['俊敏性', N('agi')],
            ['知識', N('know')],
            ['思考力', N('think')],
            ['容姿', N('looks')],
            ['幸運', N('luck')]
        ];

        baseCtx.fillStyle = '#252525';

        baseCtx.fillRect(
            0,
            18,
            868,
            121
        );

        text(
            name,
            110,
            55,
            38,
            '#ffffff'
        );

        text(
            `種族：${race}`,
            665,
            40,
            22,
            '#ffffff'
        );

        text(
            `職業：${jobName}`,
            665,
            95,
            22,
            '#ffffff'
        );

        box(
            22,
            160,
            675,
            480,
            '固有魔法',
            '#252525'
        );

        text(
            '固有魔法適正：',
            37,
            214,
            21
        );

        wrapCanvasText(
            baseCtx,
            uniqueMagic.join('　'),
            210,
            214,
            420,
            28,
            21
        );

        let magicY = 245;

        magicDetails.forEach(magic => {
            if (magic.name) {
                magicY =
                    wrapCanvasText(
                        baseCtx,
                        magic.name,
                        52,
                        magicY,
                        560,
                        20,
                        18
                    );
            }

            if (magic.effect) {
                magicY =
                    wrapCanvasText(
                        baseCtx,
                        magic.effect,
                        52,
                        magicY + 2,
                        560,
                        18,
                        16
                    );
            }
            magicY += 2;
        });

        const techniqueTitleY =
            magicY + 8;
        baseCtx.fillStyle =
            '#dddddd';
        baseCtx.fillRect(
            37,
            techniqueTitleY,
            600,
            1
        );
        text(
            '技一覧',
            45,
            techniqueTitleY + 8,
            20
        );

        const techniqueTop =
            techniqueTitleY + 38;

        const rowsPerColumn =
            Math.ceil(
                techniqueNames.length / 2
            );

        techniqueNames.forEach(
            (name, i) => {
                const col =
                    i < rowsPerColumn
                        ? 0
                        : 1;
                const row =
                    col === 0
                        ? i
                        : i - rowsPerColumn;
                const x =
                    45 + col * 290;
                const y =
                    techniqueTop +
                    row * 28;

                wrapCanvasText(
                    baseCtx,
                    name,
                    x,
                    y,
                    270,
                    22,
                    18
                );
            }
        );

        box(
            22,
            665,
            282,
            210,
            '基礎魔法適性',
            '#ed4380'
        );

        const defaultBasicMagics = [
            ['熱魔法', N('heatMagic'), 0],
            ['身体強化', N('bodyMagic'), 1],
            ['操作魔法', N('controlMagic'), 2]
        ];

        const barValues = [];

        defaultBasicMagics.forEach(
            ([name, value, index]) => {
                const checkbox =
                    document.querySelector(
                        `#basicMagicDisplayOptions input[data-image-display="basic-default"][data-index="${index}"]`
                    );

                if (checkbox?.checked) {
                    barValues.push([
                        name,
                        value,
                        99
                    ]);
                }
            }
        );

        document
            .querySelectorAll('.custom-basic-magic')
            .forEach((field, index) => {

                const name =
                    field.dataset.magicName;

                const input =
                    field.querySelector(
                        '[data-basic-magic-value]'
                    );

                const checkbox =
                    document.querySelector(
                        `#basicMagicDisplayOptions input[data-image-display="basic"][data-index="${index}"]`
                    );

                if (
                    name &&
                    input &&
                    checkbox?.checked
                ) {
                    barValues.push([
                        name,
                        Number(input.value) || 0,
                        99,
                        true
                    ]);
                }
            });

        const mpCheckbox =
            document.querySelector(
                '#basicMagicDisplayOptions input[data-image-display="basic-default"][data-index="3"]'
            );

        if (mpCheckbox?.checked) {
            barValues.push([
                '総魔力量',
                N('mp'),
                120
            ]);
        }

        const chartTop = 718;
        const chartBottom = 833;
        const chartHeight =
            chartBottom - chartTop;

        const barCount = barValues.length;

        const availableWidth = 250;
        const barGap = 15;

        const barWidth =
            Math.min(
                38,
                (availableWidth - barGap * (barCount - 1))
                / barCount
            );

        const totalBarWidth =
            barWidth * barCount +
            barGap * (barCount - 1);

        const firstBarX =
            39 + (availableWidth - totalBarWidth) / 2;

        barValues.forEach(
            ([label, value, max], i) => {
                const x =
                    firstBarX +
                    i * (barWidth + barGap);
                const height =
                    chartHeight *
                    Math.min(value, max) /
                    max;
                const y =
                    chartBottom - height;

                baseCtx.fillStyle =
                    '#eeeeee';
                baseCtx.fillRect(
                    x,
                    chartTop,
                    barWidth,
                    chartHeight
                );
                baseCtx.fillStyle =
                    '#252525';

                baseCtx.fillRect(
                    x,
                    y,
                    barWidth,
                    height
                );
                baseCtx.textAlign =
                    'center';
                text(
                    value,
                    x + barWidth / 2,
                    chartBottom + 5,
                    14
                );
                const labelLines = [];

                let currentLine = '';

                for (const char of label) {
                    const testLine = currentLine + char;

                    baseCtx.font =
                        '12px "Yu Gothic", Meiryo, sans-serif';

                    if (
                        baseCtx.measureText(testLine).width
                        > barWidth + 10
                    ) {
                        if (currentLine) {
                            labelLines.push(currentLine);
                        }

                        currentLine = char;
                    }
                    else {
                        currentLine = testLine;
                    }
                }

                if (currentLine) {
                    labelLines.push(currentLine);
                }

                baseCtx.textAlign = 'center';

                labelLines.forEach((line, index) => {
                    baseCtx.fillStyle = '#252525';
                    baseCtx.font =
                        '12px "Yu Gothic", Meiryo, sans-serif';

                    baseCtx.fillText(
                        line,
                        x + barWidth / 2,
                        chartBottom + 24 + index * 14
                    );
                });
            }
        );

        baseCtx.textAlign =
            'left';

        box(
            22,
            888,
            282,
            150,
            '特殊技能',
            '#ff9018'
        );

        specialValues.forEach(
            (skill, i) => {

                const col =
                    i < 5 ? 0 : 1;
                const row =
                    i < 5
                        ? i
                        : i - 5;
                const x =
                    35 + col * 130;
                const y =
                    940 + row * 20;

                text(
                    skill.name,
                    x,
                    y,
                    15
                );
                text(
                    skill.value,
                    x + 98,
                    y,
                    15
                );
            }
        );

        box(
            317,
            665,
            380,
            373,
            'STATUS',
            '#3199df'
        );

        const cx = 507;
        const cy = 865;
        const radius = 105;
        const maxStat = 30;
        const count = statValues.length;

        baseCtx.strokeStyle =
            '#acaaaa';

        baseCtx.lineWidth = 1;

        for (
            let level = 1;
            level <= 4;
            level++
        ) {
            const r =
                radius * level / 4;
            baseCtx.beginPath();

            for (
                let i = 0;
                i < count;
                i++
            ) {

                const angle =
                    -Math.PI / 2 +
                    i * Math.PI * 2 / count;

                const x =
                    cx +
                    Math.cos(angle) * r;

                const y =
                    cy +
                    Math.sin(angle) * r;

                if (i === 0) {
                    baseCtx.moveTo(
                        x,
                        y
                    );
                }
                else {
                    baseCtx.lineTo(
                        x,
                        y
                    );
                }
            }

            baseCtx.closePath();
            baseCtx.stroke();
        }

        for (
            let i = 0;
            i < count;
            i++
        ) {
            const angle =
                -Math.PI / 2 +
                i * Math.PI * 2 / count;

            baseCtx.beginPath();

            baseCtx.moveTo(
                cx,
                cy
            );

            baseCtx.lineTo(
                cx +
                Math.cos(angle) *
                radius,
                cy +
                Math.sin(angle) *
                radius
            );
            baseCtx.stroke();
        }

        baseCtx.beginPath();

        statValues.forEach(
            ([label, value], i) => {
                const angle =
                    -Math.PI / 2 +
                    i * Math.PI * 2 / count;
                const r =
                    radius *
                    Math.min(
                        value,
                        maxStat
                    ) /
                    maxStat;
                const x =
                    cx +
                    Math.cos(angle) * r;
                const y =
                    cy +
                    Math.sin(angle) * r;

                if (i === 0) {
                    baseCtx.moveTo(
                        x,
                        y
                    );
                }
                else {
                    baseCtx.lineTo(
                        x,
                        y
                    );
                }
            }
        );

        baseCtx.closePath();

        baseCtx.fillStyle =
            'rgba(49,153,223,0.25)';

        baseCtx.fill();

        baseCtx.strokeStyle =
            '#222222';

        baseCtx.lineWidth = 3;

        baseCtx.stroke();

        statValues.forEach(
            ([label, value], i) => {
                const angle =
                    -Math.PI / 2 +
                    i * Math.PI * 2 / count;
                const x =
                    cx +
                    Math.cos(angle) *
                    (radius + 25);
                const y =
                    cy +
                    Math.sin(angle) *
                    (radius + 25);

                baseCtx.textAlign =
                    'center';
                baseCtx.textBaseline =
                    'middle';

                text(
                    `${label} ${value}`,
                    x,
                    y,
                    14
                );
            }
        );

        baseCtx.textAlign =
            'left';

        baseCtx.textBaseline =
            'top';

        characterBaseCanvas =
            document.createElement('canvas');
        characterBaseCanvas.width =
            canvas.width;
        characterBaseCanvas.height =
            canvas.height;
        characterBaseCanvas
            .getContext('2d')
            .drawImage(
                canvas,
                0,
                0
            );
    }
    const ctx =
        canvas.getContext('2d');


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.drawImage(
        characterBaseCanvas,
        0,
        0
    );


    await drawPortrait(ctx);

    if (document.getElementById('showSpeech')?.checked) {
        drawSpeech(
            ctx,
            speech
        );
    }
}

