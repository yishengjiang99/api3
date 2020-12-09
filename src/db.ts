import Axios, { AxiosResponse } from "axios";
import { spawn } from "child_process";
import { Readable } from "stream";
import { Transform } from "stream";
let conn;

export async function db_connect() {
	conn =
		conn ||
		(await new Promise((resolve, reject) => {
			const { stdout, stdin, stderr } = spawn("mysql", [
				"-u",
				process.env.db_user,
				`-p`,
				"-h",
				process.env.db_host || "127.0.0.1",
				"grepawk",
				"--batch",
			]);
			stderr.on("data", (d) => reject(new Error(d.toString())));

			stdout.once("data", (d) => {
				if (d.toString().trim() === "Enter password:") {
					stdin.write(process.env.db_password);
				}
				stdout.on("data", (d) => {
					resolve({
						stdout,
						stderr,
						stdin,
					});
				});
			});
		}));
	return conn;
}
export function dbQuery(sql: string = "", args = []): Promise<Readable> {
	while (args && sql.includes("?")) {
		sql = sql.replace(" ? ", args[0]) && args.shift();
	}
	return db_connect().then(({ stdin, stdout, stderr }) => {
		let cols = null,
			rows = [];
		const tab = Buffer.from("\t");
		const rt = new Transform({
			objectMode: true,
			transform: (chunk, _, cb) => {
				if (!cols) {
					cols = chunk.split(tab);
					cb(null, null);
					return;
				}
				const row = chunk.split(tab);
				cb(
					null,
					cols.reduce((obj, c, i) => {
						obj[c] = rows[i];
					}, {})
				);
			},
		});
		stdout.pipe(rt);
		stdin.write(sql);
		return rt;
	});
}

export async function dbRow(sql: string, args = []) {
	return dbQuery(sql, args);
}

export async function dbUpsert(
	table: any,
	obj: { [s: string]: unknown } | ArrayLike<unknown>,
	uniqueKeys: string | string[]
) {
	const sql = `insert into ${table} (${Object.keys(obj).join(",")})
  values (${Object.values(obj)
		.map((v) => `'${v}'`)
		.join(",")}) 
  on duplicate key update ${Object.keys(obj)
		.filter((k) => uniqueKeys.indexOf(k) < 0)
		.map((k) => {
			return ` ${k}='${obj[k]}' `;
		})
		.join(",")}`;
	try {
await dbQuery(sql);
	} catch (e) {
		console.error(e);
	}
}

export async function dbInsert(
	table: string,
	obj: { [s: string]: unknown } | ArrayLike<unknown>
) {
	const sql = `insert into ${table} (${Object.keys(obj).join(",")})
  values (${Object.values(obj)
		.map((v) => `'${v}'`)
		.join(",")})`;
	const result = await dbQuery(sql).catch((err) => console.error(err));
	console.log(result);
	return result;
}
export async function dbMeta(name = "") {
	if (name !== "") return dbQuery("desc ?", [name]); //.catch(console.error);
	return dbQuery("show tables", []);
}

export const genUserName = () => {
	require("fs")
		.readSync("usernames.txt")
		.toString()
		.split("\n")
		.map((n: string) => n.trim())
		.map((name: any) =>
			require("./src/db").dbInsert("available_usernames", {
				username: name,
				taken: 0,
			})
		);
};

export async function getOrCreateUser(username: string) {
	return {};
	// let user = await dbRow("SELECT * from user where username = ? limit 1", [
	// 	username,
	// ]);
	// if (!user) {
	// 	const newuser = await dbRow(
	// 		"select username from available_usernames where taken=0 limit 1"
	// 	);
	// 	await dbQuery("update available_usernames set taken=1 where username=?", [
	// 		newuser.username,
	// 	]);
	// 	user = await dbInsert("user", {
	// 		username: newuser.username,
	// 	});
	// }
	// return user;
}

export const hashCheckAuthLogin = async (username: any) => {
	return require("exec").exec(
		`md5 -s '${username}${process.env.secret_md5_salt || "welcome"}'`,
		(err: any, stdout: { toString: () => any }, stderr: any) => {
			if (err) throw err;
			return stdout.toString();
		}
	);
};

export const userFiles = async (user: { id: any }) =>
	await dbQuery(
		`select f.*, m.meta as meta 
from user u 
  left join files f on u.id=f.user_id 
  left join file_meta m on f.id=m.file_id
  where u.id=?`,
		[user.id]
	).catch((e) => {
		console.error(e);
	});
export const insertVid = (id: any, title: any, description: any) => {
	dbInsert("ytvid", {
		title,
		id,
		description,
	})
		.then(console.log)
		.catch(console.error);
};

export const insertYtResp = (items: any[]) => {
	items.forEach(
		(item: {
			id: { videoId: any };
			snippet: { title: any; description: any };
		}) =>
			insertVid(item.id.videoId, item.snippet.title, item.snippet.description)
	);
};

export function queryYtWithDb(query: any, cb: any) {}

export const queryYt = (query: string, count: any, cb?: (arg0: any) => any) => {
	const youtube_api_key = process.env.google_key;
	const url =
		`https://www.googleapis.com/youtube/v3/search?type=video` +
		`&part=snippet&maxResults=${count}&q=${query}&key=${youtube_api_key}`;
	Axios.get(url)
		.then(function (resp: AxiosResponse) {
			return resp.data.items;
		})
		.then((items) => {
			cb && cb(items);
			insertYtResp(items);
		})
		.catch((err) => {
			console.error(err);
			return [];
		});
};

//export default reactRuntime;
