const excludedFilterProperties = ["updatedAt", "createdAt", "className"];

const getFilterPropertyNames = function( obj ) {
    let props = [];

    do {
        Object.getOwnPropertyNames( obj ).forEach(function ( prop ) {
            if ( props.indexOf( prop ) === -1 ) {
                props.push( {name: prop, type: typeof obj[prop]} );
            }
        });
    } while ( obj = Object.getPrototypeOf( obj ) );

    return props.filter(prop=> !prop.name.startsWith("_") && !excludedFilterProperties.includes(prop.name) && (prop.type=='object'||prop.type=='string'||prop.type=='number'));
}

/**
 * recursively search through an object and include object if any of it's filterable properties contain text
 * @param item
 * @param text
 * @returns {*}
 */
const recursiveSearch = (item, text, _memory) => {

    let props = getFilterPropertyNames(item);
    let memory = _memory || [];

    for (let {name} of props) {
        if(typeof item[name] == 'object' && !memory.includes(item[name]) && memory.push(item[name]) && recursiveSearch(item[name], text, memory)) {
            return item;
        }else if(typeof item[name] == 'string' && item[name].includes(text)){
            return item;
        }else if(item[name] == text){
            return item;
        }
    }
}

/**
 * get a value from an object by a . delimited filedName
 * @param fieldName
 * @param record
 * @returns {string}
 */
const getValue = (fieldName, record) => {

    const path = fieldName.split(".");
    let key
    let value = record;

    for(let i = 0; i < path.length; i++){

        key = path[i];

        if(value[key]){
            value = value[key];
        }else{
            value = "";
        }
    }

    return value;
};

const isAlphanumeric=(input)=> {
    return /^[a-zA-Z0-9]+$/.test(input);
}

const isAlphanumericAndSpace=(input)=> {
    return /^[a-zA-Z0-9 ]+$/.test(input);
}

const isEthereumAddress=(address)=> {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

const generateRandomString=(length)=> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
    return result;
  }

const awaitTimeout = (delay, reason) =>
    new Promise((resolve, reject) =>
        setTimeout(
            () => {
                (reason === undefined ? resolve() : reject(reason));
            },
            delay
        )
    );

export {
    getValue,
    recursiveSearch,
    isAlphanumeric,
    isAlphanumericAndSpace,
    isEthereumAddress,
    generateRandomString,
    awaitTimeout
}
