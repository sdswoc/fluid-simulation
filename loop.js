var kunaltriangle =function(){
	console.log("this is working");

	var canvas= document.getElementByid("kunal");
	var gl=canvas.getContext("webgl");
	if(!gl){
		console.log("webgl not supported");
		gl=canvas.getContext("abx webgl");

	}

	if(!gl){
		alert("not working buddy");

	}


	gl.clearColor(0.75, 0.85, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

};