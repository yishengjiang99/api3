import React from "react";

export default function ({files}) {
	console.log(files);
	return (
		<>
			<h1>welcome</h1>
			
			<div style={{display:"grid",gridColumnTemplate:"1fr 4fr"}} data-reactroot="">
			<li>{
				files.map(f=>{
					return (<a href={f.file}>{f.display} </a>)
				})}</li>
		

				<div></div>
			</div>
			
		</>
	);
}
