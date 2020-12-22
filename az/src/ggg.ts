require("./list-blobs")
  .listContainerFiles("midi")
  .on("data", (file) => {
    require("child_process").exec(
      `php -R "echo file_get_contents('${file.url}')"`,
      (err, stdout) => {
        !err && console.log(stdout);
      }
    );
  });
