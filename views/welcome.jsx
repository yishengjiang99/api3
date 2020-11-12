import React from "react";

export default function ({ host, access_token }) {
	return (
		<>
			<h1>welcome</h1>
			{!access_token ? <button>'hello'</button> : null}
		</>
	);
}
