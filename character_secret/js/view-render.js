/*
 * モジュール: view-render.js
 * 役割: 閲覧画面の各セクション描画と、ページ先頭へ戻る操作を担当します。
 */

function renderViewScreen() {
    renderViewStats();
    renderViewBasicMagic();
    renderViewUniqueMagic();
    renderViewSkills();
    renderViewSpecialSkills();
    renderViewUniqueMagicDetails();
    renderViewTechniques();
    renderViewWeapons();
    renderViewOther();
}

function renderViewStats() {
    const container = document.getElementById('viewStatsGrid');

    if (!container) return;

    container.innerHTML = '';

    stats.forEach(([key, label]) => {
        const input = document.getElementById(key);

        if (!input) return;

        const value = input.value;

        const item = document.createElement('div');
        item.className = 'view-stat-item';

        item.innerHTML = `
            <span class="view-stat-label">${E(label)}</span>
            <span class="view-stat-value">${E(value || '-')}</span>
        `;

        container.appendChild(item);
    });
}

function renderViewBasicMagic() {
    const container = document.getElementById('viewBasicMagicGrid');
    if (!container) return;

    container.innerHTML = '';

    const items = [
        ['basicMagicTotal', '合計値'],
        ['heatMagic', '熱魔法'],
        ['bodyMagic', '身体強化魔法'],
        ['controlMagic', '操作魔法']
    ];
    items.forEach(([id, label]) => {
        const input = document.getElementById(id);
        if (!input) return;
        const item = document.createElement('div');
        item.className = 'view-basic-magic-item';
        item.innerHTML = `
            <span class="view-basic-magic-label">${E(label)}</span>
            <span class="view-basic-magic-value">${E(input.value || '0')}</span>
        `;
        container.appendChild(item);
    });

    document.querySelectorAll('#basicMagicGrid .custom-basic-magic').forEach(field => {
        const input = field.querySelector('[data-basic-magic-value]');
        if (!input) return;
        const name = field.dataset.magicName || '追加魔法';
        const item = document.createElement('div');
        item.className = 'view-basic-magic-item';
        item.innerHTML = `
            <span class="view-basic-magic-label">${E(name)}</span>
            <span class="view-basic-magic-value">${E(input.value || '0')}</span>
        `;
        container.appendChild(item);
    });
}

function renderViewUniqueMagic() {
    const container = document.getElementById('viewUniqueMagicGrid');

    if (!container) return;

    container.innerHTML = '';

    document.querySelectorAll('#uniqueMagicOptions .check-card')
        .forEach(card => {
            const checkbox = card.querySelector('[data-unique]');
            if (!checkbox || !checkbox.checked) return;
            const name = checkbox.value;
            const item = document.createElement('div');
            item.className = 'view-unique-magic-item';
            item.textContent = name;
            container.appendChild(item);
        });
}

function renderViewSkills() {
    const container = document.getElementById('viewSkills');

    if (!container) return;

    container.innerHTML = '';

    const tables = [
        document.querySelector('#combatSkills'),
        document.querySelector('#searchSkills')
    ];

    tables.forEach(table => {
        if (!table) return;

        table.querySelectorAll('tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 3) return;
            const name = cells[0].textContent.trim();
            const value = cells[3].textContent.trim();
            if (!name) return;
            if (Number(value) === 0) return;
            const item = document.createElement('div');
            item.className = 'view-skill-item';
            item.innerHTML = `
                <span class="view-skill-name">${E(name)}</span>
                <span class="view-skill-value">${E(value)}</span>
            `;
            container.appendChild(item);
        });
    });
}

function renderViewSpecialSkills() {
    const container = document.getElementById('viewSpecialSkills');
    if (!container) return;
    container.innerHTML = '';
    const table = document.querySelector('#specialSkills');
    if (!table) return;
    table.querySelectorAll('tr').forEach(row => {
        const nameElement = row.querySelector('td');
        const allocationElement = row.querySelector('[data-custom-special-allocation]') || row.querySelector('input.mini');
        const valueElement = row.querySelector('.calc');
        if (!nameElement || !valueElement) return;
        const customName = row.querySelector('[data-custom-special-name]');
        const name = customName ? customName.value.trim() : nameElement.textContent.trim();
        const allocation = Number(
            allocationElement?.value || 0
        );
        const value = valueElement.textContent.trim();
        if (!name || allocation === 0) return;
        const item = document.createElement('div');
        item.className = 'view-special-item';
        item.innerHTML = `
            <span class="view-special-name">${E(name)}</span>
            <span class="view-special-value">${E(value)}</span>
        `;
        container.appendChild(item);
    });
}

function renderViewUniqueMagicDetails() {
    const container =
        document.getElementById('viewUniqueMagicDetails');

    if (!container) return;

    container.innerHTML = '';

    document
        .querySelectorAll('#uniqueMagicDetails .unique-detail')
        .forEach(detail => {
            const nameInput =
                detail.querySelector(
                    '[data-field="magicName"]'
                );
            const effectInput =
                detail.querySelector(
                    '[data-field="magicEffect"]'
                );
            const magicName =
                nameInput?.value.trim() || '';
            const effect =
                effectInput?.value.trim() || '';
            if (!magicName && !effect) return;
            const detailsElement =
                document.createElement('details');
            detailsElement.className =
                'view-item-collapsible';
            const summary =
                document.createElement('summary');
            summary.textContent =
                magicName || '固有魔法';
            detailsElement.appendChild(summary);
            if (effect) {
                const effectElement =
                    document.createElement('div');
                effectElement.className =
                    'view-unique-detail-effect';
                effectElement.textContent =
                    effect;
                detailsElement.appendChild(
                    effectElement
                );
            }
            container.appendChild(
                detailsElement
            );
        });
}

function renderViewTechniques() {
    const container = document.getElementById('viewTechniques');
    if (!container) return;
    container.innerHTML = '';
    const source = document.getElementById('techniques');
    if (!source) return;
    source.querySelectorAll('.technique').forEach(technique => {

        const nameInput =
            technique.querySelector('[data-field="name"]');

        const refInput =
            technique.querySelector('[data-field="ref"]');

        const multInput =
            technique.querySelector('[data-field="mult"]');

        const addInput =
            technique.querySelector('[data-field="add"]');

        const damageInput =
            technique.querySelector('[data-field="damage"]');

        const mpInput =
            technique.querySelector('[data-field="mp"]');

        const maintainMpInput =
            technique.querySelector('[data-field="maintainMp"]');

        const noteInput =
            technique.querySelector('[data-field="note"]');

        if (!nameInput) return;

        const name =
            nameInput.value.trim();

        if (!name) return;

        const details =
            document.createElement('details');

        details.className =
            'view-item-collapsible';

        const summary =
            document.createElement('summary');

        summary.textContent =
            name;

        details.appendChild(summary);

        const content =
            document.createElement('div');

        content.className =
            'view-technique-content';

                const ref =
                    refInput?.value.trim() || '';

                const mult =
                    multInput?.value.trim() || '';

                const add =
                    addInput?.value.trim() || '';

                if (ref || mult || add) {

                    const addViewRow = (labelText, valueText) => {
                        const row =
                            document.createElement('div');

                        row.className =
                            'view-technique-row';

                        const label =
                            document.createElement('span');

                        label.className =
                            'view-technique-label';

                        label.textContent =
                            labelText;

                        const value =
                            document.createElement('span');
        
                        value.className =
                            'view-technique-value';

                        value.textContent =
                            valueText;

                        row.appendChild(label);
                        row.appendChild(value);

                        content.appendChild(row);
                    };

                    const v =
                        vals();

                    const successValue =
                        (ref === 'none' || !ref ? 0 : v[ref]) *
                        Number(mult || 1) +
                        Number(add || 0);

                    addViewRow(
                        '参照ステータス',
                        statName(ref)
                    );

                    addViewRow(
                        '倍率',
                        mult || '1'
                    );

                    addViewRow(
                        '成功値への加算',
                        add || '0'
                    );

                    addViewRow(
                        '成功値',
                        successValue
                    );
                }
        const damage =
            damageInput?.value.trim() || '';

        if (damage) {
            const row =
                document.createElement('div');
            row.className =
                'view-technique-row';
            row.innerHTML = `
                <span class="view-technique-label">ダメージ</span>
                <span class="view-technique-value">${E(damage)}</span>
            `;
            content.appendChild(row);
        }
        const mp =
            mpInput?.value.trim() || '';
        if (mp) {
            const row =
                document.createElement('div');
            row.className =
                'view-technique-row';
            row.innerHTML = `
                <span class="view-technique-label">消費MP</span>
                <span class="view-technique-value">${E(mp)}</span>
            `;
            content.appendChild(row);
        }

        const maintainMp =
            maintainMpInput?.value.trim() || '';
        if (maintainMp) {
            const row =
                document.createElement('div');
            row.className =
                'view-technique-row';
            row.innerHTML = `
                <span class="view-technique-label">維持MP</span>
                <span class="view-technique-value">${E(maintainMp)}</span>
            `;
            content.appendChild(row);
        }
        const note =
            noteInput?.value.trim() || '';
        if (note) {
            const row =
                document.createElement('div');
            row.className =
                'view-technique-note';
            row.innerHTML = `
                <div class="view-technique-label">効果・メモ</div>
                <div class="view-technique-note-text">${E(note)}</div>
            `;
            content.appendChild(row);
        }
        details.appendChild(content);
        container.appendChild(details);
    });
}

function renderViewWeapons() {
    const container = document.getElementById('viewWeapons');

    if (!container) return;

    container.innerHTML = '';

    const source = document.getElementById('weapons');

    if (!source) return;

    source.querySelectorAll('.weapon').forEach(weapon => {

        const nameInput =
            weapon.querySelector('[data-field="name"]');

        const refInput =
            weapon.querySelector('[data-field="ref"]');

        const multInput =
            weapon.querySelector('[data-field="mult"]');

        const addInput =
            weapon.querySelector('[data-field="add"]');

        const damageInput =
            weapon.querySelector('[data-field="damage"]');

        const noteInput =
            weapon.querySelector('[data-field="note"]');

        if (!nameInput) return;

        const name =
            nameInput.value.trim();

        if (!name) return;

        const details =
            document.createElement('details');

        details.className =
            'view-item-collapsible';

        const summary =
            document.createElement('summary');

        summary.textContent =
            name;

        details.appendChild(summary);

        const content =
            document.createElement('div');

        content.className =
            'view-technique-content';

                const ref =
                    refInput?.value.trim() || '';

                const mult =
                    multInput?.value.trim() || '';

                const add =
                    addInput?.value.trim() || '';

                if (ref || mult || add) {

                    const addViewRow = (labelText, valueText) => {
                        const row =
                            document.createElement('div');

                        row.className =
                            'view-technique-row';

                        const label =
                            document.createElement('span');

                        label.className =
                            'view-technique-label';

                        label.textContent =
                            labelText;

                        const value =
                            document.createElement('span');

                        value.className =
                            'view-technique-value';

                        value.textContent =
                            valueText;

                        row.appendChild(label);
                        row.appendChild(value);

                        content.appendChild(row);
                    };

                    const v =
                        vals();

                    const successValue =
                        (ref === 'none' || !ref ? 0 : v[ref]) *
                        Number(mult || 1) +
                        Number(add || 0);

                    addViewRow(
                        '参照ステータス',
                        statName(ref)
                    );

                    addViewRow(
                        '倍率',
                        mult || '1'
                    );

                    addViewRow(
                        '成功値への加算',
                        add || '0'
                    );

                    addViewRow(
                        '成功値',
                        successValue
                    );
                }
        const damage =
            damageInput?.value.trim() || '';

        if (damage) {
            const row =
                document.createElement('div');
            row.className =
                'view-technique-row';
            row.innerHTML = `
                <span class="view-technique-label">ダメージ</span>
                <span class="view-technique-value">${E(damage)}</span>
            `;
            content.appendChild(row);
        }

        const note =
            noteInput?.value.trim() || '';
        if (note) {
            const row =
                document.createElement('div');
            row.className =
                'view-technique-note';
            row.innerHTML = `
                <div class="view-technique-label">効果・メモ</div>
                <div class="view-technique-note-text">${E(note)}</div>
            `;
            content.appendChild(row);
        }
        details.appendChild(content);
        container.appendChild(details);
    });
}

function renderViewOther() {
    const container = document.getElementById('viewOther');

    if (!container) return;

    container.innerHTML = '';

    const source = document.querySelector('.view-other');

    if (!source) return;

    const fields = source.querySelectorAll(
        'input:not([type="button"]):not([type="submit"]), textarea, select'
    );

    fields.forEach(field => {
        const value = field.value?.trim();

        if (!value) return;

        const fieldWrapper = field.closest('.field');

        let label = '';

        if (fieldWrapper) {
            const labelElement = fieldWrapper.querySelector('label');

            if (labelElement) {
                label = labelElement.textContent.trim();
            }
        }

        if (!label) {
            label = field.name || field.id || '';
        }

        const item = document.createElement('div');
        item.className = 'view-other-item';

        item.innerHTML = `
            <span class="view-other-label">${E(label)}</span>
            <span class="view-other-value">${E(value)}</span>
        `;

        container.appendChild(item);
    });
}

const backToTopButton =
    document.getElementById('backToTopButton');

if (backToTopButton) {
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}
