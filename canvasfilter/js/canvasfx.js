var canvasA , canvasB;
var ctxA , ctxB;

function setCanvasById(nameA, nameB) {
	canvasA = document.getElementById(nameA);
	ctxA = canvasA.getContext("2d");
	canvasB = document.getElementById(nameB);
	ctxB = canvasB.getContext("2d");
}

function applyEffect() {
	canvasA.width = canvasB.width;
	canvasA.height = canvasB.height;
	imgData = ctxB.getImageData(0, 0, canvasB.width, canvasB.height);
	ctxA.putImageData(imgData, 0, 0, 0, 0, canvasA.width, canvasA.height);
}

function noEffect() {
	canvasB.width = canvasA.width;
	canvasB.height = canvasA.height;
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
	ctxB.putImageData(imgData, 0, 0, 0, 0, canvasB.width, canvasB.height);
}


function resizeEffect(width, height, gamma=2.2) {
	canvasB.width = width
	canvasB.height = height
	var imgDataA = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
	var pxDataA = imgDataA.data;
	var imgDataB = ctxB.getImageData(0, 0, canvasB.width, canvasB.height);
	var pxDataB = imgDataB.data;
	var tmpPxArr = [];
	var originW = canvasA.width, originH = canvasA.height;
	var ratioW = originW/width, ratioH = originH/height
	
	for (var i = 0; i < originH; i++)
		for (var j = 0; j < originW; j++) {
			var p = i*originW + j<<2;
			tmpPxArr[p|3] = pxDataA[p|3] / 255;
			tmpPxArr[p] = Math.exp(Math.log(pxDataA[p]/255) * gamma) * tmpPxArr[p|3];
			tmpPxArr[p|1] = Math.exp(Math.log(pxDataA[p|1]/255) * gamma) * tmpPxArr[p|3];
			tmpPxArr[p|2] = Math.exp(Math.log(pxDataA[p|2]/255) * gamma) * tmpPxArr[p|3];
		}
	
	gamma = 1 / gamma;
	
	for (var i = 0; i < height; i++)
		for (var j = 0; j < width; j++) {
			var lowH = i*ratioH, upH = i+1<height ? (i+1)*ratioH : originH;
			var lowW = j*ratioW, upW = j+1<width ? (j+1)*ratioW : originW;
			var totalR = 0, totalG = 0, totalB = 0, totalA = 0;
			
			for (var x = Math.floor(lowH); x < upH; x++)
				for (var y = Math.floor(lowW); y < upW; y++) {
					var a = 1, b = 1, pp = x*originW + y<<2;
					if (lowH > x) a -= lowH-x;
					if (x+1 > upH) a -= x+1-upH;
					if (lowW > y) b -= lowW-y;
					if (y+1 > upW) b -= y+1-upW;
					var w = a*b;
					totalR += w*tmpPxArr[pp];
					totalG += w*tmpPxArr[pp|1];
					totalB += w*tmpPxArr[pp|2];
					totalA += w*tmpPxArr[pp|3];
				}
			
			var p = i*width + j<<2;
			totalA += 0.00000001;
			pxDataB[p] = Math.exp(Math.log(totalR/totalA) * gamma) * 255;
			pxDataB[p|1] = Math.exp(Math.log(totalG/totalA) * gamma) * 255;
			pxDataB[p|2] = Math.exp(Math.log(totalB/totalA) * gamma) * 255;
			pxDataB[p|3] = (totalA-0.00000001) / ratioH / ratioW * 255;
		}
	
	ctxB.putImageData(imgDataB, 0, 0, 0, 0, width, height);
}

function greyEffect(type=0) {
	canvasB.width = canvasA.width;
	canvasB.height = canvasA.height;
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
	var pxData = imgData.data;
	var fullH = canvasB.height, fullW = canvasB.width;
	var fullS = fullH*fullW;
	
	for (var i = 0; i < fullS; i++) {
		var r = pxData[i<<2];
		var g = pxData[i<<2|1];
		var b = pxData[i<<2|2];
		pxData[i<<2] = pxData[i<<2|1] = pxData[i<<2|2] = type == 0 ? r*38 + g*75 + b*15 >> 7 : (r + g + b) /3;
	}

	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH);
}



function hslEffect(degreeH=0, percentS=0, percentL=0) {
	function hue2rgb(p, q, t) {
		t -= Math.floor(t);
		if (t < 1/6) return p + (q - p) * 6 * t;
		if (t < 0.5) return q;
		if (t < 2/3) return p + (q - p) * (4 - 6 * t);
		return p;
	}
	function hslToRgb(h, s, l) {
		var r, g, b;
		if (s == 0) {
			r = g = b = l;  // achromatic
		} else {
			if (s > 1) s = 1;
			var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			var p = 2 * l - q;
			r = hue2rgb(p, q, h + 1/3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1/3);
		}
		return [r*255, g*255, b*255];
	}
	function rgbToHsl(r, g, b) {
		r /= 255, g /= 255, b /= 255;
		var max = Math.max(r, g, b), min = Math.min(r, g, b);
		var h, s, l = (max+min) * 0.5;
		if (max == min) {
			h = s = 0;  // achromatic
		} else {
			var d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch(max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4;
			}
			h /= 6;
		}
		return [h, s, l];
	}
	
	canvasB.width = canvasA.width;
	canvasB.height = canvasA.height;
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
	var pxData = imgData.data;
	var fullH = canvasB.height, fullW = canvasB.width;
	var fullS = fullH*fullW;
	degreeH /= 360;
	var ratio = (100 + percentS) * 0.01;
	var power = Math.exp(-percentL * 0.01) ;
	
	for (var i = 0; i < fullS; i++) {
		var r = pxData[i<<2];
		var g = pxData[i<<2|1];
		var b = pxData[i<<2|2];
		var arr = rgbToHsl(r, g, b);
		arr = hslToRgb(arr[0] + degreeH, arr[1] *= ratio, Math.exp(Math.log(arr[2]) * power));
		pxData[i<<2] = arr[0];
		pxData[i<<2|1] = arr[1];
		pxData[i<<2|2] = arr[2];
	}

	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH);
}

function motionHarrisEffect(length, degree, mask=0, centerX=0.5, centerY=0.5) {  // Harris shutter
	canvasB.width = canvasA.width;
	canvasB.height = canvasA.height;
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
	var pxData = imgData.data;
	var pxArr = [];
	
	var fullH = canvasB.height, fullW = canvasB.width;
	var halfH = (fullH-1)*0.5, halfW = (fullW-1)*0.5;
	var halfH_Re = 1 / halfH, halfW_Re = 1 / halfW;
	var halfD_Re = 1 / Math.sqrt(halfW*halfW + halfH*halfH);
	degree -= 90;
	var ratioX = Math.cos(degree/180*Math.PI), ratioY = Math.sin(degree/180*Math.PI);
	if (typeof(centerX) == "undefined") centerX = halfW;
	else centerX *= fullW - 1;
	if (typeof(centerY) == "undefined") centerY = halfH;
	else centerY *= fullH - 1;
	
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var p = i*fullW + j<<2;
			pxArr[p|3] = pxData[p|3] / 255;
			pxArr[p] = Math.exp(Math.log(pxData[p]/255)*2.2) * pxArr[p|3];
			pxArr[p|1] = Math.exp(Math.log(pxData[p|1]/255)*2.2) * pxArr[p|3];
			pxArr[p|2] = Math.exp(Math.log(pxData[p|2]/255)*2.2) * pxArr[p|3];
		}
	
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var motion = [], ratio;
			switch(mask) {
			case 0: ratio = 1; break;  // none;
			case 1: ratio = Math.sqrt((i-centerY)*(i-centerY)+(j-centerX)*(j-centerX))*halfD_Re; break;  // round
			case 2: ratio = Math.abs(i-centerY)*halfH_Re; break;  // horizontal
			case 3: ratio = Math.abs(j-centerX)*halfW_Re;  // vertical
			}
			motion[0] = -length * ratio;
			motion[1] = 0;
			motion[2] = -motion[0];
			var tmpRGB = [], tmpA = [];
			for (var k = 0; k < 3; k++) {
				tmpRGB[k] = 0, tmpA[k] = 0;
				var x = i + motion[k]*ratioX, y = j + motion[k]*ratioY;
				
				if (x > fullH-1 || x < 0) {
					var m;
					if (x > fullH-1) {
						m = (fullH-1-i)/ratioX;
						x = fullH-1;
					} else {
						m = -i/ratioX;
						x = 0;
					}
					y = j + m*ratioY;
				}
				if (y > fullW-1 || y < 0) {
					var m ;
					if (y > fullW-1) {
						m = (fullW-1-j)/ratioY;
						y = fullW-1;
					} else {
						m = -j/ratioY;
						y = 0;
					}
					x = i + m*ratioX;
				}
				
				var x_ = x == fullH-1 ? x-1 : Math.floor(x);
				var y_ = y == fullW-1 ? y-1 : Math.floor(y);
				var kx0=x-x_, kx1=1-kx0, ky0=y-y_, ky1=1-ky0;

				tmpRGB[k] += pxArr[x_*fullW + y_<<2|k]*kx1*ky1 + pxArr[x_*fullW + y_+1<<2|k]*kx1*ky0;
				tmpRGB[k] += pxArr[(x_+1)*fullW + y_<<2|k]*kx0*ky1 + pxArr[(x_+1)*fullW + y_+1<<2|k]*kx0*ky0;
				tmpA[k] += pxArr[x_*fullW + y_<<2|3]*kx1*ky1 + pxArr[x_*fullW + y_+1<<2|3]*kx1*ky0;
				tmpA[k] += pxArr[(x_+1)*fullW + y_<<2|3]*kx0*ky1 + pxArr[(x_+1)*fullW + y_+1<<2|3]*kx0*ky0;
			}
			
			var p = i*fullW + j<<2;
			pxData[p] = Math.exp(Math.log(tmpRGB[0]/(tmpA[0]+0.00000001))*0.455) * 255;
			pxData[p|1] = Math.exp(Math.log(tmpRGB[1]/(tmpA[1]+0.00000001))*0.455) * 255;
			pxData[p|2] = Math.exp(Math.log(tmpRGB[2]/(tmpA[2]+0.00000001))*0.455) * 255;
			pxData[p|3] = (tmpA[0]+tmpA[1]+tmpA[2])/3 * 255;
		}

	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH);
}

function zoomHarrisEffect(strength, centerX=0.5, centerY=0.5) {  // Harris camera
	canvasB.width = canvasA.width;
	canvasB.height = canvasA.height;
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
	var pxData = imgData.data;
	var pxArr = [];
	var fullH = canvasB.height, fullW = canvasB.width;
	var halfH = (fullH-1)*0.5, halfW = (fullW-1)*0.5;
	if (typeof(centerX) == "undefined") centerX = halfW;
	else centerX *= fullW - 1;
	if (typeof(centerY) == "undefined") centerY = halfH;
	else centerY *= fullH - 1;
	
	var ratio = [];
	ratio[0] = (10+strength) * 0.1;
	ratio[1] = 1;
	ratio[2] = (10-strength) * 0.1;
	
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var p = i*fullW + j<<2;
			pxArr[p|3] = pxData[p|3] / 255;
			pxArr[p] = Math.exp(Math.log(pxData[p]/255)*2.2) * pxArr[p|3];
			pxArr[p|1] = Math.exp(Math.log(pxData[p|1]/255)*2.2) * pxArr[p|3];
			pxArr[p|2] = Math.exp(Math.log(pxData[p|2]/255)*2.2) * pxArr[p|3];
		}
	
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var tmpRGB = [], tmpA = [];
			for (var k = 0; k < 3; k++) {
				tmpRGB[k] = 0, tmpA[k] = 0;
				var x = centerY + (i-centerY)*ratio[k], y = centerX + (j-centerX)*ratio[k];
				
				if (x > fullH-1 || x < 0) {
					var r;
					if (x > fullH-1) {
						r = (fullH-1-centerY)/(i-centerY);
						x = fullH-1;
					} else {
						r = centerY/(centerY-i);
						x = 0;
					}
					y = centerX + (j-centerX)*r;
				}
				if (y > fullW-1 || y < 0) {
					var r ;
					if (y > fullW-1) {
						r = (fullW-1-centerX)/(j-centerX);
						y = fullW-1;
					} else {
						r = centerX/(centerX-j);
						y = 0;
					}
					x = centerY + (i-centerY)*r;
				}
				
				var x_ = x == fullH-1 ? x-1 : Math.floor(x);
				var y_ = y == fullW-1 ? y-1 : Math.floor(y);
				var kx0=x-x_, kx1=1-kx0, ky0=y-y_, ky1=1-ky0;

				tmpRGB[k] += pxArr[x_*fullW + y_<<2|k]*kx1*ky1 + pxArr[x_*fullW + y_+1<<2|k]*kx1*ky0;
				tmpRGB[k] += pxArr[(x_+1)*fullW + y_<<2|k]*kx0*ky1 + pxArr[(x_+1)*fullW + y_+1<<2|k]*kx0*ky0;
				tmpA[k] += pxArr[x_*fullW + y_<<2|3]*kx1*ky1 + pxArr[x_*fullW + y_+1<<2|3]*kx1*ky0;
				tmpA[k] += pxArr[(x_+1)*fullW + y_<<2|3]*kx0*ky1 + pxArr[(x_+1)*fullW + y_+1<<2|3]*kx0*ky0;
			}
			
			var p = i*fullW + j<<2;
			pxData[p] = Math.exp(Math.log(tmpRGB[0]/(tmpA[0]+0.00000001))*0.455) * 255;
			pxData[p|1] = Math.exp(Math.log(tmpRGB[1]/(tmpA[1]+0.00000001))*0.455) * 255;
			pxData[p|2] = Math.exp(Math.log(tmpRGB[2]/(tmpA[2]+0.00000001))*0.455) * 255;
			pxData[p|3] = (tmpA[0]+tmpA[1]+tmpA[2])/3 * 255;
		}

	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH);
}

function distortionEffect(strength) {  // recommend strength from -0.5 to 0.5
	canvasB.width = canvasA.width;
	canvasB.height = canvasA.height;
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
	var pxData = imgData.data;
	var pxArr = [];
	var fullH = canvasB.height, fullW = canvasB.width;
	var halfH = (fullH-1)*0.5, halfW = (fullW-1)*0.5;
	var halfD_Re = 1 / Math.sqrt(halfW*halfW + halfH*halfH);

	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var p = i*fullW + j<<2;
			pxArr[p|3] = pxData[p|3] / 255;
			pxArr[p] = Math.exp(Math.log(pxData[p]/255)*2.2) * pxArr[p|3];
			pxArr[p|1] = Math.exp(Math.log(pxData[p|1]/255)*2.2) * pxArr[p|3];
			pxArr[p|2] = Math.exp(Math.log(pxData[p|2]/255)*2.2) * pxArr[p|3];
		}
	
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var percent = Math.sqrt((i-halfH)*(i-halfH)+(j-halfW)*(j-halfW))*halfD_Re;
			var ratio = strength < 0 ? (1-percent)+Math.exp(strength)*(percent) : (percent)+Math.exp(-strength)*(1-percent);
			var tmpRGBA = [0, 0, 0, 0];
			var x = halfH + (i-halfH)*ratio, y = halfW + (j-halfW)*ratio;
			
			var x_ = x == fullH-1 ? x-1 : Math.floor(x);
			var y_ = y == fullW-1 ? y-1 : Math.floor(y);
			var kx0=x-x_, kx1=1-kx0, ky0=y-y_, ky1=1-ky0;
			for (var k = 0; k < 4; k++) {
				tmpRGBA[k] += pxArr[x_*fullW + y_<<2|k]*kx1*ky1 + pxArr[x_*fullW + y_+1<<2|k]*kx1*ky0;
				tmpRGBA[k] += pxArr[(x_+1)*fullW + y_<<2|k]*kx0*ky1 + pxArr[(x_+1)*fullW + y_+1<<2|k]*kx0*ky0;
			}
			
			var p = i*fullW + j<<2;
			tmpRGBA[3] += 0.00000001;
			pxData[p] = Math.exp(Math.log(tmpRGBA[0]/(tmpRGBA[3]))*0.455) * 255;
			pxData[p|1] = Math.exp(Math.log(tmpRGBA[1]/(tmpRGBA[3]))*0.455) * 255;
			pxData[p|2] = Math.exp(Math.log(tmpRGBA[2]/(tmpRGBA[3]))*0.455) * 255;
			pxData[p|3] = (tmpRGBA[3]-0.00000001) * 255;
		}
		
	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH);
}

function normalBlurEffect(radius, gamma=2.2, mask=0, type=0, centerX=0.5, centerY=0.5) {  // type : 0 boxy, 1 triangular, 2 gaussian
	canvasB.width = canvasA.width;
	canvasB.height = canvasA.height;
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
	var pxData = imgData.data;
	var tmpPxArr = [], pxArr = [], rArr=[];
	var fullH = canvasB.height, fullW = canvasB.width;
	var halfH = (fullH-1)*0.5, halfW = (fullW-1)*0.5;
	var halfH_Re = 1 / halfH, halfW_Re = 1 / halfW;
	var halfD_Re = 1 / Math.sqrt(halfW*halfW + halfH*halfH);
	if (typeof(centerX) == "undefined") centerX = halfW;
	else centerX *= fullW - 1;
	if (typeof(centerY) == "undefined") centerY = halfH;
	else centerY *= fullH - 1;
	
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var p = i*fullW + j;
			var ratio = 0;
			switch(mask) {
			case 0: ratio = 1; break;  // none
			case 1: ratio = Math.sqrt((i-centerY)*(i-centerY)+(j-centerX)*(j-centerX))*halfD_Re; break;  // round
			case 2: ratio = Math.abs(i-centerY)*halfH_Re; break;  // horizontal
			case 3: ratio = Math.abs(j-centerX)*halfW_Re;  // vertical
			}
			rArr[p]= radius * ratio + 1;
			p = p << 2;
			pxArr[p|3] = pxData[p|3] / 255;
			pxArr[p] = Math.exp(Math.log(pxData[p]/255)*gamma) * pxArr[p|3];
			pxArr[p|1] = Math.exp(Math.log(pxData[p|1]/255)*gamma) * pxArr[p|3];
			pxArr[p|2] = Math.exp(Math.log(pxData[p|2]/255)*gamma) * pxArr[p|3];
		}
	
	gamma = 1 / gamma;
	
	// 1st step : vertical blur
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var p = i*fullW + j;
			var blurR = rArr[p];
			p = p << 2;
			var blurR_ = Math.floor(blurR);
			var sigma = blurR * 0.333;
			var sigma2 = 0.5 / (sigma * sigma);
			var totalW = 0, totalR = 0, totalG = 0, totalB = 0, totalA = 0;
			var xbegin = i-blurR_>=0 ? -blurR_ : -i, xend = i+blurR_<fullH ? blurR_ : fullH-i-1;
			for (var dx = xbegin; dx <= xend; dx++) {
				var x = i + dx, wt;
				switch(type) {
				case 0: wt = blurR>Math.abs(dx)+1 ? 1 : blurR-Math.abs(dx); break;
				case 1: wt = blurR - Math.abs(dx); break;
				case 2: wt = Math.exp(-dx * dx * sigma2);
				}
				if (wt < 0) continue;
				var pp = x*fullW + j<<2;
				totalR += pxArr[pp] * wt;
				totalG += pxArr[pp|1] * wt;
				totalB += pxArr[pp|2] * wt;
				totalA += pxArr[pp|3] * wt;
				totalW += wt;
			}
			tmpPxArr[p] = totalR / totalW;
			tmpPxArr[p|1] = totalG / totalW;
			tmpPxArr[p|2] = totalB / totalW;
			tmpPxArr[p|3] = totalA / totalW;

		}
	
	// 2rd step horizontal blur
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var p = i*fullW + j;
			var blurR = rArr[p];
			p = p << 2;
			var blurR_ = Math.floor(blurR);
			var sigma = blurR * 0.333;
			var sigma2 = 0.5 / (sigma * sigma);
			var totalW = 0, totalR = 0, totalG = 0, totalB = 0, totalA = 0;
			var ybegin = j-blurR_>=0 ? -blurR_ : -j, yend = j+blurR_<fullW ? blurR_ : fullW-j-1;
			for (var dy = ybegin; dy <= yend; dy++) {
				var y = j + dy, wt;
				switch(type) {
				case 0: wt = blurR>Math.abs(dy)+1 ? 1 : blurR-Math.abs(dy); break;
				case 1: wt = blurR - Math.abs(dy); break;
				case 2: wt = Math.exp(-dy * dy * sigma2);
				}
				if (wt < 0) continue;
				var pp = i*fullW + y<<2;
				totalR += tmpPxArr[pp] * wt;
				totalG += tmpPxArr[pp|1] * wt;
				totalB += tmpPxArr[pp|2] * wt;
				totalA += tmpPxArr[pp|3] * wt;
				totalW += wt;
			}
			totalA += 0.00000001;
			pxData[p] = Math.exp(Math.log(totalR/totalA) * gamma) * 255;
			pxData[p|1] = Math.exp(Math.log(totalG/totalA) * gamma) * 255;
			pxData[p|2] = Math.exp(Math.log(totalB/totalA) * gamma) * 255;
			pxData[p|3] = (totalA-0.00000001) / totalW * 255;
		}
		
	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH);
}

function fastBlurEffect(radius, gamma=2.2, mask=0, type=0, centerX=0.5, centerY=0.5) {  // type : 0 boxy, 1 triangular, 2 gaussian
	canvasB.width = canvasA.width;
	canvasB.height = canvasA.height;
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
	var pxData = imgData.data;
	var tmpPxArr = [], pxArr = [], ij=[];
	var fullH = canvasB.height, fullW = canvasB.width;
	var halfH = (fullH-1)*0.5, halfW = (fullW-1)*0.5;
	var halfH_Re = 1 / halfH, halfW_Re = 1 / halfW;
	var halfD_Re = 1 / Math.sqrt(halfW*halfW + halfH*halfH);
	if (typeof(centerX) == "undefined") centerX = halfW;
	else centerX *= fullW - 1;
	if (typeof(centerY) == "undefined") centerY = halfH;
	else centerY *= fullH - 1;
	switch(type) {
	case 0: break;
	case 1: radius = radius/2; break;
	case 2: radius = (Math.sqrt(0.444444*radius*radius+1)-1)/2;  // http://blog.ivank.net/fastest-gaussian-blur.html
	}
	
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var p = i*fullW + j<<2;
			var ratio = 0;
			switch(mask) {
			case 0: ratio = 1; break;  // none
			case 1: ratio = Math.sqrt((i-centerY)*(i-centerY)+(j-centerX)*(j-centerX))*halfD_Re; break;  // round
			case 2: ratio = Math.abs(i-centerY)*halfH_Re; break;  // horizontal
			case 3: ratio = Math.abs(j-centerX)*halfW_Re;  // vertical
			}
			var r = radius * ratio;
			var i0 = i-r, i1 = i+r+1, j0= j-r, j1 = j+r+1;
			ij[p] = i0>0? i0 : 0;
			ij[p|1] = i1<fullH? i1 : fullH-0.00000001;
			ij[p|2] = j0>0? j0 : 0;
			ij[p|3] = j1<fullW? j1 : fullW-0.00000001;
			pxArr[p|3] = pxData[p|3] / 255;
			pxArr[p] = Math.exp(Math.log(pxData[p]/255)*gamma) * pxArr[p|3];
			pxArr[p|1] = Math.exp(Math.log(pxData[p|1]/255)*gamma) * pxArr[p|3];
			pxArr[p|2] = Math.exp(Math.log(pxData[p|2]/255)*gamma) * pxArr[p|3];
		}
	
	gamma = 1 / gamma;
	
	while (type>=0) {
		type--;
		// 1st step : vertical blur
		for (var i = 0; i < fullH; i++) {
			for (var k = 0; k < 4; k++) {
				var accum = [0];
				for (var j = 0; j < fullW; j++) {
					var p = i*fullW + j<<2;
					accum[j+1] = accum[j] + pxArr[p|k];
				}
				for (var j = 0; j < fullW; j++) {
					var p = i*fullW + j<<2;
					var j0 = ij[p|2], j1 = ij[p|3], j0_= Math.floor(j0), j1_=Math.floor(j1);
					tmpPxArr[p|k] = (j1_+1-j1)*accum[j1_] + (j1-j1_)*accum[j1_+1] - (j0_+1-j0)*accum[j0_] - (j0-j0_)*accum[j0_+1];
					tmpPxArr[p|k] /= j1 - j0;
				}
			}
		}
		// 2rd step horizontal blur
		for (var j = 0; j < fullW; j++) {
			for (var k = 0; k < 4; k++) {
				var accum = [0];
				for (var i = 0; i < fullH; i++) {
					var p = i*fullW + j<<2;
					accum[i+1] = accum[i] + tmpPxArr[p|k];
				}
				for (var i = 0; i < fullH; i++) {
					var p = i*fullW + j<<2;
					var i0 = ij[p], i1 = ij[p|1], i0_= Math.floor(i0), i1_=Math.floor(i1);
					pxArr[p|k] = (i1_+1-i1)*accum[i1_] + (i1-i1_)*accum[i1_+1] - (i0_+1-i0)*accum[i0_] - (i0-i0_)*accum[i0_+1];
					pxArr[p|k] /= i1 - i0;
				}
			}
		}
	}
	
	for (var i = 0; i < fullH; i++)
			for (var j = 0; j < fullW; j++) {
				var p = i*fullW + j<<2;
				pxArr[p|3] += 0.00000001;
				pxData[p] = Math.exp(Math.log(pxArr[p]/pxArr[p|3]) * gamma) * 255;
				pxData[p|1] = Math.exp(Math.log(pxArr[p|1]/pxArr[p|3]) * gamma) * 255;
				pxData[p|2] = Math.exp(Math.log(pxArr[p|2]/pxArr[p|3]) * gamma) * 255;
				pxData[p|3] = (pxArr[p|3]-0.00000001) * 255;
			}
			
	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH);
}

/*
var b=new ArrayBuffer(4);
var d=new DataView(b, 0);
function fastSqrt(num) {  // https://en.wikipedia.org/wiki/Fast_inverse_square_root
	d.setFloat32(0, num);
	var i_ = d.getInt32(0);
	i_ = 0x5f375a86 - (i_>>1);
	d.setInt32(0, i_);
	var y_ = d.getFloat32(0);
	y_ *= (1.5 - 0.5*num*y_*y_);
	return y_*num;
}
// actually very slow
*/

function lenBlurEffect(radius, gamma=2.2, mask=0, centerX=0.5, centerY=0.5) {
	canvasB.width = canvasA.width;
	canvasB.height = canvasA.height;
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
	var pxData = imgData.data;
	var tmpPxArr = [];
	var fullH = canvasB.height, fullW = canvasB.width;
	var halfH = (fullH-1)*0.5, halfW = (fullW-1)*0.5;
	var halfH_Re = 1 / halfH, halfW_Re = 1 / halfW;
	var halfD_Re = 1 / Math.sqrt(halfW*halfW + halfH*halfH);
	if (typeof(centerX) == "undefined") centerX = halfW;
	else centerX *= fullW - 1;
	if (typeof(centerY) == "undefined") centerY = halfH;
	else centerY *= fullH - 1;
	
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var p = i*fullW + j<<2;
			tmpPxArr[p|3] = pxData[p|3] / 255;
			tmpPxArr[p] = Math.exp(Math.log(pxData[p]/255) * gamma) * tmpPxArr[p|3];
			tmpPxArr[p|1] = Math.exp(Math.log(pxData[p|1]/255) * gamma) * tmpPxArr[p|3];
			tmpPxArr[p|2] = Math.exp(Math.log(pxData[p|2]/255) * gamma) * tmpPxArr[p|3];
		}
	
	gamma = 1 / gamma;
	
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var ratio;
			switch(mask) {
			case 0: ratio = 1; break;  // none
			case 1: ratio = Math.sqrt((i-centerY)*(i-centerY)+(j-centerX)*(j-centerX))*halfD_Re; break;  // round
			case 2: ratio = Math.abs(i-centerY)*halfH_Re; break;  // horizontal
			case 3: ratio = Math.abs(j-centerX)*halfW_Re;  // vertical
			}
			var blurR = radius * ratio + 1;
			var p = i*fullW + j<<2;
			var totalW = 0, totalR = 0, totalG = 0, totalB = 0, totalA = 0;
			var blurR_x = Math.floor(blurR);
			var xbegin = i-blurR_x>=0 ? -blurR_x : -i, xend = i+blurR_x<fullH ? blurR_x : fullH-i-1;
			for (var dx = xbegin; dx <= xend; dx++) {
				var blurR_y = Math.floor(Math.sqrt(blurR*blurR - dx*dx));
				var wt1y = (blurR-1)*(blurR-1)-dx*dx;
				wt1y =  wt1y>=0? Math.floor(Math.sqrt(wt1y)) : -1;
				var ybegin = j-blurR_y>=0 ? -blurR_y : -j, yend = j+blurR_y<fullW ? blurR_y : fullW-j-1;
				for (var dy = ybegin; dy <= yend; dy++) {
					var wt = Math.abs(dy) <= wt1y ? 1 : blurR - Math.sqrt(dx*dx + dy*dy);  // to make a soft edge
					// blurR - fastSqrt(dx*dx + dy*dy)
					var pp = (i+dx)*fullW + j+dy<<2  ;
					totalR += tmpPxArr[pp] * wt;
					totalG += tmpPxArr[pp|1] * wt;
					totalB += tmpPxArr[pp|2] * wt;
					totalA += tmpPxArr[pp|3] * wt;
					totalW += wt;
				}
			}
			totalA += 0.00000001;
			pxData[p] = Math.exp(Math.log(totalR/totalA) * gamma) * 255;
			pxData[p|1] = Math.exp(Math.log(totalG/totalA) * gamma) * 255;
			pxData[p|2] = Math.exp(Math.log(totalB/totalA) * gamma) * 255;
			pxData[p|3] = (totalA-0.00000001) / totalW * 255;
		}
		
	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH);
}

/*	
	// a circle random method just for reference
	var r = Math.pow(Math.random(),0.5) * radius;
	var theta = Math.random()*2*Math.PI;
	var dx = Math.cos(theta)*r;
	var dy = Math.sin(theta)*r;
*/

function motionBlurEffect(length, degree, gamma=2.2, mask=0, centerX=0.5, centerY=0.5) {
	canvasB.width = canvasA.width;
	canvasB.height = canvasA.height;
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
	var pxData = imgData.data;
	var tmpPxArr = [];
	var fullH = canvasB.height, fullW = canvasB.width;
	var halfH = (fullH-1)*0.5, halfW = (fullW-1)*0.5;
	var halfH_Re = 1 / halfH, halfW_Re = 1 / halfW;
	var halfD_Re = 1 / Math.sqrt(halfW*halfW + halfH*halfH);
	if (typeof(centerX) == "undefined") centerX = halfW;
	else centerX *= fullW - 1;
	if (typeof(centerY) == "undefined") centerY = halfH;
	else centerY *= fullH - 1;
	
	degree %= 180;
	if (degree < 0) degree += 180;
	degree -= 90;
	var ratioR, ratioX, ratioY;
	if (degree <= 45 && degree >= -45) {
		ratioR = Math.cos(Math.PI*degree / 180);
		ratioX = 1;
		ratioY = Math.tan(Math.PI*degree / 180);
	} else {
		ratioR = Math.sin(Math.PI*degree / 180);
		ratioX = Math.cos(Math.PI*degree / 180) / ratioR;
		ratioY = 1;
	}

	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var p = i*fullW + j<<2;
			tmpPxArr[p|3] = pxData[p|3] / 255;
			tmpPxArr[p] = Math.exp(Math.log(pxData[p]/255) * gamma) * tmpPxArr[p|3];
			tmpPxArr[p|1] = Math.exp(Math.log(pxData[p|1]/255) * gamma) * tmpPxArr[p|3];
			tmpPxArr[p|2] = Math.exp(Math.log(pxData[p|2]/255) * gamma) * tmpPxArr[p|3];
		}
	
	gamma = 1 / gamma;
	
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var ratio;
			switch(mask) {
			case 0: ratio = 1; break;  // none
			case 1: ratio = Math.sqrt((i-centerY)*(i-centerY)+(j-centerX)*(j-centerX))*halfD_Re; break;  // round
			case 2: ratio = Math.abs(i-centerY)*halfH_Re; break;  // horizontal
			case 3: ratio = Math.abs(j-centerX)*halfW_Re;  // vertical
			}
			var blurR = length * ratio * ratioR;
			var p = i*fullW + j<<2;
			var totalW = 0, totalR = 0, totalG = 0, totalB = 0, totalA = 0;
			blurR = Math.abs(blurR) + 1;
			var blurR_ = Math.floor(blurR);
			for (var dk = -blurR_; dk <= blurR_; dk++) {
				var x = i + dk*ratioX, y = j + dk*ratioY;
				if (x >= 0 && x <= fullH-1 && y >= 0 && y <= fullW-1) {
					var wt = blurR - Math.abs(dk);  // to make a soft edge
					if (wt > 1) wt = 1;
					if (Math.round(y) != y || Math.round(x) != x) {
						var p1, p2, l1, l2;
						if (ratioX > ratioY) {
							var y_ = Math.floor(y);
							p1 = x*fullW + y_<<2 ;
							p2 = p1 + 4;
							l2 = y - y_;
							l1 = 1 - l2;
						} else {
							var x_ = Math.floor(x);
							p1 = x_*fullW + y<<2;
							p2 = (x_+1)*fullW + y<<2;
							l2 = x - x_;
							l1 = 1 - l2;
						}
						totalR += (tmpPxArr[p1|0]*l1 + tmpPxArr[p2|0]*l2) * wt;
						totalG += (tmpPxArr[p1|1]*l1 + tmpPxArr[p2|1]*l2) * wt;
						totalB += (tmpPxArr[p1|2]*l1 + tmpPxArr[p2|2]*l2) * wt;
						totalA += (tmpPxArr[p1|3]*l1 + tmpPxArr[p2|3]*l2) * wt;
					} else {
						var pp = Math.round(x*fullW + y)<<2;
						totalR += tmpPxArr[pp] * wt;
						totalG += tmpPxArr[pp|1] * wt;
						totalB += tmpPxArr[pp|2] * wt;
						totalA += tmpPxArr[pp|3] * wt;
					}
					totalW += wt;
				}
			}
			totalA += 0.00000001;
			pxData[p] = Math.exp(Math.log(totalR/totalA) * gamma) * 255;
			pxData[p|1] = Math.exp(Math.log(totalG/totalA) * gamma) * 255;
			pxData[p|2] = Math.exp(Math.log(totalB/totalA) * gamma) * 255;
			pxData[p|3] = (totalA-0.00000001) / totalW * 255;
		}
		
	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH);
}

function zoomBlurEffect(strength, gamma=2.2, type=0, centerX=0.5, centerY=0.5) {
	canvasB.width = canvasA.width;
	canvasB.height = canvasA.height;
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
	var pxData = imgData.data;
	var tmpPxArr = [];
	var fullH = canvasB.height, fullW = canvasB.width;
	var halfH = (fullH-1)*0.5, halfW = (fullW-1)*0.5;
	if (typeof(centerX) == "undefined") centerX = halfW;
	else centerX *= fullW - 1;
	if (typeof(centerY) == "undefined") centerY = halfH;
	else centerY *= fullH - 1;
	
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var p = i*fullW + j<<2;
			tmpPxArr[p|3] = pxData[p|3] / 255;
			tmpPxArr[p] = Math.exp(Math.log(pxData[p]/255) * gamma) * tmpPxArr[p|3];
			tmpPxArr[p|1] = Math.exp(Math.log(pxData[p|1]/255) * gamma) * tmpPxArr[p|3];
			tmpPxArr[p|2] = Math.exp(Math.log(pxData[p|2]/255) * gamma) * tmpPxArr[p|3];
		}
	
	gamma = 1 / gamma;
	
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var zoomX = (centerY-i) * strength, zoomY = (centerX-j) * strength;
			var zoomX_ = Math.abs(zoomX), zoomY_ = Math.abs(zoomY);
			var p = i*fullW + j<<2;
			if (zoomX_==0 && zoomY_==0) {
				tmpPxArr[p|3] += 0.00000001;
				pxData[p] = Math.exp(Math.log(tmpPxArr[p]/tmpPxArr[p|3]) * gamma) * 255;
				pxData[p|1] = Math.exp(Math.log(tmpPxArr[p|1]/tmpPxArr[p|3]) * gamma) * 255;
				pxData[p|2] = Math.exp(Math.log(tmpPxArr[p|2]/tmpPxArr[p|3]) * gamma) * 255;
				pxData[p|3] = (tmpPxArr[p|3]-0.00000001) * 255;
				continue;
			}
			var blurR, ratioX, ratioY;
			if (zoomX_ >= zoomY_) {
				blurR = zoomX_ + 1;
				ratioX = zoomX > 0 ? 1 : -1;
				ratioY = zoomY / zoomX_;
			} else {
				blurR = zoomY_ + 1;
				ratioX = zoomX / zoomY_;
				ratioY = zoomY > 0 ? 1 : -1;
			}
			var blurR_ = Math.floor(blurR);
			var totalW = 0, totalR = 0, totalG = 0, totalB = 0, totalA = 0;
			
			for (var dk = 0; dk <= blurR_; dk++) {
				var x = i + dk*ratioX, y = j + dk*ratioY;
				var ratio = dk / blurR;
				if (ratio == 0) ratio = 0.5 / blurR;  // prevent cracks
				var wt = blurR - dk;  // to make a soft edge
				if (wt > 1) wt = 1;
				wt *= type == 0 ? 1 : ratio * (1-ratio);
				if (Math.round(y) != y || Math.round(x) != x) {
					var p1, p2, l1, l2;
					if (Math.abs(ratioX) > Math.abs(ratioY)) {
						var y_ = Math.floor(y);
						p1 = x*fullW + y_<<2 ;
						p2 = p1 + 4;
						l2 = y - y_;
						l1 = 1 - l2;
					} else {
						var x_ = Math.floor(x);
						p1 = x_*fullW + y<<2;
						p2 = (x_+1)*fullW + y<<2;
						l2 = x - x_;
						l1 = 1 - l2;
					}
					totalR += (tmpPxArr[p1|0]*l1 + tmpPxArr[p2|0]*l2) * wt;
					totalG += (tmpPxArr[p1|1]*l1 + tmpPxArr[p2|1]*l2) * wt;
					totalB += (tmpPxArr[p1|2]*l1 + tmpPxArr[p2|2]*l2) * wt;
					totalA += (tmpPxArr[p1|3]*l1 + tmpPxArr[p2|3]*l2) * wt;
				} else {
					var pp = Math.round(x*fullW + y)<<2;
					totalR += tmpPxArr[pp] * wt;
					totalG += tmpPxArr[pp|1] * wt;
					totalB += tmpPxArr[pp|2] * wt;
					totalA += tmpPxArr[pp|3] * wt;
				}
				totalW += wt;
			}
			totalA += 0.00000001;
			pxData[p] = Math.exp(Math.log(totalR/totalA) * gamma) * 255;
			pxData[p|1] = Math.exp(Math.log(totalG/totalA) * gamma) * 255;
			pxData[p|2] = Math.exp(Math.log(totalB/totalA) * gamma) * 255;
			pxData[p|3] = (totalA-0.00000001) / totalW * 255;
		}
	
	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH);
}

function mosaicEffect(size, gamma=2.2, type=0) {
	canvasB.width = canvasA.width;
	canvasB.height = canvasA.height;
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
	var pxData = imgData.data;
	var tmpPxArr = [];
	var fullH = canvasB.height, fullW = canvasB.width;
	var beginI, endI, beginJ, endJ;
	
	switch(type) {
	case 0:  // left-top alignment
		beginI = 0;
		endI = fullH;
		beginJ = 0;
		endJ = fullW;
		break;
	case 1:  // a block in the center
		var sizeH, sizeW;
		sizeH = (Math.ceil(fullH/size)|1) * size;
		sizeW = (Math.ceil(fullW/size)|1) * size;
		beginI = Math.round(fullH/2)-Math.round(sizeH/2);
		endI = Math.round(fullH/2)+Math.round(sizeH/2);
		beginJ = Math.round(fullW/2)-Math.round(sizeW/2);
		endJ = Math.round(fullW/2)+Math.round(sizeW/2);
		break;
	case 2:  // a cross in the center;
		var halfsizeH, halfsizeW;
		halfsizeH = Math.ceil((fullH>>1) / size) * size;
		halfsizeW = Math.ceil((fullW>>1) / size) * size;
		beginI = Math.round(fullH/2)-halfsizeH;
		endI = Math.round(fullH/2)+halfsizeH;
		beginJ = Math.round(fullW/2)-halfsizeW;
		endJ = Math.round(fullW/2)+halfsizeW;
	}
	
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var p = i*fullW + j<<2;
			tmpPxArr[p|3] = pxData[p|3] / 255;
			tmpPxArr[p] = Math.exp(Math.log(pxData[p]/255) * gamma) * tmpPxArr[p|3];
			tmpPxArr[p|1] = Math.exp(Math.log(pxData[p|1]/255) * gamma) * tmpPxArr[p|3];
			tmpPxArr[p|2] = Math.exp(Math.log(pxData[p|2]/255) * gamma) * tmpPxArr[p|3];
		}
	
	gamma = 1 / gamma;
	
	for (var i = beginI; i < endI; i += size)
		for (var j = beginJ; j < endJ; j += size) {
			var totalW = 0;
			var totalR = 0, totalG = 0, totalB = 0, totalA = 0;
			for (var dx = 0; dx < size; dx++)
				for (var dy = 0; dy < size; dy++) {
					var x = i + dx;
					var y = j + dy;
					if (x >= 0 && x < fullH && y >= 0 && y < fullW) {
						var p = x*fullW + y<<2;
						totalR += tmpPxArr[p];
						totalG += tmpPxArr[p|1];
						totalB += tmpPxArr[p|2];
						totalA += tmpPxArr[p|3];
						totalW++;
					}
				}
			totalA += 0.00000001;
			var resR = Math.exp(Math.log(totalR/totalA) * gamma) * 255;
			var resG = Math.exp(Math.log(totalG/totalA) * gamma) * 255;
			var resB = Math.exp(Math.log(totalB/totalA) * gamma) * 255;
			var resA = Math.round((totalA-0.00000001) / totalW * 255);
			for (var dx = 0; dx < size; dx++)
				for (var dy = 0; dy < size; dy++) {
					var x = i + dx, y = j + dy;
					if (x >= 0 && x < fullH && y >= 0 && y < fullW) {
						var p = x*fullW + y<<2;
						pxData[p] = resR;
						pxData[p|1] = resG;
						pxData[p|2] = resB;
						pxData[p|3] = resA;
					}
				}
		}
	
	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH);
}

function dotEffect(size, type=0) {
	canvasB.width = canvasA.width;
	canvasB.height = canvasA.height;
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
	var pxData = imgData.data;
	var fullH = canvasB.height, fullW = canvasB.width;
	if (size<=1) return;
	
	if (size>2 || type==0) {
		var rmax = type==0 ? 0.707107*size : 0.5*size;
		for (var i = 0; i < fullH; i += size)
			for (var j = 0; j < fullW; j += size) {
				for (var dx = 0; dx < size; dx++)
					for (var dy = 0; dy < size; dy++) {
						var x = i + dx, y = j + dy, rx = Math.abs(dx - 0.5*size), ry = Math.abs(dy - 0.5*size);
						if (x>=fullH || y>=fullW) break;
						if (type==1 && rx+ry>rmax) {
							rx = rmax - rx;
							ry = rmax - ry;
						}
						var d = Math.sqrt(rx*rx + ry*ry);
						var p = x*fullW + y<<2;
						for (var k = 0; k < 3; k++) {
							var tmp = pxData[p|k]/255
							var r = ((((-4*tmp+6)*tmp-2.8)*tmp-0.2)*tmp+1) * rmax;  // a quadratic fitting curve
							var fill = d>0 ? d-r+0.5 : 1-r*(r+1.5);
							fill = fill<0 ? 0 : fill>1? 1 : fill;
							// fill correction
							if ((type==0&&(dx==0||dy==0))||(type==1&&rmax-rx-ry==0)) {
								if ((type==0&&dx==0&&dy==0)||(type==1&&(dx==0||dy==0))) fill = fill>0.5 ? (fill-0.5)*(fill-0.5)*4 : 0;
								else fill = fill>0.5 ? 2*fill-1 : 0;
							}
							else if ((type==1&&rmax-rx-ry==0.5)) {
								if (dx==0||dy==0) fill = fill<0.5 ? fill*fill*2 : fill;
								else fill = fill<0.5 ? fill*(fill + 0.5) : fill;
							} 
							// gamma correction
							pxData[p|k] = Math.exp(Math.log(fill)*0.455)*255;
						}
					}
			}
	} else {
		for (var i = 0; i < fullH; i++)
			for (var j = 0; j < fullW; j++) {
				var p = i*fullW + j<<2;
				for (var k = 0; k < 3; k++) {
					var tmp = Math.exp(Math.log(pxData[p|k]/255)*2.2) * 2;
					if (i+j & 1) pxData[p|k] = tmp>1 ? 255 : Math.exp(Math.log(tmp)*0.455)*255;
					else pxData[p|k] = tmp<=1 ? 0 : Math.exp(Math.log(tmp-1)*0.455)*255;
				}
			}
	}
	
	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH);
}

function lineEffect(size, type=0) {
	canvasB.width = canvasA.width;
	canvasB.height = canvasA.height;
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
	var pxData = imgData.data;
	var fullH = canvasB.height, fullW = canvasB.width;
	if (size<=1) return;
	
	var rmax = (type&1)==0 ? 0.5*size : 0.353553*size;
	for (var i = 0; i < fullH; i += size)
		for (var j = 0; j < fullW; j += size) {
			for (var dx = 0; dx < size; dx++)
				for (var dy = 0; dy < size; dy++) {
					var x = i + dx, y = j + dy, rx = dx - 0.5*size, ry = dy - 0.5*size;
					if (x>=fullH || y>=fullW) break;
					var d;
					if ((type&1)==1) d = type==1? 0.707107*Math.abs(rx + ry) : 0.707107*Math.abs(rx - ry);
					else d = type==0? Math.abs(rx) : Math.abs(ry);
					if (d > rmax) d = 2*rmax - d;
					var p = x*fullW + y<<2;
					for (var k = 0; k < 3; k++) {
						var r = (1 - Math.exp(Math.log(pxData[p|k]/255)*2.2)) * rmax;
						var fill = d>0 ? d-r+0.5 : 1-2*r;
						fill = fill<0 ? 0 : fill>1? 1 : fill;
						// fill correction
						if ((type&1)==0) {
							if (d==rmax) fill = 2*fill-1;
						}
						else if (Math.abs(d-rmax)<0.5) {
							if (size&1) fill = fill>0.5? fill : fill*1.414214-0.207107;
							else fill = 5*fill-2*fill*fill-2; // 8*fill-4*fill*fill-3
						}
						// gamma correction
						pxData[p|k] = Math.exp(Math.log(fill)*0.455)*255;
					}
				}
		}
	
	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH);
}

function fxaaEffect(type=0) { //refer to https://github.com/mattdesl/glsl-fxaa
	function luma(color) {
		return color.r*0.0012 + color.g*0.0023 + color.b*0.0004;
	}
	function getRGB(i, j, dir, ratio) {
		i = Math.floor(i + dir.y*ratio + 0.5), j = Math.floor(j + dir.x*ratio + 0.5);
		i = i<0 ? 0 : i>=fullH ? fullH-1 : i, j = j<0 ? 0 : j>=fullW ? fullW-1 : j;
		var p = i*fullW + j<<2;
		return {r: pxDataA[p], g: pxDataA[p|1], b: pxDataA[p|2]};
	}
	canvasB.width = canvasA.width;
	canvasB.height = canvasA.height;
	var imgDataA = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
	var pxDataA = imgDataA.data;
	var imgDataB = ctxB.getImageData(0, 0, canvasB.width, canvasB.height);
	var pxDataB = imgDataB.data;
	var fullH = canvasB.height, fullW = canvasB.width;
	var lumaBuffer = [];
	
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var prep = i*fullW + j, p = prep<<2;
			lumaBuffer[prep] = pxDataA[p]*0.0012 + pxDataA[p|1]*0.0023 + pxDataA[p|2]*0.0004;
		}
	
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var prep = i*fullW + j;
			var mi = i==0 ? 0 : -1, pi = i==fullH-1 ? 0 : 1;
			var mj = j==0 ? 0 : -1, pj = j==fullW-1 ? 0 : 1;
			var p = prep<<2, lumaMin, lumaMax, dir, range, rgbL;
			var lumaM = lumaBuffer[prep], rgbM = {r: pxDataA[p], g: pxDataA[p|1], b: pxDataA[p|2]};
			if (type == 0) {
				//local contrast check
				var lumaNW, lumaNE, lumaSW, lumaSE;
				p = prep + mi*fullW + mj; lumaNW = lumaBuffer[p]; p = p<<2;
				var rgbNW = {r: pxDataA[p], g: pxDataA[p|1], b: pxDataA[p|2]};
				p = prep + mi*fullW + pj; lumaNE = lumaBuffer[p]; p = p<<2;
				var rgbNE = {r: pxDataA[p], g: pxDataA[p|1], b: pxDataA[p|2]};
				p = prep + pi*fullW + mj; lumaSW = lumaBuffer[p]; p = p<<2;
				var rgbSW = {r: pxDataA[p], g: pxDataA[p|1], b: pxDataA[p|2]};
				p = prep + pi*fullW + pj; lumaSE = lumaBuffer[p]; p = p<<2;
				var rgbSE = {r: pxDataA[p], g: pxDataA[p|1], b: pxDataA[p|2]};
				lumaMin = Math.min(lumaM, lumaNW, lumaNE, lumaSW, lumaSE);
				lumaMax = Math.max(lumaM, lumaNW, lumaNE, lumaSW, lumaSE);
				range = lumaMax - lumaMin;
				if (range < Math.max(0.12, lumaMax * 0.24)) {
					p = prep<<2;
					for (k = 0; k < 4; k++) pxDataB[p|k] = pxDataA[p|k];
					continue;
				}
				dir = {x: lumaSW + lumaSE - lumaNW - lumaNE, y: lumaNW + lumaSW - lumaNE - lumaSE};
				rgbL={r: (rgbNW.r + rgbNE.r + rgbSW.r + rgbSE.r)*0.25,
					g: (rgbNW.g + rgbNE.g + rgbSW.g + rgbSE.g)*0.25,
					b: (rgbNW.b + rgbNE.b + rgbSW.b + rgbSE.b)*0.25}
			} else {
				//local contrast check
				var lumaN, lumaS, lumaW, lumaE;
				p = prep + mi*fullW; lumaN = lumaBuffer[p]; p = p<<2;
				var rgbN = {r: pxDataA[p], g: pxDataA[p|1], b: pxDataA[p|2]};
				p = prep + pi*fullW; lumaS = lumaBuffer[p]; p = p<<2;
				var rgbS = {r: pxDataA[p], g: pxDataA[p|1], b: pxDataA[p|2]};
				p = prep + mj; lumaW = lumaBuffer[p]; p = p<<2;
				var rgbW = {r: pxDataA[p], g: pxDataA[p|1], b: pxDataA[p|2]};
				p = prep + pj; lumaE = lumaBuffer[p]; p = p<<2;
				var rgbE = {r: pxDataA[p], g: pxDataA[p|1], b: pxDataA[p|2]};
				lumaMin = Math.min(lumaM, lumaN, lumaS, lumaW, lumaE);
				lumaMax = Math.max(lumaM, lumaN, lumaS, lumaW, lumaE);
				range = lumaMax - lumaMin;
				if (range < Math.max(0.1, lumaMax * 0.2)) {
					p = prep<<2;
					for (k = 0; k < 4; k++) pxDataB[p|k] = pxDataA[p|k];
					continue;
				}
				var lumaNW, lumaNE, lumaSW, lumaSE;
				p = prep + mi*fullW + mj; lumaNW = lumaBuffer[p]; p = p<<2;
				var rgbNW = {r: pxDataA[p], g: pxDataA[p|1], b: pxDataA[p|2]};
				p = prep + mi*fullW + pj; lumaNE = lumaBuffer[p]; p = p<<2;
				var rgbNE = {r: pxDataA[p], g: pxDataA[p|1], b: pxDataA[p|2]};
				p = prep + pi*fullW + mj; lumaSW = lumaBuffer[p]; p = p<<2;
				var rgbSW = {r: pxDataA[p], g: pxDataA[p|1], b: pxDataA[p|2]};
				p = prep + pi*fullW + pj; lumaSE = lumaBuffer[p]; p = p<<2;
				var rgbSE = {r: pxDataA[p], g: pxDataA[p|1], b: pxDataA[p|2]};
				dir = {x: (lumaS - lumaN)*0.4 + (lumaSW + lumaSE - lumaNW - lumaNE)*0.8, y: (lumaW - lumaE)*0.4 + (lumaNW + lumaSW - lumaNE - lumaSE)*0.8};
				rgbL={r: (rgbN.r + rgbS.r + rgbW.r + rgbE.r + (rgbNW.r + rgbNE.r + rgbSW.r + rgbSE.r)*0.75)*0.143,
					g: (rgbN.g + rgbS.g + rgbW.g + rgbE.g + (rgbNW.g + rgbNE.g + rgbSW.g + rgbSE.g)*0.75)*0.143,
					b: (rgbN.b + rgbS.b + rgbW.b + rgbE.b + (rgbNW.b + rgbNE.b + rgbSW.b + rgbSE.b)*0.75)*0.143}
			}
			
			var rangeL = Math.abs(luma(rgbL) - lumaM);
			var blendL = Math.max(0, (1 - Math.sqrt(dir.x*dir.x+dir.y*dir.y) / range)*0.5, (rangeL / range) - 0.5);
			blendL = blendL<=0.5 ? blendL : 0.5;
			var rcpDirMin = 1.0 / (Math.min(Math.abs(dir.x), Math.abs(dir.y)) + range*0.125);
			dir.x *= rcpDirMin, dir.y *= rcpDirMin;
			dir.x = dir.x>8 ? 8 : dir.x<-8 ? -8 : dir.x, dir.y = dir.y>8 ? 8 : dir.y<-8 ? -8 : dir.y
			
			var rgbTmp1 = getRGB(i, j, dir, 0.25), rgbTmp2 = getRGB(i, j, dir, -0.25);
			var rgbA = {r: (rgbM.r + rgbTmp1.r + rgbTmp2.r)*0.333, g: (rgbM.g + rgbTmp1.g + rgbTmp2.g)*0.333, b: (rgbM.b + rgbTmp1.b + rgbTmp2.b)*0.333};
			rgbTmp1 = getRGB(i, j, dir, 0.5), rgbTmp2 = rgbTmp2 = getRGB(i, j, dir, -0.5);
			var rgbB = {r: (rgbTmp1.r + rgbTmp2.r)*0.5, g: (rgbTmp1.g + rgbTmp2.g)*0.5, b: (rgbTmp1.b + rgbTmp2.b)*0.5};
			rgbB = {r: rgbA.r*0.6 + rgbB.r*0.4, g: rgbA.g*0.6 + rgbB.g*0.4, b: rgbA.b*0.6 + rgbB.b*0.4};
			var lumaA = luma(rgbA), lumaB = luma(rgbB);
			
			p = prep<<2;
			if (Math.abs(lumaB-lumaM) < rangeL) {
				if (blendL>0) {
					pxDataB[p] = rgbB.r*(1-blendL) + rgbL.r*blendL;
					pxDataB[p|1] = rgbB.g*(1-blendL) + rgbL.g*blendL;
					pxDataB[p|2] = rgbB.b*(1-blendL) + rgbL.b*blendL;
				} else pxDataB[p] = rgbB.r, pxDataB[p|1] = rgbB.g, pxDataB[p|2] = rgbB.b;
				pxDataB[p|3] = pxDataA[p|3];
			} else if (Math.abs(lumaA-lumaM) < rangeL) {
				if (blendL>0) {
					pxDataB[p] = rgbA.r*(1-blendL) + rgbL.r*blendL;
					pxDataB[p|1] = rgbA.g*(1-blendL) + rgbL.g*blendL;
					pxDataB[p|2] = rgbA.b*(1-blendL) + rgbL.b*blendL;
				} else pxDataB[p] = rgbA.r, pxDataB[p|1] = rgbA.g, pxDataB[p|2] = rgbA.b;
				pxDataB[p|3] = pxDataA[p|3];
			} else {
				if (blendL>0) {
					pxDataB[p] = rgbM.r*(1-blendL) + rgbL.r*blendL;
					pxDataB[p|1] = rgbM.g*(1-blendL) + rgbL.g*blendL;
					pxDataB[p|2] = rgbM.b*(1-blendL) + rgbL.b*blendL;
				} else pxDataB[p] = rgbM.r, pxDataB[p|1] = rgbM.g, pxDataB[p|2] = rgbM.b;
				pxDataB[p|3] = pxDataA[p|3];
			}
		}
	
	ctxB.putImageData(imgDataB, 0, 0, 0, 0, fullW, fullH);
}