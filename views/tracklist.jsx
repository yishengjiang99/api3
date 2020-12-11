import React from "react";
import ReactDOMServer from "react-dom/server";
export default function ({ cwd, tracks, onClick }) {
	return (
		<div>
			<div class="fileList" style={{ overflowY: "scroll" }}>
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
			<main style={{  overflowY: "scroll" }}>
				<iframe name="right"></iframe>
			</main>
		</div>
	);
}
