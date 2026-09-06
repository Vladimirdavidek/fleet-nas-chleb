const KEY="nasChlebFleetV2";
const seed={vehicles:[
{id:1,name:"Iveco Daily",plate:"2L6 9457",driver:1,type:"Dodávka",status:"active"},
{id:2,name:"Peugeot Boxer",plate:"7U1 2345",driver:2,type:"Dodávka",status:"active"},
{id:3,name:"Mercedes Sprinter",plate:"6J4 7012",driver:3,type:"Dodávka",status:"service"}
],drivers:[
{id:1,name:"Jan Novák",phone:"+420 601 111 222",vehicle:1,route:"Rozvoz",status:"active"},
{id:2,name:"Petr Svoboda",phone:"+420 602 222 333",vehicle:2,route:"Rozvoz",status:"active"},
{id:3,name:"Martin Dvořák",phone:"+420 603 333 444",vehicle:3,route:"Rozvoz",status:"active"}
],reports:[],services:[
{id:1,vehicle:3,type:"Pravidelný servis",date:"2026-09-12",note:"Kontrola + olej"},
{id:2,vehicle:1,type:"STK",date:"2026-10-03",note:"Objednat termín"}
]};
let db=JSON.parse(localStorage.getItem(KEY)||"null")||seed;
let currentServiceFilter="all";
const $=id=>document.getElementById(id);
function saveDB(){localStorage.setItem(KEY,JSON.stringify(db));renderAll()}
function esc(s=""){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function vehicle(id){return db.vehicles.find(v=>v.id==id)}
function driver(id){return db.drivers.find(d=>d.id==id)}
function vehicleName(id){const v=vehicle(id);return v?v.name+" • "+v.plate:"—"}
function badge(status){if(status==="active")return '<span class="badge">● Aktivní</span>';if(status==="service")return '<span class="badge warn">● Servis</span>';return '<span class="badge red">● Neaktivní</span>'}
function reportBadge(r){return r.status==="done"?'<span class="badge">Vyřízeno</span>':'<span class="badge warn">Nové</span>'}
function show(view){document.querySelectorAll(".view").forEach(x=>x.classList.add("hidden"));$(view).classList.remove("hidden");document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.view===view));const titles={dashboard:["Přehled vozového parku","Rychlý přehled vozidel, řidičů, servisu a hlášení."],vehicles:["Vozidla","Evidence vozidel a jejich aktuální stav."],drivers:["Řidiči","Řidiči, přiřazená vozidla a rozvoz."],service:["Servis a údržba","Termíny servisu, STK a údržby."],reports:["Hlášení řidičů","Nehody, poškození, servis a další požadavky."]};$("title").textContent=titles[view][0];$("subtitle").textContent=titles[view][1];renderAll()}
function renderAll(){
 $("vehicleCount").textContent=db.vehicles.length;$("driverCount").textContent=db.drivers.filter(d=>d.status==="active").length;$("reportCount").textContent=db.reports.filter(r=>r.status!=="done").length;$("serviceCount").textContent=db.services.length;
 $("vehicleStatus").innerHTML=db.vehicles.length?db.vehicles.slice(0,6).map(v=>`<div class="status-row"><div><b>${esc(v.name)}</b><div class="muted">${esc(v.plate)} • ${esc(driver(v.driver)?.name||"bez řidiče")}</div></div><span>${badge(v.status)}</span><span class="muted">${esc(v.type)}</span></div>`).join(""):'<div class="empty">Žádná vozidla.</div>';
 const rr=db.reports.slice(0,4);$("recentReports").innerHTML=rr.length?rr.map(reportHTML).join(""):'<div class="empty">Zatím žádná hlášení.</div>';
 renderVehicles();renderDrivers();renderServices();renderReports();populateSelects();
}
function reportHTML(r){return `<div class="report"><div class="report-head"><div><h3>${esc(r.type)}</h3><p>${esc(r.text)}</p></div>${reportBadge(r)}</div><div class="report-meta">${esc(r.driverName||"Neuvedeno")} • ${esc(r.vehicleName||"Neuvedeno")} • ${esc(r.time)}${r.photo?`<br><img class="photo" src="${r.photo}" alt="Fotografie hlášení">`:""}</div></div>`}
function renderVehicles(){const q=($("vehicleSearch")?.value||"").toLowerCase();const rows=db.vehicles.filter(v=>(v.name+" "+v.plate+" "+(driver(v.driver)?.name||"")).toLowerCase().includes(q));$("vehiclesTable").innerHTML=rows.map(v=>`<tr><td><b>${esc(v.name)}</b></td><td>${esc(v.plate)}</td><td>${esc(driver(v.driver)?.name||"—")}</td><td>${esc(v.type)}</td><td>${badge(v.status)}</td></tr>`).join("")||'<tr><td colspan="5"><div class="empty">Nic nenalezeno.</div></td></tr>'}
function renderDrivers(){const q=($("driverSearch")?.value||"").toLowerCase();const rows=db.drivers.filter(d=>(d.name+" "+vehicle(d.vehicle)?.plate).toLowerCase().includes(q));$("driversTable").innerHTML=rows.map(d=>`<tr><td><b>${esc(d.name)}</b></td><td>${esc(vehicle(d.vehicle)?.plate||"—")}</td><td>${esc(d.phone)}</td><td>${esc(d.route)}</td><td>${badge(d.status)}</td></tr>`).join("")||'<tr><td colspan="5"><div class="empty">Nic nenalezeno.</div></td></tr>'}
function renderServices(){const now=new Date("2026-09-06");let rows=db.services.map(s=>({...s,days:Math.ceil((new Date(s.date)-now)/86400000)}));if(currentServiceFilter==="soon")rows=rows.filter(s=>s.days>=0&&s.days<=14);if(currentServiceFilter==="overdue")rows=rows.filter(s=>s.days<0);$("serviceList").innerHTML=rows.length?rows.sort((a,b)=>a.days-b.days).map(s=>`<div class="status-row"><div><b>${esc(s.type)}</b><div class="muted">${esc(vehicleName(s.vehicle))} • ${esc(s.note)}</div></div><span class="muted">${new Date(s.date).toLocaleDateString("cs-CZ")}</span>${s.days<0?'<span class="badge red">Po termínu</span>':s.days<=14?'<span class="badge warn">Brzy</span>':'<span class="badge">Naplánováno</span>'}</div>`).join(""):'<div class="empty">Žádný servis v tomto filtru.</div>'}
function renderReports(){const f=$("reportFilter")?.value||"all";let rows=db.reports;if(f==="open")rows=rows.filter(r=>r.status!=="done");if(f==="done")rows=rows.filter(r=>r.status==="done");$("reportsList").innerHTML=rows.length?rows.map(r=>reportHTML(r)+`<button class="ghost" onclick="toggleReport(${r.id})">${r.status==="done"?"↩ Vrátit mezi otevřená":"✓ Označit jako vyřízené"}</button>`).join(""):'<div class="empty">Žádná hlášení.</div>'}
function populateSelects(){ $("reportDriver").innerHTML=db.drivers.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join("");$("reportVehicle").innerHTML=db.vehicles.map(v=>`<option value="${v.id}">${esc(v.plate)} — ${esc(v.name)}</option>`).join("")}
function toggleReport(id){const r=db.reports.find(x=>x.id===id);if(r)r.status=r.status==="done"?"open":"done";saveDB()}
function openModal(){populateSelects();$("modal").classList.remove("hidden");$("reportText").focus()}
function closeModal(){$("modal").classList.add("hidden");$("reportForm").reset();$("photoPreview").innerHTML=""}
$("reportPhoto").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{$("photoPreview").innerHTML=`<img class="photo" src="${rd.result}" alt="Náhled">`;};rd.readAsDataURL(f)});
$("reportForm").addEventListener("submit",e=>{e.preventDefault();const v=vehicle($("reportVehicle").value),d=driver($("reportDriver").value);const file=$("reportPhoto").files[0];const finish=photo=>{db.reports.unshift({id:Date.now(),driverName:d?.name||"",vehicleName:v?vehicleName(v.id):"",type:$("reportType").value,text:$("reportText").value,time:new Date().toLocaleString("cs-CZ"),status:"open",photo:photo||""});closeModal();saveDB();show("reports");toast("Hlášení bylo odesláno.");};if(file){const rd=new FileReader();rd.onload=()=>finish(rd.result);rd.readAsDataURL(file)}else finish("")});
document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>show(b.dataset.view)));
document.addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b&&!b.classList.contains("nav"))show(b.dataset.view)});
$("newReportBtn").onclick=openModal;$("newReportBtn2").onclick=openModal;$("closeModal").onclick=closeModal;$("modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});
$("vehicleSearch").addEventListener("input",renderVehicles);$("driverSearch").addEventListener("input",renderDrivers);$("reportFilter").addEventListener("change",renderReports);
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");currentServiceFilter=b.dataset.filter;renderServices()}));
$("addVehicleBtn").onclick=()=>toast("Přidání vozidel doplníme v další verzi.");$("addDriverBtn").onclick=()=>toast("Přidání řidičů doplníme v další verzi.");$("addServiceBtn").onclick=()=>toast("Plánování servisu doplníme v další verzi.");
function toast(t){$("toast").textContent=t;$("toast").classList.remove("hidden");setTimeout(()=>$("toast").classList.add("hidden"),2600)}
renderAll();show("dashboard");