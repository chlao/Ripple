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

var loadSuggestions = function (inputValue, ipAddresses){
	// Look for the value 
	var results = search(inputValue, ipAddresses);
	console.log(results);

	var newIPSuggetions = $('<ul>').addClass('search__ipSuggestions'); 

	var i; 

	for (i = 0; i < results.length; i++){
		newIPSuggetions.append('<li class="ipSuggestions__item">' + results[i] + '</li>'); 
	}

	$('.search__ipSuggestions').replaceWith(newIPSuggetions); 
	addIPSuggestionsListener();
}

function onSearch(inputValue, ipAddresses, debounceFunc){
	if (inputValue.length == 0 || $.trim(inputValue) == ''){
		//$('#search__suggestions').css('display', 'none'); 
	} else {
		if (debounceFunc){
			debounce(function(inputValue, ipAddresses){
				loadSuggestions(inputValue, ipAddresses); 
			}, 300); 
		} else{
			loadSuggestions(inputValue, ipAddresses); 
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
		var ipAddresses = data.Fwd; 
		var numIPAddresses = ipAddresses.length; 

		var i; 

		for (i = 0; i < numIPAddresses; i++){
			$('.search__ipSuggestions').append('<li class="ipSuggestions__item">' + ipAddresses[i] + '</li>'); 
		}

		addIPSuggestionsListener();

		initSearch(ipPAddresses); 
	});
});

function addIPSuggestionsListener(){
	$('.search__ipSuggestions').on('click', '.ipSuggestions__item', function(){
			var ipAddress = $(this).text();
			$('.search__ipAddress').val(ipAddress);

			getLogs(ipAddress); 
		});
}

function initSearch(ipAddresses){
	var ipSearchBox = $('.search__ipAddress');
	ipSearchBox.focus(); 

	var input = document.createElement('input');

	if (typeof input.incremental != 'undefined') {
	    ipSearchBox.on('search', function(){
			onSearch($(this).val(), ipAddresses);
		}); 
	} else {
		ipSearchBox.on('keyup', function(){
			onSearch($(this).val(), ipAddresses, true); 
		}); 
	}
}

function getLogs(ipAddress){
	console.log(ipAddress)
	$.get('/logs/' + ipAddress, function(data){
		console.log(data);
	}, 'json'); 
}