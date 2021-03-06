function PanoramaEarth(viewerId, imgday, imgnight) {
	var gl = null;
	var myCanvas = document.getElementById(viewerId);
	var vertexShaderObject = null;
	var fragmentShaderObject = null;
	var programObject = null;
	var v4PositionIndex;
	var vsh =
		'precision mediump float;\n' +
		'attribute vec4 position;\n' +
		'varying vec2 screenCoordinate;\n' +
		'uniform float ratiox;\n' +
		'uniform float ratioy;\n' +
		'void main() {\n' +
		'    gl_Position = position;\n' +
		'    screenCoordinate =  vec2(position.x*ratiox, position.y*ratioy);\n' +
		'}';
	var fsh =
		'precision mediump float;\n' +
		'varying vec2 screenCoordinate;\n' +
		'uniform sampler2D dayTexture;\n' +
		'uniform sampler2D nightTexture;\n' +
		'uniform mat3 rot;\n' +
		'uniform vec3 sun;\n' +
		'void main() {\n' +
		'    vec2 d = screenCoordinate.yx;\n' +
		'    float l = length(d);\n' +
		'    float m = 1.0 - 2.0 * l * l;\n' +
		'    if (m < 0.0) discard;\n' +
		'    vec3 v = rot * vec3(sqrt(m), d*1.414214);\n' +
		'    float t = dot(v, sun);\n' +
		'    vec2 coord = vec2(atan(v.z, v.x)*0.1591549+0.5, -atan(v.y, length(v.zx))*0.3183099+0.5);\n' +
		'    vec3 dayColor = texture2D(dayTexture, coord).rgb;\n' +
		'    vec3 nightColor = texture2D(nightTexture, coord).rgb;\n' +
		'    if (t >= 0.1) gl_FragColor = vec4(sqrt(dayColor*dayColor*(0.1+t)), 1.0);\n' +
		'    else if (t <= 0.0) gl_FragColor = vec4(nightColor, 1.0);\n' +
		'    else gl_FragColor = vec4(sqrt(dayColor*dayColor*2.0*t+nightColor*nightColor*(1.0-10.0*t)), 1.0);\n' +
		'}';
	
	var myObj = {};
	
	webglInit();
	shaderInit(vsh, fsh);
	programInit();
	createTexture(imgday, imgnight);
	
	var alpha = 0.524;  // z rotate
	var beta = 0;  // y rotate
	var speedA = 0;  // alpha speed
	var speedB = -0.001;  // beta speed
	var hold = false;  // mouse down or touch
	var lastx = 0, lasty = 0, nowx = 0, nowy = 0;  // position
	var time = 0;  // timestamp
	var idt;  // touch identifier
	var sunDirection = [0.0, 0.0, 0.0];  // sun Direction
	getDirection();
	var itv = setInterval(getDirection, 60000);
	
	var oldmousedown;
	var oldmousemove;
	var oldmouseup;
	
	function getDirection() {
		var myDate = new Date();
		var t = myDate.getTime() / 86400000;
		var d = (t-Math.floor(t)) * 6.283185;
		t = t / 365.2422;
		t = t - Math.floor(t) - 0.4722; //summer
		sunDirection[1] = 0.3977 * Math.cos(t*6.283185);
		r = Math.sqrt(1-sunDirection[1]*sunDirection[1]);
		sunDirection[0] = -r * Math.cos(d);
		sunDirection[2] = r * Math.sin(d);
	}
	
	function webglInit() {
		gl = myCanvas.getContext('webgl');
		if (gl == null) alert('Your browser does not support WebGL!');
	}
	
	function shaderInit(vsh, fsh) {
		vertexShaderObject = gl.createShader(gl.VERTEX_SHADER);
		fragmentShaderObject = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(vertexShaderObject, vsh);
		gl.shaderSource(fragmentShaderObject, fsh);
		gl.compileShader(vertexShaderObject);
		gl.compileShader(fragmentShaderObject);
		if (!gl.getShaderParameter(vertexShaderObject, gl.COMPILE_STATUS)) {
			var info = gl.getShaderInfoLog(vertexShaderObject);
			throw 'Could not compile vertex shader.\n' + info;
		}
		if (!gl.getShaderParameter(fragmentShaderObject, gl.COMPILE_STATUS)) {
			var info = gl.getShaderInfoLog(fragmentShaderObject);
			throw 'Could not compile fragment shader.\n' + info;
		}
	}
	
	function programInit() {
		programObject = gl.createProgram();
		gl.attachShader(programObject, vertexShaderObject);
		gl.attachShader(programObject, fragmentShaderObject);
		gl.bindAttribLocation(programObject, v4PositionIndex, 'position');
		gl.linkProgram(programObject);
		if (!gl.getProgramParameter(programObject, gl.LINK_STATUS)) {
			var info = gl.getProgramInfoLog(programObject);
			throw 'Could not link program.\n' + info;
		}
		gl.useProgram(programObject);
	}
	
	function createTexture(imgday, imgnight) {
		gl.activeTexture(gl.TEXTURE0);
		var texture0 = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture0);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgday);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.activeTexture(gl.TEXTURE1);
		var texture1 = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture1);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgnight);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}
	
	function draw(timestamp) {
		var diag = Math.sqrt(myCanvas.width*myCanvas.width + myCanvas.height*myCanvas.height)
		gl.viewport(0, 0, myCanvas.width, myCanvas.height);
		gl.uniform1f(myObj.ratiox, myCanvas.width/diag);
		gl.uniform1f(myObj.ratioy, myCanvas.height/diag);
		var dt = (timestamp-time) * 0.001;
		time = timestamp;
		if (hold) {
			beta += speedB = (lastx-nowx)/diag*3.141593;
			alpha += speedA = (nowy-lasty)/diag*3.141593;
			speedA /= dt;
			speedB /= dt;
			lastx = nowx;
			lasty = nowy;
		} else {
				alpha += speedA * dt;
				speedA *= Math.exp(-5*dt);
				beta += speedB * dt;
				speedB = speedB==0 ? 0 : speedB>0 ? 0.105+(speedB-0.105)*Math.exp(-5*dt) : -0.105+(speedB+0.105)*Math.exp(-5*dt);
		}
		alpha = alpha>1.570796 ? 1.570796 : alpha<-1.570796 ? -1.570796 : alpha;
		beta = beta>6.283185 ? beta-6.283185 : beta<0 ? beta+6.283185 : beta;
		var ca = Math.cos(alpha), sa = Math.sin(alpha), cb = Math.cos(beta), sb = Math.sin(beta);
		var rot =
			[ca*cb, sa, ca*sb,
			-sa*cb, ca,-sa*sb,
			-sb, 0, cb];
		gl.uniformMatrix3fv(myObj.matrix, false, rot);
		gl.uniform1i(myObj.texture0, 0);
		gl.uniform1i(myObj.texture1, 1);
		gl.uniform3fv(myObj.sun, sunDirection);
		gl.clearColor(0.0, 0.0, 0.0, 0.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		myObj.animation = requestAnimationFrame(draw);
	}
	
	function renderWebGL() {
		var vertices = 
			[1.0, 1.0,
			1.0, -1.0,
			-1.0, 1.0,
			-1.0, -1.0];
		var buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		
		gl.enableVertexAttribArray(v4PositionIndex);
		gl.vertexAttribPointer(v4PositionIndex, 2, gl.FLOAT, false, 0, 0);
		
		myObj.ratiox = gl.getUniformLocation(programObject, "ratiox");
		myObj.ratioy = gl.getUniformLocation(programObject, "ratioy");
		myObj.matrix = gl.getUniformLocation(programObject, "rot");
		myObj.texture0 = gl.getUniformLocation(programObject, "dayTexture");
		myObj.texture1 = gl.getUniformLocation(programObject, "nightTexture");
		myObj.sun = gl.getUniformLocation(programObject, "sun");
		myObj.animation = requestAnimationFrame(draw);
		oldmousedown = myCanvas.onmousedown;
		oldmousemove = document.oldmousemove;
		oldmouseup = document.oldmouseup;
		myCanvas.onmousedown = function(e) {
			if (oldmousedown) oldmousedown(e);
			if (e.button == 0) {
				hold = true;
				nowx = lastx = e.clientX;
				nowy = lasty = e.clientY;
			}
		}
		document.onmousemove = function(e) {
			if (oldmousemove) oldmousemove(e);
			if (hold) {
				nowx = e.clientX;
				nowy = e.clientY;
			}
		}
		document.onmouseup = function(e) {
			if (oldmouseup) oldmouseup(e);
			if (e.button == 0) hold = false;
		}
		viewer.addEventListener('touchstart', ontouch, false);
		document.addEventListener('touchmove', ontouch, false);
		document.addEventListener('touchend', ontouch, false);
	}
	
	function ontouch (event){
		var e = event || window.event;
		switch (e.type) {
		case 'touchstart':
			if (e.touches.length==1) {
				hold = true;
				var touch = e.touches[0]
				nowx = lastx = touch.clientX;
				nowy = lasty = touch.clientY;
				idt = touch.identifier;
			}
			break;
		case 'touchmove':
			if (hold) {
				var touches = e.changedTouches;
				for (var i=0; i<touches.length; i++) {
					if (touches[i].identifier == idt) {
						nowx = touches[i].clientX;
						nowy = touches[i].clientY;
					}
				}
			}
			break;
		case 'touchend':
			if (hold) {
				var touches = e.changedTouches;
				for (var i=0; i<touches.length; i++){
					if (touches[i].identifier == idt) {
						hold = false;
					}
				}
			}
			break;
		}
	}
	
	var my = {};
	my.start = function() {
		renderWebGL();
	}
	my.stop = function() {
		cancelAnimationFrame(myObj.animation);
		clearInterval(itv);
		myCanvas.onmousedown = oldmousedown;
		document.onmousemove = oldmousemove;
		document.onmouseup = oldmouseup;
		viewer.removeEventListener('touchstart', ontouch, false);
		document.removeEventListener('touchmove', ontouch, false);
		document.removeEventListener('touchend', ontouch, false);
		gl.disableVertexAttribArray(v4PositionIndex);
	}
	return my;
}