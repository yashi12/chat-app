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


module.exports = {
    generateMessage:generateMessage,
    // generateLocationMessage:generateLocationMessage,
    generateOldMessage:generateOldMessage
}