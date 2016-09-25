window.onresize = function(){
	scaleCanvas(1)
}

function setScaleType(type){
	scaleCanvas(0, type)
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
				noEffect()
				scaleCanvas(1)
			}
			var holder = document.getElementById('drop');
			holder.addEventListener('dragenter', function(event){
				holder.className = 'hover'
				event.stopPropagation()
				event.preventDefault()
			}, false)
			holder.addEventListener('dragleave', function(event){
				holder.className = ''
				event.stopPropagation()
				event.preventDefault()
			}, false)
			holder.addEventListener('drop', function(event){
				holder.className = ''
				event.preventDefault()
				var file = event.dataTransfer.files[0], reader = new FileReader()
				reader.onload = function(event){
					img = new Image()
					img.src = event.target.result
					img.onload = function() {
						canvasA.setAttribute('width', this.width)
						canvasA.setAttribute('height', this.height)
						canvasB.setAttribute('width', this.width)
						canvasB.setAttribute('height', this.height)
						ctxA.clearRect(0, 0, this.width, this.height)
						ctxA.drawImage(this, 0, 0)
						delete this
						noEffect()
						scaleCanvas(1)
					}
				}
				reader.readAsDataURL(file)
				event.stopPropagation()
				event.preventDefault()
			}, false)
		}

function scaleCanvas(auto, type){
	var span = document.getElementById('imgspan')
	var width = span.offsetWidth - 16
	var height = span.offsetHeight - 16
	var ratio = 0
	height/canvasB.height > width/canvasB.width ? ratio = width/canvasB.width : ratio = height/canvasB.height
	if(auto == 1){
		ratio > 1 ? type = 0 : type = 1
	}
	type == 0 ? canvasB.style.width = canvasB.width+'px' : canvasB.style.width = canvasB.width*ratio+'px'
	type == 0 ? canvasB.style.height = canvasB.height+'px' : canvasB.style.height = canvasB.height*ratio+'px'
}

function exportImg(){ 
	// here is the most important part because if you dont replace you will get a DOM 18 exception.	 
	// var image = myCanvas.toDataURL('image/png').replace('image/png', 'image/octet-stream;Content-Disposition: attachment;filename=foobar.png');
	var image = canvasB.toDataURL('image/png').replace('image/png', 'image/octet-stream;filename=foobar.png')
	var save = document.getElementById('saveimage');
	save.href = image
	save.download = 'IMG.png'
	save.click()
}

function clickIndex(index){
	var applyButtom = document.getElementsByClassName('applybuttom')
	var ctrlDiv = document.getElementsByClassName('ctrldiv')
	if(hasClass(applyButtom[index], 'inactive')){
		for (i=0;i<applyButtom.length;i++){
			i == index ? removeClass(applyButtom[i], 'inactive') : addClass(applyButtom[i], 'inactive')
			i == index ? removeClass(ctrlDiv[i], 'inactive') : addClass(ctrlDiv[i], 'inactive')
		}
		
		previewCanvas(index)
	}else{
		addClass(applyButtom[index], 'inactive')
		addClass(ctrlDiv[index], 'inactive')
		noEffect()
	}
}

function hasClass(obj, cls) {  
	return obj.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));  
}  
  
function addClass(obj, cls) {  
	if (!this.hasClass(obj, cls)) obj.className += ' ' + cls;  
}  
  
function removeClass(obj, cls) {  
	if (hasClass(obj, cls)) {  
		var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');	
		obj.className = obj.className.replace(reg, ' ');  
	}  
} 

function previewCanvas(index){
	greyEffect(0)
}





