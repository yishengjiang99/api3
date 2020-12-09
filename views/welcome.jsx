import React from "react";

export default function ({files}) {
	return (
		<>
			<h1>welcome</h1>
			
			<div style={{display:"grid",gridColumnTemplate:"1fr 4fr"}} data-reactroot="">
				<span><li>{files.map(f=><a src={f.link}>{f.display} {JSON.stringify(f)}</a>).join("")}</li></span>
				<div></div>
			</div>
			
		</>
	);
}
