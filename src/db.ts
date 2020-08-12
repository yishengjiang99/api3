import {
	createPool,
	Connection,
	createConnection,
	execute,
} from "mysql2/promise";
import Axios, { AxiosResponse } from "axios";
import { response } from "express";
// let pool = createPool({
//   host: "localhost",
//   user: process.env.db_user,
//   password: process.env.db_password,
//   database: "grepawk",
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

async function conn(): Connection {
	return await createConnection({
		host: "localhost",
		user: process.env.db_user,
		password: process.env.db_password,
		database: "grepawk",
		port: 3307,
	});
}

export async function dbQuery(sql, args = []) {
	const c = await conn();
	const [results, fields] = await c
		.query(sql, args)
		.catch((e) => {
			console.error(sql, args, e);
		})
		.finally(() => c.close());
	//  c.close();
	return results;
}
export async function dbRow(sql, args = []) {
	const results = await dbQuery(sql, args);

	if (results[0]) return results[0];
	else return false;
}

export async function dbUpsert(table, obj, uniqueKeys) {
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
		const { insertId } = await dbQuery(sql);
		return insertId;
	} catch (e) {
		console.error(e);
	}
}

export async function dbInsert(table, obj) {
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
		.map((n) => n.trim())
		.map((name) =>
			require("./src/db").dbInsert("available_usernames", {
				username: name,
				taken: 0,
			})
		);
};

export async function getOrCreateUser(username) {
	let user = await dbRow("SELECT * from user where username = ? limit 1", [
		username,
	]);
	if (!user) {
		const newuser = await dbRow(
			"select username from available_usernames where taken=0 limit 1"
		);
		await dbQuery("update available_usernames set taken=1 where username=?", [
			newuser.username,
		]);
		user = await dbInsert("user", {
			username: newuser.username,
		});
	}
	return user;
}

export const hashCheckAuthLogin = async (username) => {
	return require("exec").exec(
		`md5 -s '${username}${process.env.secret_md5_salt || "welcome"}'`,
		(err, stdout, stderr) => {
			if (err) throw err;
			return stdout.toString();
		}
	);
};

export const userFiles = async (user) =>
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
export const insertVid = (id, title, description) => {
	dbInsert("ytvid", {
		title,
		id,
		description,
	})
		.then(console.log)
		.catch(console.error);
};

export const insertYtResp = (items) => {
	items.forEach((item) =>
		insertVid(item.id.videoId, item.snippet.title, item.snippet.description)
	);
};

export const queryYt = (query, cb?) => {
	const youtube_api_key = process.env.google_key;
	const url =
		`https://www.googleapis.com/youtube/v3/search?type=video` +
		`&part=snippet&maxResults=10&q=${query}&key=${youtube_api_key}`;
	Axios.get(url)
		.then(function (resp: AxiosResponse) {
			return resp.data.items;
		})
		.then((items) => {
			cb && cb(items);
			insertYtResp(items);
		})
		.catch(console.error);
};

//export default reactRuntime;
