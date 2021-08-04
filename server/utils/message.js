const moment = require('moment');

let generateMessage = (from, text)=>{
    return {
        from,
        text,
        createdAt: moment().valueOf()
    };
};

let generateOldMessage = (from, text, createdAt)=>{
    return {
        from,
        text,
        createdAt: createdAt
    };
};

let generateError = (err)=>{
    return{
        err
    }
}

module.exports = {
    generateMessage:generateMessage,
    generateOldMessage:generateOldMessage,
    generateError:generateError
}