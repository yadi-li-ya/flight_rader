/* =========================================================
   特价雷达 FareRadar · 演示数据（均为虚构 Demo 数据）
   ========================================================= */

// ---------- 任意飞：AI 反推目的地候选池 ----------
// 结构：每个目的地带 routes[出发城市] = {base 单程特价, market 平日市价, direct, apd/apa 起降航站楼, fl[] 航班}
// fl 每班：al 航司 / no 航班号 / dep,arr 时刻 / ac 机型 / dur 时长 / dp 相对基准价差 / re 红眼
// 航司官网为真实地址，点击「去官网购票」直接跳转（数据本身为演示虚构）

const AIRLINE_DB = {
  "东航":{code:"MU", url:"https://www.ceair.com", bag:"23kg 托运 + 5kg 手提", bagkg:23, ont:90, rf:0, cf:0, dp:20},
  "国航":{code:"CA", url:"https://www.airchina.com.cn", bag:"23kg 托运 + 5kg 手提", bagkg:23, ont:88, rf:0, cf:0, dp:30},
  "南航":{code:"CZ", url:"https://www.csair.com", bag:"23kg 托运 + 5kg 手提", bagkg:23, ont:87, rf:0, cf:100, dp:0},
  "海航":{code:"HU", url:"https://www.hnair.com", bag:"23kg 托运 + 5kg 手提", bagkg:23, ont:89, rf:0, cf:0, dp:10},
  "川航":{code:"3U", url:"https://www.sichuanair.com", bag:"25kg 托运 + 5kg 手提", bagkg:25, ont:85, rf:0, cf:0, dp:0},
  "深航":{code:"ZH", url:"https://www.shenzhenair.com", bag:"20kg 托运 + 5kg 手提", bagkg:20, ont:84, rf:0, cf:120, dp:10},
  "厦航":{code:"MF", url:"https://www.xiamenair.com", bag:"23kg 托运 + 5kg 手提", bagkg:23, ont:91, rf:0, cf:0, dp:20},
  "吉祥":{code:"HO", url:"https://www.juneyaoair.com", bag:"20kg 托运 + 5kg 手提", bagkg:20, ont:86, rf:0, cf:80, dp:-10},
  "长龙":{code:"GJ", url:"https://www.loongair.cn", bag:"20kg 托运 + 5kg 手提", bagkg:20, ont:83, rf:150, cf:100, dp:-30},
  "祥鹏":{code:"8L", url:"https://www.luckyair.net", bag:"15kg 托运 + 5kg 手提", bagkg:15, ont:78, rf:180, cf:120, dp:-50},
  "春秋":{code:"9C", url:"https://www.ch.com", bag:"无免费托运 · 仅 7kg 手提", bagkg:0, ont:82, rf:180, cf:150, dp:-80}
};

const EXPLORE_POOL = [
  {city:"昆明", emoji:"🏞️", type:"nature", days:5, tags:["春城", "避暑"],
   why:"4 月不算旺季，机票仅为暑期 4 折，气候宜人。",
   routes:{
    "上海":{base:520, market:1280, direct:true, apd:"浦东T1", apa:"长水T1", fl:[{al:"东航", no:"MU4059", dep:"11:40", arr:"15:12", ac:"空客A320", dur:"3h32m", dm:212, dp:20}, {al:"吉祥", no:"HO4563", dep:"16:50", arr:"20:22", ac:"空客A320", dur:"3h32m", dm:212, dp:-10}]},
    "北京":{base:690, market:1500, direct:true, apd:"大兴T1", apa:"长水T1", fl:[{al:"国航", no:"CA7119", dep:"13:15", arr:"17:00", ac:"空客A321", dur:"3h45m", dm:225, dp:30}, {al:"海航", no:"HU8955", dep:"19:40", arr:"23:25", ac:"空客A321", dur:"3h45m", dm:225, dp:10}]},
    "广州":{base:480, market:1150, direct:true, apd:"白云T2", apa:"长水T1", fl:[{al:"南航", no:"CZ4014", dep:"07:25", arr:"09:32", ac:"波音737-800", dur:"2h07m", dm:127, dp:0}, {al:"深航", no:"ZH5110", dep:"12:25", arr:"14:32", ac:"波音737-800", dur:"2h07m", dm:127, dp:10}]},
    "成都":{base:350, market:880, direct:true, apd:"天府T2", apa:"长水T1", fl:[{al:"川航", no:"3U1237", dep:"07:25", arr:"08:47", ac:"波音737-800", dur:"1h22m", dm:82, dp:0}, {al:"国航", no:"CA2000", dep:"12:25", arr:"13:47", ac:"波音737-800", dur:"1h22m", dm:82, dp:30}]},
    "深圳":{base:500, market:1200, direct:true, apd:"宝安T3", apa:"长水T1", fl:[{al:"深航", no:"ZH7338", dep:"14:05", arr:"16:21", ac:"波音737-800", dur:"2h16m", dm:136, dp:10}, {al:"南航", no:"CZ8064", dep:"21:05", arr:"23:21", ac:"波音737-800", dur:"2h16m", dm:136, dp:0}]},
    "杭州":{base:540, market:1300, direct:true, apd:"萧山T3", apa:"长水T1", fl:[{al:"厦航", no:"MF8226", dep:"23:55", arr:"03:12", ac:"空客A320", dur:"3h17m", dm:197, dp:20, re:true, sl:3}, {al:"长龙", no:"GJ1063", dep:"10:15", arr:"13:32", ac:"空客A320", dur:"3h17m", dm:197, dp:-30}]}
   }},
  {city:"三亚", emoji:"🏝️", type:"island", days:5, tags:["海岛", "直飞"],
   why:"红眼特价 + 周二周三出发，比周末直飞省一半。",
   routes:{
    "上海":{base:680, market:1680, direct:true, apd:"浦东T1", apa:"凤凰T1", fl:[{al:"东航", no:"MU2694", dep:"10:15", arr:"13:39", ac:"空客A321", dur:"3h24m", dm:204, dp:20}, {al:"吉祥", no:"HO3198", dep:"15:20", arr:"18:44", ac:"空客A321", dur:"3h24m", dm:204, dp:-10}]},
    "北京":{base:760, market:1680, direct:true, apd:"大兴T1", apa:"凤凰T1", fl:[{al:"国航", no:"CA5754", dep:"12:25", arr:"16:50", ac:"波音787-9", dur:"4h25m", dm:265, dp:30}, {al:"海航", no:"HU7590", dep:"18:20", arr:"22:45", ac:"波音787-9", dur:"4h25m", dm:265, dp:10}]},
    "广州":{base:520, market:1380, direct:true, apd:"白云T2", apa:"凤凰T1", fl:[{al:"南航", no:"CZ2649", dep:"06:40", arr:"08:05", ac:"波音737-800", dur:"1h25m", dm:85, dp:0}, {al:"深航", no:"ZH3745", dep:"11:40", arr:"13:05", ac:"波音737-800", dur:"1h25m", dm:85, dp:10}]},
    "成都":{base:620, market:1500, direct:true, apd:"天府T2", apa:"凤凰T1", fl:[{al:"川航", no:"3U7872", dep:"06:40", arr:"09:25", ac:"空客A321", dur:"2h45m", dm:165, dp:0}, {al:"国航", no:"CA8635", dep:"11:40", arr:"14:25", ac:"空客A321", dur:"2h45m", dm:165, dp:30}]},
    "深圳":{base:430, market:1380, direct:true, apd:"宝安T3", apa:"凤凰T1", fl:[{al:"深航", no:"ZH5973", dep:"13:15", arr:"14:41", ac:"空客A320neo", dur:"1h26m", dm:86, dp:10}, {al:"南航", no:"CZ6699", dep:"19:40", arr:"21:06", ac:"空客A320neo", dur:"1h26m", dm:86, dp:0}]},
    "杭州":{base:700, market:1600, direct:true, apd:"萧山T3", apa:"凤凰T1", fl:[{al:"厦航", no:"MF6861", dep:"05:20", arr:"08:28", ac:"空客A320", dur:"3h08m", dm:188, dp:20, re:true, sl:3}, {al:"长龙", no:"GJ7698", dep:"09:30", arr:"12:38", ac:"空客A320", dur:"3h08m", dm:188, dp:-30}]}
   }},
  {city:"成都", emoji:"🍜", type:"food", days:3, tags:["美食", "高铁备选"],
   why:"非枢纽时刻票，含 23kg 行李，吃货友好。",
   routes:{
    "上海":{base:430, market:1100, direct:true, apd:"浦东T1", apa:"天府T2", fl:[{al:"东航", no:"MU5208", dep:"05:20", arr:"08:23", ac:"空客A321", dur:"3h03m", dm:183, dp:20, re:true, sl:3}, {al:"吉祥", no:"HO5712", dep:"09:30", arr:"12:33", ac:"空客A321", dur:"3h03m", dm:183, dp:-10}]},
    "北京":{base:520, market:1200, direct:true, apd:"大兴T1", apa:"天府T2", fl:[{al:"国航", no:"CA8268", dep:"06:40", arr:"09:29", ac:"波音737-800", dur:"2h49m", dm:169, dp:30}, {al:"海航", no:"HU2104", dep:"11:40", arr:"14:29", ac:"波音737-800", dur:"2h49m", dm:169, dp:10}]},
    "广州":{base:399, market:1100, direct:true, apd:"白云T2", apa:"天府T2", fl:[{al:"南航", no:"CZ5163", dep:"16:50", arr:"19:11", ac:"空客A320", dur:"2h21m", dm:141, dp:0}, {al:"深航", no:"ZH6259", dep:"23:55", arr:"02:16", ac:"空客A320", dur:"2h21m", dm:141, dp:10, re:true, sl:3}]},
    "深圳":{base:480, market:1150, direct:true, apd:"宝安T3", apa:"天府T2", fl:[{al:"深航", no:"ZH8487", dep:"07:25", arr:"09:56", ac:"波音737-800", dur:"2h31m", dm:151, dp:10}, {al:"南航", no:"CZ1213", dep:"12:25", arr:"14:56", ac:"波音737-800", dur:"2h31m", dm:151, dp:0}]},
    "杭州":{base:470, market:1180, direct:true, apd:"萧山T3", apa:"天府T2", fl:[{al:"厦航", no:"MF1375", dep:"14:05", arr:"16:56", ac:"空客A321", dur:"2h51m", dm:171, dp:20}, {al:"长龙", no:"GJ2212", dep:"21:05", arr:"23:56", ac:"空客A321", dur:"2h51m", dm:171, dp:-30}]}
   }},
  {city:"重庆", emoji:"🌃", type:"city", days:3, tags:["城市", "夜景"],
   why:"凌晨红眼但含免费改签，灵活党首选。",
   routes:{
    "上海":{base:460, market:1150, direct:true, apd:"浦东T1", apa:"江北T3", fl:[{al:"东航", no:"MU3382", dep:"10:15", arr:"12:56", ac:"空客A320", dur:"2h41m", dm:161, dp:20}, {al:"吉祥", no:"HO3886", dep:"15:20", arr:"18:01", ac:"空客A320", dur:"2h41m", dm:161, dp:-10}]},
    "北京":{base:560, market:1300, direct:true, apd:"大兴T1", apa:"江北T3", fl:[{al:"国航", no:"CA6442", dep:"12:25", arr:"15:08", ac:"波音737-800", dur:"2h43m", dm:163, dp:30}, {al:"海航", no:"HU8278", dep:"18:20", arr:"21:03", ac:"波音737-800", dur:"2h43m", dm:163, dp:10}]},
    "广州":{base:420, market:1080, direct:true, apd:"白云T2", apa:"江北T3", fl:[{al:"南航", no:"CZ3337", dep:"06:40", arr:"08:36", ac:"空客A320neo", dur:"1h56m", dm:116, dp:0}, {al:"深航", no:"ZH4433", dep:"11:40", arr:"13:36", ac:"空客A320neo", dur:"1h56m", dm:116, dp:10}]},
    "成都":{base:230, market:650, direct:true, apd:"天府T2", apa:"江北T3", fl:[{al:"川航", no:"3U8560", dep:"06:40", arr:"07:40", ac:"空客A320", dur:"1h00m", dm:60, dp:0}, {al:"国航", no:"CA1323", dep:"11:40", arr:"12:40", ac:"空客A320", dur:"1h00m", dm:60, dp:30}]},
    "深圳":{base:450, market:1120, direct:true, apd:"宝安T3", apa:"江北T3", fl:[{al:"深航", no:"ZH6661", dep:"13:15", arr:"15:21", ac:"空客A320", dur:"2h06m", dm:126, dp:10}, {al:"南航", no:"CZ7387", dep:"19:40", arr:"21:46", ac:"空客A320", dur:"2h06m", dm:126, dp:0}]},
    "杭州":{base:480, market:1180, direct:true, apd:"萧山T3", apa:"江北T3", fl:[{al:"厦航", no:"MF7549", dep:"05:20", arr:"07:49", ac:"空客A320neo", dur:"2h29m", dm:149, dp:20, re:true, sl:3}, {al:"长龙", no:"GJ8386", dep:"09:30", arr:"11:59", ac:"空客A320neo", dur:"2h29m", dm:149, dp:-30}]}
   }},
  {city:"西安", emoji:"🏯", type:"city", days:4, tags:["历史", "直飞"],
   why:"航司会员日放票，退改费全免，十三朝古都。",
   routes:{
    "上海":{base:490, market:1250, direct:true, apd:"浦东T1", apa:"咸阳T3", fl:[{al:"东航", no:"MU8415", dep:"15:20", arr:"17:40", ac:"空客A320neo", dur:"2h20m", dm:140, dp:20}, {al:"吉祥", no:"HO8919", dep:"05:20", arr:"07:40", ac:"空客A320neo", dur:"2h20m", dm:140, dp:-10, re:true, sl:3}]},
    "北京":{base:380, market:980, direct:true, apd:"大兴T1", apa:"咸阳T3", fl:[{al:"国航", no:"CA3475", dep:"18:20", arr:"20:09", ac:"波音737-800", dur:"1h49m", dm:109, dp:30}, {al:"海航", no:"HU5311", dep:"06:40", arr:"08:29", ac:"波音737-800", dur:"1h49m", dm:109, dp:10}]},
    "广州":{base:520, market:1280, direct:true, apd:"白云T2", apa:"咸阳T3", fl:[{al:"南航", no:"CZ8370", dep:"11:40", arr:"14:09", ac:"空客A320neo", dur:"2h29m", dm:149, dp:0}, {al:"深航", no:"ZH1466", dep:"16:50", arr:"19:19", ac:"空客A320neo", dur:"2h29m", dm:149, dp:10}]},
    "成都":{base:320, market:820, direct:true, apd:"天府T2", apa:"咸阳T3", fl:[{al:"川航", no:"3U5593", dep:"11:40", arr:"13:01", ac:"空客A320", dur:"1h21m", dm:81, dp:0}, {al:"国航", no:"CA6356", dep:"16:50", arr:"18:11", ac:"空客A320", dur:"1h21m", dm:81, dp:30}]},
    "深圳":{base:540, market:1300, direct:true, apd:"宝安T3", apa:"咸阳T3", fl:[{al:"深航", no:"ZH3694", dep:"19:40", arr:"22:18", ac:"空客A320", dur:"2h38m", dm:158, dp:10}, {al:"南航", no:"CZ4420", dep:"07:25", arr:"10:03", ac:"空客A320", dur:"2h38m", dm:158, dp:0}]},
    "杭州":{base:500, market:1260, direct:true, apd:"萧山T3", apa:"咸阳T3", fl:[{al:"厦航", no:"MF4582", dep:"09:30", arr:"11:42", ac:"空客A320", dur:"2h12m", dm:132, dp:20}, {al:"长龙", no:"GJ5419", dep:"14:05", arr:"16:17", ac:"空客A320", dur:"2h12m", dm:132, dp:-30}]}
   }},
  {city:"厦门", emoji:"🌊", type:"island", days:4, tags:["海岛", "文艺"],
   why:"小长假前错峰，环岛高铁免费接驳，文艺小清新。",
   routes:{
    "上海":{base:540, market:1380, direct:true, apd:"浦东T1", apa:"高崎T3", fl:[{al:"东航", no:"MU3261", dep:"23:55", arr:"01:35", ac:"波音737-800", dur:"1h40m", dm:100, dp:20, re:true, sl:3}, {al:"吉祥", no:"HO3765", dep:"10:15", arr:"11:55", ac:"波音737-800", dur:"1h40m", dm:100, dp:-10}]},
    "北京":{base:720, market:1600, direct:true, apd:"大兴T1", apa:"高崎T3", fl:[{al:"国航", no:"CA6321", dep:"07:25", arr:"10:34", ac:"空客A321", dur:"3h09m", dm:189, dp:30}, {al:"海航", no:"HU8157", dep:"12:25", arr:"15:34", ac:"空客A321", dur:"3h09m", dm:189, dp:10}]},
    "广州":{base:380, market:980, direct:true, apd:"白云T2", apa:"高崎T3", fl:[{al:"南航", no:"CZ3216", dep:"18:20", arr:"19:31", ac:"空客A320neo", dur:"1h11m", dm:71, dp:0}, {al:"深航", no:"ZH4312", dep:"06:40", arr:"07:51", ac:"空客A320neo", dur:"1h11m", dm:71, dp:10}]},
    "成都":{base:620, market:1500, direct:true, apd:"天府T2", apa:"高崎T3", fl:[{al:"川航", no:"3U8439", dep:"18:20", arr:"21:11", ac:"空客A321", dur:"2h51m", dm:171, dp:0}, {al:"国航", no:"CA1202", dep:"06:40", arr:"09:31", ac:"空客A321", dur:"2h51m", dm:171, dp:30}]},
    "深圳":{base:330, market:980, direct:true, apd:"宝安T3", apa:"高崎T3", fl:[{al:"深航", no:"ZH6540", dep:"08:10", arr:"09:16", ac:"空客A320", dur:"1h06m", dm:66, dp:10}, {al:"南航", no:"CZ7266", dep:"13:15", arr:"14:21", ac:"空客A320", dur:"1h06m", dm:66, dp:0}]},
    "杭州":{base:560, market:1400, direct:true, apd:"萧山T3", apa:"高崎T3", fl:[{al:"厦航", no:"MF7428", dep:"15:20", arr:"16:46", ac:"空客A320neo", dur:"1h26m", dm:86, dp:20}, {al:"长龙", no:"GJ8265", dep:"05:20", arr:"06:46", ac:"空客A320neo", dur:"1h26m", dm:86, dp:-30, re:true, sl:3}]}
   }},
  {city:"贵阳", emoji:"⛰️", type:"nature", days:4, tags:["自然", "避暑"],
   why:"支线机场补贴票，裸价全场最低，夏天避暑首选。",
   routes:{
    "上海":{base:410, market:1050, direct:true, apd:"浦东T1", apa:"龙洞堡T2", fl:[{al:"东航", no:"MU7231", dep:"15:20", arr:"18:10", ac:"空客A320", dur:"2h50m", dm:170, dp:20}, {al:"吉祥", no:"HO7735", dep:"05:20", arr:"08:10", ac:"空客A320", dur:"2h50m", dm:170, dp:-10, re:true, sl:3}]},
    "北京":{base:560, market:1280, direct:true, apd:"大兴T1", apa:"龙洞堡T2", fl:[{al:"国航", no:"CA2291", dep:"18:20", arr:"21:29", ac:"空客A321", dur:"3h09m", dm:189, dp:30}, {al:"海航", no:"HU4127", dep:"06:40", arr:"09:49", ac:"空客A321", dur:"3h09m", dm:189, dp:10}]},
    "广州":{base:320, market:880, direct:true, apd:"白云T2", apa:"龙洞堡T2", fl:[{al:"南航", no:"CZ7186", dep:"11:40", arr:"13:16", ac:"空客A320", dur:"1h36m", dm:96, dp:0}, {al:"深航", no:"ZH8282", dep:"16:50", arr:"18:26", ac:"空客A320", dur:"1h36m", dm:96, dp:10}]},
    "成都":{base:300, market:780, direct:true, apd:"天府T2", apa:"龙洞堡T2", fl:[{al:"川航", no:"3U4409", dep:"11:40", arr:"12:49", ac:"空客A320", dur:"1h09m", dm:69, dp:0}, {al:"国航", no:"CA5172", dep:"16:50", arr:"17:59", ac:"空客A320", dur:"1h09m", dm:69, dp:30}]},
    "深圳":{base:340, market:900, direct:true, apd:"宝安T3", apa:"龙洞堡T2", fl:[{al:"深航", no:"ZH2510", dep:"19:40", arr:"21:26", ac:"波音737-800", dur:"1h46m", dm:106, dp:10}, {al:"南航", no:"CZ3236", dep:"07:25", arr:"09:11", ac:"波音737-800", dur:"1h46m", dm:106, dp:0}]},
    "杭州":{base:430, market:1080, direct:true, apd:"萧山T3", apa:"龙洞堡T2", fl:[{al:"厦航", no:"MF3398", dep:"09:30", arr:"12:05", ac:"空客A320", dur:"2h35m", dm:155, dp:20}, {al:"长龙", no:"GJ4235", dep:"14:05", arr:"16:40", ac:"空客A320", dur:"2h35m", dm:155, dp:-30}]}
   }},
  {city:"青岛", emoji:"🍺", type:"city", days:3, tags:["啤酒", "海滨"],
   why:"红眼 + 早班组合，含行李额性价比高，啤酒节标配。",
   routes:{
    "上海":{base:470, market:1200, direct:true, apd:"浦东T1", apa:"胶东T1", fl:[{al:"东航", no:"MU5496", dep:"05:20", arr:"06:34", ac:"空客A320neo", dur:"1h14m", dm:74, dp:20, re:true, sl:3}, {al:"吉祥", no:"HO6000", dep:"09:30", arr:"10:44", ac:"空客A320neo", dur:"1h14m", dm:74, dp:-10}]},
    "北京":{base:380, market:980, direct:true, apd:"大兴T1", apa:"胶东T1", fl:[{al:"国航", no:"CA8556", dep:"06:40", arr:"07:54", ac:"空客A320neo", dur:"1h14m", dm:74, dp:30}, {al:"海航", no:"HU2392", dep:"11:40", arr:"12:54", ac:"空客A320neo", dur:"1h14m", dm:74, dp:10}]},
    "广州":{base:720, market:1500, direct:true, apd:"白云T2", apa:"胶东T1", fl:[{al:"南航", no:"CZ5451", dep:"16:50", arr:"19:46", ac:"空客A320", dur:"2h56m", dm:176, dp:0}, {al:"深航", no:"ZH6547", dep:"23:55", arr:"02:51", ac:"空客A320", dur:"2h56m", dm:176, dp:10, re:true, sl:3}]},
    "成都":{base:650, market:1450, direct:true, apd:"天府T2", apa:"胶东T1", fl:[{al:"川航", no:"3U2674", dep:"16:50", arr:"19:50", ac:"空客A321", dur:"3h00m", dm:180, dp:0}, {al:"国航", no:"CA3437", dep:"23:55", arr:"02:55", ac:"空客A321", dur:"3h00m", dm:180, dp:30, re:true, sl:3}]},
    "深圳":{base:690, market:1480, direct:true, apd:"宝安T3", apa:"胶东T1", fl:[{al:"深航", no:"ZH8775", dep:"07:25", arr:"10:24", ac:"空客A320", dur:"2h59m", dm:179, dp:10}, {al:"南航", no:"CZ1501", dep:"12:25", arr:"15:24", ac:"空客A320", dur:"2h59m", dm:179, dp:0}]},
    "杭州":{base:490, market:1250, direct:true, apd:"萧山T3", apa:"胶东T1", fl:[{al:"厦航", no:"MF1663", dep:"14:05", arr:"15:28", ac:"空客A320neo", dur:"1h23m", dm:83, dp:20}, {al:"长龙", no:"GJ2500", dep:"21:05", arr:"22:28", ac:"空客A320neo", dur:"1h23m", dm:83, dp:-30}]}
   }},
  {city:"丽江", emoji:"🏔️", type:"nature", days:6, tags:["自然", "古城"],
   why:"经昆明中转套利，比直飞省 ¥400，雪山古城绝配。",
   routes:{
    "上海":{base:610, market:1500, direct:false, apd:"浦东T1", apa:"三义T2", tf:true, th:2, hub:"昆明", fl:[{al:"东航", no:"MU6595", dep:"21:05", arr:"02:53", ac:"空客A321", dur:"5h48m", dm:348, dp:20, re:true, sl:3}, {al:"吉祥", no:"HO7099", dep:"08:10", arr:"13:58", ac:"空客A321", dur:"5h48m", dm:348, dp:-10}]},
    "北京":{base:820, market:1700, direct:false, apd:"大兴T1", apa:"三义T2", tf:true, th:2, hub:"昆明", fl:[{al:"国航", no:"CA1655", dep:"23:55", arr:"05:41", ac:"波音737-800", dur:"5h46m", dm:346, dp:30, re:true, sl:3}, {al:"海航", no:"HU3491", dep:"10:15", arr:"16:01", ac:"波音737-800", dur:"5h46m", dm:346, dp:10}]},
    "广州":{base:560, market:1450, direct:true, apd:"白云T2", apa:"三义T2", fl:[{al:"南航", no:"CZ6550", dep:"15:20", arr:"17:54", ac:"波音737-800", dur:"2h34m", dm:154, dp:0}, {al:"深航", no:"ZH7646", dep:"05:20", arr:"07:54", ac:"波音737-800", dur:"2h34m", dm:154, dp:10, re:true, sl:3}]},
    "成都":{base:420, market:1100, direct:true, apd:"天府T2", apa:"三义T2", fl:[{al:"川航", no:"3U3773", dep:"15:20", arr:"16:36", ac:"波音737-800", dur:"1h16m", dm:76, dp:0}, {al:"国航", no:"CA4536", dep:"05:20", arr:"06:36", ac:"波音737-800", dur:"1h16m", dm:76, dp:30, re:true, sl:3}]},
    "深圳":{base:600, market:1480, direct:false, apd:"宝安T3", apa:"三义T2", tf:true, th:2, hub:"昆明", fl:[{al:"深航", no:"ZH1874", dep:"06:40", arr:"11:24", ac:"空客A320", dur:"4h44m", dm:284, dp:10}, {al:"南航", no:"CZ2600", dep:"11:40", arr:"16:24", ac:"空客A320", dur:"4h44m", dm:284, dp:0}]},
    "杭州":{base:640, market:1550, direct:false, apd:"萧山T3", apa:"三义T2", tf:true, th:2, hub:"昆明", fl:[{al:"厦航", no:"MF2762", dep:"13:15", arr:"18:50", ac:"空客A320", dur:"5h35m", dm:335, dp:20}, {al:"长龙", no:"GJ3599", dep:"19:40", arr:"01:15", ac:"空客A320", dur:"5h35m", dm:335, dp:-30, re:true, sl:3}]}
   }},
  {city:"长沙", emoji:"🌶️", type:"food", days:3, tags:["美食", "茶颜"],
   why:"网红城市特价舱，周末也能捡漏，吃喝玩乐一条龙。",
   routes:{
    "上海":{base:450, market:1120, direct:true, apd:"浦东T1", apa:"黄花T2", fl:[{al:"东航", no:"MU3695", dep:"15:20", arr:"17:07", ac:"空客A320neo", dur:"1h47m", dm:107, dp:20}, {al:"吉祥", no:"HO4199", dep:"05:20", arr:"07:07", ac:"空客A320neo", dur:"1h47m", dm:107, dp:-10, re:true, sl:3}]},
    "北京":{base:520, market:1250, direct:true, apd:"大兴T1", apa:"黄花T2", fl:[{al:"国航", no:"CA6755", dep:"18:20", arr:"20:51", ac:"波音737-800", dur:"2h31m", dm:151, dp:30}, {al:"海航", no:"HU8591", dep:"06:40", arr:"09:11", ac:"波音737-800", dur:"2h31m", dm:151, dp:10}]},
    "广州":{base:360, market:950, direct:true, apd:"白云T2", apa:"黄花T2", fl:[{al:"南航", no:"CZ3650", dep:"11:40", arr:"12:56", ac:"波音737-800", dur:"1h16m", dm:76, dp:0}, {al:"深航", no:"ZH4746", dep:"16:50", arr:"18:06", ac:"波音737-800", dur:"1h16m", dm:76, dp:10}]},
    "成都":{base:420, market:1080, direct:true, apd:"天府T2", apa:"黄花T2", fl:[{al:"川航", no:"3U8873", dep:"11:40", arr:"13:28", ac:"空客A320", dur:"1h48m", dm:108, dp:0}, {al:"国航", no:"CA1636", dep:"16:50", arr:"18:38", ac:"空客A320", dur:"1h48m", dm:108, dp:30}]},
    "深圳":{base:380, market:980, direct:true, apd:"宝安T3", apa:"黄花T2", fl:[{al:"深航", no:"ZH6974", dep:"19:40", arr:"21:03", ac:"空客A320neo", dur:"1h23m", dm:83, dp:10}, {al:"南航", no:"CZ7700", dep:"07:25", arr:"08:48", ac:"空客A320neo", dur:"1h23m", dm:83, dp:0}]},
    "杭州":{base:470, market:1150, direct:true, apd:"萧山T3", apa:"黄花T2", fl:[{al:"厦航", no:"MF7862", dep:"09:30", arr:"11:02", ac:"空客A320neo", dur:"1h32m", dm:92, dp:20}, {al:"长龙", no:"GJ8699", dep:"14:05", arr:"15:37", ac:"空客A320neo", dur:"1h32m", dm:92, dp:-30}]}
   }},
  {city:"大理", emoji:"🏞️", type:"nature", days:5, tags:["风花雪月", "慢生活"],
   why:"苍山洱海，节奏慢，适合彻底放空的小长假。",
   routes:{
    "上海":{base:660, market:1600, direct:true, apd:"浦东T1", apa:"荒草坝T1", fl:[{al:"东航", no:"MU6456", dep:"05:20", arr:"09:11", ac:"空客A321", dur:"3h51m", dm:231, dp:20, re:true, sl:3}, {al:"吉祥", no:"HO6960", dep:"09:30", arr:"13:21", ac:"空客A321", dur:"3h51m", dm:231, dp:-10}]},
    "北京":{base:880, market:1800, direct:true, apd:"大兴T1", apa:"荒草坝T1", fl:[{al:"国航", no:"CA1516", dep:"06:40", arr:"10:33", ac:"空客A320", dur:"3h53m", dm:233, dp:30}, {al:"海航", no:"HU3352", dep:"11:40", arr:"15:33", ac:"空客A320", dur:"3h53m", dm:233, dp:10}]},
    "广州":{base:600, market:1500, direct:true, apd:"白云T2", apa:"荒草坝T1", fl:[{al:"南航", no:"CZ6411", dep:"16:50", arr:"19:21", ac:"波音737-800", dur:"2h31m", dm:151, dp:0}, {al:"深航", no:"ZH7507", dep:"23:55", arr:"02:26", ac:"波音737-800", dur:"2h31m", dm:151, dp:10, re:true, sl:3}]},
    "成都":{base:380, market:980, direct:true, apd:"天府T2", apa:"荒草坝T1", fl:[{al:"川航", no:"3U3634", dep:"16:50", arr:"18:15", ac:"波音737-800", dur:"1h25m", dm:85, dp:0}, {al:"国航", no:"CA4397", dep:"23:55", arr:"01:20", ac:"波音737-800", dur:"1h25m", dm:85, dp:30, re:true, sl:3}]},
    "深圳":{base:640, market:1550, direct:true, apd:"宝安T3", apa:"荒草坝T1", fl:[{al:"深航", no:"ZH1735", dep:"07:25", arr:"10:06", ac:"空客A320", dur:"2h41m", dm:161, dp:10}, {al:"南航", no:"CZ2461", dep:"12:25", arr:"15:06", ac:"空客A320", dur:"2h41m", dm:161, dp:0}]},
    "杭州":{base:690, market:1650, direct:true, apd:"萧山T3", apa:"荒草坝T1", fl:[{al:"厦航", no:"MF2623", dep:"14:05", arr:"17:42", ac:"波音737-800", dur:"3h37m", dm:217, dp:20}, {al:"长龙", no:"GJ3460", dep:"21:05", arr:"00:42", ac:"波音737-800", dur:"3h37m", dm:217, dp:-30, re:true, sl:3}]}
   }},
  {city:"哈尔滨", emoji:"❄️", type:"city", days:4, tags:["北国", "冰雪"],
   why:"反季节特价，夏天看中央大街也很舒服，冬季冰雪封神。",
   routes:{
    "上海":{base:780, market:1700, direct:true, apd:"浦东T1", apa:"太平T1", fl:[{al:"东航", no:"MU4747", dep:"11:40", arr:"14:44", ac:"波音737-800", dur:"3h04m", dm:184, dp:20}, {al:"吉祥", no:"HO5251", dep:"16:50", arr:"19:54", ac:"波音737-800", dur:"3h04m", dm:184, dp:-10}]},
    "北京":{base:480, market:1180, direct:true, apd:"大兴T1", apa:"太平T1", fl:[{al:"国航", no:"CA7807", dep:"13:15", arr:"15:18", ac:"空客A320", dur:"2h03m", dm:123, dp:30}, {al:"海航", no:"HU1643", dep:"19:40", arr:"21:43", ac:"空客A320", dur:"2h03m", dm:123, dp:10}]},
    "广州":{base:980, market:2000, direct:true, apd:"白云T2", apa:"太平T1", fl:[{al:"南航", no:"CZ4702", dep:"07:25", arr:"12:18", ac:"空客A350", dur:"4h53m", dm:293, dp:0}, {al:"深航", no:"ZH5798", dep:"12:25", arr:"17:18", ac:"空客A350", dur:"4h53m", dm:293, dp:10}]},
    "成都":{base:760, market:1800, direct:true, apd:"天府T2", apa:"太平T1", fl:[{al:"川航", no:"3U1925", dep:"07:25", arr:"11:57", ac:"空客A350", dur:"4h32m", dm:272, dp:0}, {al:"国航", no:"CA2688", dep:"12:25", arr:"16:57", ac:"空客A350", dur:"4h32m", dm:272, dp:30}]},
    "深圳":{base:1020, market:2050, direct:true, apd:"宝安T3", apa:"太平T1", fl:[{al:"深航", no:"ZH8026", dep:"14:05", arr:"19:02", ac:"空客A330", dur:"4h57m", dm:297, dp:10}, {al:"南航", no:"CZ8752", dep:"21:05", arr:"02:02", ac:"空客A330", dur:"4h57m", dm:297, dp:0, re:true, sl:3}]},
    "杭州":{base:820, market:1750, direct:true, apd:"萧山T3", apa:"太平T1", fl:[{al:"厦航", no:"MF8914", dep:"23:55", arr:"03:13", ac:"空客A321", dur:"3h18m", dm:198, dp:20, re:true, sl:3}, {al:"长龙", no:"GJ1751", dep:"10:15", arr:"13:33", ac:"空客A321", dur:"3h18m", dm:198, dp:-30}]}
   }}
];

// ---------- 实时捡漏流 ----------
const DEALS = [
  {id:1, from:"上海", to:"昆明", src:"airline", srcName:"东航官方", price:498, market:1280,
   discount:"2.5折", direct:true, depart:"04-16 06:40", arrive:"04-16 10:05", dur:"3h25m",
   flightNo:"MU5807", apd:"浦东T1", apa:"长水T1",
   tags:["直飞","含行李"], posted:"12分钟前", flash:false,
   rules:{bare:498, market:1280, baggageKg:23, refundFee:0, changeFee:0, redEye:false, sleepLossH:0, durationH:3.42, transfer:false, transferH:0, onTime:91}},
  {id:2, from:"北京", to:"三亚", src:"ota", srcName:"去哪儿", price:688, market:1680,
   discount:"3折", direct:true, depart:"04-17 23:55", arrive:"04-18 03:20", dur:"3h25m",
   flightNo:"HU7181", apd:"大兴T1", apa:"凤凰T1",
   tags:["红眼","限时秒杀"], posted:"1小时前", flash:true,
   rules:{bare:688, market:1680, baggageKg:20, refundFee:200, changeFee:0, redEye:true, sleepLossH:3, durationH:3.42, transfer:false, transferH:0, onTime:82}},
  {id:3, from:"广州", to:"成都", src:"airline", srcName:"川航官方", price:399, market:1100,
   discount:"2.8折", direct:true, depart:"04-18 14:10", arrive:"04-18 16:35", dur:"2h25m",
   flightNo:"3U8734", apd:"白云T2", apa:"天府T2",
   tags:["直飞","手慢无"], posted:"3小时前", flash:false,
   rules:{bare:399, market:1100, baggageKg:25, refundFee:0, changeFee:0, redEye:false, sleepLossH:0, durationH:2.42, transfer:false, transferH:0, onTime:88}},
  {id:4, from:"上海", to:"重庆", src:"ota", srcName:"飞猪", price:460, market:1150,
   discount:"3折", direct:false, depart:"04-19 05:20", arrive:"04-19 10:40", dur:"5h20m",
   flightNo:"9C8917", apd:"浦东T1", apa:"江北T3",
   tags:["中转","红眼"], posted:"5小时前", flash:false,
   rules:{bare:460, market:1150, baggageKg:20, refundFee:0, changeFee:150, redEye:true, sleepLossH:2, durationH:5.33, transfer:true, transferH:2, onTime:75}},
  {id:5, from:"杭州", to:"西安", src:"airline", srcName:"海航官方", price:490, market:1250,
   discount:"3.2折", direct:true, depart:"04-20 09:30", arrive:"04-20 12:10", dur:"2h40m",
   flightNo:"HU7893", apd:"萧山T3", apa:"咸阳T3",
   tags:["直飞","会员日"], posted:"昨日", flash:false,
   rules:{bare:490, market:1250, baggageKg:23, refundFee:0, changeFee:0, redEye:false, sleepLossH:0, durationH:2.67, transfer:false, transferH:0, onTime:89}},
  {id:6, from:"深圳", to:"厦门", src:"ota", srcName:"携程", price:330, market:980,
   discount:"2.6折", direct:true, depart:"04-21 13:15", arrive:"04-21 14:25", dur:"1h10m",
   flightNo:"ZH9871", apd:"宝安T3", apa:"高崎T3",
   tags:["直飞","¥500内"], posted:"昨日", flash:false,
   rules:{bare:330, market:980, baggageKg:20, refundFee:0, changeFee:80, redEye:false, sleepLossH:0, durationH:1.17, transfer:false, transferH:0, onTime:91}},
  {id:7, from:"上海", to:"丽江", src:"airline", srcName:"祥鹏航空", price:610, market:1500,
   discount:"3.5折", direct:false, depart:"04-22 08:00", arrive:"04-22 13:30", dur:"5h30m",
   flightNo:"8L9852", apd:"浦东T1", apa:"三义T2",
   tags:["中转套利"], posted:"2天前", flash:false,
   rules:{bare:610, market:1500, baggageKg:15, refundFee:180, changeFee:0, redEye:false, sleepLossH:0, durationH:5.5, transfer:true, transferH:1.5, onTime:70}},
  {id:8, from:"成都", to:"三亚", src:"ota", srcName:"同程", price:520, market:1400,
   discount:"3折", direct:true, depart:"04-23 19:40", arrive:"04-23 22:05", dur:"2h25m",
   flightNo:"3U8761", apd:"天府T2", apa:"凤凰T1",
   tags:["直飞","海岛"], posted:"2天前", flash:false,
   rules:{bare:520, market:1400, baggageKg:20, refundFee:0, changeFee:100, redEye:false, sleepLossH:0, durationH:2.42, transfer:false, transferH:0, onTime:86}},
  {id:9, from:"上海", to:"青岛", src:"airline", srcName:"山航官方", price:470, market:1200,
   discount:"3.2折", direct:true, depart:"04-24 07:10", arrive:"04-24 09:05", dur:"1h55m",
   flightNo:"SC4663", apd:"浦东T1", apa:"胶东T1",
   tags:["直飞","啤酒节"], posted:"3天前", flash:false,
   rules:{bare:470, market:1200, baggageKg:23, refundFee:0, changeFee:0, redEye:false, sleepLossH:0, durationH:1.92, transfer:false, transferH:0, onTime:87}},
];

// ---------- 特价日历（每条航线 5 周最低价） ----------
const CALENDAR = {
  "SHA-KMG":{name:"上海 ⇄ 昆明", prices:[1280,980,620,498,560,720,890, 760,540,520,610,580,640,820, 690,510,498,560,600,590,770, 720,530,520,580,540,610,800, 700,560,540,600,570,620,790]},
  "PEK-SYX":{name:"北京 ⇄ 三亚", prices:[1680,1380,980,760,690,880,1180, 1100,820,720,688,740,860,1200, 980,760,700,720,780,820,1150, 1020,780,740,760,800,840,1120, 980,800,760,780,820,860,1100]},
  "CAN-CTU":{name:"广州 ⇄ 成都", prices:[1100,820,520,430,460,560,720, 640,480,430,460,470,540,700, 580,450,420,440,470,510,680, 600,470,430,450,480,520,690, 590,460,440,460,490,520,670]}
};

// ---------- 航司活动通知 ----------
const AIRLINES = [
  {logo:"✈️", name:"东方航空", act:"会员日放票", when:"9/18 00:00 开抢",
   desc:"次月上海 / 昆明 / 成都等线 2-3 折票集中放出，建议提前填好乘机人。",
   site:"https://www.ceair.com", btn:"去东航抢"},
  {logo:"🐼", name:"四川航空", act:"熊猫惠周三特惠", when:"每周三 10:00",
   desc:"成都 / 重庆进出港支线补贴票低至 ¥199 起，手慢无。",
   site:"https://www.sichuanair.com", btn:"去川航看"},
  {logo:"🌊", name:"海南航空", act:"不定时闪购", when:"工作日午间随机",
   desc:"含行李额、退改宽松的闪购票，数量少不预告，建议开提醒盯守。",
   site:"https://www.hnair.com", btn:"去海航刷"},
  {logo:"🐯", name:"春秋航空", act:"大促秒杀", when:"618 / 双11 / 开学季",
   desc:"裸价最低常有 ¥9 秒杀，适合只背背包的极简出行。",
   site:"https://www.ch.com", btn:"去春秋逛"}
];

// ---------- 捡漏社区晒单 ----------
const COMMUNITY = [
  {name:"羊毛老张", initial:"张", time:"今天 09:12", stars:5,
   text:"设了上海→昆明 ¥500 提醒，今早掉到 498 直接推送，立马锁了！东航官方的票还能免费改签。",
   deal:"上海 ✈ 昆明 · ¥498（市价 ¥1280）"},
  {name:"打卡少女Mia", initial:"M", time:"昨天 21:40", stars:5,
   text:"用「任意飞」输入预算 600，给我推了丽江经昆明中转，比直飞省 400，真实到手价评分帮我省了行李坑。",
   deal:"上海 → 丽江 · ¥610（中转套利）"},
  {name:"出差党老王", initial:"王", time:"2天前", stars:4,
   text:"特价日历真香，本来订 4-20 的票，看日历发现 4-18 同航线便宜 180，顺手把会改了。",
   deal:"北京 → 三亚 · ¥688（错峰 1 天省 ¥180）"}
];
