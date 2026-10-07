import { showFreezeDiv, hideFreezeDiv } from './utils.js';
import { createElement, setTextContent, createButton } from './utils/dom.js';
import { editEvent, configureRankInput } from '../ui/editing.ts';
import { relativePercent, itemWeights, factionScope, categoryId } from '../model/editing.ts';

export class chancesController {
    constructor(state) {
        this.state = state;

        this.onWeaponChanceChange = this.onWeaponChanceChange.bind(this);
        this.onGrenadeChanceChange = this.onGrenadeChanceChange.bind(this);
        this.onArmorChanceChange = this.onArmorChanceChange.bind(this);
        this.onPistolChanceChange = this.onPistolChanceChange.bind(this);
        this.onHelmetChanceChange = this.onHelmetChanceChange.bind(this);
        this.onAmmoChanceChange = this.onAmmoChanceChange.bind(this);
        this.onAttributeChange = this.onAttributeChange.bind(this);
    }

    get currentFaction() { return this.state.view.faction; }
    set currentFaction(value) { this.state.view.faction = factionScope(value); }
    get currentCategory() { return this.state.view.category; }
    set currentCategory(value) { this.state.view.category = categoryId(value); }
    get typeToTable() { return this.state.typeToTable; }
    // PresetsManager still calls this after legacy assignments. No rebinding is needed.
    fillSettings() {}

    changeList(list, classification, item, operation) {
        this.state.edit({ kind: 'list', list, faction: this.currentFaction, role: classification, item, operation });
        return itemWeights(this.state.config, list, this.currentFaction, classification);
    }

    createChances (item, summary, chances, classification = '', attr = 'chances') {
        let chancesElement = document.createElement('div');
        chancesElement.classList.add('chances_row');
        for (let i=0; i<chances.length; i++) {
            let resultElement = document.createElement('div'); //container to show real chance
                resultElement.classList.add('chance');
                
            if (isNaN(parseFloat(chances[i]))) { //for static text
                setTextContent(resultElement, chances[i]);
            }else{ //inputs
                let faction = this.currentFaction;
                let itemType = this.currentCategory;

                let chanceElement = document.createElement('input');
                    chanceElement.type = 'number';
                    chanceElement.classList.add('chance');
                    chanceElement.value = chances[i];
                    chanceElement.dataset.faction = faction;
                    chanceElement.dataset.classification = classification;
                    chanceElement.dataset.type = itemType;
                    chanceElement.dataset.item = item;
                    chanceElement.dataset.attr = attr;
                    chanceElement.dataset.level = i;
                    configureRankInput(chanceElement, this.currentCategory, attr);


                resultElement.appendChild(chanceElement);

                let chanceLabel = document.createElement('div');
                    chanceLabel.id = classification + '-' + item + '-' + attr + '-' + i + '_label';
                    chanceLabel.classList.add('chance_label');
                resultElement.appendChild(chanceLabel);

            }
            chancesElement.appendChild(resultElement);
        }

        summary.appendChild(chancesElement);

        return chancesElement;
    }

    addRow (parentElement, item, classification, chances){ //TODO rewrite to dot use dublicate code
        let row = document.createElement('tr');
            
            // Item name cell
            let itemCell = document.createElement('td');
            itemCell.className = 'align-middle';
            
            const strongEl = createElement('strong', {
                textContent: item
            });
            itemCell.appendChild(strongEl);
            
            row.appendChild(itemCell);
            
            chances.forEach((chance, index) => {
                let chanceCell = document.createElement('td');
                chanceCell.className = 'text-center position-relative';
                
                if (isNaN(parseFloat(chance))) {
                    // Static text
                    const badge = createElement('span', {
                        className: 'badge bg-secondary',
                        textContent: chance
                    });
                    chanceCell.appendChild(badge);
                } else {
                    // Input field
                    let input = document.createElement('input');
                    input.type = 'number';
                    input.className = 'form-control form-control-sm text-center';
                    input.value = chance;
                    input.dataset.faction = this.currentFaction;
                    input.dataset.classification = classification;
                    input.dataset.type = this.currentCategory;
                    input.dataset.item = item;
                    input.dataset.level = index;
                    configureRankInput(input, this.currentCategory, input.dataset.attr);

                    
                    let label = document.createElement('small');
                    label.className = 'text-muted me-1 chance_persent';
                    label.id = `${classification}-${item}-chances-${index}_label`;
                    
                    chanceCell.appendChild(input);
                    chanceCell.appendChild(label);
                }
                
                row.appendChild(chanceCell);
            });
            
            // Add delete button if needed
            if ((this.currentCategory === 'Primary' || this.currentCategory === 'Armor' || this.currentCategory === 'Pistols') && this.currentFaction !== 'Generic_settings' && item !== '') {
                let actionsCell = document.createElement('td');
                actionsCell.className = 'text-center';
                
                let deleteButton = createButton({
                    className: 'btn btn-danger btn-sm',
                    iconClass: 'fas fa-trash',
                    attributes: { title: 'Delete' }
                });
                
                deleteButton.addEventListener('click', () => {
                    const list = this.currentCategory === 'Primary' ? 'weapon' : this.currentCategory === 'Armor' ? 'armor' : 'pistol';
                    const items = this.changeList(list, classification, item, 'remove');
                    this.updateAllLabels(items, classification);
                    row.remove();
                });
                
                actionsCell.appendChild(deleteButton);
                row.appendChild(actionsCell);
            }
            
            parentElement.appendChild(row);

            return row;
    }

    addItem(parentEl, list, classification, item) {
        const current = itemWeights(this.state.config, list, this.currentFaction, classification);
        if (Object.hasOwn(current, item)) return;
        const items = this.changeList(list, classification, item, 'add');
        this.addRow(parentEl, item, classification, [0, 0, 0, 0]);
        this.updateAllLabels(items, classification);
    }
    addWeaponToClass(parentEl, classification, item) { this.addItem(parentEl, 'weapon', classification, item); }
    addArmor(parentEl, item) { this.addItem(parentEl, 'armor', '', item); }
    addPistol(parentEl, item) { this.addItem(parentEl, 'pistol', '', item); }

    showAddSelection (target, type, classification) {
        showFreezeDiv();
        let fullscreenDiv = document.createElement('div');
        fullscreenDiv.classList.add('fullscreen_select');
        let divContent = document.createElement('div');
        divContent.classList.add('fullscreen_select_content');

        for (let item in this.typeToTable[type]) {
            let option = document.createElement('div');
            option.classList.add('fullscreen_select_item');
            option.textContent = item;
            option.value = item;
            divContent.appendChild(option);
        }

        divContent.querySelectorAll('.fullscreen_select_item').forEach((el) => {
            el.addEventListener('click', (e) => {
                let item = e.target.value;
                if (type === 'weapon') {
                    this.addWeaponToClass(target, classification, item);
                }else if (type === 'armor') {
                    this.addArmor(target, item);
                }else if (type === 'pistol') {
                    this.addPistol(target, item);
                }

                fullscreenDiv.remove();
                hideFreezeDiv();
            });
        });

        let closeButton = createButton({
            text: 'Close',
            className: 'fullscreen_select_close'
        });
        closeButton.addEventListener('click', function() {
            fullscreenDiv.remove();
            hideFreezeDiv();
        });

        fullscreenDiv.appendChild(divContent);
        fullscreenDiv.appendChild(closeButton);
        document.body.appendChild(fullscreenDiv);
    }

    drawAttentionDiv (text = 'This section is for all factions, settings for specific factions are not implemented yet') {
        let div = createElement('div', {
            className: 'alert alert-info'
        });
        
        const icon = createElement('i', {
            className: 'fas fa-info-circle me-2'
        });
        div.appendChild(icon);
        div.appendChild(document.createTextNode(text));
        
        return div;
    }

    updateLabels(settings, level, classification = '') {
        for (const item in settings) {
            const label = document.getElementById(classification + '-' + item + '-chances-' + level + '_label');
            setTextContent(label, '~' + relativePercent(settings, item, Number(level)).toFixed(2) + '%');
        }
    }
    updateAllLabels(settings, classification = '') {
        for (let level = 0; level < 4; level++) this.updateLabels(settings, level, classification);
    }
    changeWeight(event, list) {
        if (editEvent(this.state, event, list)) {
            const d = event.target.dataset;
            this.updateLabels(itemWeights(this.state.config, list, d.faction, d.classification), d.level, d.classification);
        }
    }
    onWeaponChanceChange(event) { this.changeWeight(event, 'weapon'); }
    onArmorChanceChange(event) { this.changeWeight(event, 'armor'); }
    onPistolChanceChange(event) { this.changeWeight(event, 'pistol'); }
    onGrenadeChanceChange(event) { editEvent(this.state, event, 'grenade'); }
    onHelmetChanceChange(event) { editEvent(this.state, event, 'helmet'); }
    onAmmoChanceChange(event) { editEvent(this.state, event, 'ammo'); }
    onAttributeChange(event) { editEvent(this.state, event, 'attribute'); }

    //TODO rewrite to use typeToTable
    fillChancesTable (oSettings, newRowReplace, tableType, classification = '') {
        // Create Bootstrap table structure
        let tableContainer = document.createElement('div');
        tableContainer.className = 'table-responsive';
        
        let table = document.createElement('table');
        table.className = 'table table-striped table-hover table-sm';
        
        // Create header
        let thead = document.createElement('thead');
        thead.className = 'table-dark';
        let headerRow = document.createElement('tr');
        
        // Add item name header
        let itemHeader = document.createElement('th');
        itemHeader.textContent = 'Item';
        itemHeader.className = 'text-start';
        headerRow.appendChild(itemHeader);
        
        // Add level headers
        const levelHeaders = newRowReplace || ['Newbie', 'Experienced', 'Veteran', 'Master'];
        levelHeaders.forEach(level => {
            let levelHeader = document.createElement('th');
            levelHeader.textContent = level;
            levelHeader.className = 'text-center';
            headerRow.appendChild(levelHeader);
        });
        
        // Add actions header if needed
        if ((this.currentCategory === 'Primary' || this.currentCategory === 'Armor' || this.currentCategory === 'Pistols') && this.currentFaction !== 'Generic_settings') {
            let actionsHeader = document.createElement('th');
            actionsHeader.textContent = 'Actions';
            actionsHeader.className = 'text-center';
            headerRow.appendChild(actionsHeader);
        }
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body
        let tbody = document.createElement('tbody');
        
        // Add data rows
        for (let item in oSettings) {
            let row = document.createElement('tr');
            
            // Item name cell
            let itemCell = document.createElement('td');
            itemCell.className = 'align-middle';
            
            const strongEl = createElement('strong', {
                textContent: item
            });
            itemCell.appendChild(strongEl);
            
            row.appendChild(itemCell);
            
            // Check if it's an object with attributes or array of chances
            if (typeof oSettings[item] === 'object' && !Array.isArray(oSettings[item])) {
                let colCount = levelHeaders.length + 1;
                if ((this.currentCategory === 'Primary' || this.currentCategory === 'Armor' || this.currentCategory === 'Pistols') && this.currentFaction !== 'Generic_settings') {
                    colCount += 1;
                }
                itemCell.colSpan = colCount;
                row.className = 'table-light';
                tbody.appendChild(row);

                // Handle objects with attributes (like grenades)
                for (let attr in oSettings[item]) {
                    let attrRow = document.createElement('tr');
                    attrRow.className = 'table-secondary';
                    
                    let attrCell = document.createElement('td');
                    attrCell.className = 'align-middle ps-4';
                    attrCell.appendChild(document.createTextNode('\u00A0\u00A0' + attr)); // Using non-breaking spaces instead of &nbsp;
                    attrRow.appendChild(attrCell);
                    
                    // Add chance inputs for this attribute
                    oSettings[item][attr].forEach((chance, index) => {
                        let chanceCell = document.createElement('td');
                        chanceCell.className = 'text-center position-relative';
                        
                        let input = document.createElement('input');
                        input.type = 'number';
                        input.className = 'form-control form-control-sm text-center';
                        input.value = chance;
                        input.dataset.faction = this.currentFaction;
                        input.dataset.classification = classification;
                        input.dataset.type = this.currentCategory;
                        input.dataset.item = item;
                        input.dataset.attr = attr;
                        input.dataset.level = index;
                        configureRankInput(input, this.currentCategory, input.dataset.attr);

                        
                        let label = document.createElement('small');
                        label.className = 'text-muted me-1 chance_persent';
                        label.id = `${classification}-${item}-${attr}-${index}_label`;
                        
                        chanceCell.appendChild(input);
                        chanceCell.appendChild(label);
                        attrRow.appendChild(chanceCell);
                    });
                    
                    tbody.appendChild(attrRow);
                }
            } else {
                // Handle arrays of chances
                const chances = Array.isArray(oSettings[item]) ? oSettings[item] : [oSettings[item]];
                chances.forEach((chance, index) => {
                    let chanceCell = document.createElement('td');
                    chanceCell.className = 'text-center position-relative';
                    
                    if (isNaN(parseFloat(chance))) {
                        // Static text
                        const badge = createElement('span', {
                            className: 'badge bg-secondary',
                            textContent: chance
                        });
                        chanceCell.appendChild(badge);
                    } else {
                        // Input field
                        let input = document.createElement('input');
                        input.type = 'number';
                        input.className = 'form-control form-control-sm text-center';
                        input.value = chance;
                        input.dataset.faction = this.currentFaction;
                        input.dataset.classification = classification;
                        input.dataset.type = this.currentCategory;
                        input.dataset.item = item;
                        input.dataset.level = index;
                        configureRankInput(input, this.currentCategory, input.dataset.attr);

                        
                        let label = document.createElement('small');
                        label.className = 'text-muted me-1 chance_persent';
                        label.id = `${classification}-${item}-chances-${index}_label`;
                        
                        chanceCell.appendChild(input);
                        chanceCell.appendChild(label);
                    }
                    
                    row.appendChild(chanceCell);
                });
                
                // Add delete button if needed
                if ((this.currentCategory === 'Primary' || this.currentCategory === 'Armor' || this.currentCategory === 'Pistols') && this.currentFaction !== 'Generic_settings' && item !== '') {
                    let actionsCell = document.createElement('td');
                    actionsCell.className = 'text-center';
                    
                    let deleteButton = createButton({
                        className: 'btn btn-danger btn-sm',
                        iconClass: 'fas fa-trash',
                        attributes: { title: 'Delete' }
                    });
                    
                    deleteButton.addEventListener('click', () => {
                        const list = this.currentCategory === 'Primary' ? 'weapon' : this.currentCategory === 'Armor' ? 'armor' : 'pistol';
                        const items = this.changeList(list, classification, item, 'remove');
                        this.updateAllLabels(items, classification);
                        row.remove();
                    });
                    
                    actionsCell.appendChild(deleteButton);
                    row.appendChild(actionsCell);
                }
                
                tbody.appendChild(row);
            }
        }
        
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        
        // Add "Add Item" button if table type is specified
        if (tableType) {
            let addButtonContainer = document.createElement('div');
            addButtonContainer.className = 'd-flex justify-content-center';
            
            let addButton = createButton({
                className: 'btn btn-success btn-sm',
                text: 'Add Item',
                iconClass: 'fas fa-plus'
            });
            addButton.addEventListener('click', () => {
                this.showAddSelection(tbody, tableType, classification);
            });
            
            addButtonContainer.appendChild(addButton);
            tableContainer.appendChild(addButtonContainer);
        }
        
        return tableContainer;
    }

    fillAttributesTable = (oSettings, parentElement, type) => {
        const typeToAttributeList = {
            weapon: [['minAmmo', 'number'], ['maxAmmo','number'], ['minCondition', 'number'], ['maxCondition', 'number']],
            armor: [['drop', 'checkbox'], ['dropItem', 'select'], ['helmet', 'select'], ['helmetSpawn', 'number']]
        };
        const attributeToTitle = {
            minAmmo: 'Minimum Ammo',
            maxAmmo: 'Maximum Ammo',
            minCondition: 'Minimum Condition (%)',
            maxCondition: 'Maximum Condition (%)',
            drop: 'Can Drop (if enabled)',
            dropItem: 'Alter item drop (for NPC armor)',
            helmet: 'Helmet',   
            helmetSpawn: 'Helmet Drop Chance (%) (seems not working, spawn in helmet settings)'
        }; //TODO add tooltips on hover

        let attributesTable = document.createElement('div');

        attributesTable.classList.add('attributes_table');

        const addAttributes = (item, oAttr, parentElement) => {
            let attributesElement = document.createElement('div');
            attributesElement.className = 'row g-2';
            
            for (let attr in typeToAttributeList[type]) {
                let thisAttr = typeToAttributeList[type][attr];
                
                // Create Bootstrap form group
                let formGroup = document.createElement('div');
                formGroup.className = 'col-md-6';
                
                let labelEl = document.createElement('label');
                labelEl.className = 'form-label';
                setTextContent(labelEl, attributeToTitle[thisAttr[0]] || thisAttr[0]);
                
                let attrElement;
                if (thisAttr[1] === 'select') {
                    attrElement = document.createElement('select');
                    attrElement.className = 'form-select form-select-sm';
                    attrElement.dataset.type = type;
                    attrElement.dataset.item = item;
                    attrElement.dataset.attr = thisAttr[0];
                    let itemList = type==='armor'?thisAttr[0]=='helmet'?this.state.config.HelmetsSettings:this.state.config.ArmorSpawnSettings:this.state.config.WeaponList; //bruh
                    {
                        let option = document.createElement('option');
                        option.value = '';
                        option.text = '';
                        attrElement.appendChild(option);
                    }
                    for (let item in itemList) {
                        let option = document.createElement('option');
                        option.value = item;
                        option.text = item;
                        attrElement.appendChild(option);
                    }
                    attrElement.value = oAttr[thisAttr[0]] ?? '';
                } else if (thisAttr[1] === 'checkbox') {
                    // Special handling for checkbox
                    let checkDiv = document.createElement('div');
                    checkDiv.className = 'form-check';
                    
                    attrElement = document.createElement('input');
                    attrElement.className = 'form-check-input';
                    attrElement.type = 'checkbox';
                    attrElement.checked = oAttr[thisAttr[0]];
                    attrElement.dataset.type = type;
                    attrElement.dataset.item = item;
                    attrElement.dataset.attr = thisAttr[0];
                    
                    labelEl.className = 'form-check-label';
                    
                    checkDiv.appendChild(attrElement);
                    checkDiv.appendChild(labelEl);
                    formGroup.appendChild(checkDiv);
                    attributesElement.appendChild(formGroup);
                    continue;
                } else {
                    attrElement = document.createElement('input');
                    attrElement.className = 'form-control form-control-sm';
                    attrElement.type = thisAttr[1];
                    attrElement.value = typeof oAttr[thisAttr[0]] === 'boolean' ? Number(oAttr[thisAttr[0]]) : oAttr[thisAttr[0]] ?? '';
                    attrElement.dataset.type = type;
                    attrElement.dataset.item = item;
                    attrElement.dataset.attr = thisAttr[0];

                    // Add validation for number inputs
                    if (thisAttr[1] === 'number') {
                        // Set appropriate min/max based on attribute type
                        let min = 0;
                        let max = Infinity;
                        
                        if (thisAttr[0].includes('Condition') || thisAttr[0] === 'helmetSpawn') {
                            max = 100; // Condition is percentage
                        }
                        
                        attrElement.min = min;
                        if (Number.isFinite(max)) attrElement.max = max;
                        attrElement.step = thisAttr[0].includes('Ammo') ? '1' : 'any';

                    }
                }

                formGroup.appendChild(labelEl);
                formGroup.appendChild(attrElement);
                attributesElement.appendChild(formGroup);
            }
                
            parentElement.appendChild(attributesElement);
        }

        const addRow = (parentElement, item, value) => {
            // Create Bootstrap card for each item
            let card = document.createElement('div');
            card.className = 'card mb-2';
            
            let cardHeader = document.createElement('div');
            cardHeader.className = 'card-header';
            
            const h6 = createElement('h6', {
                className: 'mb-0'
            });
            
            const button = createElement('button', {
                className: 'btn btn-link text-decoration-none p-0 text-start w-100',
                attributes: {
                    type: 'button',
                    'data-bs-toggle': 'collapse',
                    'data-bs-target': `#collapse-${item.replace(/\s+/g, '-')}`,
                    'aria-expanded': 'true',
                    'aria-controls': `collapse-${item.replace(/\s+/g, '-')}`
                }
            });
            
            button.appendChild(document.createTextNode(item));
            
            const chevronIcon = createElement('i', {
                className: 'fas fa-chevron-down float-end'
            });
            button.appendChild(chevronIcon);
            
            h6.appendChild(button);
            cardHeader.appendChild(h6);
            
            let collapseDiv = document.createElement('div');
            collapseDiv.className = 'collapse show';
            collapseDiv.id = `collapse-${item.replace(/\s+/g, '-')}`;
            
            let cardBody = document.createElement('div');
            cardBody.className = 'card-body';
            
            addAttributes(item, value, cardBody);
            
            collapseDiv.appendChild(cardBody);
            card.appendChild(cardHeader);
            card.appendChild(collapseDiv);
            parentElement.appendChild(card);
        };

        for (let item in oSettings) {
            addRow(attributesTable, item, oSettings[item]);
        }

        attributesTable.addEventListener('change', this.onAttributeChange);
        parentElement.appendChild(attributesTable);
    }
}
