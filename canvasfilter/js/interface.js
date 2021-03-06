var scaleType = 1  // 0:100% 1:auto

window.onresize = function(){
	scaleCanvas()
}

function setScaleType(type){
	scaleType = type
	scaleCanvas()
}

window.onload = function(){
			var image = new Image()
			setCanvasById('canvashidden', 'canvasshow')	 // before using canvasfx function
			image.src = 'img/iron.jpg'	// sample image is from http://www.polayoutu.com/collections/4
			image.onload = function(){
				canvasA.setAttribute('width', image.width)
				canvasA.setAttribute('height', image.height)
				canvasB.setAttribute('width', image.width)
				canvasB.setAttribute('height', image.height)
				ctxA.drawImage(image, 0, 0)
				for (var i=0; i<15; i++) resetValues(i)
				clickIndex(-1)
				noEffect()
				setScaleType(1)
			}
			var holder = document.getElementById('drop')
			holder.ondragenter = function(){
				holder.className = 'hover'
				return false
			}
			holder.ondragleave = function(){
				holder.className = ''
				return false
			}
			holder.ondragover = function(){
				return false  // otherwise the page will be replaced by the image
			}
			holder.ondrop = function(e){
				e.preventDefault()
				e.stopPropagation()
				holder.className = ''
				var file = e.dataTransfer.files[0]
				importFile(file)
				return false
			}
		}

function scaleCanvas(){
	var span = document.getElementById('imgspan')
	var width = span.offsetWidth - 16
	var height = span.offsetHeight - 16
	var ratio = 0
	var type = scaleType
	height/canvasB.height > width/canvasB.width ? ratio = width/canvasB.width : ratio = height/canvasB.height
	if(scaleType == 1){
		ratio > 1 ? type = 0 : type = 1
	}
	type == 0 ? canvasB.style.width = canvasB.width+'px' : canvasB.style.width = canvasB.width*ratio+'px'
	type == 0 ? canvasB.style.height = canvasB.height+'px' : canvasB.style.height = canvasB.height*ratio+'px'
}

function exportImg(){ 
	/*
	// here is the most important part because if you dont replace you will get a DOM 18 exception.
	var image = canvasB.toDataURL('image/png').replace('image/png', 'image/octet-stream')
	var save = document.getElementById('saveimage');
	save.href = image
	save.type = 'image/png'
	save.download = 'Image.png'
	save.click()
	*/
	var dataurl = canvasB.toDataURL('image/png')
	//DataUrl to Blob
	var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
		bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n)
	while(n--){
		u8arr[n] = bstr.charCodeAt(n)
	}
	var blob = new Blob([u8arr], {type:mime})
	//save
	var save = document.getElementById('saveimage')
	save.href = URL.createObjectURL(blob)
	save.download = 'Image.png'
	save.click()
}

function importImg(){
	var input = document.getElementById('importfile')
	var file = input.files[0]
	importFile(file)
	input.value=''
}

function importFile(file){
	var reader = new FileReader()
	reader.onload = function(event){
		img = new Image()
		img.src = event.target.result
		img.onload = function(){
			canvasA.setAttribute('width', this.width)
			canvasA.setAttribute('height', this.height)
			canvasB.setAttribute('width', this.width)
			canvasB.setAttribute('height', this.height)
			ctxA.clearRect(0, 0, this.width, this.height)
			ctxA.drawImage(this, 0, 0)
			delete this
			for (var i=0; i<15; i++) resetValues(i)
			clickIndex(-1)
			noEffect()
			setScaleType(1)
		}
	}
	reader.readAsDataURL(file)
}

function clickIndex(index){
	var applyButtom = document.getElementsByClassName('applybuttom')
	var ctrlDiv = document.getElementsByClassName('ctrldiv')
	if(index==-1 || hasClass(applyButtom[index], 'inactive')){
		for (i=0;i<applyButtom.length;i++){
			if (!hasClass(applyButtom[i], 'inactive')){
				addClass(applyButtom[i], 'inactive')
				addClass(ctrlDiv[i], 'inactive')
			}
		}
		if (index!=-1) {
			removeClass(applyButtom[index], 'inactive')
			removeClass(ctrlDiv[index], 'inactive')
			updateValues(index)
			previewCanvas(index)
		}
	}else{
		addClass(applyButtom[index], 'inactive')
		addClass(ctrlDiv[index], 'inactive')
		noEffect()
		scaleCanvas()
	}
}

function hasClass(obj, cls){
	return obj.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'))
}
  
function addClass(obj, cls){
	if(!this.hasClass(obj, cls)) obj.className += ' ' + cls
}  
  
function removeClass(obj, cls){
	if(hasClass(obj, cls)){
		var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)')
		obj.className = obj.className.replace(reg, ' ')
	}
}

function resetValues(index){
	var div = document.getElementsByClassName("div"+index)
	switch(index){
		case 0:
			div[0].value=canvasA.width
			div[1].value=canvasA.height
			div[2].value="2.2"
			div[3].value="0"
			break
		case 1:
			div[0].value="0"
			div[1].value="0"
			div[2].value="0"
			break
		case 2:
			div[0].value="0"
			break
		case 3:
			div[0].value="-0.1"
			break
		case 4:
			div[0].value="4"
			div[1].value="30"
			div[2].value="0"
			div[3].value="0.5"
			div[4].value="0.5"
			break
		case 5:
			div[0].value="0.2"
			div[1].value="0.5"
			div[2].value="0.5"
			break
		case 6:
			div[0].value="5"
			div[1].value="2.2"
			div[2].value="0"
			div[3].value="1"
			div[4].value="0.5"
			div[5].value="0.5"
			break
		case 7:
			div[0].value="5"
			div[1].value="2.2"
			div[2].value="0"
			div[3].value="0.5"
			div[4].value="0.5"
			break
		case 8:
			div[0].value="5"
			div[1].value="30"
			div[2].value="2.2"
			div[3].value="0"
			div[4].value="0.5"
			div[5].value="0.5"
			break
		case 9:
			div[0].value="0.05"
			div[1].value="2.2"
			div[2].value="0"
			div[3].value="0.5"
			div[4].value="0.5"
			break
		case 10:
			div[0].value="10"
			div[1].value="2.2"
			div[2].value="0"
			break
		case 11:
			div[0].value="6"
			div[1].value="1"
			break
		case 12:
			div[0].value="6"
			div[1].value="1"
			break
		case 13:
			div[0].value="0"
			break
		case 14:
			div[0].value="0"
			break
	}
}

function updateWH(type){
	var div = document.getElementsByClassName("div0")
	var minW=1, minH=1
	if(canvasA.width>canvasA.height) minW = Math.floor(canvasA.width/canvasA.height+0.5)
	else minH = Math.floor(canvasA.height/canvasA.width+0.5)
	if(type) {
		div[1].value = parseInt(div[1].value)
		div[0].value = Math.floor(div[1].value/canvasA.height*canvasA.width + 0.5)
	}else{
		div[0].value = parseInt(div[0].value)
		div[1].value = Math.floor(div[0].value/canvasA.width*canvasA.height + 0.5)
	}
	if (div[0].value<minW) div[0].value=minW
	if (div[1].value<minH) div[1].value=minH
}

function updateValues(index){
	var div = document.getElementsByClassName("div"+index)
	var value = document.getElementsByClassName("value"+index)
	switch(index){
		case 0:
			value[0].innerText=div[2].value
			value[1].innerText=div[3].value
			break
		case 1:
			value[0].innerText=div[0].value
			value[1].innerText=div[1].value
			value[2].innerText=div[2].value
			break
		case 2:
			break
		case 3:
			value[0].innerText=div[0].value
			break
		case 4:
			value[0].innerText=div[0].value
			value[1].innerText=div[1].value
			div[3].value = parseFloat(div[3].value)
			div[4].value = parseFloat(div[4].value)
			break
		case 5:
			value[0].innerText=div[0].value
			div[1].value = parseFloat(div[1].value)
			div[2].value = parseFloat(div[2].value)
			break
		case 6:
			value[0].innerText=div[0].value
			value[1].innerText=div[1].value
			div[4].value = parseFloat(div[4].value)
			div[5].value = parseFloat(div[5].value)
			break
		case 7:
			value[0].innerText=div[0].value
			value[1].innerText=div[1].value
			div[3].value = parseFloat(div[3].value)
			div[4].value = parseFloat(div[4].value)
			break
		case 8:
			value[0].innerText=div[0].value
			value[1].innerText=div[1].value
			value[2].innerText=div[2].value
			div[4].value = parseFloat(div[4].value)
			div[5].value = parseFloat(div[5].value)
			break
		case 9:
			value[0].innerText=div[0].value
			value[1].innerText=div[1].value
			div[3].value = parseFloat(div[3].value)
			div[4].value = parseFloat(div[4].value)
			break
		case 10:
			value[0].innerText=div[0].value
			value[1].innerText=div[1].value
			break
		case 11:
			value[0].innerText=div[0].value
			break
		case 12:
			value[0].innerText=div[0].value
			break
	}
}

function previewCanvas(index){
	var div = document.getElementsByClassName("div"+index)
	switch(index){
		case 0:
			resizeEffect(parseInt(div[0].value),
				parseInt(div[1].value),
				parseFloat(div[2].value),
				parseFloat(div[3].value))
			break
		case 1:
			hslEffect(parseInt(div[0].value),
				parseInt(div[1].value),
				parseInt(div[2].value))
			break
		case 2:
			greyEffect(parseInt(div[0].value))
			break
		case 3:
			distortionEffect(parseFloat(div[0].value))
			break
		case 4:
			motionHarrisEffect(parseFloat(div[0].value),
				parseInt(div[1].value),
				parseInt(div[2].value),
				parseFloat(div[3].value),
				parseFloat(div[4].value))
			break
		case 5:
			zoomHarrisEffect(parseFloat(div[0].value),
				parseFloat(div[1].value),
				parseFloat(div[2].value))
			break
		case 6:
			if (parseFloat(div[0].value)<=15)
			normalBlurEffect(parseFloat(div[0].value),
				parseFloat(div[1].value),
				parseInt(div[2].value),
				parseInt(div[3].value),
				parseFloat(div[4].value),
				parseFloat(div[5].value))
			else
			fastBlurEffect(parseFloat(div[0].value),
				parseFloat(div[1].value),
				parseInt(div[2].value),
				parseInt(div[3].value),
				parseFloat(div[4].value),
				parseFloat(div[5].value))
			break
		case 7:
			fastLenBlurEffect(parseFloat(div[0].value),
				parseFloat(div[1].value),
				parseInt(div[2].value),
				parseFloat(div[3].value),
				parseFloat(div[4].value))
			break
		case 8:
			motionBlurEffect(parseFloat(div[0].value),
				parseInt(div[1].value),
				parseFloat(div[2].value),
				parseInt(div[3].value),
				parseFloat(div[4].value),
				parseFloat(div[5].value))
			break
		case 9:
			zoomBlurEffect(parseFloat(div[0].value),
				parseFloat(div[1].value),
				parseInt(div[2].value),
				parseFloat(div[3].value),
				parseFloat(div[4].value))
			break
		case 10:
			mosaicEffect(parseInt(div[0].value),
				parseFloat(div[1].value),
				parseInt(div[2].value))
			break
		case 11:
			dotEffect(parseInt(div[0].value),
				parseInt(div[1].value))
			break
		case 12:
			lineEffect(parseInt(div[0].value),
				parseInt(div[1].value))
			break
		case 13:
			ditherEffect(parseInt(div[0].value))
			break
		case 14:
			fxaaEffect(parseInt(div[0].value))
			break
	}
	scaleCanvas()
}





