function updateParagraph(){
    document.getElementById("mypara").innerHTML = "This is now updated";
}

document.getElementById("mybut").addEventListener("click", updateParagraph);

/*
var c = document.getElementById("chart");
var ctx = c.getContext("2d");
ctx.beginPath();
ctx.arc(100, 40, 50, 0, 6);
ctx.stroke(); 
*/