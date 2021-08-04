let expect = require('expect');

var {generateMessage} = require('./message');

describe('Generate Message',()=>{
    it('should generate correct msg object',  ()=> {
        let from = "yashi",
            text= "some random text",
            message = generateMessage(from,text);

        expect(typeof message.createdAt).toBe('number');
        expect(message).toMatchObject({from, text});
    });
});
