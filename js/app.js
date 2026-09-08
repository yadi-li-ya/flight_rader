/* =========================================================
   特价雷达 FareRadar · 交互逻辑
   ========================================================= */
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg){
  const t = $("#toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* =========================================================
   0. 日期工具 · 每天自动取最新日期，价格随日期浮动
   ========================================================= */
const WEEK = ["周日","周一","周二","周三","周四","周五","周六"];
const pad = n => String(n).padStart(2,"0");
function todayISO(){
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function isoAdd(iso, days){
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function mmdd(iso){ return iso ? iso.slice(5).replace("-","-") : ""; }
function weekOf(iso){ return WEEK[new Date(iso+"T00:00:00").getDay()]; }
// 日期系数：周末溢价 + 提前预订天数（越临近越贵）
function dateFactor(iso){
  const t = iso || todayISO();
  const d = new Date(t + "T00:00:00");
  const dowF = [1.20,0.92,0.88,0.93,1.05,1.30,1.18][d.getDay()]; // 周日..周六
  const days = Math.round((d - new Date(todayISO()+"T00:00:00")) / 86400000);
  const lead = days < 0 ? 1.10 : days < 7 ? 1.08 : days <= 21 ? 1.00 : 0.95;
  return dowF * lead;
}
const priceOn = (base, iso) => Math.round(base * dateFactor(iso));

// 购票跳转：航司官网 / OTA（真实站点）
function srcUrl(name){
  return AIRLINE_DB[name] ? AIRLINE_DB[name].url
    : (SRC_URL[name] || "https://www.ctrip.com");
}
const SRC_URL = {
  "去哪儿":"https://www.qunar.com", "飞猪":"https://www.fliggy.com",
  "携程":"https://www.ctrip.com", "同程":"https://www.ly.com",
  "东航官方":"https://www.ceair.com", "川航官方":"https://www.sichuanair.com",
  "海航官方":"https://www.hnair.com", "山航官方":"https://www.shandongair.com.cn",
  "祥鹏航空":"https://www.luckyair.net"
};

/* =========================================================
   1. 任意飞 · AI 反推目的地
   ========================================================= */
let exploreState = {items:[], from:"上海", date:"", budget:1000, days:5};
const exploreSel = {};   // city -> 选中的航班下标

function scoreExplore(base, market, budget){
  const fit = base <= budget ? 100 : Math.max(0, 100 - (base - budget) / budget * 120);
  const discount = (1 - base / market) * 100;
  return Math.round(fit * 0.45 + discount * 0.55);
}
// 由「航线 + 航班 + 日期」合成评分所需的规则对象
function exploreRules(route, fl, price, iso){
  const A = AIRLINE_DB[fl.al] || {};
  const f = dateFactor(iso);
  return {
    bare: price, market: Math.round(route.market * f),
    baggageKg: A.bagkg ?? 20, refundFee: A.rf ?? 0, changeFee: A.cf ?? 0,
    redEye: !!fl.re, sleepLossH: fl.sl || 0,
    durationH: (fl.dm || 0) / 60, transfer: !!route.tf, transferH: route.th || 0,
    onTime: A.ont ?? 85
  };
}
// 单张卡片的实时价格（受日期 + 所选航司影响）
function flightPrice(d, iso, idx){
  const fl = d._r.fl[idx || 0];
  return priceOn(d._r.base + (fl.dp || 0), iso);
}
function renderExplore(items, from, iso){
  const grid = $("#exploreGrid");
  if(!items.length){ grid.innerHTML = `<p class="muted">没找到符合条件的目的地，试试放宽预算或换个日期 🤔</p>`; return; }
  grid.innerHTML = items.map((d, i) => xcardHTML(d, i, from, iso)).join("");

  // 航司切换：只更新该卡片，不重排
  $$(".xcard__al", grid).forEach(sel => sel.addEventListener("change", ()=>{
    exploreSel[sel.dataset.city] = +sel.value;
    const card = sel.closest(".xcard");
    const item = exploreState.items.find(x => x.city === sel.dataset.city);
    if(item) paintXCard(card, item, exploreState.from, exploreState.date);
  }));
  // 评分入口
  $$("[data-score-city]", grid).forEach(b => b.addEventListener("click", e=>{
    e.stopPropagation();
    const item = exploreState.items.find(x => x.city === b.dataset.scoreCity);
    if(item) openScorePanel(explorePayload(item, exploreState.from, exploreState.date));
  }));
  // 点击卡片空白处：提示推荐理由
  $$(".xcard", grid).forEach(c => c.addEventListener("click", e=>{
    if(e.target.closest("select,button,a")) return;
    const d = EXPLORE_POOL.find(x => x.city === c.dataset.city);
    d && toast(`🧭 ${d.city}：${d.why}（演示数据）`);
  }));
}
function xcardHTML(d, i, from, iso){
  const idx = exploreSel[d.city] ?? 0;
  const fl = d._r.fl[idx];
  const A = AIRLINE_DB[fl.al] || {};
  const price = flightPrice(d, iso, idx);
  const market = Math.round(d._r.market * dateFactor(iso));
  const save = market - price, pct = Math.round(save / market * 100);
  const ev = evalDeal({rules: exploreRules(d._r, fl, price, iso)});
  const alOpts = d._r.fl.map((f, k) => {
    const p = priceOn(d._r.base + (f.dp||0), iso);
    return `<option value="${k}" ${k===idx?"selected":""}>✈️ ${f.al} ${f.no} · ¥${p}</option>`;
  }).join("");
  const bag = A.bag || "—";
  return `<article class="xcard" data-city="${d.city}">
    ${i===0?'<span class="xcard__rank">🏆 性价比第1</span>':""}
    <div class="xcard__head">
      <span class="xcard__emoji">${d.emoji}</span>
      <div>
        <h3>${d.city}</h3>
        <div class="xcard__route">${from} → ${d.city} · ${mmdd(iso)} ${weekOf(iso)}</div>
      </div>
    </div>
    <select class="xcard__al" data-city="${d.city}" aria-label="选择航空公司">${alOpts}</select>
    <div class="xcard__time">
      <div class="tm"><b>${fl.dep}</b><span>${d._r.apd}</span></div>
      <div class="tmline"><i>${fl.dur}</i><em>${d._r.tf?"中转":"直飞"}</em></div>
      <div class="tm"><b>${fl.arr}</b><span>${d._r.apa}</span></div>
    </div>
    <div class="xcard__info">
      <span>🛩️ ${fl.ac}</span><span>🎒 ${bag}</span><span>⏱️ 准点 ${A.ont??"—"}%</span>
      ${fl.re?'<span class="warn">🌙 红眼</span>':""}
    </div>
    <div class="xcard__price"><b>¥${price}</b><s>市价 ¥${market}</s>
      <span class="xcard__save">省 ${pct}% · 立省 ¥${save}</span></div>
    <div class="xcard__actions">
      <button class="sbtn" data-score-city="${d.city}">📊 综合评分 <b>${ev.score}</b> ${ev.grade}级</button>
      <a class="buy" href="${A.url||"#"}" target="_blank" rel="noopener">去${fl.al}官网购票 ↗</a>
    </div>
    <div class="xcard__tags">${d.tags.map(t=>`<span class="tag">${t}</span>`).join("")}
      <span class="tag tag--low">建议玩 ${d.days} 天</span></div>
  </article>`;
}
// 切换航司后只刷新该卡片的动态部分
function paintXCard(card, d, from, iso){
  const idx = exploreSel[d.city] ?? 0;
  const fl = d._r.fl[idx];
  const A = AIRLINE_DB[fl.al] || {};
  const price = flightPrice(d, iso, idx);
  const market = Math.round(d._r.market * dateFactor(iso));
  const save = market - price, pct = Math.round(save / market * 100);
  const ev = evalDeal({rules: exploreRules(d._r, fl, price, iso)});
  card.querySelector(".xcard__time").innerHTML =
    `<div class="tm"><b>${fl.dep}</b><span>${d._r.apd}</span></div>
     <div class="tmline"><i>${fl.dur}</i><em>${d._r.tf?"中转":"直飞"}</em></div>
     <div class="tm"><b>${fl.arr}</b><span>${d._r.apa}</span></div>`;
  card.querySelector(".xcard__info").innerHTML =
    `<span>🛩️ ${fl.ac}</span><span>🎒 ${A.bag||"—"}</span><span>⏱️ 准点 ${A.ont??"—"}%</span>
     ${fl.re?'<span class="warn">🌙 红眼</span>':""}`;
  card.querySelector(".xcard__price").innerHTML =
    `<b>¥${price}</b><s>市价 ¥${market}</s><span class="xcard__save">省 ${pct}% · 立省 ¥${save}</span>`;
  const sb = card.querySelector("[data-score-city] b");
  if(sb){ sb.textContent = ev.score; }
  const buy = card.querySelector(".buy");
  if(buy){ buy.href = A.url || "#"; buy.textContent = `去${fl.al}官网购票 ↗`; }
  const sel = card.querySelector(".xcard__al");
  if(sel){ [...sel.options].forEach((o,k)=>{
    o.textContent = `✈️ ${d._r.fl[k].al} ${d._r.fl[k].no} · ¥${priceOn(d._r.base+(d._r.fl[k].dp||0), iso)}`;
  }); sel.value = String(idx); }
}
function runFlexSearch(e, {scroll=true}={}){
  e && e.preventDefault();
  const from = $("#flexFrom").value;
  const iso  = $("#flexDate").value || todayISO();
  const budget = +$("#flexBudget").value;
  const days = +$("#flexDays").value;
  const pref = $(".chip.is-active", $("#prefChips")).dataset.pref;
  let pool = EXPLORE_POOL
    .filter(d => d.routes && d.routes[from])
    .map(d => ({...d, _r: d.routes[from]}))
    .filter(d => pref === "all" || d.type === pref)
    .filter(d => d.days <= days + 2)
    .filter(d => flightPrice(d, iso, exploreSel[d.city] ?? 0) <= budget * 1.15)
    .map(d => ({...d, _s: scoreExplore(flightPrice(d, iso), d._r.market * dateFactor(iso), budget)}))
    .sort((a,b) => b._s - a._s)
    .slice(0, 6);
  exploreState = {items: pool, from, date: iso, budget, days};
  renderExplore(pool, from, iso);
  if(scroll) $("#explore").scrollIntoView({behavior:"smooth"});
  toast(pool.length
    ? `✅ ${from}出发 · ${mmdd(iso)} ${weekOf(iso)}，为你挑出 ${pool.length} 个高性价比目的地`
    : "没匹配到，试试放宽预算或换个日期");
}
function explorePayload(d, from, iso){
  const idx = exploreSel[d.city] ?? 0;
  const fl = d._r.fl[idx];
  const price = flightPrice(d, iso, idx);
  return {
    title:`${from} → ${d.city}`, sub:`${fl.al} ${fl.no} · ${fl.ac} · ${mmdd(iso)} ${weekOf(iso)}`,
    rules: exploreRules(d._r, fl, price, iso),
    buyName: fl.al, url: (AIRLINE_DB[fl.al]||{}).url
  };
}

/* =========================================================
   2. 实时捡漏流（受传统搜索的航线 / 日期影响）
   ========================================================= */
let dealFilter = {src:"all", tag:"all"};
let dealsDate = "";        // 传统搜索选定的去程日期
let dealsRoute = null;     // {from,to} 或 null
let dealsDirect = false;

function dealMatch(d){
  if(dealFilter.src !== "all" && d.src !== dealFilter.src) return false;
  if(dealFilter.tag === "direct" && !d.direct) return false;
  if(dealFilter.tag === "low" && d.price > 500) return false;
  if(dealFilter.tag === "flash" && !d.flash) return false;
  if(dealsDirect && !d.direct) return false;
  if(dealsRoute && !(d.from === dealsRoute.from && d.to === dealsRoute.to)) return false;
  return true;
}
function renderDeals(){
  const grid = $("#dealsGrid"), note = $("#dealsNote");
  const iso = dealsDate || todayISO();
  const f = dateFactor(iso);
  let list = DEALS.filter(dealMatch);
  const exact = list.length;
  if(dealsRoute && !exact){                       // 该航线无特价 → 展示相近推荐
    list = DEALS.filter(d => dealFilter.src==="all" || d.src===dealFilter.src);
  }
  if(note){
    note.innerHTML = dealsRoute
      ? (exact
        ? `🔍 <b>${dealsRoute.from} → ${dealsRoute.to}</b> · ${mmdd(iso)} ${weekOf(iso)} 出发 · 共 <b>${exact}</b> 条特价（价格已按该日期重算）`
        : `🔍 暂未收录 <b>${dealsRoute.from} → ${dealsRoute.to}</b> 的特价，为你展示当前热门航线 · ${mmdd(iso)} ${weekOf(iso)}`)
      : `🕒 全网实时特价 · 展示 <b>${mmdd(iso)} ${weekOf(iso)}</b> 的实时价格`;
  }
  if(!list.length){ grid.innerHTML = `<p class="muted">该筛选下暂无特价，换个条件看看～</p>`; return; }
  grid.innerHTML = list.map(d => {
    const price = Math.round(d.price * f);
    const market = Math.round(d.market * f);
    const save = market - price;
    const ev = evalDeal({...d, rules:{...d.rules, bare:price, market}});
    const time = (d.depart.split(" ")[1] || "");
    const warn = ev.score < 75;
    return `<article class="dcard" data-id="${d.id}">
      <div class="dcard__top">
        <span class="dcard__route">${d.from} → ${d.to}</span>
        <span class="dcard__src ${d.src==="ota"?"ota":""}">${d.srcName}</span>
      </div>
      <div class="dcard__mid">
        <div class="dcard__price"><b>¥${price}</b><s>¥${market}</s></div>
        <div class="dcard__disc">${d.discount} · 省¥${save}</div>
      </div>
      <div class="dcard__foot">
        <span>🛫 ${mmdd(iso)} ${weekOf(iso)} ${time} · ${d.direct?"直飞":"中转"}</span>
      </div>
      <div class="dcard__foot"><span class="muted">${d.posted}</span><span>${d.tags.map(t=>"#"+t).join(" ")}</span></div>
      <button class="sbtn ${warn?"warn":""}" data-score-id="${d.id}">📊 综合评分 <b>${ev.score}</b> ${ev.grade}级 · 点击查看</button>
    </article>`;
  }).join("");
  $$(".dcard", grid).forEach(c => c.addEventListener("click", e=>{
    if(e.target.closest("[data-score-id]")) return;   // 评分按钮单独处理
    openDealModal(+c.dataset.id);
  }));
  $$("[data-score-id]", grid).forEach(b => b.addEventListener("click", e=>{
    e.stopPropagation();
    const d = DEALS.find(x => x.id === +b.dataset.scoreId);
    if(!d) return;
    const iso2 = dealsDate || todayISO(), f2 = dateFactor(iso2);
    const price = Math.round(d.price * f2);
    openScorePanel({
      title:`${d.from} → ${d.to}`, sub:`${d.srcName} · ${d.direct?"直飞":"中转"} · ${mmdd(iso2)} ${weekOf(iso2)}`,
      rules:{...d.rules, bare:price, market:Math.round(d.market*f2)},
      buyName:d.srcName, url:srcUrl(d.srcName), deal:d
    });
  }));
}

/* =========================================================
   3. 特价日历（真实日期，从今天起 5 周）
   ========================================================= */
function colorFor(p, min, max){
  const r = (p - min) / (max - min || 1);
  if(r < .2) return "lg-5"; if(r < .4) return "lg-4";
  if(r < .6) return "lg-3"; if(r < .8) return "lg-2"; return "lg-1";
}
function renderCalendar(routeKey){
  const data = CALENDAR[routeKey];
  const prices = data.prices;
  const min = Math.min(...prices), max = Math.max(...prices);
  const today = new Date(todayISO()+"T00:00:00");
  let html = WEEK.map(w=>`<div class="cal__cell empty" style="background:#eef2f7;color:#94a3b8">${w}</div>`).join("");
  for(let i=0;i<today.getDay();i++) html += `<div class="cal__cell empty"></div>`;
  for(let k=0; k<prices.length; k++){
    const iso = isoAdd(todayISO(), k);
    const day = new Date(iso+"T00:00:00").getDate();
    const p = prices[k], cls = colorFor(p, min, max);
    const md = iso.slice(5).replace("-","/");
    html += `<div class="cal__cell ${cls}" data-price="${p}" data-iso="${iso}">
      <span class="wk">${md}</span>¥${p}<small>${(p/min).toFixed(1)}×</small></div>`;
  }
  $("#calGrid").innerHTML = html;
  $$("#calGrid .cal__cell:not(.empty)").forEach(c => c.addEventListener("click", ()=>{
    openCalModal(routeKey, c.dataset.iso, c.dataset.price);
  }));
}
function buildCalFlights(routeKey, iso, base){
  const opts = [
    {al:"东方航空", code:"MU", site:"https://www.ceair.com", kind:"航司"},
    {al:"中国国航", code:"CA", site:"https://www.airchina.com.cn", kind:"航司"},
    {al:"南方航空", code:"CZ", site:"https://www.csair.com", kind:"航司"},
    {al:"携程旅行", code:"", site:"https://www.ctrip.com", kind:"OTA"},
  ];
  const times = [["08:20","11:45"],["13:10","16:35"],["19:40","23:05"],["06:50","10:15"]];
  const vary = [0, 45, -35, 30];
  return opts.map((o,i)=>({
    al:o.al, code:o.code, site:o.site, kind:o.kind,
    no: o.code ? `${o.code}${5800+i*37}` : "套餐价",
    dep:times[i][0], arr:times[i][1],
    dur: i<3 ? "约3h25m" : "中转约5h40m",
    direct: i<3,
    price: Math.max(99, base + vary[i])
  }));
}
function openCalModal(routeKey, iso, base){
  const name = (CALENDAR[routeKey] && CALENDAR[routeKey].name) || routeKey;
  const flights = buildCalFlights(routeKey, iso, +base);
  const rows = flights.map(f=>`
    <tr>
      <td><b>${f.al}</b>${f.kind==="OTA"?" <span class=\"tag tag--low\">OTA</span>":""}<br/>
        <span class="muted" style="font-size:11px">${f.no}</span></td>
      <td>${f.dep} → ${f.arr}<br/><span class="muted" style="font-size:11px">${f.dur} · ${f.direct?"直飞":"中转"}</span></td>
      <td class="calcmp__price">¥${f.price}</td>
      <td><a class="buy" href="${f.site}" target="_blank" rel="noopener">去${f.al}购票 ↗</a></td>
    </tr>`).join("");
  $("#calModalBody").innerHTML = `
    <div class="md__hero">
      <div><div class="md__route">${name}</div>
      <div class="muted" style="font-size:13px">${mmdd(iso)} ${weekOf(iso)} · 当日最低价 <b style="color:var(--low)">¥${base}</b></div></div>
    </div>
    <p class="muted" style="font-size:12.5px;margin:0 0 10px">以下为该日可选航班对比（演示数据，价格随渠道浮动）：</p>
    <table class="calcmp"><thead><tr><th>航司 / 航班</th><th>时刻</th><th>价格</th><th>购票</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
  openModal("#calModal");
}

/* =========================================================
   4. 真实到手价引擎（由规则实时计算，非写死）
   ========================================================= */
const WEIGHTS = {
  balanced:{性价比:.30,退改友好:.20,舒适度:.20,准点率:.15,含行李:.15},
  saver:   {性价比:.50,退改友好:.15,舒适度:.10,准点率:.10,含行李:.15},
  comfort: {性价比:.20,退改友好:.20,舒适度:.40,准点率:.10,含行李:.10},
  flex:    {性价比:.20,退改友好:.45,舒适度:.15,准点率:.10,含行李:.10}
};
let currentWeights = WEIGHTS.balanced;
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const gradeOf = s => s>=90?"S":s>=80?"A":s>=70?"B":s>=60?"C":"D";
const GRADE_COLOR = {S:"#eab308", A:"#10b981", B:"#3b82f6", C:"#f59e0b", D:"#ef4444"};
const RADAR_AXES = ["性价比","退改友好","舒适度","准点率","含行李"];

function evalDeal(d){
  const r = d.rules;
  const value   = clamp(Math.round((1 - r.bare/r.market)*160), 0, 100);
  let flex = 100;
  if(r.refundFee>0)  flex -= Math.min(45, r.refundFee/8);
  if(r.changeFee>0)  flex -= Math.min(35, r.changeFee/8);
  flex = clamp(Math.round(flex),0,100);
  let comfort = 100;
  if(r.redEye)        comfort -= 22 + Math.min(15,(r.sleepLossH||0)*3);
  if(r.transfer)      comfort -= Math.min(25,(r.transferH||0)*8);
  if(r.durationH>4)   comfort -= Math.min(15,(r.durationH-4)*10);
  comfort = clamp(Math.round(comfort),0,100);
  const punctual = clamp(Math.round(r.onTime),0,100);
  const baggage  = r.baggageKg>=20?100:r.baggageKg>=15?78:r.baggageKg>0?55:25;
  const dims = {性价比:value, 退改友好:flex, 舒适度:comfort, 准点率:punctual, 含行李:baggage};
  const cost = costModel(r);
  let score = 0; for(const k in dims) score += dims[k]*(currentWeights[k]||0);
  return {dims, score:Math.round(score), grade:gradeOf(score), cost, pitfalls:pitfallsOf(dims,r)};
}
function costModel(r){
  const items=[];
  if(r.baggageKg < 20){
    const fee = Math.round((20-r.baggageKg)*16);
    if(fee>0) items.push({k:"行李补购", v:fee, note:`仅含 ${r.baggageKg}kg，补到 20kg 约 ¥${fee}`});
  } else items.push({k:"行李", v:0, note:`含 ${r.baggageKg}kg 托运，无需补购`});
  if(r.redEye)  items.push({k:"红眼耗时", v:60, note:"凌晨起降，折算时间成本 ¥60"});
  if(r.transfer){ const v=Math.round((r.transferH||1)*35); items.push({k:"中转机会成本", v, note:`${r.transferH||1}h 中转停留 ¥${v}`}); }
  const inflex = (r.refundFee>0?r.refundFee:0) + (r.changeFee>0?Math.round(r.changeFee*0.5):0);
  if(inflex>0)  items.push({k:"退改不灵活", v:inflex, note:`退改费用折算风险折价 ¥${inflex}`});
  const total = r.bare + items.reduce((s,i)=>s+i.v,0);
  return {bare:r.bare, items, total, hidden:total-r.bare};
}
function pitfallsOf(dims,r){
  const out=[];
  if(dims.退改友好<60) out.push("退改不灵活：退票/改签成本偏高，行程有变会肉疼");
  if(dims.舒适度<60)    out.push(r.redEye?"红眼航班：凌晨起降，少睡还累":"舒适偏弱：时长/中转偏多");
  if(dims.含行李<60)    out.push("行李额度低：需补购托运，到手价要加钱");
  if(dims.性价比<60)    out.push("性价比一般：相对市场均价优势不大");
  return out;
}

/* ---------- 雷达图 / 评分环（可指定容器） ---------- */
function radarPoints(vals, R=100, cx=160, cy=160){
  const n = RADAR_AXES.length;
  return RADAR_AXES.map((ax,i) => {
    const ang = -Math.PI/2 + i * 2*Math.PI/n;
    const r = R * (vals[ax]/100);
    return [cx + r*Math.cos(ang), cy + r*Math.sin(ang)];
  });
}
function drawRadar(vals, sel){
  const el = $(sel); if(!el) return;
  const cx=160, cy=160, R=100, n = RADAR_AXES.length;
  let svg = "";
  [0.25,0.5,0.75,1].forEach(f=>{
    const pts = RADAR_AXES.map((ax,i)=>{
      const ang=-Math.PI/2+i*2*Math.PI/n;
      return `${cx+R*f*Math.cos(ang)},${cy+R*f*Math.sin(ang)}`;
    }).join(" ");
    svg += `<polygon points="${pts}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`;
  });
  RADAR_AXES.forEach((ax,i)=>{
    const ang=-Math.PI/2+i*2*Math.PI/n;
    const x=cx+R*Math.cos(ang), y=cy+R*Math.sin(ang);
    svg += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#e2e8f0"/>`;
    const lx=cx+(R+18)*Math.cos(ang), ly=cy+(R+18)*Math.sin(ang);
    const vx=cx+(R+30)*Math.cos(ang), vy=cy+(R+30)*Math.sin(ang);
    svg += `<text x="${lx}" y="${ly}" font-size="12" font-weight="800" fill="#334155" text-anchor="middle" dominant-baseline="middle">${ax}</text>`;
    svg += `<text x="${vx}" y="${vy+4}" font-size="11" font-weight="800" fill="#2563eb" text-anchor="middle">${vals[ax]}</text>`;
  });
  const pts = radarPoints(vals, R).map(p=>`${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  svg += `<polygon points="${pts}" fill="rgba(37,99,235,.22)" stroke="#2563eb" stroke-width="2.5"/>`;
  radarPoints(vals, R).forEach(p=> svg += `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="#2563eb"/>`);
  el.innerHTML = svg;
}
function drawRing(ev, sel){
  const el = $(sel); if(!el) return;
  const c = GRADE_COLOR[ev.grade], R=52, C=2*Math.PI*R, off=C*(1-ev.score/100);
  el.innerHTML = `<svg viewBox="0 0 140 140" width="100%" height="100%">
    <circle cx="70" cy="70" r="${R}" fill="none" stroke="#eef2f7" stroke-width="12"/>
    <circle cx="70" cy="70" r="${R}" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round"
      stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 70 70)"
      style="transition:stroke-dashoffset .9s cubic-bezier(.2,.7,.2,1)"/>
    <text x="70" y="64" text-anchor="middle" font-size="36" font-weight="800" fill="${c}">${ev.score}</text>
    <text x="70" y="88" text-anchor="middle" font-size="14" font-weight="800" fill="#64748b">等级 ${ev.grade}</text>
  </svg>`;
}
function dimsHTML(ev){
  const meta = {
    性价比:["💰","相对市场均价的折扣力度"], 退改友好:["🧳","退票 / 改签成本高低"],
    舒适度:["🛋️","机型时长 / 红眼 / 中转"], 准点率:["⏱️","航司历史准点表现"],
    含行李:["🎒","是否含免费托运额"]
  };
  return RADAR_AXES.map(k=>{
    const v = ev.dims[k];
    const w = Math.round((currentWeights[k]||0)*100);   // 当前权重占比
    const col = v>=80?"low":v>=60?"amber":"deal";
    const barC = v>=80?"#10b981":v>=60?"#f59e0b":"#ef4444";
    return `<div class="dim dim--${col}">
      <div class="dim__top"><span>${meta[k][0]} ${k}<em class="dim__w">权重 ${w}%</em></span><b>${v}</b></div>
      <div class="dim__bar"><i style="width:${v}%;background:${barC}"></i></div>
      <div class="dim__note">${meta[k][1]}</div>
      <div class="dim__calc">${v} × ${w}% = ${(v*w/100).toFixed(1)} 分</div></div>`;
  }).join("");
}
function costHTML(d, ev){
  const c = ev.cost;
  const hiddenPct = c.hidden>0 ? Math.round(c.hidden/c.total*100) : 0;
  const items = c.items.map(it=>`
    <li class="cost__item"><span class="cost__k">${it.k}</span>
      <span class="cost__note">${it.note}</span>
      <span class="cost__v ${it.v>0?"plus":"zero"}">${it.v>0?"+¥"+it.v:"¥0"}</span></li>`).join("");
  return `
    <div class="realprice">
      <div class="realprice__label">真实到手价</div>
      <div class="realprice__val">¥${c.total}<small>含隐性成本 ¥${c.hidden}</small></div>
      <div class="realprice__formula">= 裸价 + 行李补购 + 红眼耗时 + 中转机会成本 + 退改不灵活</div>
      <div class="realprice__cmp">裸价 ¥${c.bare} · 同航线均价 ¥${d.rules.market} · ${d.rules.market-c.bare>0?"立省 ¥"+(d.rules.market-c.bare):"无优势"}</div>
    </div>
    <div class="costbar">
      <div class="costbar__bare" style="width:${100-hiddenPct}%">裸价</div>
      <div class="costbar__hidden" style="width:${hiddenPct}%">${hiddenPct>8?"隐性 ¥"+c.hidden:""}</div>
    </div>
    <ul class="cost__list">${items}</ul>
    ${ev.pitfalls.length?`<div class="pitfalls"><b>⚠️ 坑点预警</b>${ev.pitfalls.map(p=>`<span class="pit">${p}</span>`).join("")}</div>`:""}`;
}

/* =========================================================
   5. 评分弹窗（挂在每张机票卡片下）
   ========================================================= */
let scorePanel = null;
function openScorePanel(p){
  scorePanel = p;
  $("#scoreModalBody").innerHTML = `
    <h3 class="sp__title">${p.title}<span>${p.sub}</span></h3>
    <div class="sp">
      <div class="score__ring">
        <div class="ring" id="spRing"></div>
        <div class="weights" id="spWeights">
          <button class="wbtn is-active" data-w="balanced">⚖️ 均衡</button>
          <button class="wbtn" data-w="saver">💰 省钱优先</button>
          <button class="wbtn" data-w="comfort">🛋️ 舒服优先</button>
          <button class="wbtn" data-w="flex">🧳 灵活优先</button>
        </div>
        <p class="muted" style="text-align:center;font-size:12.5px;margin:0">切换偏好，评分实时重算</p>
      </div>
      <div class="score__chart"><svg id="spRadar" viewBox="0 0 320 320" width="100%" height="100%"></svg></div>
      <div class="score__detail" id="spDetail"></div>
    </div>
    <div class="score__dims" id="spDims"></div>
    <div class="md__cta">
      <a class="btn btn--primary" href="${p.url||"#"}" target="_blank" rel="noopener">去${p.buyName||""}官网购票 ↗</a>
      <button class="btn btn--ghost" data-open-alert>🔔 设降价提醒</button>
    </div>`;
  paintScorePanel();
  openModal("#scoreModal");
}
function paintScorePanel(){
  if(!scorePanel) return;
  const d = {rules: scorePanel.rules};
  const ev = evalDeal(d);
  drawRing(ev, "#spRing");
  drawRadar(ev.dims, "#spRadar");
  $("#spDetail").innerHTML = costHTML(d, ev);
  $("#spDims").innerHTML = dimsHTML(ev);
}
function initScoreWeights(){
  const wrap = $("#scoreModalBody");
  wrap.addEventListener("click", e=>{
    const b = e.target.closest(".wbtn"); if(!b) return;
    $$(".wbtn", wrap).forEach(x=>x.classList.remove("is-active"));
    b.classList.add("is-active");
    currentWeights = WEIGHTS[b.dataset.w] || WEIGHTS.balanced;
    paintScorePanel();
    toast(`⚖️ 已切换为「${b.textContent.trim()}」权重，评分已重算`);
  });
}

/* =========================================================
   6. 航司活动 + 社区
   ========================================================= */
function renderAirlines(){
  $("#airlinesList").innerHTML = AIRLINES.map(a => `
    <article class="acard">
      <div class="acard__head">
        <div class="acard__logo">${a.logo}</div>
        <div><h3>${a.name} <span class="acard__act">${a.act}</span></h3>
        <div class="acard__when">🔔 ${a.when}</div></div>
      </div>
      <p class="acard__desc">${a.desc}</p>
      <a class="acard__btn" href="${a.site}" target="_blank" rel="noopener">${a.btn} ↗</a>
    </article>`).join("");
}
function renderCommunity(){
  $("#communityList").innerHTML = COMMUNITY.map(c => `
    <article class="ccard">
      <div class="ccard__top">
        <div class="ccard__ava">${c.initial}</div>
        <div><div class="ccard__name">${c.name}</div><div class="ccard__time">${c.time}</div></div>
      </div>
      <p class="ccard__text">${c.text}</p>
      <div class="ccard__deal">${c.deal}</div>
      <div class="ccard__stars">${"★".repeat(c.stars)}${"☆".repeat(5-c.stars)}</div>
    </article>`).join("");
}

/* =========================================================
   7. 弹窗：机票详情
   ========================================================= */
function openDealModal(id){
  const d = DEALS.find(x=>x.id===id); if(!d) return;
  const iso = dealsDate || todayISO(), f = dateFactor(iso);
  const price = Math.round(d.price*f), market = Math.round(d.market*f);
  const rules = {...d.rules, bare:price, market};
  const ev = evalDeal({rules}), c = ev.cost, r = d.rules;
  const items = c.items.map(it=>`<div class="md__item"><b>${it.k}</b>${it.note}${it.v>0?`（+¥${it.v}）`:""}</div>`).join("");
  $("#dealModalBody").innerHTML = `
    <button class="modal__x" data-close>✕</button>
    <div class="md__hero">
      <div><div class="md__route">${d.from} → ${d.to}</div>
      <div class="muted" style="font-size:13px">${d.srcName} · ${d.direct?"直飞":"中转"} · ${d.dur} · ${mmdd(iso)} ${weekOf(iso)}</div></div>
      <div class="md__price"><b>¥${price}</b><s>¥${market}</s></div>
    </div>
    <div class="md__real">真实到手价 <b>¥${c.total}</b> <span class="muted">（裸价 ¥${c.bare} + 隐性成本 ¥${c.hidden}）</span> · 综合评分 <b style="color:${GRADE_COLOR[ev.grade]}">${ev.score} 分 / ${ev.grade} 级</b></div>
    <div class="md__grid">
      <div class="md__item"><b>航班号</b>${d.flightNo||"—"}</div>
      <div class="md__item"><b>起降机场</b>${d.apd||"—"} ➜ ${d.apa||"—"}</div>
      <div class="md__item"><b>出发 / 到达</b>${d.depart.split(" ")[1]||""} ➜ ${d.arrive.split(" ")[1]||""}</div>
      <div class="md__item"><b>折扣</b>${d.discount} · 省 ¥${market-price}</div>
      <div class="md__item"><b>🧳 行李额</b>${r.baggageKg>=20?`含 ${r.baggageKg}kg 托运`:`仅 ${r.baggageKg}kg`}</div>
      <div class="md__item"><b>🔁 退改签</b>${r.refundFee?`退票 ¥${r.refundFee}`:"退票免费"}${r.changeFee?` / 改签 ¥${r.changeFee}`:" / 免费改签"}</div>
      <div class="md__item"><b>🌙 红眼程度</b>${r.redEye?"是（"+(r.sleepLossH||"")+"h）":"否"}</div>
      <div class="md__item"><b>⏱️ 准点率</b>${r.onTime}%</div>
      ${items}
    </div>
    ${ev.pitfalls.length?`<div class="md__pit">⚠️ ${ev.pitfalls.join("；")}</div>`:""}
    <div class="md__cta">
      <a class="btn btn--primary" href="${srcUrl(d.srcName)}" target="_blank" rel="noopener">去${d.srcName}购票 ↗</a>
      <button class="btn btn--ghost" data-open-alert>🔔 设降价提醒</button>
      <button class="btn btn--ghost" data-score-id="${d.id}">📊 看评分拆解</button>
    </div>`;
  openModal("#dealModal");
}

/* ---------- 弹窗通用 ---------- */
function openModal(sel){ $(sel).classList.add("is-open"); $(sel).setAttribute("aria-hidden","false"); }
function closeModal(m){ m.classList.remove("is-open"); m.setAttribute("aria-hidden","true"); }
document.addEventListener("click", e=>{
  if(e.target.matches("[data-close]")) closeModal(e.target.closest(".modal"));
  if(e.target.matches("[data-open-login]")) openModal("#loginModal");
  if(e.target.matches("[data-open-alert]")){
    $$(".modal.is-open").forEach(closeModal);
    openModal("#loginModal"); toast("🔔 演示：请先登录以开启降价提醒");
  }
  // 详情弹窗里的「看评分拆解」
  const sb = e.target.closest("[data-score-id]");
  if(sb && sb.closest("#dealModal")){
    const d = DEALS.find(x => x.id === +sb.dataset.scoreId);
    if(!d) return;
    const iso = dealsDate || todayISO(), f = dateFactor(iso);
    const price = Math.round(d.price*f);
    closeModal($("#dealModal"));
    openScorePanel({
      title:`${d.from} → ${d.to}`, sub:`${d.srcName} · ${d.direct?"直飞":"中转"} · ${mmdd(iso)} ${weekOf(iso)}`,
      rules:{...d.rules, bare:price, market:Math.round(d.market*f)},
      buyName:d.srcName, url:srcUrl(d.srcName), deal:d
    });
  }
});
document.addEventListener("keydown", e=>{ if(e.key==="Escape") $$(".modal.is-open").forEach(closeModal); });

/* =========================================================
   8. 初始化：导航 / 搜索 / 过滤器
   ========================================================= */
function initNavScroll(){
  if(!("IntersectionObserver" in window)) return;
  const links = $$("#navLinks a");
  const map = links.map(a => ({a, sec: $(a.getAttribute("href"))})).filter(x=>x.sec);
  const obs = new IntersectionObserver(es=>{
    es.forEach(en=>{ if(en.isIntersecting){
      links.forEach(l=>l.classList.remove("is-active"));
      const cur = map.find(x=>x.sec===en.target); cur && cur.a.classList.add("is-active");
    }});
  }, {rootMargin:"-45% 0px -50% 0px"});
  map.forEach(x=>obs.observe(x.sec));
}
function initSearchTabs(){
  $$(".stab").forEach(t=>t.addEventListener("click",()=>{
    $$(".stab").forEach(x=>x.classList.remove("is-active")); t.classList.add("is-active");
    const mode = t.dataset.mode;
    $("#flexForm").classList.toggle("is-active", mode==="flex");
    $("#normalForm").classList.toggle("is-active", mode==="normal");
  }));
  // 只在点击「帮我挑最划算的目的地」后才重算，并自动定位到结果区
  $("#flexForm").addEventListener("submit", e => runFlexSearch(e, {scroll:true}));
  // 传统搜索：按航线 + 日期实时重算捡漏流
  $("#normalForm").addEventListener("submit", e=>{
    e.preventDefault();
    const from = $("#nFrom").value.trim() || "上海";
    const to   = $("#nTo").value.trim() || "昆明";
    const dep  = $("#nDep").value || todayISO();
    dealsRoute = {from, to};
    dealsDate  = dep;
    dealsDirect = $("#nDirect").checked;
    renderDeals();
    $("#deals").scrollIntoView({behavior:"smooth"});
    toast(`🔍 已按 ${from} → ${to} · ${mmdd(dep)} ${weekOf(dep)} 重新算价`);
  });
  // 去程变化时自动同步返程（不早于去程）
  $("#nDep").addEventListener("change", ()=>{
    const ret = $("#nRet");
    if(ret.value && ret.value < $("#nDep").value) ret.value = isoAdd($("#nDep").value, 3);
  });
}
function initFilters(){
  $$("#dealFilters .fchip").forEach(c=>c.addEventListener("click",()=>{
    const grp = c.parentElement;
    $$(".fchip", grp).forEach(x=>x.classList.remove("is-active")); c.classList.add("is-active");
    if(c.dataset.src) dealFilter.src = c.dataset.src;
    if(c.dataset.tag) dealFilter.tag = c.dataset.tag;
    renderDeals();
  }));
  $$("#calRoutes .rchip").forEach(c=>c.addEventListener("click",()=>{
    $$("#calRoutes .rchip").forEach(x=>x.classList.remove("is-active")); c.classList.add("is-active");
    renderCalendar(c.dataset.route);
  }));
  // 偏好 chip 只切换选中态，等点击搜索按钮才重算
  $$("#prefChips .chip").forEach(c=>c.addEventListener("click",()=>{
    $$("#prefChips .chip").forEach(x=>x.classList.remove("is-active")); c.classList.add("is-active");
  }));
}
function initAlerts(){
  $("#alertForm").addEventListener("submit", e=>{
    e.preventDefault();
    toast("🛰️ 已开启雷达监控，掉价第一时间推你（演示）");
  });
}
function initDates(){
  const t = todayISO();
  const fd = $("#flexDate"); if(fd){ fd.value = t; fd.min = t; }
  const nd = $("#nDep"); if(nd){ nd.value = t; nd.min = t; }
  const nr = $("#nRet"); if(nr){ nr.value = isoAdd(t, 3); nr.min = t; }
}

/* =========================================================
   9. 炫酷增强
   ========================================================= */
function initSpotlight(){
  ["#exploreGrid","#dealsGrid","#airlinesList","#communityList"].forEach(sel=>{
    const g = $(sel); if(!g) return;
    g.addEventListener("mousemove", e=>{
      const card = e.target.closest(".xcard,.dcard,.acard,.ccard");
      if(!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx",(e.clientX-r.left)+"px");
      card.style.setProperty("--my",(e.clientY-r.top)+"px");
    });
  });
}
function initReveal(){
  const targets = $$(".section__head, .search-card, .xcard, .dcard, .acard, .ccard, .method__col, .cal, .alerts");
  if(!("IntersectionObserver" in window)){ targets.forEach(t=>t.classList.add("in")); return; }
  const io = new IntersectionObserver(es=>{
    es.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } });
  }, {threshold:.12, rootMargin:"0px 0px -6% 0px"});
  targets.forEach((t,i)=>{ t.classList.add("reveal"); t.style.transitionDelay=((i%6)*0.05)+"s"; io.observe(t); });
}
function initScroll(){
  const nav = $("#nav"), toTop = $("#toTop");
  const onScroll = ()=>{
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    nav.classList.toggle("scrolled", y > 10);
    toTop.classList.toggle("show", y > 600);
  };
  window.addEventListener("scroll", onScroll, {passive:true});
  onScroll();
  toTop.addEventListener("click", ()=> window.scrollTo({top:0, behavior:"smooth"}));
}

/* =========================================================
   初始化
   ========================================================= */
document.addEventListener("DOMContentLoaded", ()=>{
  initDates();                       // 日期每天自动更新为今天
  runFlexSearch(null, {scroll:false});
  renderDeals();
  renderCalendar("SHA-KMG");
  renderAirlines();
  renderCommunity();
  initNavScroll();
  initSearchTabs();
  initFilters();
  initAlerts();
  initScoreWeights();
  initSpotlight();
  initReveal();
  initScroll();
});
