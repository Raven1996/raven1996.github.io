var canvasA , canvasB;
var ctxA , ctxB;

function setCanvasById(nameA, nameB) {
	canvasA = document.getElementById(nameA);
	ctxA = canvasA.getContext("2d");
	canvasB = document.getElementById(nameB);
	ctxB = canvasB.getContext("2d");
}

function noEffect() {
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
	ctxB.putImageData(imgData, 0, 0, 0, 0, canvasB.width, canvasB.height);
}

function depthOfFieldEffect(fnumber, focus, foci, gamma=2.2, maxR) {
	var samples = [0.0, 0.6180340, 0.2360680, 0.8541020, 0.4721360, 0.0901699, 0.7082039, 0.3262379,
	0.9442719, 0.5623059, 0.1803399, 0.7983739, 0.4164079, 0.0344419, 0.6524758, 0.2705098,
	0.8885438, 0.5065778, 0.1246118, 0.7426458, 0.3606798, 0.9787138, 0.5967478, 0.2147817,
	0.8328157, 0.4508497, 0.0688837, 0.6869177, 0.3049517, 0.9229857, 0.5410197, 0.1590537,
	0.7770876, 0.3951216, 0.0131556, 0.6311896, 0.2492236, 0.8672576, 0.4852916, 0.1033256,
	0.7213595, 0.3393935, 0.9574275, 0.5754615, 0.1934955, 0.8115295, 0.4295635, 0.0475975,
	0.6656315, 0.2836654, 0.9016994, 0.5197334, 0.1377674, 0.7558014, 0.3738354, 0.9918694,
	0.6099034, 0.2279374, 0.8459713, 0.4640053, 0.0820393, 0.7000733, 0.3181073, 0.9361413];
	var kmax = 64;
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
	var pxData = imgData.data;
	var tmpPxArr = [];
	var radius = [], weight = [], searchR = [];
	var fullH = canvasB.height, fullW = canvasB.width;
	var halfH = (fullH-1)*0.5, halfW = (fullW-1)*0.5;
	var halfH_Re = 1 / halfH, halfW_Re = 1 / halfW;
	var halfD_Re = 1 / Math.sqrt(halfW*halfW + halfH*halfH);
	if (typeof(centerX) == "undefined") centerX = halfW;
	else centerX *= fullW - 1;
	if (typeof(centerY) == "undefined") centerY = halfH;
	else centerY *= fullH - 1;
	var minZ = 255, maxZ = 0;
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var p = (i*fullW + j)<<2;
			tmpPxArr[p] = Math.exp(Math.log(pxData[p]/255) * gamma);
			tmpPxArr[p|1] = Math.exp(Math.log(pxData[p|1]/255) * gamma);
			tmpPxArr[p|2] = Math.exp(Math.log(pxData[p|2]/255) * gamma);
			tmpPxArr[p|3] = pxData[p|3];
			if (tmpPxArr[p|3] < minZ) minZ = tmpPxArr[p|3];
			if (tmpPxArr[p|3] > maxZ) maxZ = tmpPxArr[p|3];
		}
	var maxRadius = 0;
	var t = 500*foci/focus/fnumber;
	for (var i = minZ; i <= maxZ; i++) {
		radius[i] = Math.abs(i-focus)/(255-i+foci)*t;
		if (radius[i] > maxR) radius[i] = maxR;
		weight[i] = Math.min(1, 1/(radius[i]*radius[i]*Math.PI+0.000001));
	}
	
	gamma = 1 / gamma;
	
	tmpSearchR = [];
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var p = i*fullW + j;
			tmpSearchR[p] = radius[tmpPxArr[p<<2|3]];
			for (var k = -maxR; k <= maxR; k++)
				if (i+k>=0 && i+k<fullH) {
					var pp = ((i+k)*fullW + j)<<2;
					if (radius[tmpPxArr[pp|3]] > tmpSearchR[p])
						tmpSearchR[p] = radius[tmpPxArr[pp|3]];
				}
		}
	
	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var p = i*fullW + j;
			searchR[p] = tmpSearchR[p];
			for (var k = -maxR; k <= maxR; k++)
				if (j+k>=0 && j+k<fullW) {
					var pp = (i*fullW + j+k);
					if (tmpSearchR[pp] > searchR[p])
						searchR[p] = tmpSearchR[pp];
				}
		}
	tmpSearchR = null;

	for (var i = 0; i < fullH; i++)
		for (var j = 0; j < fullW; j++) {
			var p = (i*fullW + j)<<2;
			var searchRadius = searchR[p>>2];
			if (searchRadius < 0.5) {
				pxData[p|3] = 255;
				continue;
			}
			var area = Math.PI*searchRadius*searchRadius;
			var totalW1 = 0, totalR1 = 0, totalG1 = 0, totalB1 = 0;  // above
			var totalW0 = 0, totalR0 = 0, totalG0 = 0, totalB0 = 0;  // below
			var knum = Math.min(kmax, Math.round(area+4));
			var ratio = knum / area;
			var rd = Math.random();
			for (var k = 0; k < knum; k++) {
				var r = Math.sqrt(samples[k]) * searchRadius;
				var theta = (k/knum+rd)*2*Math.PI;
				var x = i + Math.round(Math.cos(theta)*r);
				var y = j + Math.round(Math.sin(theta)*r);
				if (x<0 || x>=fullH || y<0 || y>=fullW) continue;
				var pp = (x*fullW + y)<<2;
                var distance = Math.sqrt((x-i)*(x-i) + (y-j)*(y-j));
				if (tmpPxArr[pp|3] > tmpPxArr[p|3]) {  // above
					var blurR = radius[tmpPxArr[pp|3]];
					if (distance > blurR+0.5) continue;
					var wt = weight[tmpPxArr[pp|3]];
                    wt *= distance<=blurR ? 1 : (blurR+0.5-distance);
					totalW1 += wt;
					totalR1 += tmpPxArr[pp] * wt;
					totalG1 += tmpPxArr[pp|1] * wt;
					totalB1 += tmpPxArr[pp|2] * wt;
				} else {  // below
					var blurR = radius[tmpPxArr[p|3]];
					if (distance > blurR+0.5) continue;
					var wt = weight[tmpPxArr[p|3]];
					wt *= distance<=blurR ? 1 : (blurR+0.5-distance);
					totalW0 += wt;
					totalR0 += tmpPxArr[pp] * wt;
					totalG0 += tmpPxArr[pp|1] * wt;
					totalB0 += tmpPxArr[pp|2] * wt;
				}
			}
			if (totalW1 > ratio) {
				totalR1 = totalR1 * ratio / totalW1;
				totalG1 = totalG1 * ratio / totalW1;
				totalB1 = totalB1 * ratio / totalW1;
				totalW1 = ratio;
			}
			if (totalW0 > ratio-totalW1) {
				totalR0 = totalR0 * (ratio-totalW1) / totalW0
				totalG0 = totalG0 * (ratio-totalW1) / totalW0
				totalB0 = totalB0 * (ratio-totalW1) / totalW0
				totalW0 = ratio-totalW1
			}
			pxData[p] = Math.exp(Math.log((totalR1+totalR0)/(totalW1+totalW0)) * gamma) * 255;
			pxData[p|1] = Math.exp(Math.log((totalG1+totalG0)/(totalW1+totalW0)) * gamma) * 255;
			pxData[p|2] = Math.exp(Math.log((totalB1+totalB0)/(totalW1+totalW0)) * gamma) * 255;
			pxData[p|3] = 255;
		}

	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH);
}

/*	
	// a circle random method just for referring
	var r = Math.pow(Math.random(),0.5) * radius;
	var theta = Math.random()*2*Math.PI;
	var dx = Math.cos(theta)*r;
	var dy = Math.sin(theta)*r;
*/