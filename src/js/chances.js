import { showFreezeDiv, hideFreezeDiv } from './utils.js';

export class chancesController {
    constructor() {
        this.currentFaction = "Neutral";
        this.currentCategory = "Primary";
        this.settings = {
            weapon: {},
            armor: {},
            pistol: {},
            grenade: {},
            helmet: {},
            ammo: {}
        };
        this.lists = {
            weapon: {},
            armor: {},
            helmet: {}
        }
        this.typeToTable = {};

        this.onWeaponChanceChange = this.onWeaponChanceChange.bind(this);
        this.onGrenadeChanceChange = this.onGrenadeChanceChange.bind(this);
        this.onArmorChanceChange = this.onArmorChanceChange.bind(this);
        this.onPistolChanceChange = this.onPistolChanceChange.bind(this);
        this.onHelmetChanceChange = this.onHelmetChanceChange.bind(this);
        this.onAmmoChanceChange = this.onAmmoChanceChange.bind(this);
        this.onAttributeChange = this.onAttributeChange.bind(this);
    }

    fillSettings (settings) {
        this.settings = {
            weapon: settings.weapon,
            armor: settings.armor,
            pistol: settings.pistol,
            grenade: settings.grenade,
            helmet: settings.helmet,
            ammo: settings.ammo
        }
        this.lists = {
            weapon: settings.weaponList,
            armor: settings.armorList,
            helmet: settings.helmet
        };
    }

    createChances (item, summary, chances, classification = '', attr = 'chances') {
        let chancesElement = document.createElement('div');
        chancesElement.classList.add('chances_row');
        for (let i=0; i<chances.length; i++) {
            let resultElement = document.createElement('div'); //container to show real chance
                resultElement.classList.add('chance');
                
            if (isNaN(parseFloat(chances[i]))) { //for static text
                resultElement.innerHTML = chances[i];
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

    addRow (parentElement, item, classification, chances){
        let row = document.createElement('div');
        row.classList.add(typeof chances=== 'object' && chances.length?'item_row':'item_column');
        let itemElement = document.createElement('div');
        itemElement.classList.add('chances_item');
        itemElement.innerHTML = item;
        row.appendChild(itemElement);

        let eChances;

        if (typeof chances === 'object'){
            if (chances.length){
                eChances = this.createChances(item, row, chances, classification);
            }else{
                for (let attr in chances) {
                    let innerRow = document.createElement('div');
                    innerRow.classList.add('attr_row');
                    row.appendChild(innerRow);
                    let attrNameElement = document.createElement('div');
                    attrNameElement.classList.add('attr_item');
                    attrNameElement.innerHTML = attr;
                    innerRow.appendChild(attrNameElement);
                    eChances = this.createChances(item, innerRow, chances[attr], classification, attr);
                }
            }
            
        }

        if ((this.currentCategory === 'Primary' || this.currentCategory === 'Armor') && this.currentFaction !== 'Generic_settings' && item !== '') {
            let deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<i class="fas fa-trash me-1"></i>Delete';
            deleteButton.className = 'btn btn-danger btn-sm ms-2';
            
            deleteButton.addEventListener('click', () => {
                let GeneralSettings = 'GeneralNPC_'+this.currentFaction;
                if (this.currentCategory === 'Primary') {
                    delete this.settings.weapon[GeneralSettings][classification][item];
                    this.updateAllLabels(this.settings.weapon[GeneralSettings][classification], classification);
                }else if (this.currentCategory === 'Armor') {
                    delete this.settings.armor[GeneralSettings][item];
                    this.updateAllLabels(this.settings.armor[GeneralSettings]);
                }
                row.remove();
            });
            row.appendChild(deleteButton);
        }

        parentElement.appendChild(row);
        return eChances;
    }

    addWeaponToClass (parentEl, classification, weapon) {
        let GeneralSettings = 'GeneralNPC_'+this.currentFaction;
        let WeaponSettings = this.settings.weapon[GeneralSettings];
        if (WeaponSettings[classification][weapon]) return;

        let eChances = this.addRow(parentEl, weapon, classification, [0, 0, 0, 0]);
        eChances.addEventListener('change', this.onWeaponChanceChange);

        WeaponSettings[classification][weapon] = [0, 0, 0, 0];

        this.updateAllLabels(WeaponSettings[classification], classification);
    }

    addArmor (parentEl, armor) {
        let GeneralSettings = 'GeneralNPC_'+this.currentFaction;
        let ArmorSettings = this.settings.armor[GeneralSettings];
        if (ArmorSettings[armor]) return;

        let eChances = this.addRow(parentEl, armor, '', [0, 0, 0, 0]);
        eChances.addEventListener('change', this.onArmorChanceChange);

        ArmorSettings[armor] = [0, 0, 0, 0];
        this.updateAllLabels(ArmorSettings);
    }

    addPistol (parentEl, item) {
        let GeneralSettings = 'GeneralNPC_'+this.currentFaction;
        let PistolSettings = this.settings.pistol[GeneralSettings];
        if (PistolSettings[item]) return;

        let eChances = this.addRow(parentEl, item, '', [0, 0, 0, 0]);
        eChances.addEventListener('change', this.onPistolChanceChange);

        PistolSettings[item] = [0, 0, 0, 0];
        this.updateAllLabels(PistolSettings);
    }

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
            el.addEventListener('click', function(e) {
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

        let closeButton = document.createElement('button');
        closeButton.innerHTML = 'Close';
        closeButton.classList.add('fullscreen_select_close');
        closeButton.addEventListener('click', function() {
            fullscreenDiv.remove();
            hideFreezeDiv();
        });

        fullscreenDiv.appendChild(divContent);
        fullscreenDiv.appendChild(closeButton);
        document.body.appendChild(fullscreenDiv);
    }

    drawAttentionDiv (text = 'This section is for all factions, settings for specific factions are not implemented yet') {
        let div = document.createElement('div');
        div.className = 'alert alert-info';
        div.innerHTML = `<i class="fas fa-info-circle me-2"></i>${text}`;
        return div;
    }

    updateLabels (oSettings, level, classification = '') {
        let total = 0;
        for (let item in oSettings) {
            total += +oSettings[item][level];
        }

        for (let item in oSettings) {
            let label = document.getElementById(classification + '-' + item + '-' + 'chances' + '-' + level + '_label');
            label.innerHTML = '~'+(oSettings[item][level]/total*100).toFixed(2)+'%';
        }

    }

    updateAllLabels (oSettings, classification = '') {
        for (let level = 0; level < 4; level++) {
            this.updateLabels(oSettings, level, classification);
        }
    }

    onWeaponChanceChange(e) {
        //TODO rewrite to use typeToTable
        let dataset = e.target.dataset;
        let value = e.target.value;
        let GeneralSettings = 'GeneralNPC_'+dataset.faction;
        let WeaponSettings = this.settings.weapon[GeneralSettings];
        WeaponSettings[dataset.classification][dataset.item][dataset.level] = value;

        this.updateLabels(WeaponSettings[dataset.classification], dataset.level, dataset.classification);
    }

    onGrenadeChanceChange (e) {
        let dataset = e.target.dataset;
        let value = e.target.value;
        this.settings.grenade.Default[dataset.item][dataset.attr][dataset.level] = value;
    }

    onArmorChanceChange(e) {
        let dataset = e.target.dataset;
        let value = e.target.value;
        let GeneralSettings = 'GeneralNPC_'+dataset.faction;
        let ArmorSettings = this.settings.armor[GeneralSettings];
        ArmorSettings[dataset.item][dataset.level] = value;

        this.updateLabels(ArmorSettings, dataset.level);
    }

    onPistolChanceChange(e) {
        let dataset = e.target.dataset;
        let value = e.target.value;
        let GeneralSettings = 'GeneralNPC_'+dataset.faction;
        let PistolSettings = this.settings.pistol[GeneralSettings];
        PistolSettings[dataset.item][dataset.level] = value;

        this.updateLabels(PistolSettings, dataset.level);
    }

    onHelmetChanceChange(e) {
        let dataset = e.target.dataset;
        let value = e.target.value;
        this.settings.helmet[dataset.item][dataset.level] = value;
    }

    onAmmoChanceChange(e){
        let dataset = e.target.dataset;
        let value = e.target.value;
        let AmmoSettings = this.settings.ammo[dataset.item];
        AmmoSettings[dataset.level] = value;
    }

    onAttributeChange(e) {
        let dataset = e.target.dataset;
        let value = e.target.value;
        this.typeToTable[dataset.type][dataset.item][dataset.attr] = value;
    }

    //TODO rewrite to use typeToTable
    fillChancesTable (oSettings, newRowReplace, tableType, classification = '') {
        // Create Bootstrap table structure
        let tableContainer = document.createElement('div');
        tableContainer.className = 'table-responsive mb-3';
        
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
        if ((this.currentCategory === 'Primary' || this.currentCategory === 'Armor') && this.currentFaction !== 'Generic_settings') {
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
            itemCell.innerHTML = `<strong>${item}</strong>`;
            itemCell.className = 'align-middle';
            row.appendChild(itemCell);
            
            // Check if it's an object with attributes or array of chances
            if (typeof oSettings[item] === 'object' && !Array.isArray(oSettings[item])) {
                // Handle objects with attributes (like grenades)
                for (let attr in oSettings[item]) {
                    let attrRow = document.createElement('tr');
                    attrRow.className = 'table-secondary';
                    
                    let attrCell = document.createElement('td');
                    attrCell.innerHTML = `&nbsp;&nbsp;${attr}`;
                    attrCell.className = 'align-middle ps-4';
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
                        
                        let label = document.createElement('small');
                        label.className = 'text-muted position-absolute top-0 end-0 me-1';
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
                        chanceCell.innerHTML = `<span class="badge bg-secondary">${chance}</span>`;
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
                        
                        let label = document.createElement('small');
                        label.className = 'text-muted position-absolute top-0 end-0 me-1';
                        label.id = `${classification}-${item}-chances-${index}_label`;
                        
                        chanceCell.appendChild(input);
                        chanceCell.appendChild(label);
                    }
                    
                    row.appendChild(chanceCell);
                });
                
                // Add delete button if needed
                if ((this.currentCategory === 'Primary' || this.currentCategory === 'Armor') && this.currentFaction !== 'Generic_settings' && item !== '') {
                    let actionsCell = document.createElement('td');
                    actionsCell.className = 'text-center';
                    
                    let deleteButton = document.createElement('button');
                    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
                    deleteButton.className = 'btn btn-danger btn-sm';
                    deleteButton.title = 'Delete';
                    
                    deleteButton.addEventListener('click', () => {
                        let GeneralSettings = 'GeneralNPC_'+this.currentFaction;
                        if (this.currentCategory === 'Primary') {
                            delete this.settings.weapon[GeneralSettings][classification][item];
                            this.updateAllLabels(this.settings.weapon[GeneralSettings][classification], classification);
                        } else if (this.currentCategory === 'Armor') {
                            delete this.settings.armor[GeneralSettings][item];
                            this.updateAllLabels(this.settings.armor[GeneralSettings]);
                        }
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
            addButtonContainer.className = 'd-flex justify-content-center mb-3';
            
            let addButton = document.createElement('button');
            addButton.className = 'btn btn-success btn-sm';
            addButton.innerHTML = '<i class="fas fa-plus me-1"></i>Add Item';
            addButton.addEventListener('click', () => {
                this.showAddSelection(tableContainer, tableType, classification);
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
                labelEl.innerHTML = thisAttr[0];
                
                let attrElement = null;
                if (thisAttr[1] === 'select') {
                    attrElement = document.createElement('select');
                    attrElement.className = 'form-select form-select-sm';
                    attrElement.dataset.type = type;
                    attrElement.dataset.to_item = item;
                    attrElement.dataset.to_attr = thisAttr[0];
                    let itemList = type==='armor'?thisAttr[0]=='helmet'?this.lists.helmet:this.lists.armor:this.lists.weapon; //bruh
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
                    attrElement.value = oAttr[thisAttr[0]];
                } else if (thisAttr[1] === 'checkbox') {
                    // Special handling for checkbox
                    let checkDiv = document.createElement('div');
                    checkDiv.className = 'form-check';
                    
                    attrElement = document.createElement('input');
                    attrElement.className = 'form-check-input';
                    attrElement.type = 'checkbox';
                    attrElement.checked = oAttr[thisAttr[0]];
                    attrElement.dataset.type = type;
                    attrElement.dataset.to_item = item;
                    attrElement.dataset.to_attr = thisAttr[0];
                    
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
                    attrElement.value = oAttr[thisAttr[0]];
                    attrElement.dataset.type = type;
                    attrElement.dataset.to_item = item;
                    attrElement.dataset.to_attr = thisAttr[0];
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
            cardHeader.innerHTML = `
                <h6 class="mb-0">
                    <button class="btn btn-link text-decoration-none p-0 text-start w-100" type="button" 
                            data-bs-toggle="collapse" data-bs-target="#collapse-${item.replace(/\s+/g, '-')}" 
                            aria-expanded="true" aria-controls="collapse-${item.replace(/\s+/g, '-')}">
                        ${item}
                        <i class="fas fa-chevron-down float-end"></i>
                    </button>
                </h6>
            `;
            
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