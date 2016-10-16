/*
function getLogs(){
	$.get('/logs', function(data){
		
	}); 
}*/

$(document).ready(function(){
	$.get('/ip', function(data){
		console.log(data.Fwd);
	});
});
