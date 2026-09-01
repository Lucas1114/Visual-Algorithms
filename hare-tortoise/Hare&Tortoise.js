var NS = "http://www.w3.org/2000/svg";

var svg=document.getElementById('lp_svg')
var svg_rm=document.getElementById('rm_svg')

var string
var lens
var cycle_sta

var x=900;
var y=400;
var cx
var cy
var interval

var h_x=x-760 
var t_x=x-750
var h_y=y-20
var t_y=y+90

var pos_x
var line_itv

// the index of node where hare and tortoise are
var fast=0
var slow=0

var hare=document.getElementById('hare')
var tort=document.getElementById('tort')

var hare1=document.getElementById('hare1')

var tort1=document.getElementById('tort1')



var round
var fastspeed=2

var chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ'
var pre_len

// bar
var bar_rect = document.getElementById("bar_r");
var bar_txt = document.getElementById('bar_t')
var body = document.body;
var drag = false;
var tmpY = 0;
var mouseY = 0;
var newPos = 0; 
var random_len=10;

bar_rect.style.cursor='pointer'; 
bar_txt.style.cursor='pointer'; 
bar_rect.addEventListener("mousedown",eventHandler);
bar_txt.addEventListener("mousedown",eventHandler);

bar_rect.ondblclick=function(){generate_random()}
bar_txt.ondblclick=function(){generate_random()}

body.addEventListener("mousemove",eventHandler);
body.addEventListener("mouseup",eventHandler);

function eventHandler(event){
    
    event = event || window.event;
    switch(event.type){
        case "mousedown":
            if(event.target.id==bar_rect.id || event.target.id==bar_txt.id){
                drag = true;
                tmpX = parseInt(event.target.getAttribute("x"));
                mouseX = event.clientX;
            }
            break;
        case "mousemove":
            if(!drag) return;
            

            newPos = tmpX+event.clientX-mouseX;

            if(newPos<5){
                newPos = 1.5;            
            }else if(newPos>388){
                newPos = 390;
            }
            
            random_len=Math.ceil((newPos-1.5)/30)+3
            bar_txt.innerHTML=random_len
            if (random_len>=10){
                bar_txt.setAttribute("x",newPos+5)
            }else{
                bar_txt.setAttribute("x",newPos+10)
            }
            bar_rect.setAttribute("x",newPos);  
            bar_rect.style.fill='white'
            bar_txt.style.fill='gray'              
            break;
        case "mouseup":
            drag = false;
            break;
    }
}

function build_string(xx,yy,val,interval,square_side_length,i,part,stroke_color,fill_color,txt_color,seg){

    
    var svg= document.getElementById(part)
    var rect = document.createElementNS(NS, "rect"); 
    
    rect.setAttribute('id',seg+'r'+i.toString())  
    rect.setAttribute("x", xx + i*interval);  
    rect.setAttribute("y",yy);
    rect.setAttribute("width", square_side_length);
    rect.setAttribute("height", square_side_length);    
    rect.setAttribute("stroke", stroke_color);
    rect.setAttribute("fill", fill_color);
    rect.setAttribute("stroke-width","2")
    rect.style.cursor='pointer';  
    
    rect.onclick=function(){draw(i)}
    svg.appendChild(rect);
    
    var txt = document.createElementNS(NS, 'text'); 
    txt.setAttribute('id',seg+'t'+i.toString())  
    if (val.toString().length>1){
      txt.setAttribute('x', xx+interval*3/8+i*interval);
    }else{
      txt.setAttribute('x', xx+interval/2+i*interval);
    }
    txt.setAttribute("y", yy+0.5*interval);
    txt.setAttribute("font-size",15);
    txt.setAttribute("text-anchor","middle")
    txt.setAttribute("dominant-baseline", "middle")
    txt.setAttribute("fill",txt_color);
    txt.style.fontWeight='bold';
    txt.style.cursor='pointer';
    txt.innerHTML = val;  
    
    txt.onclick=function(){draw(i)}
    svg.appendChild(txt);
  }

function createString(){
    string=document.getElementById("string").value
    lens=string.length
    if (lens==0){
        alert('String box cannot be empty!\n\nPlease input a string or refresh web page to use default one: "ABCDEFGHIJ".')
        
      }else{

        pre_cycle=0
        svg.innerHTML=""
        document.getElementById('select_cycle').innerHTML=''
        
        
        for (var i=0;i<lens;i++){
            
            build_string(80,30,string[i],20,20,i,"select_cycle","black","white",'black',"string");
            
        }
    }
}

function generate_random() { 
    bar_rect.style.fill='gray'
    bar_txt.style.fill='white'
    pre_cycle=0
    svg.innerHTML=""  
    document.getElementById('select_cycle').innerHTML=''
    string= '';    
    lens=random_len
    for (var i=0; i<lens; i++){
        string+=chars[Math.floor(Math.random() * chars.length)];      
        build_string(80,30,string[i],20,20,i,"select_cycle","black","white",'black',"string");        
    }
}

var pre_cycle
function draw(cycle){   
    
    cycle_sta=cycle           
    document.getElementById('btn_area').style.display='block'

    if(cycle==0 || cycle==lens-1){
        alert('It would be meaningless if first or last letter is the cycle starting point.');
        return
    }
    
    document.getElementById('stringr'+pre_cycle.toString()).setAttribute('fill','white')
    document.getElementById('stringt'+pre_cycle.toString()).setAttribute('fill','black')
    pre_cycle=cycle
    document.getElementById('stringr'+cycle.toString()).setAttribute('fill','black')
    document.getElementById('stringt'+cycle.toString()).setAttribute('fill','white')
    
    svg.innerHTML=""
        
    
    interval=2*Math.PI/(lens-cycle)
    line_itv=500/cycle
    merge_idx=(lens-cycle)*Math.ceil((cycle+1)/(lens-cycle))
    
    reset()      
    
    var newLine = document.createElementNS(NS,'line');
    newLine.setAttribute('id','line2');
    newLine.setAttribute('x1',x-700);
    newLine.setAttribute('y1',y);
    newLine.setAttribute('x2',x);
    newLine.setAttribute('y2',y);
    newLine.setAttribute("stroke", "black")
    newLine.setAttribute("stroke-width", "4")
    svg.appendChild(newLine);
    
    var circle = document.createElementNS(NS, "circle");  
    circle.setAttribute("cx",x);  
    circle.setAttribute("cy",y);
    circle.setAttribute("r", "200");        
    circle.setAttribute("stroke", "black");
    circle.setAttribute("stroke-width","4")
    circle.setAttribute("fill", "white");
    svg.appendChild(circle);
    
    for (var i=0;i<cycle;i++){
        
        build_non_cycle(string[i],i,"black","white","black",cycle)
        
    }  
    
    for (var i=cycle;i<lens;i++){
        build_cycle(string[i],i,"black","white","black",cycle)
    }    
}

function build_non_cycle(val,i,stroke_color,fill_color,txt_color,cycle){    
    
    var circle = document.createElementNS(NS, "circle");       
    circle.setAttribute("cx",x-700+i*500/cycle);  
    circle.setAttribute("cy",y);
    circle.setAttribute("r", "20");        
    circle.setAttribute("stroke", stroke_color);
    circle.setAttribute("stroke-width","4")
    circle.setAttribute("fill", fill_color);
    svg.appendChild(circle);
    
    var txt = document.createElementNS(NS, 'text'); 
    txt.setAttribute('x', x-700-12+i*500/cycle); 
    txt.setAttribute("y", 5+y);
    txt.setAttribute("font-size","14");
    txt.setAttribute("fill",txt_color);    
    txt.innerHTML = (i).toString()+' '+val;
    svg.appendChild(txt);   
}

function build_cycle(val,i,stroke_color,fill_color,txt_color,cycle){   
    
    var circle = document.createElementNS(NS, "circle");        
    circle.setAttribute("cx", x-200*Math.cos(interval*(i-cycle)));  
    circle.setAttribute("cy",y-200*Math.sin(interval*(i-cycle)));
    circle.setAttribute("r", "20");        
    circle.setAttribute("stroke", stroke_color);
    circle.setAttribute("stroke-width","4")
    circle.setAttribute("fill", fill_color);
    svg.appendChild(circle);

    var txt = document.createElementNS(NS, 'text'); 
    
    txt.setAttribute('x', x-12-200*Math.cos(interval*(i-cycle))); 
    txt.setAttribute("y", y+5-200*Math.sin(interval*(i-cycle)));
    txt.setAttribute("font-size","14");
    txt.setAttribute("fill",txt_color);
    txt.innerHTML = (i).toString()+' '+val;
    svg.appendChild(txt);      
}

function reset(){
    for (var i=0;i<5;i++){
        document.getElementById('track'+i.toString()).style.display="none"
    }

    fast=0
    slow=0
    fastspeed=2
    track_cnt=0
    clearInterval(round)     
    document.getElementById('fwd').disabled=false
    document.getElementById('bwd').disabled=false    
    document.getElementById('ctn').disabled=false
    
    svg_rm.innerHTML=""
    hare.setAttribute('transform',"translate("+h_x+","+h_y+")")
    svg.appendChild(hare)
    
    tort.setAttribute('transform',"translate("+t_x+","+t_y+")")
    svg.appendChild(tort)    
    //因为hare在def中，必须在hare被append到svg后，否则下面这句执行时会报错，估计是必须group先有效，
    //parent node不在svg中时，直接调用child node会报错
    document.getElementById('hare_speed').innerHTML='2'
    
}  

function pointer_move(part,speed,k,pos_y,pointer_r){
    document.getElementById('fwd').disabled=true
    document.getElementById('bwd').disabled=true
    var animation=setInterval(move,1)       
    var cnt=0
    var pointer=document.getElementById(part)     
    svg.appendChild(pointer)    
    
    function move(){
        if (cnt==201){
            if (part=='hare'){
                fast=k   
                
            }else{
                slow=k                 
            }
            document.getElementById('fwd').disabled=false
            document.getElementById('bwd').disabled=false
            clearInterval(animation);
            
        }else{
            if (Math.round(k)<=cycle_sta) {
                pos_x=h_x+line_itv*k
                pointer.setAttribute("transform","translate("+pos_x+","+pos_y+")");
            }else{              
                cx=x-pointer_r*Math.cos(interval*(k-cycle_sta))-60
                cy=y-pointer_r*Math.sin(interval*(k-cycle_sta))+40
                pointer.setAttribute("transform","translate("+cx+","+cy+")");
            }
            k+=speed/200   
            cnt+=1 
        }    
    }    
}

function pointer_continuous_move(part,speed,k,pos_y,pointer_r){
    
    var animation=setInterval(move,1)       
    var cnt=0
    var pointer=document.getElementById(part)     
    svg.appendChild(pointer)    

    function move(){
        if (cnt==201){
            if (part=='hare'){
                fast=k   
                
            }else{
                slow=k                 
            }
            
            clearInterval(animation);
        }else{
            if (k<cycle_sta) {
                pos_x=h_x+line_itv*k
                pointer.setAttribute("transform","translate("+pos_x+","+pos_y+")");
            }else{              
                cx=x-pointer_r*Math.cos(interval*(k-cycle_sta))-60
                cy=y-pointer_r*Math.sin(interval*(k-cycle_sta))+40
                pointer.setAttribute("transform","translate("+cx+","+cy+")");
            }
            k+=speed/200   
            cnt+=1 
        }    
    }    
}

var track_cnt=0
function run(){
    document.getElementById('fwd').disabled=true
    document.getElementById('bwd').disabled=true
    document.getElementById('ctn').disabled=true
    if (fastspeed==1 && parseInt(slow)==cycle_sta){        
        reset()
    }
    round=setInterval(sp,1500);
    function sp(){
        if (fastspeed==1 && parseInt(slow)==cycle_sta){
            clearInterval(round);        
            document.getElementById('fwd').disabled=false
            document.getElementById('bwd').disabled=false  
            document.getElementById('ctn').disabled=false
            alert("Animation ended, click 'Stop & Reset' button to return to initial state.")
            
            
        }else{
            
            if (fastspeed==2 && (fast-slow)%(lens-cycle_sta) <1 && Math.round(slow)>=cycle_sta){
                
                if (track_cnt<5){
                    track_draw()
                    track_cnt+=1
                }else{
                    document.getElementById('hare_speed').innerHTML='1'
                    fastspeed=1
                    merge_cx=cx
                    merge_cy=cy
                    slow=0
                    tort.setAttribute('transform',"translate("+t_x+","+t_y+")")
                    svg.appendChild(tort) 
                }
            }else{
                pointer_continuous_move('hare',fastspeed,fast,h_y,260)  
                pointer_continuous_move('tort',1,slow,t_y,140) 
            }            
        }
    }
}







var merge_idx
var merge_cx
var merge_cy
var round_num

function step(){
    if (fastspeed==1 && Math.round(slow)==cycle_sta){
        alert("Animation ended, click 'Stop & Reset' button to return to initial state.")
             
        
    }else{       
        if (fastspeed==2 && (fast-slow)%(lens-cycle_sta) <1 && Math.round(slow)>=cycle_sta){
            
            round_num=parseInt(slow)/(lens-cycle_sta)
            if (track_cnt<5){
                track_draw()
                track_cnt+=1
            }else{
                document.getElementById('hare_speed').innerHTML='1'
                
                fastspeed=1   
                merge_cx=cx
                merge_cy=cy
                slow=0
                tort.setAttribute('transform',"translate("+t_x+","+t_y+")")
                svg.appendChild(tort) 
            }
        }else{
            pointer_move('hare',fastspeed,fast,h_y,260)  
            pointer_move('tort',1,slow,t_y,140) 
            
        }      
          
    }
    
}

function step_back(){
    if (fastspeed==2 && Math.round(slow)==0){
        reset()        
        
    }else{
        if (fastspeed==1 && Math.round(slow)==0){
            document.getElementById('hare_speed').innerHTML=2
            fastspeed=2
            slow=(merge_idx-cycle_sta)%(lens-cycle_sta)+cycle_sta            
            tort.setAttribute('transform',"translate("+merge_cx+","+merge_cy+")")
            svg.appendChild(tort) 
        }else{
            if (fastspeed==2 && track_cnt!=0){
                track_cnt=0
                for (var i=0;i<5;i++){
                    document.getElementById('track'+i.toString()).style.display="none"
                }
                svg_rm.innerHTML=''
            }
            pointer_move('hare',-1*fastspeed,fast,h_y,260)  
            pointer_move('tort',-1,slow,t_y,140) 
           
        }            
    } 
}

var ex
var ey
// 半径200变成20，10倍； 线长500变成40，12.5倍
function track(tx,ty,color_line,color_arc1,color_arc2) {  
    var newLine = document.createElementNS(NS,'line');
    newLine.setAttribute('id','line1');
    newLine.setAttribute('x1',tx-60);
    newLine.setAttribute('y1',ty);
    newLine.setAttribute('x2',tx-20);
    newLine.setAttribute('y2',ty);
    newLine.setAttribute("stroke", color_line)
    newLine.setAttribute("stroke-width", "4")
    svg_rm.append(newLine);

    var large_arc
    if ((merge_idx-cycle_sta)<(lens-merge_idx)){
        large_arc=0
    }else{
        large_arc=1
    }
    
    if (merge_idx==lens){
        
        var circle=document.createElementNS(NS,'circle')

        circle.setAttribute("cx",tx);  
        circle.setAttribute("cy",ty);
        circle.setAttribute("r", "20");        
        circle.setAttribute("stroke", color_arc2);
        circle.setAttribute("stroke-width","4")
        circle.setAttribute("fill", "none");
        
        svg_rm.appendChild(circle)
    }else{
    
        var arc1 = document.createElementNS(NS, 'path');
        arc1.setAttribute('Id','arc1')
        ex=tx-20*Math.cos(interval*(merge_idx-cycle_sta))
        ey=ty-20*Math.sin(interval*(merge_idx-cycle_sta))        
        arc1.setAttribute("d", "M"+(tx-20)+" "+ty+" A20 20 0 "+large_arc+" 1 "+ex+" "+ey+"")
        arc1.setAttribute("stroke",color_arc1)
        arc1.setAttribute("stroke-width","4")
        arc1.setAttribute("fill","none")
        svg_rm.appendChild(arc1)

        var arc2 = document.createElementNS(NS, 'path');
        arc2.setAttribute('Id','arc2')
        ex=tx-20*Math.cos(interval*(merge_idx-cycle_sta))
        ey=ty-20*Math.sin(interval*(merge_idx-cycle_sta))        
        arc2.setAttribute("d", "M"+ex+" "+ey+" A20 20 0 "+(1-large_arc)+" 1 "+(tx-20)+" "+ty+"")
        arc2.setAttribute("stroke",color_arc2)
        arc2.setAttribute("stroke-width","4")
        arc2.setAttribute("fill","none")
        svg_rm.appendChild(arc2)
    }
}

function plus(x,y,val){
    var plus=document.createElementNS(NS,'text')
    plus.setAttribute('x',x)    
    plus.setAttribute("y",y+20);
    plus.setAttribute("font-size","60");
    plus.setAttribute("fill",'black');      
    plus.innerHTML = val;
    svg_rm.appendChild(plus)
}

function multiply(x,y){
    var mtp=document.createElementNS(NS,'text')
    mtp.setAttribute('x',x)    
    mtp.setAttribute("y",y);
    mtp.setAttribute("font-size","70");
    mtp.setAttribute("fill",'black');      
    mtp.innerHTML = '+';
    mtp.setAttribute('transform','rotate(45 '+x+' '+y+')')
    svg_rm.appendChild(mtp)
}

for (var i=0;i<5;i++){
    document.getElementById('track'+i.toString()).style.display="none"
}

function track_draw(){
    document.getElementById('track'+track_cnt.toString()).style.display="";
    
    switch(track_cnt){
        case 0:
            tort1.setAttribute('transform',"translate(120,60)")
            svg_rm.appendChild(tort1) 

            hare1.setAttribute('transform',"translate(370,60)")
            svg_rm.appendChild(hare1)
    
            track(100,100,"blue","blue","lightgrey")       
            track(360,100,'red','red','lightgrey')
            plus(390,100,'+')    
            track(490,100,'lightgrey','red','red')            
            break

        case 1:
            multiply(120,100)
            plus(200,100,'2')
            plus(260,100,'=')                     
            
            if (round_num>1){
                multiply(520,100)
                plus(600,100,round_num)
            }
            break

        case 2:
            track(100,160,"blue","blue","lightgrey")
            plus(130,160,'+')
            track(230,160,"blue","blue","lightgrey")
            plus(260,160,'=')    
            track(360,160,'red','red','lightgrey')
            plus(390,160,'+')    
            track(490,160,'lightgrey','red','red')

            if (merge_idx==lens){           

                if (round_num>1){
                    multiply(520,160)
                    plus(600,160,round_num)    
                }
            }else{

                if (round_num>1){
                    plus(520,160,'+')    
                    track(620,160,'lightgrey','red','red')             
                    
                }
                if (round_num>2){
                    multiply(650,160)
                    plus(730,160,round_num-1)
                }
            }           
            break

        case 3:
            track(100,220,"blue","blue","lightgrey")
            plus(130,220,'+')
            track(230,220,"lightgrey","lightgrey","lightgrey")
            plus(260,220,'=')    
            track(360,220,"lightgrey","lightgrey",'lightgrey')
            plus(390,220,'+')    
            track(490,220,'lightgrey','red','red')            
            
            if (merge_idx==lens){
                track_cnt+=1
                document.getElementById('track'+track_cnt.toString()).style.display="";

                if (round_num>1){
                    multiply(520,220)
                    plus(600,220,round_num)
    
                }
            }else{
                if (round_num>1){
                    plus(520,220,'+')    
                    track(620,220,'lightgrey','red','red')             
                    
                }
                if (round_num>2){
                    multiply(650,220)
                    plus(730,220,round_num-1)    
                }
            }
            break

        case 4:
            track(100,280,"blue","lightgrey","lightgrey")
            plus(130,280,'+')
            track(230,280,"lightgrey","lightgrey","lightgrey")
            plus(260,280,'=')    
            track(360,280,"lightgrey","lightgrey",'lightgrey')
            plus(390,280,'+')    
            track(490,280,'lightgrey','lightgrey','red')

            if (round_num>1){
                plus(520,280,'+')    
                track(620,280,'lightgrey','red','red')       
            }
            if (round_num>2){
                multiply(650,280)
                plus(730,280,round_num-1)
            }          
            break               
    }    
}

function menu(){
    var sub_menu = document.getElementById('menu');
    var dis_v = sub_menu.style.display;    
    if(dis_v == "block")
        sub_menu.style.display = "none";
    else
        sub_menu.style.display = "block";        
}