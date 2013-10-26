function add0(time){
if(time<10){
return "0"+time;
}else{
return time;
}
}
var interval = 1000;
function ShowCountDown(year,month,day,hourd,minuted)
{
var now = new Date();
var endDate = new Date(year, month-1, day, hourd, minuted);
var leftTime=endDate.getTime()-now.getTime();
var leftsecond = parseInt(leftTime/1000);
var day=Math.floor(leftsecond/(60*60*24)); 
day = day < 0 ? 0 : day;
var hour=Math.floor((leftsecond-day*24*60*60)/3600);
hour = hour < 0 ? 0 : hour;
var minute=Math.floor((leftsecond-day*24*60*60-hour*3600)/60);
minute = minute < 0 ? 0 : minute;
var second=Math.floor(leftsecond-day*24*60*60-hour*3600-minute*60);
second = second < 0 ? 0 : second;
var day2 = add0(day)
var hour2 = add0(hour)
var minute2 = add0(minute)
var second2 = add0(second)
$("#day").html(day2);
$("#hour").html(hour2);
$("#min").html(minute2);
$("#sec").html(second2);
}