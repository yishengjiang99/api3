const azfs = require('../dist/azfs');
const {randomBytes} = require('crypto');
function test(str, cb) {
    cb();
}
const log = (e) => console.log(e);
test("azfs fstat", async function () {
    azfs.getContainer("lobby", log);

    var f = await azfs.listFiles("lobby");
    azfs.touch("lobby/ch_members.json");

    azfs.file_put_content('lobby', 'compose_draft.json', 'abcd')
    var res = azfs.fstat('lobby', 'ch_members.json');
    console.log(res)


    azfs.file_put_content('qalobby', 'compose_draft.json', 'abcd');
    azfs.file_get_content("qalobby", "compose_draft.json", function (result) {
        expect(result).toEqual("abcd");
    });

    const filename = new Date().getUTCMilliseconds() + ".txt";
    await azfs.file_put_content("qalobby", filename, new Date().getUTCMilliseconds());
    console.log(filename);

    await azfs.file_get_content('lobby', filename, 'cdef', res => {
        console.log(res);
    });

})
