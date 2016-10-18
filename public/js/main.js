var ripple = {
	chart: null, 
	ipAddresses: [], 
	ipAddressesHTML: null
}; 


// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

var loadSuggestions = function (inputValue){
	// Look for the value 
	var results = search(inputValue, ripple.ipAddresses);
	console.log(results);

	var newIPSuggetions = $('<ul>').addClass('search__ipSuggestions'); 

	var i; 

	for (i = 0; i < results.length; i++){
		newIPSuggetions.append('<li class="ipSuggestions__item">' + results[i] + '</li>'); 
	}

	$('.search__ipSuggestions').replaceWith(newIPSuggetions); 
	addIPSuggestionsListener();
}

function onSearch(inputValue, debounceFunc){
	console.log('onSearch'); 
	$('search__ipSuggestions').show();
	if (inputValue.length == 0 || $.trim(inputValue) == ''){
		$('.search__ipSuggestions').replaceWith(ripple.ipAddressesHTML); 
	} else {
		if (debounceFunc){
			debounce(function(inputValue){
				loadSuggestions(inputValue); 
			}, 300); 
		} else{
			loadSuggestions(inputValue); 
		}
	}
}

function search(inputValue, ipAddresses){
	var low = 0; 
	var high = ipAddresses.length - 1; 
	var mid; 

	var inputLen = inputValue.length;

	var currWord;
	var prefix; 

	var results = []; 

	while (low <= high){
		mid = Math.floor((low + high)/2); 
		currWord = ipAddresses[mid];
		prefix = currWord.substring(0, inputLen);

		if (inputValue < prefix){
			high = mid - 1; 
		} else if (inputValue > prefix){
			low = mid + 1; 
		} else{
			// Backtrack to find all ip address starting w/ current input value 
			while (prefix === inputValue){
				mid--; 
				
				if (mid >= 0){
					currWord = ipAddresses[mid]; 
					prefix = currWord.substring(0, inputLen); 
				} else{
					break;
				}
			}

			// Reset values 
			mid++;
			currWord = ipAddresses[mid]; 
			prefix = currWord.substring(0, inputLen); 

			// Add all words w/ prefix to results 
			while (prefix === inputValue){
				results.push(currWord); 
				mid++;
				
				if (mid < ipAddresses.length){
					currWord = ipAddresses[mid]; 
					prefix = currWord.substring(0, inputLen); 
				} else{
					break;
				}
			}

			break;
		}
	}

	return results;
}

$(document).ready(function(){
	$.get('/ip', function(data){
		ripple.ipAddresses = data.Fwd; 
		var numIPAddresses = ripple.ipAddresses.length; 

		var i; 

		for (i = 0; i < numIPAddresses; i++){
			$('.search__ipSuggestions').append('<li class="ipSuggestions__item">' + ripple.ipAddresses[i] + '</li>'); 
		}

		ripple.ipAddressesHTML = $('search__ipSuggestions'); 

		addIPSuggestionsListener();

		initSearch(); 
	});
});

function addIPSuggestionsListener(){
	$('.search__ipSuggestions').on('click', '.ipSuggestions__item', function(){
			var ipAddress = $(this).text();
			$('.search__ipAddress').val(ipAddress);

			$('.search__ipSuggestions').hide();

			getLogs(ipAddress); 
		});
}

function initSearch(){
	var ipSearchBox = $('.search__ipAddress');
	ipSearchBox.focus(); 

	var input = document.createElement('input');

	if (typeof input.incremental != 'undefined') {
	    ipSearchBox.on('search', function(){
			onSearch($(this).val());
		}); 
	} else {
		ipSearchBox.on('keyup', function(){
			onSearch($(this).val(), true); 
		}); 
	}
}

function getLogs(ipAddress){
	$('.ipAddress').text('IP Address: ' + ipAddress); 
	$.get('/logs/' + ipAddress, function(data){
		console.log(data);

		createChart(data.Timestamp); 
	}, 'json'); 
}

function createChart(requestTimes){
	var ctx = $('#chart__requestsForIP');

	var structuredData = {};
	var labels = [];
	var data = []; 
	var time;

	var i; 

	for (i = 0; i < requestTimes.length; i++){
		console.log(requestTimes[i]) 
		// yyyy-mm-dd hh:mm:ss
		time = requestTimes[i].substring(0, 19); 
		if (structuredData[time] !== undefined){
			structuredData[time]++; 
		} else{
			structuredData[time] = 1; 
			labels.push(time); 
		}
	}

	for (i = 0; i < labels.length; i++){
		data.push(structuredData[labels[i]]); 
	}

	var barData = {
		labels: labels,
	    datasets: [
	        {
	        	label: 'Requests Per Second', 
	            backgroundColor: 'rgba(255, 99, 132, 0.9)',
	            borderColor: 'rgba(0, 0, 0, 1)',
	            borderWidth: 1,
	            data: data,
	        }
	    ]
	};

	var barChart = new Chart(ctx, {
	    type: 'bar',
	    data: barData,
	    options: {
	    	scales: {
	            yAxes: [{
	                ticks: {
	                    min: 0,
	                    stepSize: 1
	                }
	            }]
	        }
	    }
	});

	if (ripple.chart !== null){
		ripple.chart.destroy();
	}
	ripple.chart = barChart; 
}