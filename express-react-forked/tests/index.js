const compiler = require("../compile");
const app = require("express")();
app.set("views", require("path").resolve(__dirname, 'views'));
app.set("view engine", "jsx");
app.engine("jsx", compiler());

const sleep = async (ms) => new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
})
app.get("/", async (req, res) => {
    let x = 5;
    res.render('section1', { count: x-- }, (err, html) => err && res.end(err.message) || res.write(html));
    await sleep(1000);
    res.render('section1', { count: x-- }, (err, html) => err && res.end(err.message) || res.write(html));
    await sleep(1000);
    res.render('section1', { count: x-- }, (err, html) => err && res.end(err.message) || res.write(html));
    await sleep(1000);
    res.render('section1', { count: x-- }, (err, html) => err && res.end(err.message) || res.write(html));
    await sleep(1000);
    res.render('cake', { count: x-- }, (err, html) => err && res.end(err.message) || res.end(html));
});

require("child_process").execSync("lsof -i tcp:3334 |grep LISTEN|awk '{print $2}' |xargs kill -9")
require("http").createServer(app).listen(3334);
