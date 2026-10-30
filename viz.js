
"use strict";
const $=s=>document.querySelector(s),W=1000,H=640;
const fmt=n=>new Intl.NumberFormat("es-ES").format(n);
function base(){
 const chart=$("#chart"),tip=$("#tip");
 const svg=d3.select(chart).append("svg").attr("viewBox","0 0 "+W+" "+H);
 const show=(e,html)=>{const r=chart.getBoundingClientRect();tip.innerHTML=html;tip.style.opacity="1";tip.style.left=Math.max(0,Math.min(e.clientX-r.left+14,r.width-220))+"px";tip.style.top=Math.max(4,e.clientY-r.top+14)+"px"};
 const hide=()=>tip.style.opacity="0";
 const legend=colors=>{const root=d3.select("#legend");Object.entries(colors).forEach(([name,color])=>{const el=root.append("span").attr("class","legend-item");el.append("i").attr("class","swatch").style("background",color);el.append("span").text(name)})};
 return {svg,show,hide,legend};
}
async function load(file){try{return await d3.csv(file,d3.autoType)}catch(e){$("#chart").insertAdjacentHTML("beforeend",'<p class="chart-error">No se pudieron cargar los datos. Abre la página mediante GitHub Pages.</p>');throw e}}
async function circle(){
 const data=await load("circle_packing_gapminder_2007.csv");
 const {svg,show,hide,legend}=base();
 const colors={Asia:"#d58c36",Africa:"#238b7e",Americas:"#467eb0",Europe:"#8b6faf",Oceania:"#647d95"};
 const groups=Array.from(d3.group(data,d=>d.continent),([name,items])=>({name,children:items.map(d=>({name:d.country,continent:name,population:d.population}))}));
 const root=d3.hierarchy({name:"Mundo",children:groups}).sum(d=>d.population||0).sort((a,b)=>b.value-a.value);
 d3.pack().size([W-20,H-20]).padding(3)(root);root.each(d=>{d.x+=10;d.y+=10});
 const g=svg.append("g");
 const nodes=g.selectAll("circle").data(root.descendants().slice(1)).join("circle").attr("cx",d=>d.x).attr("cy",d=>d.y).attr("r",d=>d.r)
 .attr("fill",d=>colors[d.depth===1?d.data.name:d.data.continent]).attr("fill-opacity",d=>d.depth===1?.16:.83)
 .attr("stroke",d=>d.depth===1?"#2c4b67":"#fff").attr("stroke-width",d=>d.depth===1?1.6:1)
 .style("cursor",d=>d.depth===1?"pointer":"default")
 .on("mousemove",(event,d)=>show(event,"<strong>"+d.data.name+"</strong><br>"+fmt(d.value)+" habitantes")).on("mouseleave",hide);
 const labels=g.selectAll("text.leaf").data(root.leaves()).join("text").attr("class","leaf").attr("x",d=>d.x).attr("y",d=>d.y+3)
 .attr("text-anchor","middle").attr("font-size",11).attr("font-weight",700).attr("fill","#fff").style("pointer-events","none").text(d=>d.data.name);
 const parents=g.selectAll("text.parent").data(root.children).join("text").attr("class","parent").attr("x",d=>d.x).attr("y",d=>d.y-d.r+17)
 .attr("text-anchor","middle").attr("font-size",13).attr("font-weight",800).attr("fill","#243a51").style("pointer-events","none").text(d=>d.data.name);
 function zoom(focus){
  const k=focus===root?1:Math.min((W-35)/(2*focus.r),(H-35)/(2*focus.r));
  g.transition().duration(450).attr("transform","translate("+W/2+","+H/2+") scale("+k+") translate("+(-focus.x)+","+(-focus.y)+")");
  nodes.style("opacity",d=>focus===root||d.ancestors().includes(focus)?1:.09);
  labels.style("display",d=>(focus===root?d.r>23:(d.parent===focus&&d.r*k>22))?"":"none").style("font-size",(11/k)+"px");
  parents.style("display",focus===root?"":"none");
 }
 nodes.filter(d=>d.depth===1).on("click",(event,d)=>{event.stopPropagation();zoom(d)});
 svg.on("click",()=>zoom(root));$("#reset").addEventListener("click",()=>zoom(root));zoom(root);legend(colors);
}
async function gantt(){
 const data=await load("gantt_proyecto_software.csv"),{svg,show,hide,legend}=base();
 const colors={"Planificación":"#6b7f96","Análisis":"#367ea9","Diseño":"#886bb0","Desarrollo":"#278e7e","Pruebas":"#c28c39","Documentación":"#9b77a9","Despliegue":"#c46c5d"};
 const parse=d3.utcParse("%Y-%m-%d");data.forEach(d=>{d.start=d.start instanceof Date?d.start:parse(d.start);d.end=d.end instanceof Date?d.end:parse(d.end)});
 const L=240,T=90,rowH=46;
 const x=d3.scaleUtc().domain([d3.utcDay.offset(d3.min(data,d=>d.start),-4),d3.utcDay.offset(d3.max(data,d=>d.end),6)]).range([L,W-24]);
 svg.append("g").attr("class","axis").attr("transform","translate(0,"+(T-30)+")").call(d3.axisTop(x).ticks(d3.utcMonth.every(1)).tickFormat(d3.utcFormat("%b %Y")).tickSize(0)).call(g=>g.select(".domain").remove());
 const weeks=d3.utcMonday.range(d3.utcMonday.floor(d3.min(data,d=>d.start)),d3.utcMonday.ceil(d3.max(data,d=>d.end)));
 svg.append("g").selectAll("line").data(weeks).join("line").attr("x1",x).attr("x2",x).attr("y1",T-18).attr("y2",T+data.length*rowH).attr("stroke","#e9eef4");
 const rows=svg.append("g").selectAll("g.task").data(data).join("g").attr("transform",(d,i)=>"translate(0,"+(T+i*rowH)+")");
 rows.append("rect").attr("width",W).attr("height",rowH).attr("fill",(d,i)=>i%2?"#f8fafc":"white");
 rows.append("text").attr("x",L-12).attr("y",rowH/2+4).attr("text-anchor","end").attr("font-size",13).attr("fill","#2d455c").text(d=>d.task);
 rows.append("rect").attr("x",d=>x(d.start)).attr("y",8).attr("height",rowH-16).attr("rx",5)
 .attr("width",d=>x(d3.utcDay.offset(d.end,1))-x(d.start)).attr("fill",d=>colors[d.phase])
 .on("mousemove",(event,d)=>show(event,"<strong>"+d.task+"</strong><br>"+d3.utcFormat("%d/%m/%Y")(d.start)+" – "+d3.utcFormat("%d/%m/%Y")(d.end)))
 .on("mouseleave",hide);
 rows.append("line").attr("x1",0).attr("x2",W).attr("y1",rowH).attr("y2",rowH).attr("stroke","#e9eef4");legend(colors);
}
async function hull(){
 const data=await load("iris_convex_hull.csv"),{svg,show,hide,legend}=base();
 const colors={setosa:"#0072b2",versicolor:"#d55e00",virginica:"#009e73"};
 const x=d3.scaleLinear().domain([.8,7.2]).range([78,W-35]),y=d3.scaleLinear().domain([0,2.7]).range([H-70,30]);
 svg.append("g").attr("class","axis").attr("transform","translate(0,"+(H-70)+")").call(d3.axisBottom(x).ticks(8));
 svg.append("g").attr("class","axis").attr("transform","translate(78,0)").call(d3.axisLeft(y).ticks(6));
 svg.append("text").attr("x",520).attr("y",H-18).attr("text-anchor","middle").attr("font-size",14).text("Longitud del pétalo (cm)");
 svg.append("text").attr("transform","translate(21,320) rotate(-90)").attr("text-anchor","middle").attr("font-size",14).text("Anchura del pétalo (cm)");
 const polygons=svg.append("g"),vertices=svg.append("g");
 d3.groups(data,d=>d.species).forEach(([species,items])=>{
  const poly=d3.polygonHull(items.map(d=>[x(d.petal_length),y(d.petal_width)]));if(!poly)return;
  polygons.append("polygon").attr("points",poly.map(p=>p.join(",")).join(" ")).attr("fill",colors[species]).attr("fill-opacity",.14).attr("stroke",colors[species]).attr("stroke-width",3);
  vertices.append("g").selectAll("circle").data(poly).enter().append("circle").attr("cx",p=>p[0]).attr("cy",p=>p[1]).attr("r",7).attr("fill","none").attr("stroke",colors[species]).attr("stroke-width",2);
 });vertices.style("display","none");
 svg.append("g").selectAll("circle").data(data).join("circle").attr("cx",d=>x(d.petal_length)).attr("cy",d=>y(d.petal_width)).attr("r",4.3)
 .attr("fill",d=>colors[d.species]).attr("fill-opacity",.85).attr("stroke","#fff").attr("stroke-width",.7)
 .on("mousemove",(event,d)=>show(event,"<strong>"+d.species+"</strong><br>Longitud: "+d.petal_length+" cm<br>Anchura: "+d.petal_width+" cm")).on("mouseleave",hide);
 let hp=true,vp=false;
 $("#toggleHull").addEventListener("click",e=>{hp=!hp;polygons.style("display",hp?"":"none");e.currentTarget.textContent=hp?"Ocultar envolventes":"Mostrar envolventes"});
 $("#toggleVertices").addEventListener("click",e=>{vp=!vp;vertices.style("display",vp?"":"none");e.currentTarget.textContent=vp?"Ocultar puntos extremos":"Mostrar puntos extremos"});legend(colors);
}
document.addEventListener("DOMContentLoaded",()=>{const mode=document.body.dataset.chart,fn=mode==="circle"?circle:mode==="gantt"?gantt:mode==="hull"?hull:null;if(fn)fn().catch(console.error)});
