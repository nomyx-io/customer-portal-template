import React, { SVGProps } from "react";

const KronosSymbol = (props: SVGProps<SVGSVGElement>) => (
	<div style={{width: "19px", height: "19px"}}>
		<svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 38.9 40.4">
			<circle style={{fill: "rgba(80, 216, 144, 0.15"}} cx="19.4" cy="20.2" r="17.7" stroke="rgba(255, 255, 255, 0.15)" strokeWidth={3}/>
			<g>
				<path style={{fill: "rgba(220, 220, 220, 1)"}}
					  d="M2.8,19.2L22,0l3.5,3.5L10,19.2l9,9l-7.4-0.2L2.8,19.2z"/>
				<path style={{fill: "rgba(220, 220, 220, 1)"}}
					  d="M36.1,21.2L16.8,40.4l-3.5-3.5l15.5-15.7l-9-9l7.4,0.2L36.1,21.2z"/>
			</g>
		</svg>

	</div>
);

export default KronosSymbol;
