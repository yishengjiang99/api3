const { readFileSync, createReadStream } = require('fs');
const { resolve } = require("path")
const staticMocks = {
    '/me/top/tracks': 'top-tracks.json',
    '/me/playlists': 'me-playlists.json',
    '/me/player/recently-played': "recently-played.json",
    "/search": "search-track.json"
}
const staticRoot = resolve(__dirname, "../static/mock-data/");

const mockStdk = {
    fetchAPI: (uri) => {

        return JSON.parse(readFileSync(resolve(staticRoot, staticMocks[uri])));
    },
    fetchAPIPost: (uri) => { /* /dev/null */ }
}
module.exports = mockStdk;