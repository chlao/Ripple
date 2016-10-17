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

var loadSuggestionsDebounce = debounce(function(suggestions){
	loadSuggestions(suggestions); 
}, 300); 

function onSearch(inputValue, ipAddresses, debounceFunc){
	// Look for the value 
	var results = search(inputValue, ipAddresses);
	console.log(results);

	/*
	if (debounceFunc){
		callback = loadSuggestionsDebounce; 
	}

	if (c.length == 0 || $.trim(c) == ''){
		$('#search__suggestions').css('display', 'none'); 
	} else {
		$.ajax({
			url: '',  
			success: callback
		}); 
	}
	*/
}

function search(inputValue, ipAddresses){
	var sortedIPAddresses = mergeSort(ipAddresses);
	console.log(sortedIPAddresses);

	var inputLen = inputValue.length;

	var currIndex; 
	var currWord; 

	var low = 0; 
	var high = sortedIPAddresses.length - 1; 
	var mid; 

	var results = [];

	while (low < high){
		mid = Math.floor((low + high)/2);
		currWord = sortedIPAddresses[mid];
		prefix = currWord.substring(0, inputLen);

		if (inputValue < prefix){
			high = mid - 1; 
		} else if (inputValue > prefix){
			low = mid + 1; 
		} else{
			currIndex = mid; 

			// Backtrack to find all ip address starting w/ current input value 
			while (prefix === inputValue){
				currIndex--; 
				
				if (currIndex >= 0){
					currWord = sortedIPAddresses[currIndex]; 
					prefix = currWord.substring(0, inputLen); 
				} else{
					break;
				}
			}

			// Reset values 
			currIndex++;
			currWord = sortedIPAddresses[currIndex]; 
			prefix = currWord.substring(0, inputLen); 

			// Add all words w/ prefix to results 
			while (prefix === inputValue){
				results.push(currWord); 
				currIndex++;
				
				if (currIndex < sortedIPAddresses.length){
					currWord = sortedIPAddresses[currIndex]; 
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

	return parseInt(ipAddressLeft[i]) < parseInt(ipAddressRight[i]);
}

function merge(leftArr, rightArr){
  var mergedArr = []; 
  var elem; 
  
  while (leftArr.length && rightArr.length){ 
	if(compareIPs(leftArr[0], rightArr[0])){
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

		for (i = 0; i < numIPAddresses; i++){
			$('.search__ipSuggestions').append('<li class="ipSuggestions__item">' + ipAddresses[i] + '</li>'); 
		}

		$('.search__ipSuggestions').on('click', '.ipSuggestions__item', function(){
			console.log($(this).text());
			// Search 
			getLogs($(this).text()); 
		});

		initSearch(ipAddresses); 
	});
});

function initSearch(ipAddresses){
	var ipSearchBox = $('.search__ipAddress')
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
	$.get('/logs', ipAddress, function(data){
		
	}, 'json'); 
}