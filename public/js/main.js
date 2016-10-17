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

	var currIndex; 
	var currWord;

	var comparisonValue; 

	var results = []; 

	while (low <= high){
		mid = Math.floor((low + high)/2); 
		currWord = ipAddresses[mid];
		prefix = currWord.substring(0, inputLen);

		comparisonValue = compareIPs(inputValue, prefix);

		if (comparisonValue === -1){
			high = mid - 1; 
		} else if (comparisonValue === 1){
			low = mid + 1; 
		} else{
			currIndex = mid; 

			// Backtrack to find all ip address starting w/ current input value 
			while (prefix === inputValue){
				currIndex--; 
				
				if (currIndex >= 0){
					currWord = ipAddresses[currIndex]; 
					prefix = currWord.substring(0, inputLen); 
				} else{
					break;
				}
			}

			// Reset values 
			currIndex++;
			currWord = ipAddresses[currIndex]; 
			prefix = currWord.substring(0, inputLen); 

			// Add all words w/ prefix to results 
			while (prefix === inputValue){
				results.push(currWord); 
				currIndex++;
				
				if (currIndex < ipAddresses.length){
					currWord = ipAddresses[currIndex]; 
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

function mergeSort(arr){
	var low, mid, high;
	var left, right;

	if (arr.length <= 1){
		return arr; 
	}

	low = 0; 
	high = arr.length; 
	mid = Math.floor((low+high)/2); 

	if (low < high){
		left = mergeSort(arr.slice(0, mid)); 
		right = mergeSort(arr.slice(mid, high)); 
		return merge(left, right); 
	}
}

function compareIPs(ipAddressA, ipAddressB){
	var ipAddressLeft = ipAddressA.split('.');
  	var ipAddressRight = ipAddressB.split('.'); 

  	var i = 0;  

  	while (parseInt(ipAddressLeft[i]) == parseInt(ipAddressRight[i])){
  		i++;
	}

	if (parseInt(ipAddressLeft[i]) < parseInt(ipAddressRight[i])){
		return -1; 
	} else if (parseInt(ipAddressLeft[i]) > parseInt(ipAddressRight[i])){
		return 1; 
	} else{
		return 0; 
	}
}

function merge(leftArr, rightArr){
  var mergedArr = []; 
  var elem; 
  
  while (leftArr.length && rightArr.length){ 
	if(compareIPs(leftArr[0], rightArr[0]) === -1){
      elem = leftArr.shift(); 
      mergedArr.push(elem); 
    } else {
      elem = rightArr.shift(); 
      mergedArr.push(elem); 
    }
  }

  return mergedArr.concat(leftArr, rightArr); 
}

$(document).ready(function(){
	$.get('/ip', function(data){
		var ipAddresses = data.Fwd; 
		var numIPAddresses = ipAddresses.length; 

		var i; 

		var sortedIPAddresses = mergeSort(ipAddresses);

		for (i = 0; i < numIPAddresses; i++){
			$('.search__ipSuggestions').append('<li class="ipSuggestions__item">' + sortedIPAddresses[i] + '</li>'); 
		}

		addIPSuggestionsListener();

		initSearch(sortedIPAddresses); 
	});
});

function addIPSuggestionsListener(){
	$('.search__ipSuggestions').on('click', '.ipSuggestions__item', function(){
			var ipAddress = $(this).text();
			console.log(ipAddress);
			$('.search__ipAddress').val(ipAddress);
			// Search 
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