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
				text = "List of the 50 largest U.S. cities in order of Rent:Buy Ratio in Q1 2011";
				break;
				
			case "rent":
				text = "Median annualized rent for two-bedroom apartments, condominiums and townhomes listed on Trulia.com";
				break;
			case "price":
			case "buy":
				text = "Median list price for two-bedroom apartments, condominiums and townhomes listed on Trulia.com";
				break;
			case "population":
				text = "Population data from the US Census Bureau (June 2009)";
				break;
				
			case "unemployment":
				text = "Percentage of labor force in U.S. metro that is unemployed (Source: BLS.gov, Nov 2010)";
				break;
				
			case "jobgrowth":
				text = "One-year job growth projections for U.S. metros (Source: Moody's Analytics, Dec 2010)";
				break;
				
			case "foreclosure":
				text = "Total foreclosure filings in a month divided by housing units in a city (Source: RealtyTrac.com, Nov 2010)";
				break;
			case "ratio":
				text = "Trulia calculates the price-to-rent ratio for the 50 largest U.S. cities using the median list price compared with the median rent on two-bedroom apartments, condominiums and townhomes listed on Trulia.com";
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
	// var colors = ["#99ca3c", "#99ca3c", "#84c175", "#74bb98", "#5cb4c2", "#51aee1"];
	
	// colorbrewer red to yellow to green
	var colors = ["rgb(215,48,39)", "rgb(252,141,89)", "rgb(254,224,139)", "rgb(217,239,139)", "rgb(145,207,97)", "rgb(26,152,80)"];
	colors.reverse();
	
	if (currentType == "price_rent_ratio") {
	  if (v < 10) return colors[0];
	  if (v < 15) return colors[1];
	  if (v < 20) return colors[2];
	  if (v < 25) return colors[3];
	  if (v < 30) return colors[4];
	  if (v < 35) return colors[5];
	  else return colors[5];
	} 
	else if (currentType == "annual_rent") {
	  if (v < 10000) return colors[0];
	  if (v < 15000) return colors[1];
	  if (v < 20000) return colors[2];
	  if (v < 25000) return colors[3];
	  if (v < 30000) return colors[4];
	  if (v < 35000) return colors[5];
	  else return colors[5];
	}
	else if (currentType == "list_price") {
	  if (v < 100000) return colors[0];
	  if (v < 200000) return colors[1];
	  if (v < 30000) return colors[2];
	  if (v < 400000) return colors[3];
	  if (v < 500000) return colors[4];
	  if (v < 6000000) return colors[5];
	  else 	return colors[5];
	} 
};

// round dollar amounts into K and M figures
function monetize(d, nodollar) {

  var suffix = (d / 1000) > 999 ? (parseInt(d / 100000) / 10) + "M" : 
		   (d / 1000) >= 1 ? parseInt(d / 1000) + "K" : 
			parseInt(d);
			
	var prefix = nodollar ? "" : "$";
	
	return prefix + suffix;
};

// round the dollar amounts into ranges
function range(d, increment, money) {
	var q = Math.floor(d / increment) * increment;
	
	if (money) {
		return monetize(q) + " - " + monetize(q + increment);
	} else {
		return "$" + q + " - $" + (q + increment);	
	}
}

// any number parsing
function getText(d, type) {
	switch(type) {
		case "rent":
			return range(d/12, 500);
		case "buy":
			return range(d, 100000, true);
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
	if (ratio < 10) {
		return "More affordable to buy";
	}
	else if (ratio > 30) {
		return "Much more affordable to rent";
	}
	else if (ratio < 15) {
		return "Affordable to buy";
	}
	else if (ratio >= 15 && ratio < 20) {
		return "Renting is less expensive,<br/>but buying might be better";
	}
	else if (ratio >= 20) {
		return "More affordable to rent";
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
	 + "<br />Rent:Buy Ratio: <span class='tooltipValue'>" + d.ratio + "</span>"
	 + "<br />Rent: <span class='tooltipValue'>" + range(d.rent / 12, 500) + "</span>"
	 + "<br />Buy: <span class='tooltipValue'>" + range(d.buy, 100000, true) + "</span>"
	 + "<br /><br />Population: <span class='tooltipValue'>" + monetize(d.pop, true) + "</span>"
	 + "<br />Job Growth: <span class='tooltipValue'>" + getText(d.jobgrowth, "jobgrowth") + "</span>"
	 + "<br />Foreclosure Rate: <span class='tooltipValue'>" + d.foreclosure + "%" + "</span>"
	 + "<br />Unemployment Rate: <span class='tooltipValue'>" + getText(d.unemployment, "unemployment") + "</span></div>";
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
