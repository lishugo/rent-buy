var isIE = (/msie/i.test(navigator.userAgent) && !/opera/i.test(navigator.userAgent)) || getURLVars().ie == "true";

function renderUI() {

	// turn the transport method radiobuttons into tab buttons
	$("#colorRadio").buttonset().change( function(e) {
		currentColorScale = e.target.id;
		updateLegend();

		vis.render();
	});

	$("#scaleRadio").buttonset().change( function(e) {
		currentSizeScale = e.target.id;
		updateMetric();
		updateLegend();
		
		vis.render();
	});
	
	$("#leftPicker").buttonset().change( function(e) {
		lcy = rcy = 0;
		leftWidth = e.target.id.toString().split("_").pop();
		
		chart.render();
	});
	
	$("#rightPicker").buttonset().click( function(e) {
		lcy = rcy = 0;
		rightWidth = e.target.id.toString().split("_").pop();
		
		chart.render();
	});
	
	$(".ui-button").tipsy({title: getButtonTooltipText(), fade:true});
	
	addScrollButton();
}

// if it's ie, we just swap between static images
function renderIEUI() {
	
	var fig = document.getElementById("fig");
	
	var mapImage = document.createElement("img"),
		chartImage = document.createElement("img");
		
	var chartDiv = document.getElementById("stackChart");
	
	fig.appendChild(mapImage);
	chartDiv.appendChild(chartImage);
	
	var colorRadio = "ratio", scaleRadio = "population", leftPick = "ratio", rightPick = "buy";
	// turn the transport method radiobuttons into tab buttons
	$("#colorRadio").buttonset().change( function(e) {
		colorRadio = getType(e.target.id);
		
		mapImage.src = "images/map/" + colorRadio + "_" + scaleRadio + ".png";
	});

	$("#scaleRadio").buttonset().change( function(e) {
		scaleRadio = getType(e.target.id);
		
		mapImage.src = "images/map/" + colorRadio + "_" + scaleRadio + ".png";
	});
	
	$("#leftPicker").buttonset().change( function(e) {
		leftPick = getType(e.target.id);
		
		chartImage.src = "images/chart/" + leftPick + "_" + rightPick + ".png";
	});
	
	$("#rightPicker").buttonset().change( function(e) {
		rightPick = getType(e.target.id);

		chartImage.src = "images/chart/" + leftPick + "_" + rightPick + ".png";
	});
	
	mapImage.src = "images/map/" + colorRadio + "_" + scaleRadio + ".png";
	chartImage.src = "images/chart/" + leftPick + "_" + rightPick + ".png";
	
	$(".ui-button").tipsy({title: getButtonTooltipText(), fade:true, html: true});
	
	$("#clearMapButtons").height(20);
	
	addScrollButton();
}

function addScrollButton() {
  var floater = $("#floaterText");
  
  floater.click(function() {
    // window.scroll(0, 835);
    var max = 835;
    var current = document.body.scrollTop;
    var interval = setInterval(function() {
      window.scroll(0, current);
      if (current > max) {
        clearInterval(interval); 
      }
      current += 40;
    }, 1);
    
    floater.animate({
      bottom: "-60px"
    }, "fast", function() {
      floater.hide("fast");
    });
  });
  
  setTimeout( function() {
    if (document.body.scrollTop == 0) {
      floater.animate({
        bottom: "0px"
      }, "slow");
    }
  }, 2000);
  
  var checker = setInterval( function() {
    if (document.body.scrollTop > 400) {
      floater.animate({
        bottom: "-60px"
      }, "fast");
      
      clearInterval(checker);
    }
  }, 1000);
}

// initialize tip properties, and allow for custom gravity
function initializeTips() {
	
	$.fn.tipsy.defaults.html = true;
	$.fn.tipsy.defaults.fade = true;
	
	$.fn.tipsy.elementOptions = function(ele, options) {
		var contents = $(ele).attr("title"),
			position = contents.search("gravity='"),
			gravity = position >= 0 ? contents[position + 9] : "n";
		
		options.gravity = gravity ? gravity : "n";
		
		return options;
	};
}

function getButtonTooltipText() {
	return function() {
		var type = $(this).attr("for");
		type = type.split("_").pop();
		
		var text;
		switch (type) {
			case "city":
				text = "全国32个大中城市房地产租售比列表";
				break;
				
			case "rent":
				text = "每平米房租均价";
				break;
			case "price":
			case "buy":
				text = "每平米新房均价";
				break;
			case "population":
				text = "各城市人口数量";
				break;
			case "ratio":
				text = "全国大中城市租售比，每平米房价/(每平米房租*12)";
				break;
			
			default:
				text = "";
				break;
			
		}
		
		return text; // "<span class='tooltipButtonText'>" + text + "</span>";
	};
}

// initial parsing of the data
function processData() {
	city_lowres.forEach(function(s) {
	  if (city_stats[s.name]) {
	    var x = scale(s.location).x,
	        y = scale(s.location).y,
	        population = city_stats[s.name].population,
	        n = { 
				x: x, y: y, p: {x: x, y: y}, r: numToRad(population), 
				name: 			s.name, 
				rent: 			city_stats[s.name].annual_rent, 
				pop: 			city_stats[s.name].population, 
				buy: 			city_stats[s.name].list_price,
				ratio: 			city_stats[s.name].price_rent_ratio,
				jobgrowth: 		city_stats[s.name].job_growth,
				unemployment: 	city_stats[s.name].unemployment,
				foreclosure: 	city_stats[s.name].foreclosure,
				index: nodes.length
			};
	    nodes.push(n);
	    codeToNode[s.name] = n;
	  }
	});

	city_lowres.forEach(function(s) {
	  if (city_stats[s.name]) {
	    var borders = city_borders[s.name];
	    borders.forEach(function(b) {
	      if (codeToNode[s.name] && codeToNode[b] && s.name < b) {
	        var nodeA = codeToNode[s.name];
	        var nodeB = codeToNode[b];
	        links.push({sourceNode:nodeA, targetNode:nodeB, length:(nodeA.r + nodeB.r + 2)});
	      }
	    });
	  }
	});
};

// color scale
function col(v, forceType) {
	var currentType = forceType ? forceType : currentColorScale;
	
	// old trulia green to blue
	 //var colors = ["#99ca3c", "#99ca3c", "#84c175", "#74bb98", "#5cb4c2", "#51aee1"];
	//var colors = ["#e5302a", "#002940", "#2c594f", "#998a2f", "#ffa644", "#ffffff"];
	// colorbrewer red to yellow to green
	var colors = ["rgb(215,48,39)", "rgb(252,141,89)", "rgb(254,224,139)", "rgb(217,239,139)", "rgb(145,207,97)", "rgb(26,152,80)"];
	colors.reverse();
	
	if (currentType == "price_rent_ratio") {
	  if (v < 20) return colors[0];
	  if (v < 25) return colors[1];
	  if (v < 30) return colors[2];
	  if (v < 35) return colors[3];
	  if (v < 40) return colors[4];
	  if (v < 45) return colors[5];
	  else return colors[5];
	} 
	else if (currentType == "annual_rent") {
	  if (v < 20) return colors[0];
	  if (v < 25) return colors[1];
	  if (v < 30) return colors[2];
	  if (v < 35) return colors[3];
	  if (v < 40) return colors[4];
	  if (v < 45) return colors[5];
	  else return colors[5];
	}
	else if (currentType == "list_price") {
	  if (v < 7000) return colors[0];
	  if (v < 11000) return colors[1];
	  if (v < 15000) return colors[2];
	  if (v < 19000) return colors[3];
	  if (v < 23000) return colors[4];
	  if (v < 27000) return colors[5];
	  else 	return colors[5];
	} 
};

// round chinese yuan amounts into 万 and 百万 figures
function monetize(d, nodollar) {

  var suffix = (d / 10000) > 999 ? (parseInt(d / 100000) / 100) + "千万" : 
		   (d / 1000) > 999 ? parseInt(d / 1000000) + "百万" : 
			parseInt(d);
			
	var prefix = nodollar ? "" : "￥";
	
	return prefix + suffix;
};

// round the dollar amounts into ranges
function range(d, increment, money) {
	var q = Math.floor(d / increment) * increment;
	
	if (money) {
		return monetize(q) + " - " + monetize(q + increment);
	} else {
		return "￥" + q + " - ￥" + (q + increment);	
	}
}

// any number parsing
function getText(d, type) {
	switch(type) {
		case "rent":
			return range(d*60, 200);
		case "buy":
			return range(d, 200, true);
		case "ratio":
			return d;
		case "unemployment":
		case "jobgrowth":
		case "foreclosure":
			return d < .1 ? d : d + "%";
		default: 
			return d;
	}
};

// convert ratio number to an actual suggestion
function getRatioSuggestion(ratio) {
	if (ratio < 20) {
		return "买房合适些";
	}
	else if (ratio > 40) {
		return "绝对要租房，买不起啊";
	}
	else if (ratio < 25) {
		return "为了舒服些，还是买房吧";
	}
	else if (ratio >= 25 && ratio < 30) {
		return "租房买房差不多,<br/>一咬牙买了吧";
	}
	else if (ratio >= 30) {
		return "还是租吧";
	}
	else {
		return "";
	}
}

// return our tooltip inner html
function getTooltip(d, gravity) {
	gravity = gravity == undefined ? "n" : gravity;
	
	return "<div class='tooltip'><div class='tooltipTitle' gravity='" + gravity + "' >" + d.name + "</div>"
	 + "<div class='tooltipSuggestion'>" + getRatioSuggestion(d.ratio) + "</div>"
	 + "<br />租售比: <span class='tooltipValue'>" + d.ratio + "</span>"
	 + "<br />每月房租均价: <span class='tooltipValue'>" + range(d.rent * 60, 200) + "</span>"
	 + "<br />每平米房价均价: <span class='tooltipValue'>" + range(d.buy, 200, true) + "</span>"
	 + "<br /><br />人口: <span class='tooltipValue'>" + monetize(d.pop, true) + "</span></div>";
};

// normalize
function getType(s) {
	switch (s) {
		case "annual_rent":
		case "scale_annual_rent":
		case "right_rent":
		case "left_rent":
			return "rent";
			
		case "list_price":
		case "right_buy":
		case "left_buy":
		case "scale_list_price":
			return "buy";
			
		case "scale_population":
			return "population";
		
		case "price_rent_ratio":
		case "scale_price_rent_ratio":
		case "right_ratio":
			return "ratio";
			
		case "right_foreclosure":
		case "right_unemployment":
		case "right_jobgrowth":
			return s.split("_").pop();
		default:
			return s;
	}
}

// grab urlvariables
function getURLVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}
