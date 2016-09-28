var canvasA , canvasB
var ctxA , ctxB

function setCanvasById(nameA, nameB){
	canvasA = document.getElementById(nameA)
	ctxA = canvasA.getContext("2d")
	canvasB = document.getElementById(nameB)
	ctxB = canvasB.getContext("2d")
}

function applyEffect(){
	imgData = ctxB.getImageData(0, 0, canvasB.width, canvasB.height)
	ctxA.putImageData(imgData, 0, 0, 0, 0, canvasA.width, canvasA.height)
}

function noEffect(){
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height)
	ctxB.putImageData(imgData, 0, 0, 0, 0, canvasB.width, canvasB.height)
}

function greyEffect(type){
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height)
	var pxData = imgData.data
	var fullH = canvasB.height, fullW = canvasB.width
	var fullS = fullH*fullW
	
	for(var i = 0; i < fullS; i ++){
		var r = pxData[(i<<2)+0]
		var g = pxData[(i<<2)+1]
		var b = pxData[(i<<2)+2]

		var grey
		grey = type == 0 ? (r*38 + g*75 + b*15) >> 7 : (r + g + b) /3

		pxData[(i<<2)+0] = grey
		pxData[(i<<2)+1] = grey
		pxData[(i<<2)+2] = grey
	}

	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH)
}

function hslEffect(degreeH, percentS, percentL){
	function hslToRgb(h, s, l){
		var r, g, b
		if(s == 0){
			r = g = b = l  // achromatic
		}else{
			function hue2rgb(p, q, t){
				t -= Math.floor(t)
				if(t < 1/6) return p + (q - p) * 6 * t
				if(t < 1/2) return q
				if(t < 2/3) return p + (q - p) * (2/3 - t) * 6
				return p;
			}
			var q = l < 0.5 ? l * (1 + s) : l + s - l * s
			var p = 2 * l - q
			r = hue2rgb(p, q, h + 1/3)
			g = hue2rgb(p, q, h)
			b = hue2rgb(p, q, h - 1/3)
		}
		return [Math.round(r*255), Math.round(g*255), Math.round(b*255)]
	}
	
	function rgbToHsl(r, g, b){
		r /= 255, g /= 255, b /= 255
		var max = Math.max(r, g, b), min = Math.min(r, g, b)
		var h, s, l = (max+min) / 2
		if(max == min){
			h = s = 0  // achromatic
		}else{
			var d = max - min
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
			switch(max){
				case r: h = (g - b) / d + (g < b ? 6 : 0); break
				case g: h = (b - r) / d + 2; break
				case b: h = (r - g) / d + 4; break
			}
			h /= 6
		}
		return [h, s, l]
	}
	
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height)
	var pxData = imgData.data
	var fullH = canvasB.height, fullW = canvasB.width
	var fullS = fullH*fullW
	degreeH /= 360
	var ratio = (100 + percentS)/100
	var power = Math.exp(-percentL/100) 
	
	for(var i = 0; i < fullS; i ++){
		var r = pxData[(i<<2)+0]
		var g = pxData[(i<<2)+1]
		var b = pxData[(i<<2)+2]
		var hslArr = rgbToHsl(r, g, b)
		hslArr[0] += degreeH
		hslArr[0] -= Math.floor(hslArr[0])
		hslArr[1] *= ratio
		if(hslArr[1] > 1) hslArr[1] = 1
		hslArr[2] = Math.exp(Math.log(hslArr[2]) * power)
		var rgbArr = hslToRgb(hslArr[0], hslArr[1], hslArr[2])

		pxData[(i<<2)+0] = rgbArr[0]
		pxData[(i<<2)+1] = rgbArr[1]
		pxData[(i<<2)+2] = rgbArr[2]
	}

	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH)
}

function motionHarrisEffect(length, degree, mask){  // Harris camera
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height)
	var pxData = imgData.data
	var pxArr = []
	
	var fullH = canvasB.height, fullW = canvasB.width
	var halfH = (fullH-1)/2, halfW = (fullW-1)/2
	var halfD = Math.sqrt(halfW*halfW + halfH*halfH)
	degree -= 90
	var ratioX = Math.cos(degree/180*Math.PI)
	var ratioY = Math.sin(degree/180*Math.PI)
	
	for(var i = 0; i<fullH; i ++)
		for(var j = 0; j<fullW; j ++){
			var p = (i*fullW + j)<<2
			pxArr[p+3] = pxData[p+3] / 255
			pxArr[p+0] = pxData[p+0] / 255 * pxArr[p+3]
			pxArr[p+1] = pxData[p+1] / 255 * pxArr[p+3]
			pxArr[p+2] = pxData[p+2] / 255 * pxArr[p+3]
		}
	
	for(var i = 0; i<fullH; i ++)
		for(var j = 0; j<fullW; j ++){
			var motion = [], ratio
			switch(mask){
				case 0 : ratio = 1; break  // none
				case 1 : ratio = Math.sqrt((i-halfH)*(i-halfH)+(j-halfW)*(j-halfW))/halfD; break  // round
				case 2 : ratio = Math.abs(i-halfH)/halfH; break  // horizontal
				case 3 : ratio = Math.abs(j-halfW)/halfW  // vertical
			}
			motion[0] = -length * ratio
			motion[1] = 0
			motion[2] = -motion[0]
			var tmpRGB = [], tmpA = []
			for(var k = 0; k < 3; k ++){
				tmpRGB[k] = 0, tmpA[k] = 0
				var x = i + motion[k]*ratioX, y = j + motion[k]*ratioY, x_, y_
				
				if(x > fullH-1 || x < 0){
					var m
					if(x > fullH-1){
						m = (fullH-1-i)/ratioX
						x = fullH-1
					}else{
						m = -i/ratioX
						x = 0
					}
					y = j + m*ratioY
				}
				if(y > fullW-1 || y < 0){
					var m 
					if(y > fullW-1){
						m = (fullW-1-j)/ratioY
						y = fullW-1
					}else{
						m = -j/ratioY
						y = 0
					}
					x = i + m*ratioX
				}
				
				x_ = x == fullH-1 ? x-1 : Math.floor(x)
				y_ = y == fullW-1 ? y-1 : Math.floor(y)

				tmpRGB[k] += pxArr[((x_*fullW + y_)<<2)+k] * (x_+1-x)*(y_+1-y) + pxArr[((x_*fullW + y_+1)<<2)+k] * (x_+1-x)*(y-y_)
				tmpRGB[k] += pxArr[(((x_+1)*fullW + y_)<<2)+k] * (x-x_)*(y_+1-y) + pxArr[(((x_+1)*fullW + y_+1)<<2)+k] * (x-x_)*(y-y_)
				tmpA[k] += pxArr[((x_*fullW + y_)<<2)+3] * (x_+1-x)*(y_+1-y) + pxArr[((x_*fullW + y_+1)<<2)+3] * (x_+1-x)*(y-y_)
				tmpA[k] += pxArr[(((x_+1)*fullW + y_)<<2)+3] * (x-x_)*(y_+1-y) + pxArr[(((x_+1)*fullW + y_+1)<<2)+3] * (x-x_)*(y-y_)
			}
			
			var p = (i*fullW + j)<<2
			pxData[p+0] = tmpRGB[0]/(tmpA[0]+0.0000000001) * 255
			pxData[p+1] = tmpRGB[1]/(tmpA[1]+0.0000000001) * 255
			pxData[p+2] = tmpRGB[2]/(tmpA[2]+0.0000000001) * 255
			pxData[p+3] = (tmpA[0]+tmpA[1]+tmpA[2])/3 * 255
		}

	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH)
}

function zoomHarrisEffect(strength){  // Harris camera
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height)
	var pxData = imgData.data
	var pxArr = []
	
	var fullH = canvasB.height, fullW = canvasB.width
	var halfH = (fullH-1)/2, halfW = (fullW-1)/2
	
	var ratio = []
	ratio[0] = (10+strength)/10
	ratio[1] = 1
	ratio[2] = (10-strength)/10
	
	for(var i = 0; i<fullH; i ++)
		for(var j = 0; j<fullW; j ++){
			var p = (i*fullW + j)<<2
			pxArr[p+3] = pxData[p+3] / 255
			pxArr[p+0] = pxData[p+0] / 255 * pxArr[p+3]
			pxArr[p+1] = pxData[p+1] / 255 * pxArr[p+3]
			pxArr[p+2] = pxData[p+2] / 255 * pxArr[p+3]
		}
	
	for(var i = 0; i<fullH; i ++)
		for(var j = 0; j<fullW; j ++){
			var tmpRGB = [], tmpA = []
			for(var k = 0; k < 3; k ++){
				tmpRGB[k] = 0, tmpA[k] = 0
				var x = halfH + (i-halfH)*ratio[k], y = halfW + (j-halfW)*ratio[k], x_, y_
				
				if(x > fullH-1 || x < 0){
					var r
					if(x > fullH-1){
						r = halfH/(i-halfH)
						x = fullH-1
					}else{
						r = halfH/(halfH-i)
						x = 0
					}
					y = halfW + (j-halfW)*r
				}
				if(y > fullW-1 || y < 0){
					var r 
					if(y > fullW-1){
						r = halfW/(j-halfW)
						y = fullW-1
					}else{
						r = halfW/(halfW-j)
						y = 0
					}
					x = halfH + (i-halfH)*r
				}
				
				x_ = x == fullH-1 ? x-1 : Math.floor(x)
				y_ = y == fullW-1 ? y-1 : Math.floor(y)
				
				tmpRGB[k] += pxArr[((x_*fullW + y_)<<2)+k] * (x_+1-x)*(y_+1-y) + pxArr[((x_*fullW + y_+1)<<2)+k] * (x_+1-x)*(y-y_)
				tmpRGB[k] += pxArr[(((x_+1)*fullW + y_)<<2)+k] * (x-x_)*(y_+1-y) + pxArr[(((x_+1)*fullW + y_+1)<<2)+k] * (x-x_)*(y-y_)
				tmpA[k] += pxArr[((x_*fullW + y_)<<2)+3] * (x_+1-x)*(y_+1-y) + pxArr[((x_*fullW + y_+1)<<2)+3] * (x_+1-x)*(y-y_)
				tmpA[k] += pxArr[(((x_+1)*fullW + y_)<<2)+3] * (x-x_)*(y_+1-y) + pxArr[(((x_+1)*fullW + y_+1)<<2)+3] * (x-x_)*(y-y_)
			}
			
			var p = (i*fullW + j)<<2
			pxData[p+0] = tmpRGB[0]/(tmpA[0]+0.0000000001) * 255
			pxData[p+1] = tmpRGB[1]/(tmpA[1]+0.0000000001) * 255
			pxData[p+2] = tmpRGB[2]/(tmpA[2]+0.0000000001) * 255
			pxData[p+3] = (tmpA[0]+tmpA[1]+tmpA[2])/3 * 255
		}

	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH)
}

function distortionEffect(strength){  // recommend strength from -0.5 to 0.5
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height)
	var pxData = imgData.data
	var pxArr = []
	
	var fullH = canvasB.height, fullW = canvasB.width
	var halfH = (fullH-1)/2, halfW = (fullW-1)/2
	var halfD = Math.sqrt(halfW*halfW + halfH*halfH)

	for(var i = 0; i<fullH; i ++)
		for(var j = 0; j<fullW; j ++){
			var p = (i*fullW + j)<<2
			pxArr[p+3] = pxData[p+3] / 255
			pxArr[p+0] = pxData[p+0] / 255 * pxArr[p+3]
			pxArr[p+1] = pxData[p+1] / 255 * pxArr[p+3]
			pxArr[p+2] = pxData[p+2] / 255 * pxArr[p+3]
		}
	
	for(var i = 0; i<fullH; i ++)
		for(var j = 0; j<fullW; j ++){
			var percent = Math.sqrt((i-halfH)*(i-halfH)+(j-halfW)*(j-halfW))/halfD
			var ratio = strength < 0 ? (1-percent)+Math.exp(strength)*(percent) : (percent)+Math.exp(-strength)*(1-percent)
			var tmpRGBA = [0, 0, 0, 0]
			var x = halfH + (i-halfH)*ratio, y = halfW + (j-halfW)*ratio, x_, y_
			
			x_ = x == fullH-1 ? x-1 : Math.floor(x)
			y_ = y == fullW-1 ? y-1 : Math.floor(y)
			for(var k = 0; k < 4; k ++){
				tmpRGBA[k] += pxArr[((x_*fullW + y_)<<2)+k] * (x_+1-x)*(y_+1-y) + pxArr[((x_*fullW + y_+1)<<2)+k] * (x_+1-x)*(y-y_)
				tmpRGBA[k] += pxArr[(((x_+1)*fullW + y_)<<2)+k] * (x-x_)*(y_+1-y) + pxArr[(((x_+1)*fullW + y_+1)<<2)+k] * (x-x_)*(y-y_)
			}
			
			var p = (i*fullW + j)<<2
			pxData[p+0] = tmpRGBA[0]/(tmpRGBA[3]+0.0000000001) * 255
			pxData[p+1] = tmpRGBA[1]/(tmpRGBA[3]+0.0000000001) * 255
			pxData[p+2] = tmpRGBA[2]/(tmpRGBA[3]+0.0000000001) * 255
			pxData[p+3] = tmpRGBA[3] * 255
		}
		
	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH)
}

function normalBlurEffect(radius, brightness, mask, type){
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height)
	var pxData = imgData.data
	var tmpPxArr = []
	var pxArr = []
	var rArr=[]

	var fullH = canvasB.height, fullW = canvasB.width
	var halfH = (fullH-1)/2, halfW = (fullW-1)/2
	var halfD = Math.sqrt(halfW*halfW + halfH*halfH)
	
	var power = Math.exp(2.3*brightness)  // 0 ~ 1 remap the value
	
	for(var i = 0; i<fullH; i ++)
		for(var j = 0; j<fullW; j ++){
			var p = i*fullW + j
			var ratio = 0
			switch(mask){
				case 0 : ratio = 1; break  // none
				case 1 : ratio = Math.sqrt((i-halfH)*(i-halfH)+(j-halfW)*(j-halfW))/halfD; break  // round
				case 2 : ratio = Math.abs(i-halfH)/halfH; break  // horizontal
				case 3 : ratio = Math.abs(j-halfW)/halfW  // vertical
			}
			rArr[p]= radius * ratio
			p = p << 2
			pxArr[p+3] = pxData[p+3] / 255
			pxArr[p+0] = Math.exp(Math.log(pxData[p+0]/255)*power) * pxArr[p+3]
			pxArr[p+1] = Math.exp(Math.log(pxData[p+1]/255)*power) * pxArr[p+3]
			pxArr[p+2] = Math.exp(Math.log(pxData[p+2]/255)*power) * pxArr[p+3]
		}
	
	power = 1 / power
	
	// 1st step : vertical blur
	for(var i = 0; i<fullH; i ++)
		for(var j = 0; j<fullW; j ++){
			var p = i*fullW + j
			var blurR = rArr[p]
			p = p << 2
			if(blurR <= 1){
				tmpPxArr[p+0] = pxArr[p+0] / (pxArr[p+3]+0.0000000001)
				tmpPxArr[p+1] = pxArr[p+1] / (pxArr[p+3]+0.0000000001)
				tmpPxArr[p+2] = pxArr[p+2] / (pxArr[p+3]+0.0000000001)
				tmpPxArr[p+3] = pxArr[p+3]
				continue
			}
			var blurR_ = Math.floor(blurR)
			var sigma = blurR / 3
			var sigma2 = 2 * sigma * sigma;
			var totalW = 0, totalR = 0, totalG = 0, totalB = 0, totalA = 0
			for(var dx = -blurR_; dx <= blurR_; dx++){
				var x = i + dx, y = j, wt
				if(x >= 0 && x < fullH){
					wt = type == 0 ? blurR - Math.abs(dx) : Math.exp(-(dx * dx) / sigma2) // the first is much faster
					var pp = (x*fullW + y)<<2
					totalR += pxArr[pp+0] * wt
					totalG += pxArr[pp+1] * wt
					totalB += pxArr[pp+2] * wt
					totalA += pxArr[pp+3] * wt
					totalW += wt
				}
			}
			tmpPxArr[p+0] = totalR / totalW
			tmpPxArr[p+1] = totalG / totalW
			tmpPxArr[p+2] = totalB / totalW
			tmpPxArr[p+3] = totalA / totalW

		}
	
	// 2rd step horizontal blur
	for(var i = 0; i<fullH; i ++)
		for(var j = 0; j<fullW; j ++){
			var p = i*fullW + j
			var blurR = rArr[p]
			p = p << 2
			if(blurR <= 1){
				pxData[p+0] = Math.exp(Math.log(tmpPxArr[p+0]/(tmpPxArr[p+3]+0.0000000001)) * power) * 255
				pxData[p+1] = Math.exp(Math.log(tmpPxArr[p+1]/(tmpPxArr[p+3]+0.0000000001)) * power) * 255
				pxData[p+2] = Math.exp(Math.log(tmpPxArr[p+2]/(tmpPxArr[p+3]+0.0000000001)) * power) * 255
				pxData[p+3] = tmpPxArr[p+3] * 255
				continue
			}
			var blurR_ = Math.floor(blurR)
			var sigma = blurR / 3
			var sigma2 = 2 * sigma * sigma;
			var totalW = 0, totalR = 0, totalG = 0, totalB = 0, totalA = 0
			for(var dy = -blurR_; dy <= blurR_; dy++){
				var x = i, y = j + dy, wt
				if(y >= 0 && y < fullW){
					wt = type == 0 ? 1 - Math.abs(dy)/blurR : Math.exp(-(dy * dy) / sigma2) // the first is much faster
					var pp = (x*fullW + y)<<2
					totalR += tmpPxArr[pp+0] * wt
					totalG += tmpPxArr[pp+1] * wt
					totalB += tmpPxArr[pp+2] * wt
					totalA += tmpPxArr[pp+3] * wt
					totalW += wt
				}
			}
			pxData[p+0] = Math.exp(Math.log(totalR/(totalA+0.0000000001)) * power) * 255
			pxData[p+1] = Math.exp(Math.log(totalG/(totalA+0.0000000001)) * power) * 255
			pxData[p+2] = Math.exp(Math.log(totalB/(totalA+0.0000000001)) * power) * 255
			pxData[p+3] = totalA / totalW * 255
		}
		
	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH)
}

function lenBlurEffect(radius, brightness, mask){

/*
	var b=new ArrayBuffer(4)
	var d=new DataView(b, 0)
	function fastSqrt(num){  // https://en.wikipedia.org/wiki/Fast_inverse_square_root
		d.setFloat32(0, num)
		var i_ = d.getInt32(0)
		i_ = 0x5f375a86 - (i_>>1)
		d.setInt32(0, i_)
		var y_ = d.getFloat32(0)
		y_ *= (1.5 - 0.5*num*y_*y_)
		return y_*num
	}
	// actually very slow
*/

	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height)
	var pxData = imgData.data
	var tmpPxArr = []

	var fullH = canvasB.height, fullW = canvasB.width
	var halfH = (fullH-1)/2, halfW = (fullW-1)/2
	var halfD = Math.sqrt(halfW*halfW + halfH*halfH)
	
	var power = Math.exp(2.3*brightness)  // 0 ~ 1 remap the value
	
	for(var i = 0; i<fullH; i ++)
		for(var j = 0; j<fullW; j ++){
			var p = (i*fullW + j)<<2
			tmpPxArr[p+3] = pxData[p+3] / 255
			tmpPxArr[p+0] = Math.exp(Math.log(pxData[p+0]/255) * power) * tmpPxArr[p+3]
			tmpPxArr[p+1] = Math.exp(Math.log(pxData[p+1]/255) * power) * tmpPxArr[p+3]
			tmpPxArr[p+2] = Math.exp(Math.log(pxData[p+2]/255) * power) * tmpPxArr[p+3]
		}
	
	power = 1 / power
	
	for(var i = 0; i<fullH; i ++)
		for(var j = 0; j<fullW; j ++){
			var ratio
			switch(mask){
				case 0 : ratio = 1; break  // none
				case 1 : ratio = Math.sqrt((i-halfH)*(i-halfH)+(j-halfW)*(j-halfW))/halfD; break  // round
				case 2 : ratio = Math.abs(i-halfH)/halfH; break  // horizontal
				case 3 : ratio = Math.abs(j-halfW)/halfW  // vertical
			}
			var blurR = radius * ratio
			var p = (i*fullW + j)<<2
			if(blurR <= 0.5){
				pxData[p+0] = Math.exp(Math.log(tmpPxArr[p+0]/(tmpPxArr[p+3]+0.0000000001)) * power) * 255
				pxData[p+1] = Math.exp(Math.log(tmpPxArr[p+1]/(tmpPxArr[p+3]+0.0000000001)) * power) * 255
				pxData[p+2] = Math.exp(Math.log(tmpPxArr[p+2]/(tmpPxArr[p+3]+0.0000000001)) * power) * 255
				pxData[p+3] = tmpPxArr[p+3] * 255
				continue
			}
			var blurR_ = Math.round(blurR)
			var totalW = 0, totalR = 0, totalG = 0, totalB = 0, totalA = 0
			blurR += 0.5
			for(var dx = -blurR_; dx <= blurR_; dx++)
				for(var dy = -blurR_; dy <= blurR_; dy++){
					var wt = blurR - Math.sqrt(dx*dx + dy*dy)
					//var wt = blurR - fastSqrt(dx*dx + dy*dy)
					if(wt > 0){
						var x = i + dx, y = j + dy
						if(x >= 0 && x < fullH && y >= 0 && y < fullW){
							if(wt > 1) wt = 1  // to make a soft edge
							var pp = (x*fullW + y)<<2  
							totalR += tmpPxArr[pp+0] * wt
							totalG += tmpPxArr[pp+1] * wt
							totalB += tmpPxArr[pp+2] * wt
							totalA += tmpPxArr[pp+3] * wt
							totalW += wt
						}
					}
				}
			pxData[p+0] = Math.exp(Math.log(totalR/(totalA+0.0000000001)) * power) * 255
			pxData[p+1] = Math.exp(Math.log(totalG/(totalA+0.0000000001)) * power) * 255
			pxData[p+2] = Math.exp(Math.log(totalB/(totalA+0.0000000001)) * power) * 255
			pxData[p+3] = totalA / totalW * 255
		}
		
	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH)
}

/*	
	// a circle random method just for referring
	r = (1-Math.pow(Math.random(),2)) * radius
	theta = Math.random()*2*Math.PI
	var dx = Math.cos(theta)*r
	var dy = Math.sin(theta)*r
*/

function motionBlurEffect(length, degree, brightness, mask){
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height)
	var pxData = imgData.data
	var tmpPxArr = []

	var fullH = canvasB.height, fullW = canvasB.width
	var halfH = (fullH-1)/2, halfW = (fullW-1)/2
	var halfD = Math.sqrt(halfW*halfW + halfH*halfH)
	
	degree %= 180
	if(degree < 0) degree += 180
	degree -= 90 
	
	if(degree <= 45 && degree >= -45) {
		ratioR = Math.cos(Math.PI*degree / 180)
		ratioX = 1
		ratioY = Math.tan(Math.PI*degree / 180)
	}else{
		ratioR = Math.sin(Math.PI*degree / 180)
		ratioX = Math.cos(Math.PI*degree / 180) / ratioR
		ratioY = 1
	}
	
	var power = Math.exp(2.3*brightness)  // 0 ~ 1 remap the value
	
	for(var i = 0; i<fullH; i ++)
		for(var j = 0; j<fullW; j ++){
			var p = (i*fullW + j)<<2
			tmpPxArr[p+3] = pxData[p+3] / 255
			tmpPxArr[p+0] = Math.exp(Math.log(pxData[p+0]/255) * power) * tmpPxArr[p+3]
			tmpPxArr[p+1] = Math.exp(Math.log(pxData[p+1]/255) * power) * tmpPxArr[p+3]
			tmpPxArr[p+2] = Math.exp(Math.log(pxData[p+2]/255) * power) * tmpPxArr[p+3]
		}
	
	power = 1 / power
	
	for(var i = 0; i<fullH; i ++)
		for(var j = 0; j<fullW; j ++){
			var ratio
			switch(mask){
				case 0 : ratio = 1; break  // none
				case 1 : ratio = Math.sqrt((i-halfH)*(i-halfH)+(j-halfW)*(j-halfW))/halfD; break  // round
				case 2 : ratio = Math.abs(i-halfH)/halfH; break  // horizontal
				case 3 : ratio = Math.abs(j-halfW)/halfW  // vertical
			}
			var blurR = length * ratio * ratioR
			var p = (i*fullW + j)<<2
			var totalW = 0, totalR = 0, totalG = 0, totalB = 0, totalA = 0
			blurR = Math.abs(blurR)
			if(blurR < 0.5){
				pxData[p+0] = Math.exp(Math.log(tmpPxArr[p+0]/(tmpPxArr[p+3]+0.0000000001)) * power) * 255
				pxData[p+1] = Math.exp(Math.log(tmpPxArr[p+1]/(tmpPxArr[p+3]+0.0000000001)) * power) * 255
				pxData[p+2] = Math.exp(Math.log(tmpPxArr[p+2]/(tmpPxArr[p+3]+0.0000000001)) * power) * 255
				pxData[p+3] = tmpPxArr[p+3] * 255
				continue
			}
			var blurR_ = Math.round(blurR)
			blurR += 0.5
			
			for(var dk = -blurR_; dk <= blurR_; dk++){
				var x = i + dk*ratioX, y = j + dk*ratioY
				if(x >= 0 && x <= fullH-1 && y >= 0 && y <= fullW-1){
					var wt = blurR - Math.abs(dk)  // to make a soft edge
					if(wt > 1) wt = 1
					if(Math.round(y) == y && Math.round(x) == x){
						var pp = Math.round(x*fullW + y)<<2
						totalR += tmpPxArr[pp+0] * wt
						totalG += tmpPxArr[pp+1] * wt
						totalB += tmpPxArr[pp+2] * wt
						totalA += tmpPxArr[pp+3] * wt
					}else{  // to make a soft edge
						var p1, p2, l1, l2
						if(ratioX > ratioY){
							var y_ = Math.floor(y)
							p1 = (x*fullW + y_)<<2 
							p2 = p1 + 4
							l2 = y - y_
							l1 = 1 - l2
						}else{
							var x_ = Math.floor(x)
							p1 = (x_*fullW + y)<<2
							p2 = ((x_+1)*fullW + y)<<2
							l2 = x - x_
							l1 = 1 - l2
						}
						totalR += (tmpPxArr[p1+0]*l1 + tmpPxArr[p2+0]*l2) * wt
						totalG += (tmpPxArr[p1+1]*l1 + tmpPxArr[p2+1]*l2) * wt
						totalB += (tmpPxArr[p1+2]*l1 + tmpPxArr[p2+2]*l2) * wt
						totalA += (tmpPxArr[p1+3]*l1 + tmpPxArr[p2+3]*l2) * wt
					}
					totalW += wt
				}
			}
				
			pxData[p+0] = Math.exp(Math.log(totalR/(totalA+0.0000000001)) * power) * 255
			pxData[p+1] = Math.exp(Math.log(totalG/(totalA+0.0000000001)) * power) * 255
			pxData[p+2] = Math.exp(Math.log(totalB/(totalA+0.0000000001)) * power) * 255
			pxData[p+3] = totalA / totalW * 255
		}
		
	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH)
}

function zoomBlurEffect(strength, brightness, type){
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height)
	var pxData = imgData.data
	var tmpPxArr = []

	var fullH = canvasB.height, fullW = canvasB.width
	var halfH = (fullH-1)/2, halfW = (fullW-1)/2
	
	var power = Math.exp(2.3*brightness)  // 0 ~ 1 remap the value
	
	for(var i = 0; i<fullH; i ++)
		for(var j = 0; j<fullW; j ++){
			var p = (i*fullW + j)<<2
			tmpPxArr[p+3] = pxData[p+3] / 255
			tmpPxArr[p+0] = Math.exp(Math.log(pxData[p+0]/255) * power) * tmpPxArr[p+3]
			tmpPxArr[p+1] = Math.exp(Math.log(pxData[p+1]/255) * power) * tmpPxArr[p+3]
			tmpPxArr[p+2] = Math.exp(Math.log(pxData[p+2]/255) * power) * tmpPxArr[p+3]
		}
	
	power = 1 / power
	
	for(var i = 0; i<fullH; i ++)
		for(var j = 0; j<fullW; j ++){
			var zoomX = (halfH-i) * strength, zoomY = (halfW-j) * strength
			var zoomX_ = Math.abs(zoomX), zoomY_ = Math.abs(zoomY)
			var p = (i*fullW + j)<<2
			if(zoomX_<=0.5 && zoomY_<=0.5){
				pxData[p+0] = Math.exp(Math.log(tmpPxArr[p+0]/(tmpPxArr[p+3]+0.0000000001)) * power) * 255
				pxData[p+1] = Math.exp(Math.log(tmpPxArr[p+1]/(tmpPxArr[p+3]+0.0000000001)) * power) * 255
				pxData[p+2] = Math.exp(Math.log(tmpPxArr[p+2]/(tmpPxArr[p+3]+0.0000000001)) * power) * 255
				pxData[p+3] = tmpPxArr[p+3] * 255
				continue
			}
			var blurR, ratioX, ratioY
			if(zoomX_ >= zoomY_){
				blurR = zoomX_
				ratioX = zoomX > 0 ? 1 : -1
				ratioY = zoomY / zoomX_
			}else{
				blurR = zoomY_
				ratioX = zoomX / zoomY_
				ratioY = zoomY > 0 ? 1 : -1
			}
			var blurR_ = Math.round(blurR)
			var totalW = 0, totalR = 0, totalG = 0, totalB = 0, totalA = 0
			blurR += 0.5
			
			for(var dk = 0; dk <= blurR_; dk++){
				var x = i + dk*ratioX, y = j + dk*ratioY
				var ratio = dk / blurR
				if(ratio == 0) ratio = 0.5 / blurR  // prevent cracks
				var wt = blurR - dk  // to make a soft edge
				if(wt > 1) wt = 1
				wt *= type == 0 ? 1 : ratio * (1-ratio)
				if(Math.round(y) == y && Math.round(x) == x){
					var pp = Math.round(x*fullW + y)<<2
					totalR += tmpPxArr[pp+0] * wt
					totalG += tmpPxArr[pp+1] * wt
					totalB += tmpPxArr[pp+2] * wt
					totalA += tmpPxArr[pp+3] * wt
				}else{  // to make a soft edge
					var p1, p2, l1, l2
					if(Math.abs(ratioX) > Math.abs(ratioY)){
						var y_ = Math.floor(y)
						p1 = (x*fullW + y_)<<2 
						p2 = p1 + 4
						l2 = y - y_
						l1 = 1 - l2
					}else{
						var x_ = Math.floor(x)
						p1 = (x_*fullW + y)<<2
						p2 = ((x_+1)*fullW + y)<<2
						l2 = x - x_
						l1 = 1 - l2
					}
					totalR += (tmpPxArr[p1+0]*l1 + tmpPxArr[p2+0]*l2) * wt
					totalG += (tmpPxArr[p1+1]*l1 + tmpPxArr[p2+1]*l2) * wt
					totalB += (tmpPxArr[p1+2]*l1 + tmpPxArr[p2+2]*l2) * wt
					totalA += (tmpPxArr[p1+3]*l1 + tmpPxArr[p2+3]*l2) * wt
				}
				totalW += wt
			}
			
			pxData[p+0] = Math.exp(Math.log(totalR/(totalA+0.0000000001)) * power) * 255
			pxData[p+1] = Math.exp(Math.log(totalG/(totalA+0.0000000001)) * power) * 255
			pxData[p+2] = Math.exp(Math.log(totalB/(totalA+0.0000000001)) * power) * 255
			pxData[p+3] = totalA / totalW * 255
		}
	
	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH)
}

function mosaicEffect(size, type){
	var imgData = ctxA.getImageData(0, 0, canvasA.width, canvasA.height)
	var pxData = imgData.data
	var tmpPxArr = []
	
	var fullH = canvasB.height, fullW = canvasB.width
	var beginI, endI, beginJ, endJ
	
	switch(type){
	case 0:  // left-top alignment
		beginI = 0
		endI = fullH
		beginJ = 0
		endJ = fullW
		break
	case 1:  // a block in the center
		var sizeH, sizeW
		sizeH = ((Math.ceil(fullH/size)>>1<<1) + 1) * size
		sizeW = ((Math.ceil(fullW/size)>>1<<1) + 1) * size
		beginI = Math.round(fullH>>1)-Math.round(sizeH>>1)
		endI = Math.round(fullH>>1)+Math.round(sizeH>>1)
		beginJ = Math.round(fullW>>1)-Math.round(sizeW>>1)
		endJ = Math.round(fullW>>1)+Math.round(sizeW>>1)
		break
	case 2:  // a cross in the center
		var halfsizeH, halfsizeW
		halfsizeH = Math.ceil(Math.ceil(fullH/2) / size) * size
		halfsizeW = Math.ceil(Math.ceil(fullW/2) / size) * size
		beginI = Math.round(fullH>>1)-halfsizeH
		endI = Math.round(fullH>>1)+halfsizeH
		beginJ = Math.round(fullW>>1)-halfsizeW
		endJ = Math.round(fullW>>1)+halfsizeW
		break 
	}
	
	
	for(var i = 0; i<fullH; i ++)
		for(var j = 0; j<fullW; j ++){
			var p = (i*fullW + j)<<2
			tmpPxArr[p+3] = pxData[p+3] / 255
			tmpPxArr[p+0] = Math.round(pxData[p+0] * tmpPxArr[p+3])
			tmpPxArr[p+1] = Math.round(pxData[p+1] * tmpPxArr[p+3])
			tmpPxArr[p+2] = Math.round(pxData[p+2] * tmpPxArr[p+3])
		}
	
	for(var i = beginI; i < endI; i += size)
		for(var j = beginJ; j < endJ; j += size){
			var totalW = 0
			var totalR = 0, totalG = 0, totalB = 0, totalA = 0
			for(var dx = 0; dx < size; dx ++)
				for(var dy = 0; dy < size; dy ++){
					var x = i + dx
					var y = j + dy
					if(x >= 0 && x < fullH && y >= 0 && y < fullW){
						var p = (x*fullW + y)<<2
						totalR += tmpPxArr[p+0]
						totalG += tmpPxArr[p+1]
						totalB += tmpPxArr[p+2]
						totalA += tmpPxArr[p+3]
						totalW ++
					}
				}

			var resR = Math.round(totalR / (totalA+0.0000000001))
			var resG = Math.round(totalG / (totalA+0.0000000001))
			var resB = Math.round(totalB / (totalA+0.0000000001))
			var resA = Math.round(totalA / totalW * 255)

			for(var dx = 0; dx < size; dx ++)
				for(var dy = 0; dy < size; dy ++){

					var x = i + dx
					var y = j + dy

					if(x >= 0 && x < fullH && y >= 0 && y < fullW){
						var p = (x*fullW + y)<<2
						pxData[p+0] = resR
						pxData[p+1] = resG
						pxData[p+2] = resB
						pxData[p+3] = resA
					}
				}
		}
		
	ctxB.putImageData(imgData, 0, 0, 0, 0, fullW, fullH)
}