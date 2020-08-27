const ssr = require("../ssr");
const chai = require("chai");
describe("onhttp", function () {
    it("respons 200 in header", function () {
        chai.request(onHttp).get("/")
            .end((err, res) => {
                console.log(res);
            })
    })
})