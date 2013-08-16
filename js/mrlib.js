angular.module('mrlib', ['ngCookies'], function($compileProvider, $routeProvider, $locationProvider) {

	var mrNodes = [];
	var mrButtons = [];

	var wpx, hpx;
	var wmm, hmm;
	var marginBottom = 150;
	var pointHTML = '<div id="%s" style="top:0px;left:0px;width:5px;height:5px;background-color:#ff00ff;z-index:1000;position:absolute;"></div>';
	var latestIDs = {};
	
	var getWindowSize = function() {
		if (document.all) { //IE
			wpx = document.body.clientWidth;
			hpx = document.body.clientHeight;
		} else {
			wpx = window.innerWidth;
			hpx = window.innerHeight;
		}
	}

	angular.element(angular.element(document).ready(function() {
		getWindowSize();
		angular.element(window).bind("resize", function() {
			getWindowSize();
		});
	}));


	// Setup Leap loop with frame callback function
	var controllerOptions = {enableGestures: true};
	
	Leap.loop(controllerOptions, function(frame) {
		if(frame.hands.length > 0) {
			var tmpIDs={};
			for(var i=0;i<frame.hands.length;i++) {
				var x = (frame.hands[i].palmPosition[0] + (wmm/2))*(wpx / wmm);
				var y = (hmm-frame.hands[i].palmPosition[1]+marginBottom)*(hpx / hmm);
				var idx = "id"+frame.hands[i].id;
				var pnode = latestIDs[idx] ? latestIDs[idx].node : null;
				if(pnode == null) {
					var html = 	pointHTML.replace('%s', "id"+frame.hands[i].id);
					angular.element(document.body).append(html);
					pnode = angular.element(document.getElementById(idx));
					latestIDs[idx] = {};
					latestIDs[idx].node = pnode;
					latestIDs[idx].lastX = -999;
					latestIDs[idx].lastY = -999;
					latestIDs[idx].lastZ = -999;
				}else{
					var px = parseInt(pnode.css('left').replace("px", ""));
					var py = parseInt(pnode.css('top').replace("px", ""));
					latestIDs[idx].lastX = px;
					latestIDs[idx].lastY = py;
					latestIDs[idx].lastZ = latestIDs[idx].z;
				}
				latestIDs[idx].z = parseInt(frame.hands[i].palmPosition[2]);
				pnode.css('left', x+"px");
				pnode.css('top',  y+"px");
				tmpIDs[idx]=true;
			}
			for(var key in latestIDs) {
				if(!tmpIDs[key]){
					latestIDs[key].node.remove();
					delete latestIDs[key];
				}
			}
		}else{
			for(var key in latestIDs) {
				latestIDs[key].node.remove();
			}
			latestIDs = {};
		}
		
		var selectedNodes = {};
		var usedHands = {};
		for(var i=0;i < mrNodes.length && frame.hands != null && frame.hands.length > 0;i++) {
			var node = mrNodes[i];
			var style = node[0].currentStyle || document.defaultView.getComputedStyle(node[0], '')
			var x1 = parseInt(style.left.replace("px", ""));
			var y1 = parseInt(style.top.replace("px", ""));
			var w1 = parseInt(style.width.replace("px", ""));
			var h1 = parseInt(style.height.replace("px", ""));
			var selected = false;
			for(var key in latestIDs) {
				var pnode = latestIDs[key].node;
				var px = parseInt(pnode.css('left').replace("px", ""));
				var py = parseInt(pnode.css('top').replace("px", ""));
				var change = true;
				if(px > x1 && px < (x1+w1) && py > y1 && py < (y1+h1)) {
					if(usedHands[key]) {
						if(node.css("z-index") == 999 || node.css("z-index") == 1000) {
							for(var removeKey in selectedNodes) {
								if(selectedNodes[removeKey].key == key) {
									selectedNodes[removeKey].node.css("border","1px solid rgba(0, 0, 0, 1.0)");
									selectedNodes[removeKey].node.css("z-index", 0);
									delete selectedNodes[removeKey];
									break;
								}
							}
						}else{
							change = false;
						}
					}
					if(change) {
						selected = true;
						usedHands[key] = true;
						if(selectedNodes[node[0].id]){
							selectedNodes[node[0].id].mode = "resise";
							selectedNodes[node[0].id].another = key;
						}else{
							selectedNodes[node[0].id] = {};
							selectedNodes[node[0].id].node = node;
							selectedNodes[node[0].id].key = key;
							selectedNodes[node[0].id].mode = "selected";
						}
					}
					for(var j=0;frame.gestures && j<frame.gestures.length;j++) {
						var gesture = frame.gestures[j];
						var searchEnd = false;
						if(gesture.type == 'keyTap') {
							for(var k=0;gesture.handIds && k<gesture.handIds.length;k++) {
								if(gesture.handIds[k] == key.substring(2)) {
									if(latestIDs[key].on) {
										latestIDs[key].on = false;
									}else{
										latestIDs[key].on = true;
									}
									searchEnd = true;
								}
								if(searchEnd) {
									break;
								}
							}
						}
						if(searchEnd) {
							break;
						}
					}
				}
			}
			if(selected) {
				if(latestIDs[selectedNodes[node[0].id].key].on) {
					node.css("border","5px solid rgba(33, 92, 236, 1.0)");
				}else{
					node.css("border","5px solid rgba(0, 0, 0, 1.0)");
				}
				node.css("z-index", 999);
				node[0].parentNode.insertBefore(node[0], node[0].parentNode.lastChild);
			}else{
				node.css("border","1px solid rgba(0, 0, 0, 1.0)");
				node.css("z-index", 0);
			}
		}
		for(var key in latestIDs) {
			if(!usedHands[key]) {
				latestIDs[key].on = false;
			}
		}
		
			
		for(var key in selectedNodes) {
			if(selectedNodes[key].mode == "selected") {
				var pnode = latestIDs[selectedNodes[key].key].node;
				var px = parseInt(pnode.css('left').replace("px", ""));
				var py = parseInt(pnode.css('top').replace("px", ""));
				var pz = latestIDs[selectedNodes[key].key].z;
				var lastPx = latestIDs[selectedNodes[key].key].lastX;
				var lastPy = latestIDs[selectedNodes[key].key].lastY;
				var lastPz = latestIDs[selectedNodes[key].key].lastZ;
				var tapOn = latestIDs[selectedNodes[key].key].on;
				var node = selectedNodes[key].node;
				var style = node[0].currentStyle || document.defaultView.getComputedStyle(node[0], '')
				var fingerCnt = -1;
				var hand = null;
				for(var i=0;i<frame.hands.length;i++) {
					if(frame.hands[i].id == selectedNodes[key].key.substring(2)) {
						hand = frame.hands[i];
						fingerCnt = frame.hands[i].fingers ? frame.hands[i].fingers.length : -1;
						break;
					}
				}
					
				if(fingerCnt == 0) {
					node.css("z-index", 1000);
					node[0].parentNode.insertBefore(node[0], node[0].parentNode.lastChild);
				}
				if(fingerCnt == 1 && tapOn) {
					if(lastPx != -999 && lastPy != -999) {
						if(px != lastPx || py != lastPy) {
							var diffX = lastPx - px;
							var diffY = lastPy - py;
							var x1 = parseInt(style.left.replace("px", ""));
							var y1 = parseInt(style.top.replace("px", ""));
							var newX = x1 - diffX;
							var newY = y1 - diffY;
							node.css('left', newX+"px");
							node.css('top', newY+"px");
						}
					}
				}
				
				if(fingerCnt == 5 && tapOn) {
					if(lastPz != -999) {
						if(pz != lastPz) {
							var pxRate =  Math.abs(pz - lastPz);//1mmで1%ずつ拡縮
							var w1 = parseInt(style.width.replace("px", ""));
							var h1 = parseInt(style.height.replace("px", ""));
							if(pxRate < 80) {
								var newW = -1;
								var newH = -1;
								if(pz > lastPz) { //拡大
									newW = w1 + Math.round(w1 * pxRate / 100);
									newH = h1 + Math.round(h1 * pxRate / 100);
								}else{ //縮小
									newW = w1 - Math.round(w1 * pxRate / 100);
									newH = h1 - Math.round(h1 * pxRate / 100);
								}
								node.css('width', newW+"px");
								node.css('height', newH+"px");
							}
						}
					}
				}
			}else if(selectedNodes[key].mode == "resise") {
				var hID1 = selectedNodes[key].key.substring(2);
				var hID2 = selectedNodes[key].another.substring(2);
				var fingerCnt1 = -1;
				var fingerCnt2 = -1;
				for(var i=0;i<frame.hands.length;i++) {
					if(frame.hands[i].id == hID1) {
						fingerCnt1 = frame.hands[i].fingers ? frame.hands[i].fingers.length : -1;
					}else if(frame.hands[i].id == hID2) {
						fingerCnt2 = frame.hands[i].fingers ? frame.hands[i].fingers.length : -1;
					}
				}

				if(fingerCnt1 == 0 && fingerCnt2 == 0) {
					var pnode  = latestIDs[selectedNodes[key].key].node;
					var pnode2 = latestIDs[selectedNodes[key].another].node;
					var px  = parseInt(pnode.css('left').replace("px", ""));
					var py  = parseInt(pnode.css('top').replace("px", ""));
					var px2 = parseInt(pnode2.css('left').replace("px", ""));
					var py2 = parseInt(pnode2.css('top').replace("px", ""));
					var lastPx  = latestIDs[selectedNodes[key].key].lastX;
					var lastPy  = latestIDs[selectedNodes[key].key].lastY;
					var lastPx2 = latestIDs[selectedNodes[key].another].lastX;
					var lastPy2 = latestIDs[selectedNodes[key].another].lastY;
					if(lastPx != -999 && lastPy != -999 && lastPx2 != -999 && lastPy2 != -999) {
						var diffX  = px < px2 ? lastPx - px : lastPx2 - px2;
						var diffY  = px < px2 ? lastPy - py : lastPy2 - py2;
						var diffX2 = px < px2 ? lastPx2 - px2 : lastPx - px;
						var diffY2 = px < px2 ? lastPy2 - py2 : lastPy - py;
						var node = selectedNodes[key].node;
						var style = node[0].currentStyle || document.defaultView.getComputedStyle(node[0], '')
						var w1 = parseInt(style.width.replace("px", ""));
						var h1 = parseInt(style.height.replace("px", ""));
						var newW = w1 + diffX-diffX2;
						var newH = h1 + diffY-diffY2;
						node.css('width', newW+"px");
						node.css('height', newH+"px");
					}
				}
			}
		}
	});

	$compileProvider.directive('mrDispMilli', function() {
		return function(scope, element, attrs) {
			var mrDisp = attrs.mrDispMilli.split(",");
			wmm = new Number(mrDisp[0]);
			hmm = new Number(mrDisp[1]);
		}
	});
	
	$compileProvider.directive('mrNode', function() {
		return function(scope, element, attrs) {
			mrNodes.push(element);
			angular.element(element).bind("mouseover", function() {
			});

			angular.element(element).bind("mouseout", function() {
			});
		}
	});

	$compileProvider.directive('mrButton', function() {
		return function(scope, element, attrs) {
			mrButtons.push(element);
		}
	});

});
