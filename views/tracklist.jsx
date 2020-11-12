import React from "react";
import ReactDOMServer from "react-dom/server";
export default function ({ cwd, tracks, onClick }) {
	return (
		<div style={{ display: "grid", gridTemplateColumns: "1fr 4fr" }}>
			<div style={{ height: "90vh", overflowY: "scroll" }}>
				<span>{cwd}</span>
				<ul>
					{tracks.map((track, idx) => (
						<li key={idx}>
							<a target="right" href={track.href}>
								{track.name}
							</a>
						</li>
					))}
				</ul>
			</div>
			<div style={{ height: "90vh", overflowY: "scroll" }}>
				<iframe name="right"></iframe>
			</div>
		</div>
	);
}
