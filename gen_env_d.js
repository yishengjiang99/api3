const { writeFileSync } = require("fs");
writeFileSync(
	"./env_d",
	Object.keys(process.env)
		.map((key) => key + "=" + process.env[key])
		.join("\n")
);
