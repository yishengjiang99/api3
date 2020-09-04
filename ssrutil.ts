function httpsGetSync(url) {
    const content = execSync(`curl '${url}'`);
    return content;
}

function file_get_contents(filename) {
    if (!filename) return "";
    fscache[filename] = fscache[filename]
        || (filename.startsWith("http") && httpsGetSync(filename)) ||
        readFileSync(resolve("views", filename)).toString();
    return fscache[filename];
};