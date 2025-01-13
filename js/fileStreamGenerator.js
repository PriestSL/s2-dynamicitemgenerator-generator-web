import { createLoadout } from './textGenerators.js';

const sendConfigToServer = (file) => {
    let xhr = new XMLHttpRequest();
    let url = new URL('http://127.0.0.1:8080/pack');
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify({file: file}));
    xhr.onload = function() {
        if (xhr.status != 200) {
            console.log(`Error ${xhr.status}: ${xhr.statusText}`);
        } else {
            console.log(`Done, got ${xhr.response.length} bytes`);
            let resp = JSON.parse(xhr.response);
            let link = document.createElement('a');
            link.href = 'data:application/octet-stream;base64,' + resp.file;
            link.download = 's2ArmorStrucGeneratorOutputWEBTEST.pak';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        }
    };
    xhr.onerror = function() {
        console.log("Request failed");
    }
};

export const generateConfig = async ()=>{
    let cArmorGenerators = "";
    let response = await createLoadout();
    if (response){
        cArmorGenerators = response;
    }


    

    sendConfigToServer(cArmorGenerators);
}

