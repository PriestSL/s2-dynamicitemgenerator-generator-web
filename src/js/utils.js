export const deepCopy = (obj) => {
    return JSON.parse(JSON.stringify(obj));
}

export const showFreezeDiv = () => {
    const freezeDiv = document.createElement('div');
    freezeDiv.classList.add('freezeDiv');
    document.body.appendChild(freezeDiv);
}

export const hideFreezeDiv = () => {
    const freezeDiv = document.querySelector('.freezeDiv');
    if (freezeDiv) {
        document.body.removeChild(freezeDiv);
    }
}

export const objCompare = (obj1, obj2) => {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}