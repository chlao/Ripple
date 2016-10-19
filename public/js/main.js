var ripple = {
	chart: null, 
	ipAddresses: []
}; 

$(document).ready(function(){
	$.get('/ip', function(data){
		ripple.ipAddresses = data.Fwd; 
		var numIPAddresses = ripple.ipAddresses.length; 

		var i; 

		for (i = 0; i < numIPAddresses; i++){
			$('.search__ipSuggestions--original').append('<li class="ipSuggestions__item">' + ripple.ipAddresses[i] + '</li>'); 
		}

		//addIPSuggestionsListener($('.search__ipSuggestions--original'));

		$('.search__ipSuggestions--original').on('click', '.ipSuggestions__item', function(){
			var ipAddress = $(this).text();
			$('.search__ipAddress').val(ipAddress);

			$('.search__ipSuggestions--original').hide();

			$('.search__ipSuggestions--results').append('<li class="ipSuggestions__item">' + ipAddress + '</li>'); 
			$('.search__ipSuggestions--results').show();

			getLogs(ipAddress); 
		});

		$('.search__ipSuggestions--results').on('click', '.ipSuggestions__item', function(){
			var ipAddress = $(this).text();
			$('.search__ipAddress').val(ipAddress);

			$('.search__ipSuggestions--results').empty().append('<li class="ipSuggestions__item">' + ipAddress + '</li>'); 
			$('.search__ipSuggestions--results').show();

			getLogs(ipAddress); 
		});

		initSearch(); 
	});
});

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

function addIPSuggestionsListener(ipAddressesList){
	ipAddressesList.on('click', '.ipSuggestions__item', function(){
		var ipAddress = $(this).text();
		$('.search__ipAddress').val(ipAddress);

		var currList; 

		if (ipAddressesList.hasClass('search__ipSuggestions--original')){
			currList = $('<ul>').addClass('search__ipSuggestions--results'); 
		} 

		curList.empty().append('<li class="ipSuggestions__item">' + ipAddress + '</li>'); 

		getLogs(ipAddress); 
	});
}

function initSearch(){
	var ipSearchBox = $('.search__ipAddress');
	ipSearchBox.focus(); 

	ipSearchBox.on('keyup', function(e){
		onSearch($(this).val()); 
	}); 
}

function onSearch(inputValue){
	var debounceFunc; 
	var newIPSuggestions; 

	var i; 

	if (inputValue.length == 0 || $.trim(inputValue) == ''){
		$('.search__ipSuggestions--results').empty().hide();
		$('.search__ipSuggestions--original').show();

		/*
		newIPSuggestions = $('<ul>').addClass('search__ipSuggestions'); 

		for (i = 0; i < ripple.ipAddresses.length; i++){
			newIPSuggestions.append('<li class="ipSuggestions__item">' + ripple.ipAddresses[i] + '</li>'); 
		}
		*/
		//$('.search__ipSuggestions').replaceWith(newIPSuggestions); 
		//addIPSuggestionsListener();
	} else {
		debounceFunc = debounce(loadSuggestions, 250);
		debounceFunc(inputValue); 
	}
}

function loadSuggestions(inputValue){
	// Look for the value 
	var results = search(inputValue, ripple.ipAddresses);

	//var newIPSuggestions = $('<ul>').addClass('search__ipSuggestions--results'); 
	var i; 

	$('.search__ipSuggestions--results').empty();

	for (i = 0; i < results.length; i++){
		$('.search__ipSuggestions--results').append('<li class="ipSuggestions__item">' + results[i] + '</li>'); 
	}

	//$('.search__ipSuggestions').replaceWith(newIPSuggestions); 
	//$('.search__ipSuggestions--original').after(newIPSuggestions); 
	$('.search__ipSuggestions--original').hide();
	$('.search__ipSuggestions--results').show();

	//addIPSuggestionsListener($('.search__ipSuggestions--results'));

	
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

function getLogs(ipAddress){
	$('.ipAddress').text('IP Address: ' + ipAddress); 
	$.get('/logs/' + ipAddress, function(data){
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
	            backgroundColor: '#F78B2D',
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