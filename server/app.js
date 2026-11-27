/* 통합본: tools/integrate_server.py 가 프로토타입 app.js에서 생성. 직접 수정 금지 */
/* AIK Supermicro 서버 쇼룸 + 구성기 프로토타입
 * 데이터: catalog.js (window.CATALOG). 화면 로직만 이 파일에 있음.
 * 라우트: #/  #/products  #/product/:id  #/configure/:id  #/downloads
 */
(function () {
  const C = window.CATALOG;
  const ITEMS = Object.fromEntries(C.items.map(i => [i.id, i]));
  const MODELS = Object.fromEntries(C.models.map(m => [m.id, m]));
  const $ = (s, el = document) => el.querySelector(s);
  const app = $("#app");

  // ---------- 공통 포맷 ----------
  const won = n => Math.round(n).toLocaleString("ko-KR");
  const man = n => {                       // 원 → "1,234만원"
    const v = Math.round(n / 1e5) * 10;     // 10만원 단위 반올림, 단위 만원
    if (v >= 10000) return (v / 10000).toFixed(2).replace(/\.?0+$/, "") + "억원";
    return v.toLocaleString("ko-KR") + "만원";
  };
  const band = n => {
    const b = C.meta.price_band;
    return `${man(n * (1 - b))} ~ ${man(n * (1 + b))}`;
  };
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const srvArt = u => `<div class="srv" style="width:${Math.min(80, 50 + u * 4)}%">${Array.from({ length: Math.min(4, Math.max(1, u)) * 2 }, (_, k) => `<i class="${k === 0 ? "led" : ""}"></i>`).join("")}</div>`;
  const tagsOf = m => [
    `<span class="tag gray">${m.u}U</span>`,
    `<span class="tag gray">${m.cpu_vendor}</span>`,
    m.gpu_max ? `<span class="tag">GPU ${m.gpu_fixed ? m.gpu_fixed_label : "최대 " + m.gpu_max}</span>` : "",
    m.dlc ? `<span class="tag dlc">DLC 지원</span>` : "",
  ].join("");

  // ---------- 레이아웃 ----------
  function shell(active, body) {
    const nav = [["#/", "개요"], ["#/products", "제품"], ["#/dc-lab", "DC구축 시뮬레이터"], ["#/configure/" + C.models[0].id, "서버 구성하기"], ["#/downloads", "자료실"], ["#/robot", "서버 교체 로봇"]];
    const TAB = { "개요": "서버 소개", "서버 구성하기": "내 서버 만들기" };
    const tabs = document.getElementById("smcTabs");
    if (tabs) tabs.innerHTML = nav.map(([h, t], i) => `<li class="${i === 0 ? "first_tab " : ""}${active === t ? "tab_choice" : ""}"><a href="${h}">${TAB[t] || t}</a></li>`).join("");
    const crumb = document.getElementById("smcCrumb");
    if (crumb) crumb.textContent = TAB[active] || active;
    app.innerHTML = `

      ${body}
      <div class="smc-note"><div class="wrap">
        <b>(주)에이아이코리아</b> | ${esc(C.meta.partner_label)} | 문의 ${esc(C.meta.quote_email)}<br>
        가격은 문의 시 안내합니다. 사양 데이터 기준일 ${esc(C.meta.updated)}.
      </div></div>`;
    { const top = app.getBoundingClientRect().top + window.pageYOffset; if (window.pageYOffset > top) window.scrollTo(0, top); }
  }

  // ---------- 1. 랜딩 ----------
  function viewHome() {
    const fam = C.families.map(f => {
      const n = C.models.filter(m => m.family === f.id).length;
      return `<a class="card" href="#/products?family=${f.id}"><h3>${esc(f.name)}</h3><p>${esc(f.desc)}</p><p style="margin-top:10px"><span class="tag gray">${n}개 모델</span></p></a>`;
    }).join("");
    const uses = C.use_cases.map(u => `<a class="card" href="#/products?use=${u.id}"><h3>${esc(u.name)}</h3><p>${esc(u.desc)}</p></a>`).join("");
    shell("개요", `
      <section class="hero"><div class="wrap">
        <p class="intro">모델을 고르고 CPU, 메모리, GPU, 스토리지를 직접 바꿔 보면 구성 가능 여부와 예상 전력을 바로 확인할 수 있습니다. 고밀도 GPU 서버는 액체냉각(DLC) 설계까지 함께 제안합니다.</p>
        <a class="btn sky" href="#/products">내 서버 만들기</a> <a class="btn ghost" href="#/downloads">카탈로그 다운로드</a>
        <div class="stats">
          <div><b>${ALL.length.toLocaleString()}종</b><small>Supermicro 전체 라인업</small></div>
          <div><b>실시간</b><small>구성 검증, 전력 확인</small></div>
          <div><b>전력, 발열</b><small>랙 단위 kW 자동 산출</small></div>
          <div><b>EPC 연계</b><small>DLC, CDU, 배관 설계</small></div>
        </div>
      </div></section>
      <section class="blk one"><div class="wrap">
        <h2>서버, 냉각, 설치를 한 번의 계약으로</h2><p class="sub">서버 업체, 냉각 업체, 시공사를 따로 계약하면 책임이 나뉩니다. 에이아이코리아는 세 가지를 하나의 창구에서 수행합니다.</p>
        <div class="flow">
          <div class="st"><span class="no">01</span><h3>서버 공급</h3><p>Supermicro GPU 서버, 랙 단위 시스템<br>사양 구성, 납품, 시운전</p></div>
          <i aria-hidden="true"></i>
          <div class="st"><span class="no">02</span><h3>액체냉각 설계</h3><p>CDU, Manifold, 2차측 배관<br>랙 열부하에 맞춘 용량 산정</p></div>
          <i aria-hidden="true"></i>
          <div class="st"><span class="no">03</span><h3>설치, 유지보수</h3><p>랙 설치, 배관 시공, 누설 시험<br>가동 후 점검과 유지보수</p></div>
        </div>
        <div class="cmp"><div><b>분산 발주</b><span>계약 4건, 업체 간 책임 구분 필요</span></div><div class="on"><b>AIKOREA 단일 창구</b><span>계약 1건, 단일 책임</span></div></div>
      </div></section>
      <section class="blk" style="padding-top:0"><div class="wrap">
        <h2>Supermicro 소개 영상</h2><p class="sub">1분 분량의 국문 소개 영상입니다.</p>
        <video class="vid wide" controls playsinline preload="metadata" src="video/smc_intro_ko_1min.mp4#t=4"></video>
      </div></section>
      <section class="blk" style="padding-top:0"><div class="wrap">
        <h2>용도로 찾기</h2><p class="sub">워크로드를 고르면 맞는 모델만 추려 드립니다.</p>
        <div class="grid g3">${uses}</div>
      </div></section>
      <section class="blk" style="padding-top:0"><div class="wrap">
        <h2>제품군</h2><p class="sub">Supermicro 주력 서버 패밀리</p>
        <div class="grid g4">${fam}</div>
      </div></section>`);
  }

  // ---------- 2. 제품 목록 ----------
  function viewProductsOld(q) {
    const f = { family: q.getAll("family"), use: q.getAll("use"), cpu: q.getAll("cpu"), gpu: q.get("gpu"), dlc: q.get("dlc") };
    const list = C.models.filter(m =>
      (!f.family.length || f.family.includes(m.family)) &&
      (!f.use.length || f.use.some(u => m.use_cases.includes(u))) &&
      (!f.cpu.length || f.cpu.includes(m.cpu_vendor)) &&
      (!f.gpu || (f.gpu === "y" ? m.gpu_max > 0 : m.gpu_max === 0)) &&
      (!f.dlc || m.dlc));
    const cb = (k, v, t) => `<label><input type="checkbox" data-k="${k}" value="${v}" ${q.getAll(k).includes(v) ? "checked" : ""}> ${esc(t)}</label>`;
    const cards = list.map(m => {
      const base = startPrice(m);
      return `<a class="card pcard" href="#/product/${m.id}">
        <div class="img">${srvArt(m.u)}</div>
        <div class="sku">${esc(m.sku)}</div>
        <h3>${esc(m.name)}</h3>
        <p style="margin-bottom:10px">${esc(m.summary)}</p>
        <div>${tagsOf(m)}</div>
        <div class="meta">
          <div class="price">${smcPrice(m.id)}</div>
          <div class="lead">납기 ${startLead(m)}</div>
        </div></a>`;
    }).join("") || `<div class="card">조건에 맞는 모델이 없습니다.</div>`;
    shell("제품", `
      <div class="wrap"><div class="crumb"><a href="#/">개요</a> / 제품</div>
      <div class="plist">
        <aside class="filters" id="flt">
          <h4>제품군</h4>${C.families.map(x => cb("family", x.id, x.name)).join("")}
          <h4>용도</h4>${C.use_cases.map(x => cb("use", x.id, x.name)).join("")}
          <h4>CPU</h4>${cb("cpu", "Intel", "Intel Xeon")}${cb("cpu", "AMD", "AMD EPYC")}
          <h4>기타</h4>${cb("gpu", "y", "GPU 탑재 모델")}${cb("dlc", "y", "DLC(수냉) 지원")}
          <p style="margin:14px 0 0"><a class="btn ghost sm" href="#/products">필터 초기화</a></p>
        </aside>
        <div><p class="sub" style="margin:0 0 12px">${list.length}개 모델 / 가격, 납기는 견적으로 안내</p>
          <div class="grid g3">${cards}</div></div>
      </div></div>`);
    $("#flt").addEventListener("change", () => {
      const p = new URLSearchParams();
      document.querySelectorAll("#flt input:checked").forEach(i => p.append(i.dataset.k, i.value));
      location.hash = "#/products" + (p.toString() ? "?" + p : "");
    });
  }

  // ---------- 3. 제품 상세 ----------
  function viewProductLive(id) {
    const m = MODELS[id];
    if (!m) return viewProducts(new URLSearchParams());
    const fam = C.families.find(f => f.id === m.family);
    const docs = C.docs.filter(d => d.models.includes(m.id) || d.models.includes("*"));
    shell("제품", `
      <div class="wrap"><div class="crumb"><a href="#/">개요</a> / <a href="#/products?family=${m.family}">${esc(fam.name)}</a> / ${esc(m.sku)}</div>
      <div class="detail">
        <div>
          <div class="card img" style="display:grid;place-items:center;background:linear-gradient(180deg,#F1F5F9,#E2E8F0)">${srvArt(m.u)}<small style="color:var(--ink-3);margin-top:8px">제품 이미지: Supermicro 사용 승인 후 교체</small></div>
          <h3 style="margin:24px 0 10px">주요 사양</h3>
          <table class="kv">${Object.entries(m.specs).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</table>
          <p style="font-size:12px;color:var(--ink-3)">상세 사양은 <a href="${esc(m.url)}" target="_blank" rel="noopener" style="color:var(--navy)">Supermicro 공식 제품 페이지</a> 기준. ${esc(m.source_note || "")}</p>
        </div>
        <div>
          <div class="sku">${esc(m.sku)}</div>
          <h1>${esc(m.name)}</h1>
          <div style="margin-bottom:12px">${tagsOf(m)}</div>
          <p style="color:var(--ink-2)">${esc(m.summary)}</p>
          <div class="card" style="margin:18px 0">
            <div class="row2" style="display:flex;justify-content:space-between"><span>가격</span><b class="price">${smcPrice(m.id)}</b></div>
            <div class="row2" style="display:flex;justify-content:space-between;margin-top:6px"><span>납기</span><b>${startLead(m)}</b></div>
            <p style="font-size:12px;margin-top:10px">${smcNote(m.id)}</p>
            <p style="margin-top:14px"><a class="btn" href="#/configure/${m.id}">이 모델로 구성하기</a></p>
          </div>
          <h3 style="margin:24px 0 10px">자료 다운로드</h3>
          ${docs.map(docRow).join("") || "<p>등록된 자료가 없습니다.</p>"}
        </div>
      </div></div>`);
    bindDocs();
  }

  // ---------- 4. 자료실 ----------
  function docRowOld(d) {
    return `<div class="dl"><span class="ic">${d.type === "AIK" ? "AIK" : "PDF"}</span>
      <div><b>${esc(d.title)}</b><br><small>${esc(d.kind)} · ${esc(d.lang)} · ${esc(d.size || "")}</small></div>
      ${d.gated ? `<button class="btn ghost sm" data-doc="${d.id}">신청 후 받기</button>` : `<a class="btn ghost sm" href="${esc(d.url)}" target="_blank" rel="noopener">받기</a>`}
    </div>`;
  }
  function viewDownloadsOld() {
    const groups = [...new Set(C.docs.map(d => d.kind))];
    shell("자료실", `
      <div class="wrap"><div class="crumb"><a href="#/">개요</a> / 자료실</div>
      <section class="blk" style="padding-top:20px">
        <h2>카탈로그, 브로슈어, 데이터시트</h2>
        <p class="sub">Supermicro 공식 자료는 바로 받을 수 있고, AIK 통합 카탈로그는 간단한 정보 입력 후 이메일로 보내 드립니다.</p>
        ${groups.map(g => `<h3 style="margin:24px 0 10px">${esc(g)}</h3>${C.docs.filter(d => d.kind === g).map(docRow).join("")}`).join("")}
      </section></div>`);
    bindDocs();
  }
  function bindDocs() {
    document.querySelectorAll("[data-doc]").forEach(b => b.onclick = () => {
      const d = C.docs.find(x => x.id === b.dataset.doc);
      openModal(`<h2 style="margin-top:0">${esc(d.title)}</h2>
        <p class="sub">입력하신 이메일로 자료를 보내 드립니다. (프로토타입: 실제 발송 없음)</p>
        ${leadForm(false)}`, "자료 신청이 접수된 것으로 가정합니다. 실제 운영 시 CRM/메일 발송 연동 필요.");
    });
  }

  // ---------- 5. 구성기 ----------
  const STEPS = [
    { key: "model", name: "모델" }, { key: "cpu", name: "CPU" }, { key: "mem", name: "메모리" },
    { key: "storage", name: "스토리지" }, { key: "gpu", name: "GPU" }, { key: "net", name: "네트워크" },
    { key: "power", name: "전원, 냉각" }, { key: "svc", name: "보증, 서비스" }, { key: "review", name: "견적 확인" },
  ];
  let S = null; // 구성 상태

  function defaults(m) {
    const d = m.defaults || {};
    return {
      model: m.id, step: 0, units: 1,
      cpu: d.cpu || (m.opts.cpu || [])[0] || null,
      mem: { id: d.mem || (m.opts.mem || [])[0] || null, qty: d.mem_qty || m.sockets * 8 },
      boot: d.boot || (m.opts.boot || [])[0] || null,
      drive: { id: d.drive || null, qty: d.drive_qty || 0 },
      raid: d.raid || "raid-none",
      gpu: { id: d.gpu || null, qty: d.gpu_qty || 0 },
      nic: d.nic ? [...d.nic] : [],
      cooling: d.cooling || "cool-air",
      warranty: d.warranty || "war-3y",
      svc: d.svc ? [...d.svc] : [],
    };
  }
  const M = () => MODELS[S.model];

  function lines() {
    const m = M(), L = [];
    const add = (id, qty, label) => { const it = ITEMS[id]; if (it && qty > 0) L.push({ it, qty: qty * 1, label: label || it.name }); };
    L.push({ it: { name: m.sku + " 베어본", price: m.base_price, lead: m.lead_weeks[0], watts: m.base_watts }, qty: 1, label: m.sku + " 기본 섀시(베어본)" });
    add(S.cpu, m.sockets);
    add(S.mem.id, S.mem.qty);
    add(S.boot, 1);
    add(S.drive.id, S.drive.qty);
    if (S.raid !== "raid-none") add(S.raid, 1);
    if (!m.gpu_fixed) add(S.gpu.id, S.gpu.qty);
    S.nic.forEach(n => add(n, 1));
    add(psuFor(), 1);
    if (S.cooling !== "cool-air") add(S.cooling, 1);
    add(S.warranty, 1);
    S.svc.forEach(s => add(s, 1));
    return L;
  }
  function watts() {
    const m = M();
    let w = m.base_watts;
    const W = (id, q) => (ITEMS[id]?.watts || 0) * q;
    w += W(S.cpu, m.sockets) + W(S.mem.id, S.mem.qty) + W(S.boot, 1) + W(S.drive.id, S.drive.qty);
    if (!m.gpu_fixed) w += W(S.gpu.id, S.gpu.qty);
    S.nic.forEach(n => w += W(n, 1));
    return Math.round(w);
  }
  function psuFor() {
    const need = watts() * C.meta.psu_headroom;
    const cand = (M().opts.psu || []).map(id => ITEMS[id]).sort((a, b) => a.capacity - b.capacity);
    return (cand.find(p => p.capacity >= need) || cand[cand.length - 1] || {}).id;
  }
  function totals() {
    const L = lines();
    const unit = L.reduce((s, l) => s + (l.it.price || 0) * l.qty, 0);
    const lead = Math.max(...L.map(l => l.it.lead || 0), M().lead_weeks[0]) + C.meta.assembly_weeks;
    return { L, unit, total: unit * S.units, lead: [lead, lead + C.meta.lead_buffer_weeks], w: watts() };
  }

  function validate() {
    const m = M(), out = [];
    const cpu = ITEMS[S.cpu], mem = ITEMS[S.mem.id], drv = ITEMS[S.drive.id], gpu = ITEMS[S.gpu.id];
    if (!cpu) out.push({ lv: "err", st: 1, msg: "CPU를 선택하세요." });
    if (!mem) out.push({ lv: "err", st: 2, msg: "메모리를 선택하세요." });
    else {
      const ch = m.mem_channels * m.sockets;
      if (S.mem.qty > m.dimm_slots) out.push({ lv: "err", st: 2, msg: `메모리는 최대 ${m.dimm_slots}개 슬롯입니다.` });
      if (S.mem.qty < m.sockets) out.push({ lv: "err", st: 2, msg: `CPU ${m.sockets}개 구성에는 최소 ${m.sockets}개 DIMM이 필요합니다.` });
      else if (S.mem.qty % ch !== 0 && S.mem.qty < m.dimm_slots) out.push({ lv: "warn", st: 2, msg: `최대 대역폭을 위해 DIMM ${ch}개 단위(채널 ${m.mem_channels}개 x CPU ${m.sockets}개) 장착을 권장합니다.` });
    }
    if (drv) {
      const bays = m.bays[drv.form] || 0;
      if (!bays) out.push({ lv: "err", st: 3, msg: `이 모델은 ${drv.form} 드라이브 베이가 없습니다.` });
      else if (S.drive.qty > bays) out.push({ lv: "err", st: 3, msg: `${drv.form} 베이는 최대 ${bays}개입니다.` });
      if (drv.iface === "SAS" && S.raid === "raid-none") out.push({ lv: "err", st: 3, msg: "SAS 드라이브는 RAID/HBA 컨트롤러가 필요합니다." });
    }
    if (gpu && !m.gpu_fixed) {
      if (S.gpu.qty > m.gpu_max) out.push({ lv: "err", st: 4, msg: `GPU는 최대 ${m.gpu_max}개입니다.` });
      if (gpu.dw && m.gpu_dw_max !== undefined && S.gpu.qty > m.gpu_dw_max) out.push({ lv: "err", st: 4, msg: `더블와이드 GPU는 최대 ${m.gpu_dw_max}개입니다.` });
    }
    const w = watts(), psu = ITEMS[psuFor()];
    if (psu && psu.capacity < w * C.meta.psu_headroom) out.push({ lv: "err", st: 6, msg: `예상 전력 ${won(w)}W 대비 PSU 용량이 부족합니다. GPU나 CPU 등급을 낮춰 주세요.` });
    const rackKw = (w * S.units) / 1000;
    if (m.needs_dlc && S.cooling === "cool-air") out.push({ lv: "err", st: 6, msg: "이 모델은 수냉(DLC) 구성 전용입니다." });
    if (rackKw > C.meta.air_limit_kw_per_rack) out.push({ lv: "warn", st: 6, msg: `${S.units}대를 한 랙에 설치하면 총 ${rackKw.toFixed(1)}kW로 공랭 랙 한계(약 ${C.meta.air_limit_kw_per_rack}kW/랙)를 넘을 수 있습니다. AIK DLC, CDU 냉각 설계를 함께 검토하세요.` });
    return out;
  }

  function optRow({ id, sel, type = "radio", name, extra = "", disabled = false, priceTxt }) {
    const it = ITEMS[id] || {};
    const p = priceTxt !== undefined ? priceTxt : "";
    return `<label class="opt ${sel ? "sel" : ""} ${disabled ? "dis" : ""}">
      <input type="${type}" name="${name}" value="${id}" ${sel ? "checked" : ""} ${disabled ? "disabled" : ""}>
      <div><div class="t">${esc(it.name || id)}</div><div class="d">${esc(it.desc || "")}</div>${extra}</div>
      <div class="p">${p}${it.price && type !== "checkbox" && name !== "cpu" ? "" : ""}</div></label>`;
  }
  const qtyBox = (k, v) => `<span class="qty"><button data-q="${k}" data-d="-1">−</button><span>${v}</span><button data-q="${k}" data-d="1">+</button></span>`;

  function stepBody() {
    const m = M(), o = m.opts, st = STEPS[S.step].key;
    const issues = validate().filter(i => i.st === S.step).map(i => `<div class="note ${i.lv}">${esc(i.msg)}</div>`).join("");
    let h = "";
    if (st === "model") {
      h = `<h2>모델 선택</h2><p class="sub">모델을 바꾸면 해당 모델의 기본 구성으로 초기화됩니다.</p><div class="opts">` +
        C.models.map(x => `<label class="opt ${x.id === S.model ? "sel" : ""}"><input type="radio" name="model" value="${x.id}" ${x.id === S.model ? "checked" : ""}>
          <div><div class="t">${esc(x.name)} <span class="sku">${esc(x.sku)}</span></div><div class="d">${esc(x.summary)}</div><div style="margin-top:6px">${tagsOf(x)}</div></div>
          <div class="p">${smcPrice(x.id, 1)}<small>${startLead(x)}</small></div></label>`).join("") + "</div>";
    }
    if (st === "cpu") {
      h = `<h2>CPU</h2><p class="sub">${m.sockets}소켓 모델입니다. 선택한 CPU ${m.sockets}개가 장착됩니다.</p><div class="opts">` +
        o.cpu.map(id => optRow({ id, name: "cpu", sel: S.cpu === id, priceTxt: "" })).join("") + "</div>";
    }
    if (st === "mem") {
      const cap = ITEMS[S.mem.id] ? ITEMS[S.mem.id].gb * S.mem.qty : 0;
      h = `<h2>메모리</h2><p class="sub">DIMM ${m.dimm_slots}슬롯, 채널 ${m.mem_channels}개 x CPU ${m.sockets}개. 현재 총 <b>${cap.toLocaleString()}GB</b></p>
        <div class="grp">모듈</div><div class="opts">${o.mem.map(id => optRow({ id, name: "mem", sel: S.mem.id === id })).join("")}</div>
        <div class="grp">수량 ${qtyBox("mem", S.mem.qty)}</div>`;
    }
    if (st === "storage") {
      h = `<h2>스토리지</h2><p class="sub">베이 구성: ${Object.entries(m.bays).map(([k, v]) => `${k} ${v}개`).join(", ")}</p>
        <div class="grp">부팅 드라이브</div><div class="opts">${o.boot.map(id => optRow({ id, name: "boot", sel: S.boot === id })).join("")}</div>
        <div class="grp">데이터 드라이브 ${S.drive.id ? qtyBox("drive", S.drive.qty) : ""}</div>
        <div class="opts">${optRow({ id: "none-drive", name: "drive", sel: !S.drive.id, priceTxt: "" }).replace("none-drive</div>", "데이터 드라이브 없음</div>")}
        ${o.drive.map(id => optRow({ id, name: "drive", sel: S.drive.id === id, disabled: !(m.bays[ITEMS[id].form] > 0) })).join("")}</div>
        <div class="grp">RAID / HBA</div><div class="opts">${o.raid.map(id => optRow({ id, name: "raid", sel: S.raid === id })).join("")}</div>`;
    }
    if (st === "gpu") {
      if (m.gpu_fixed) h = `<h2>GPU</h2><p class="sub">${esc(m.gpu_fixed_label)} 일체형 모델로 GPU는 기본 구성에 포함되어 있습니다.</p><div class="note info">GPU 수량, 종류 변경이 필요하면 견적 요청 시 비고란에 적어 주세요.</div>`;
      else if (!m.gpu_max) h = `<h2>GPU</h2><p class="sub">이 모델은 GPU 확장을 지원하지 않습니다. 다음 단계로 진행하세요.</p>`;
      else h = `<h2>GPU / 가속기</h2><p class="sub">최대 ${m.gpu_max}개${m.gpu_dw_max !== undefined ? `(더블와이드 ${m.gpu_dw_max}개)` : ""}. GPU 수에 따라 전원 용량이 자동 조정됩니다.</p>
        <div class="grp">GPU ${S.gpu.id ? qtyBox("gpu", S.gpu.qty) : ""}</div>
        <div class="opts">${optRow({ id: "none-gpu", name: "gpu", sel: !S.gpu.id, priceTxt: "" }).replace("none-gpu</div>", "GPU 없음</div>")}
        ${o.gpu.map(id => optRow({ id, name: "gpu", sel: S.gpu.id === id })).join("")}</div>`;
    }
    if (st === "net") {
      h = `<h2>네트워크</h2><p class="sub">온보드 ${esc(m.onboard_nic)} 기본 포함. 추가 NIC를 선택하세요(복수 선택).</p><div class="opts">` +
        o.nic.map(id => optRow({ id, name: "nic", type: "checkbox", sel: S.nic.includes(id) })).join("") + "</div>";
    }
    if (st === "power") {
      const w = watts(), psu = ITEMS[psuFor()], ratio = psu ? (w * C.meta.psu_headroom) / psu.capacity : 1;
      const kw = (w * S.units) / 1000, rr = kw / C.meta.air_limit_kw_per_rack;
      h = `<h2>전원, 냉각</h2><p class="sub">선택한 부품 기준으로 소비전력을 계산해 PSU를 자동 선정합니다.</p>
        <div class="card"><div class="row2" style="display:flex;justify-content:space-between"><span>서버 1대 예상 최대 소비전력</span><b>${won(w)} W</b></div>
        <div class="row2" style="display:flex;justify-content:space-between;margin-top:6px"><span>자동 선정 PSU</span><b>${esc(psu ? psu.name : "-")}</b></div>
        <div class="meter"><i class="${ratio > 1 ? "over" : ratio > .85 ? "hot" : ""}" style="width:${Math.min(100, ratio * 100)}%"></i></div><small style="color:var(--ink-3)">PSU 부하율(여유율 ${Math.round((C.meta.psu_headroom - 1) * 100)}% 반영) ${Math.round(ratio * 100)}%</small>
        <div class="row2" style="display:flex;justify-content:space-between;margin-top:14px"><span>${S.units}대 합계 발열</span><b>${kw.toFixed(1)} kW (${won(w * S.units * 3.412)} BTU/h)</b></div>
        <div class="meter"><i class="${rr > 1 ? "over" : rr > .8 ? "hot" : ""}" style="width:${Math.min(100, rr * 100)}%"></i></div><small style="color:var(--ink-3)">공랭 랙 1개 기준(${C.meta.air_limit_kw_per_rack}kW) 대비</small></div>
        <div class="grp">냉각 방식</div><div class="opts">${o.cooling.map(id => optRow({ id, name: "cooling", sel: S.cooling === id, disabled: (id !== "cool-air" && !m.dlc) || (id === "cool-air" && m.needs_dlc) })).join("")}</div>
        <div class="note info">AIK는 데이터센터 냉각 EPC 전문 기업입니다. DLC를 선택하거나 랙 밀도가 높으면 CDU, 매니폴드, 배관 설계 견적을 함께 드립니다.</div>`;
    }
    if (st === "svc") {
      h = `<h2>보증, 서비스</h2><p class="sub">기본 보증은 ${esc(ITEMS["war-3y"].name)}입니다.</p>
        <div class="grp">보증</div><div class="opts">${o.warranty.map(id => optRow({ id, name: "warranty", sel: S.warranty === id })).join("")}</div>
        <div class="grp">설치, 부가 서비스 (복수 선택)</div><div class="opts">${o.svc.map(id => optRow({ id, name: "svc", type: "checkbox", sel: S.svc.includes(id) })).join("")}</div>`;
    }
    if (st === "review") {
      const t = totals(), all = validate();
      h = `<h2>견적 확인</h2><p class="sub">구성을 확인하고 수량을 정한 뒤 견적을 요청하세요.</p>
        <div class="grp">서버 수량 ${qtyBox("units", S.units)}</div>
        ${all.length ? all.map(i => `<div class="note ${i.lv}">[${STEPS[i.st].name}] ${esc(i.msg)}</div>`).join("") : `<div class="note ok">구성 검증을 통과했습니다.</div>`}
        <table class="kv" style="margin-top:12px">${t.L.map(l => `<tr><th>${esc(l.label)}</th><td>${l.qty > 1 ? l.qty + "개" : ""}</td></tr>`).join("")}</table>
        <div class="navbtns" style="justify-content:flex-start;gap:8px">
          <button class="btn" id="bQuote" ${all.some(i => i.lv === "err") ? "disabled" : ""}>이 구성으로 견적 요청</button>
          <button class="btn ghost" id="bPrint">요약서 PDF 저장</button>
          <button class="btn ghost" id="bShare">구성 링크 복사</button></div>`;
    }
    return h + issues + `<div class="navbtns">
      <button class="btn ghost" data-go="${S.step - 1}" ${S.step === 0 ? "disabled" : ""}>이전</button>
      ${S.step < STEPS.length - 1 ? `<button class="btn" data-go="${S.step + 1}">다음: ${STEPS[S.step + 1].name}</button>` : ""}</div>`;
  }

  function summary() {
    const m = M(), t = totals(), errs = validate().filter(i => i.lv === "err").length;
    const onReq = true;
    return `<div class="hd"><small>${esc(m.sku)}</small><b>${esc(m.name)}</b></div>
      <div class="bd">${t.L.map(l => `<div class="line"><span>${esc(l.label)}${l.qty > 1 ? " x" + l.qty : ""}</span><span>${onReq ? "" : l.it.price ? man(l.it.price * l.qty) : "포함"}</span></div>`).join("")}</div>
      <div class="ft">
        <div class="row2"><span>수량</span><b>${S.units}대</b></div>
        <div class="row2"><span>납기</span><b>견적 문의</b></div>
        <div class="row2"><span>예상 전력</span><b>${won(t.w)}W/대</b></div>
        <div style="margin-top:8px;font-size:13px;color:var(--ink-3)">가격</div>
        <div class="big">${smcPrice(m.id, 1)}</div>${smcKrw(m.id)}${smcPriceSubCfg(m.id)}
        ${errs ? `<div class="note err">해결이 필요한 항목 ${errs}건</div>` : ""}
        <div class="disc">${esc(C.meta.disclaimer)}</div>
        <div class="acts"><button class="btn" data-go="${STEPS.length - 1}">견적 확인으로</button></div>
      </div>`;
  }

  function send3d() {
    const m = M(), drv = ITEMS[S.drive.id], gpu = ITEMS[S.gpu.id], psu = ITEMS[psuFor()] || {};
    const pm = /x\s?(\d)/.exec(psu.name || "");
    const gq = m.gpu_fixed ? m.gpu_max : (S.gpu.id ? S.gpu.qty : 0);
    const mem = ITEMS[S.mem.id];
    const detail = {
      sku: m.sku, step: STEPS[S.step].key, u: m.u, sockets: m.sockets, cpu: !!S.cpu, dimmSlots: m.dimm_slots, memQty: S.mem.id ? S.mem.qty : 0,
      bays: m.bays, driveForm: drv ? drv.form : null, driveQty: S.drive.id ? S.drive.qty : 0,
      gpuQty: gq, gpuFixed: !!m.gpu_fixed, gpuDw: m.gpu_fixed ? true : !!(gpu && gpu.dw),
      nic: S.nic.length, psu: pm ? +pm[1] : 2, dlc: S.cooling !== "cool-air" || !!m.needs_dlc,
      caption: [m.sku, "CPU " + m.sockets + "개", mem ? "메모리 " + (mem.gb * S.mem.qty).toLocaleString() + "GB" : "", S.drive.id ? "드라이브 " + S.drive.qty + "개" : "", gq ? "GPU " + gq + "개" : ""].filter(Boolean).join(", "),
    };
    const fire = () => window.dispatchEvent(new CustomEvent("smc3d", { detail }));
    if (window.SMC3D_READY) fire(); else window.addEventListener("smc3d-ready", fire, { once: true });
  }

  function renderCfg() {
    $("#cfgSteps").innerHTML = STEPS.map((s, i) => `<button class="${i === S.step ? "on" : i < S.step ? "done" : ""}" data-go="${i}"><b>STEP ${i + 1}</b>${s.name}</button>`).join("");
    $("#cfgPanel").innerHTML = stepBody();
    $("#cfgSum").innerHTML = summary();
    history.replaceState(null, "", "#/configure/" + S.model + "?c=" + encodeState());
    send3d();
  }

  function viewConfigureLive(id, q) {
    const m = MODELS[id] || C.models[0];
    S = decodeState(q.get("c"), m) || defaults(m);
    shell("서버 구성하기", `<div class="wrap"><div class="crumb"><a href="#/">개요</a> / <a href="#/product/${m.id}">${esc(m.sku)}</a> / 서버 구성하기</div>
      <div class="cfg has3d"><aside class="v3d" id="cfg3d"><div class="v3d-stage"></div><p class="v3d-cap"></p><p class="v3d-note">드래그하면 돌려 볼 수 있고, Ctrl + 휠로 확대합니다. 실제 제품 형상이 아닌 구성 개념도입니다.</p></aside><div><div class="steps" id="cfgSteps"></div><div class="panel" id="cfgPanel"></div></div><aside class="sum" id="cfgSum"></aside></div></div>`);
    const root = $(".cfg");
    root.addEventListener("click", e => {
      const go = e.target.closest("[data-go]");
      if (go && !go.disabled) { S.step = Math.max(0, Math.min(STEPS.length - 1, +go.dataset.go)); renderCfg(); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      const qb = e.target.closest("[data-q]");
      if (qb) {
        e.preventDefault();
        const k = qb.dataset.q, d = +qb.dataset.d, m = M();
        if (k === "mem") S.mem.qty = Math.max(1, Math.min(m.dimm_slots, S.mem.qty + d));
        if (k === "drive") S.drive.qty = Math.max(1, Math.min(m.bays[(ITEMS[S.drive.id] || {}).form] || 1, S.drive.qty + d));
        if (k === "gpu") { const cap = ITEMS[S.gpu.id]?.dw && m.gpu_dw_max !== undefined ? m.gpu_dw_max : m.gpu_max; S.gpu.qty = Math.max(1, Math.min(cap, S.gpu.qty + d)); }
        if (k === "units") S.units = Math.max(1, Math.min(999, S.units + d));
        renderCfg(); return;
      }
      if (e.target.id === "bPrint") window.print();
      if (e.target.id === "bShare") { navigator.clipboard?.writeText(location.href); e.target.textContent = "링크 복사됨"; }
      if (e.target.id === "bQuote") quoteModal();
    });
    root.addEventListener("change", e => {
      const i = e.target; if (!i.name) return;
      const v = i.value;
      if (i.name === "model") { S = defaults(MODELS[v]); renderCfg(); return; }
      if (i.name === "cpu") S.cpu = v;
      if (i.name === "mem") S.mem.id = v;
      if (i.name === "boot") S.boot = v;
      if (i.name === "drive") { if (v === "none-drive") S.drive = { id: null, qty: 0 }; else S.drive = { id: v, qty: Math.max(S.drive.qty, ITEMS[v].min_qty || 2) }; }
      if (i.name === "raid") S.raid = v;
      if (i.name === "gpu") { if (v === "none-gpu") S.gpu = { id: null, qty: 0 }; else { const cap = ITEMS[v].dw && M().gpu_dw_max !== undefined ? M().gpu_dw_max : M().gpu_max; S.gpu = { id: v, qty: Math.min(cap, Math.max(S.gpu.qty, 1)) }; } }
      if (i.name === "nic") S.nic = i.checked ? [...S.nic, v] : S.nic.filter(x => x !== v);
      if (i.name === "cooling") S.cooling = v;
      if (i.name === "warranty") S.warranty = v;
      if (i.name === "svc") S.svc = i.checked ? [...S.svc, v] : S.svc.filter(x => x !== v);
      renderCfg();
    });
    renderCfg();
  }

  function encodeState() { const { step, ...rest } = S; return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(rest))))); }
  function decodeState(c, m) {
    if (!c) return null;
    try { const s = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(c))))); return s.model === m.id ? { ...defaults(m), ...s, step: 0 } : null; } catch { return null; }
  }

  function startPrice(m) {
    const keep = S; S = defaults(m); const t = totals().unit; S = keep; return t;
  }
  function startLead(m) {
    return "견적 문의";
  }

  // ---------- 견적 요청 ----------
  function leadForm(withNeed = true) {
    return `<form class="form" id="lf" onsubmit="return false">
      <label>회사명 *<input required name="co"></label><label>담당자 *<input required name="nm"></label>
      <label>이메일 *<input required type="email" name="em"></label><label>연락처<input name="tel"></label>
      ${withNeed ? `<label>납품 희망일<input type="date" name="due"></label><label>설치 장소<select name="site"><option>고객 IDC/전산실</option><option>코로케이션 IDC</option><option>신규 DC 구축 현장</option><option>미정</option></select></label>
      <label class="full">요청 사항<textarea name="memo" rows="3" placeholder="예: 동일 구성 10대, 랙 설치 및 DLC 냉각 설계 포함 요청"></textarea></label>` : ""}
      <label class="full" style="display:flex;gap:8px;align-items:center"><input type="checkbox" required> 개인정보 수집, 이용에 동의합니다. (필수)</label>
      <button class="btn full" style="grid-column:1/-1" id="lfSend">보내기</button></form>`;
  }
  function quoteModal() {
    const m = M(), t = totals();
    openModal(`<h2 style="margin-top:0">견적 요청</h2>
      <p class="sub">${esc(m.sku)} x ${S.units}대 / ${smcQuoteLine(m.id)}<br>구성 내역과 링크가 담당자에게 함께 전달됩니다. 영업일 기준 1일 내 회신.</p>
      ${leadForm(true)}`, null, () => {
      const f = Object.fromEntries(new FormData($("#lf")));
      const body = [`[웹 구성기 견적 요청]`, `회사: ${f.co} / 담당: ${f.nm} / ${f.em} / ${f.tel || ""}`, `납품 희망: ${f.due || "-"} / 설치: ${f.site}`, `모델: ${m.sku} x ${S.units}대`,
        ...t.L.map(l => `- ${l.label}${l.qty > 1 ? " x" + l.qty : ""}`), `${t.w}W/대`, `요청: ${f.memo || "-"}`, `구성 링크: ${location.href}`].join("\n");
      location.href = `mailto:${C.meta.quote_email}?subject=${encodeURIComponent("[서버 견적요청] " + f.co + " / " + m.sku)}&body=${encodeURIComponent(body)}`;
    });
  }
  function openModal(html, doneMsg, onSend) {
    let md = $("#modal");
    if (!md) { md = document.createElement("div"); md.id = "modal"; md.className = "modal"; (document.getElementById("smc") || document.body).appendChild(md); }
    md.innerHTML = `<div class="box">${html}<p style="text-align:right;margin:12px 0 0"><button class="btn ghost sm" id="mClose">닫기</button></p></div>`;
    md.classList.add("on");
    md.onclick = e => { if (e.target === md || e.target.id === "mClose") md.classList.remove("on"); };
    const send = $("#lfSend");
    if (send) send.onclick = () => {
      const f = $("#lf"); if (!f.reportValidity()) return;
      if (onSend) onSend();
      md.querySelector(".box").innerHTML = `<h2 style="margin-top:0">접수 완료</h2><p>${esc(doneMsg || "메일 작성 창이 열렸습니다. 발송 버튼을 눌러 주세요. (프로토타입: 실제 운영 시 서버 전송으로 교체)")}</p><p style="text-align:right"><button class="btn sm" id="mClose">확인</button></p>`;
    };
  }

  // =====================================================================
  // 확장 (tools/server_ext/ext_app.js): 전체 라인업 제품 목록, 사양 기반 견적 구성, 분류형 자료실
  // 데이터: catalog_ext.js (window.CATALOG_EXT), 상세 사양: specs/<id>.json
  // integrate_server.py 가 app.js 의 라우터 앞에 끼워 넣는다. 아래 함수들은 같은 이름의 기존 함수를 대체한다.
  // =====================================================================
  const X = window.CATALOG_EXT || { cats: [], models: [], docs: [], doc_kinds: [], doc_topics: [] };
  X.models.forEach(m => { if (m.sum && m.sum.indexOf("<!--") >= 0) m.sum = m.sum.replace(/\s*<!--[\s\S]*$/, "").replace(/\s*\/\s*[^\/:]{1,20}:\s*$/, ""); });   // 수집본에 섞여 온 HTML 주석 조각 제거
  const FEATURED = new Set(C.models.map(m => m.sku));
  const HASIMG = new Set(X.models.filter(m => m.img).map(m => m.id));
  // 제품 사진(img/<id>.webp)이 있으면 사진, 없으면 도식 그림
  const pic = (m, cls) => HASIMG.has(m.id) ? `<img class="${cls || "pimg"}" src="${esc((m.photo || "img/" + m.id + ".webp").replace(/^(?:img|catalog-media)\//, dir => "/server/" + dir))}" alt="${esc(m.sku)}" loading="lazy">` : srvArt(m.u || 2);
  const CATOF = Object.fromEntries(X.cats.map(c => [c.id, c]));
  const smcPrice = () => "견적 문의";
  const smcQuoteLine = () => "가격은 문의";
  const smcNote = () => "가격은 구성 확정 후 담당자 견적서로 안내드립니다.";
  const smcPriceSub = () => "", smcKrw = () => "", smcPriceSubCfg = () => "";
  // 부품 단위로 구성할 수 있는 기존 모델과 전체 라인업을 하나의 목록으로 합친다
  const ALL = [
    ...C.models.map(m => ({ id: m.id, sku: m.sku, name: m.name, cat: m.family === "storage" ? "storage" : m.family === "gpu" ? "gpu" : "rack", u: m.u, cpu: m.cpu_vendor, gpu: m.gpu_max || 0, dlc: !!m.dlc, sum: m.summary, live: true })),
    ...X.models.filter(m => !FEATURED.has(m.sku)),
  ];
  const BYID = Object.fromEntries(ALL.map(m => [m.id, m]));
  // BEST 표시: NVIDIA HGX B200, B300, GB200 계열 (모델명의 -NB 표기, NVL72). Vera Rubin 계열은 모델이 등록되면 아래 식에 추가
  const isBest = m => /-NB|NVL72/i.test(m.sku);
  const bestTag = m => isBest(m) ? `<span class="best" title="국내 AI 데이터센터 주력 플랫폼 (NVIDIA Blackwell 계열)">BEST<i>!</i></span>` : "";
  const PAGE = 24;
  let listShown = PAGE, listKey = "";

  const xTags = m => [
    m.live || m.cfg ? `<span class="tag live">바로 구성 가능</span>` : "",
    m.u ? `<span class="tag gray">${m.u}U</span>` : "",
    m.cpu ? `<span class="tag gray">${esc(m.cpu)}</span>` : "",
    m.gen ? `<span class="tag gray">${esc(m.gen)}</span>` : "",
    m.gpu ? `<span class="tag">GPU 최대 ${m.gpu}</span>` : m.gpuOk ? `<span class="tag">GPU 지원</span>` : "",
    m.dlc ? `<span class="tag dlc">DLC 지원</span>` : "",
  ].join("");

  // ---------- 2. 제품 목록 (전체 라인업) ----------
  function viewProducts(q) {
    // 기존 주소(?family=, ?use=) 호환
    const famMap = { gpu: "gpu", hyper: "rack", clouddc: "rack", storage: "storage" };
    const useMap = { train: "gpu", infer: "gpu", virt: "rack", cloud: "rack", storage: "storage", hpc: "twin" };
    const cats = [...q.getAll("cat"), ...q.getAll("family").map(f => famMap[f]).filter(Boolean), ...q.getAll("use").map(u => useMap[u]).filter(Boolean)];
    const f = { cat: cats, cpu: q.getAll("cpu"), u: q.getAll("u"), gpu: q.get("gpu"), dlc: q.get("dlc"), live: q.get("live"), grp: q.get("grp") || "", kw: (q.get("kw") || "").trim().toLowerCase() };
    const list = ALL.filter(m =>
      (!f.cat.length || f.cat.includes(m.cat)) &&
      (!f.cpu.length || f.cpu.includes(m.cpu)) &&
      (!f.u.length || f.u.includes(m.u >= 4 ? "4" : String(m.u || ""))) &&
      (!f.gpu || m.gpu > 0 || m.gpuOk) && (!f.dlc || m.dlc) && (!f.live || m.live || m.cfg) && (!f.grp || m.grp === f.grp) &&
      (!f.kw || (m.sku + " " + m.name + " " + (m.sum || "")).toLowerCase().includes(f.kw)));
    const rank = m => /NVL72/i.test(m.sku) ? (/GB300/i.test(m.sku) ? 0 : 1) : isBest(m) ? 2 : 3;   // NVL72 랙 시스템을 맨 위로 (최신 세대 먼저)
    list.sort((a, b) => rank(a) - rank(b));
    const key = q.toString();
    if (key !== listKey) { listKey = key; listShown = PAGE; }
    const cb = (k, v, t, n) => `<label><input type="checkbox" data-k="${k}" value="${v}" ${(k === "cat" ? f.cat : q.getAll(k)).includes(v) ? "checked" : ""}> ${esc(t)}${n !== undefined ? ` <small>${n}</small>` : ""}</label>`;
    const count = id => ALL.filter(m => m.cat === id).length;
    const card = m => `<a class="card pcard" href="#/product/${m.id}">
        <div class="img">${pic(m)}${bestTag(m)}</div>
        <div class="sku">${esc(m.sku)}</div>
        <h3>${esc(m.name)}</h3>
        <p style="margin-bottom:10px">${esc(m.sum || "")}</p>
        <div>${xTags(m)}</div>
        <div class="meta">
          <div class="price">${smcPrice(m.id)}</div>
          <div class="lead">${esc((CATOF[m.cat] || {}).name || "")}</div>
        </div></a>`;
    shell("제품", `
      <div class="wrap"><div class="crumb"><a href="#/">개요</a> / 제품</div>
      <div class="plist">
        <aside class="filters" id="flt">
          <h4>모델명 검색</h4><input type="search" id="fltKw" value="${esc(q.get("kw") || "")}" placeholder="예: SYS-422GS, X14" aria-label="모델명 검색">
          <h4>제품 분류</h4>${X.cats.map(c => cb("cat", c.id, c.name, count(c.id))).join("")}
          <h4>CPU</h4>${cb("cpu", "Intel", "Intel Xeon")}${cb("cpu", "AMD", "AMD EPYC, Ryzen")}${cb("cpu", "Arm", "Arm (NVIDIA, Ampere)")}
          <h4>높이</h4>${cb("u", "1", "1U")}${cb("u", "2", "2U")}${cb("u", "3", "3U")}${cb("u", "4", "4U 이상")}
          <h4>바로 구성 가능 모델</h4><select id="fltGrp" aria-label="바로 구성 가능 모델 분류"><option value="">전체 모델</option>${(SMC.groups || []).map(x => `<option value="${esc(x)}" ${f.grp === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select>
          <h4>기타</h4>${cb("gpu", "y", "GPU 탑재 모델")}${cb("dlc", "y", "DLC(수냉) 지원")}${cb("live", "y", "바로 구성 가능 모델")}
          <p style="margin:14px 0 0"><a class="btn ghost sm" href="#/products">필터 초기화</a></p>
        </aside>
        <div><p class="sub" style="margin:0 0 12px"><b>${list.length.toLocaleString()}</b>개 모델 / 전체 ${ALL.length.toLocaleString()}개. "바로 구성 가능" 모델은 부품을 직접 골라 구성하고, 그 외 모델은 필요한 사양을 알려 주시면 견적으로 안내합니다.</p>
          <div class="grid g3">${list.slice(0, listShown).map(card).join("") || `<div class="card">조건에 맞는 모델이 없습니다.</div>`}</div>
          ${list.length > listShown ? `<p style="text-align:center;margin:24px 0 0"><button type="button" class="btn ghost" id="moreBtn">더 보기 (${Math.min(PAGE, list.length - listShown)}개 / 남은 ${list.length - listShown}개)</button></p>` : ""}
        </div>
      </div></div>`);
    const apply = () => {
      const p = new URLSearchParams();
      document.querySelectorAll("#flt input:checked").forEach(i => p.append(i.dataset.k, i.value));
      const kw = $("#fltKw").value.trim();
      if (kw) p.set("kw", kw);
      const grp = $("#fltGrp").value;
      if (grp) p.set("grp", grp);
      location.hash = "#/products" + (p.toString() ? "?" + p : "");
    };
    $("#flt").addEventListener("change", apply);
    $("#fltKw").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); apply(); } });
    const more = $("#moreBtn");
    if (more) more.addEventListener("click", () => { const y = window.pageYOffset; listShown += PAGE; viewProducts(q); window.scrollTo(0, y); });
  }

  // ---------- 3. 제품 상세 ----------
  const SPEC_KO = { "Product SKUs": "제품 번호", "Motherboard": "메인보드", "Processor": "프로세서", "GPU": "GPU", "System Memory": "메모리", "Drive Bays / Storage": "드라이브 베이", "Drive Bays": "드라이브 베이",
    "Expansion Slots": "확장 슬롯", "On-Board Devices": "온보드 장치", "Input / Output": "입출력", "Power Supply": "전원", "System Cooling": "냉각", "Chassis": "섀시", "Form Factor": "폼팩터",
    "Dimensions and Weight": "크기, 무게", "Dimensions": "크기", "Operating Environment": "운용 환경", "Management": "관리", "Security": "보안", "System BIOS": "BIOS", "Front Panel": "전면 패널", "PC Health Monitoring": "상태 모니터링" };
  const specKo = k => { const base = k.replace(/ \(per Node\)$/, ""); return (SPEC_KO[base] || base) + (base !== k ? " (노드당)" : ""); };
  function viewProduct(id) {
    const m = BYID[id];
    if (!m) return viewProducts(new URLSearchParams());
    if (m.live) {
      viewProductLive(id);
      const box = app.querySelector(".detail .card.img");
      if (box && HASIMG.has(m.id)) box.innerHTML = pic(m, "pimg big");
      if (box) { box.style.position = "relative"; box.insertAdjacentHTML("beforeend", bestTag(m)); }
      return;
    }
    const cat = CATOF[m.cat] || { name: "" };
    const docs = X.docs.filter(d => (d.cats || []).includes(m.cat)).slice(0, 6);
    shell("제품", `
      <div class="wrap"><div class="crumb"><a href="#/">개요</a> / <a href="#/products?cat=${m.cat}">${esc(cat.name)}</a> / ${esc(m.sku)}</div>
      <div class="detail">
        <div>
          <div class="card img" style="position:relative;display:grid;place-items:center;background:linear-gradient(180deg,#F1F5F9,#E2E8F0)">${bestTag(m)}${HASIMG.has(m.id) ? pic(m, "pimg big") : srvArt(m.u || 2) + `<small style="color:var(--ink-3);margin-top:8px">제품 이미지 준비 중</small>`}</div>
          <div id="specBox"><p class="sub" style="margin-top:24px">상세 사양을 불러오는 중입니다.</p></div>
        </div>
        <div>
          <div class="sku">${esc(m.sku)}</div>
          <h1>${esc(m.name)}</h1>
          <div style="margin-bottom:12px">${xTags(m)}</div>
          <p style="color:var(--ink-2)">${esc(m.sum || "")}</p>
          <div class="card" style="margin:18px 0">
            <div class="row2" style="display:flex;justify-content:space-between"><span>가격</span><b class="price">${smcPrice(m.id)}</b></div>${smcPriceSub(m.id)}
            <div class="row2" style="display:flex;justify-content:space-between;margin-top:6px"><span>납기</span><b>견적 문의</b></div>
            <p style="font-size:12px;margin-top:10px">CPU, 메모리, 드라이브 등 필요한 사양을 고르면 담당자가 견적서로 회신드립니다.</p>
            <p style="margin-top:14px"><a class="btn" href="#/configure/${m.id}">${m.part ? "이 제품 견적 요청" : "이 모델로 구성하기"}</a></p>
          </div>
          <div id="featBox"></div>
          ${docs.length ? `<h3 style="margin:24px 0 10px">관련 자료</h3>${docs.map(docRow).join("")}<p style="margin-top:8px"><a class="btn ghost sm" href="#/downloads?cat=${m.cat}">관련 자료 전체 보기</a></p>` : ""}
        </div>
      </div></div>`);
    loadSpec(m).then(sp => {
      if (location.hash.indexOf("#/product/" + m.id) !== 0) return;
      const box = $("#specBox"), fb = $("#featBox");
      if (!box) return;
      const src = sp && sp.url ? `<a href="${esc(sp.url)}" target="_blank" rel="noopener" style="color:var(--navy)">Supermicro 공식 제품 페이지</a>` : "Supermicro 공식 자료";
      if (!sp || !sp.specs || !Object.keys(sp.specs).length) {
        box.innerHTML = `<p class="sub" style="margin-top:24px">등록된 상세 사양이 없습니다. ${src}에서 확인하거나 견적 요청 시 문의해 주십시오.</p>`;
      } else {
        box.innerHTML = Object.entries(sp.specs).map(([sec, rows]) => `<h3 style="margin:24px 0 10px">${esc(specKo(sec))}</h3>
          <table class="kv">${Object.entries(rows).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${v.map(esc).join("<br>")}</td></tr>`).join("")}</table>`).join("") +
          `<p style="font-size:12px;color:var(--ink-3);margin-top:12px">사양 원문은 ${src} 기준이며 개정될 수 있습니다. 최종 사양은 견적서로 확정합니다.</p>`;
      }
      if (fb && sp && ((sp.apps || []).length || (sp.features || []).length)) {
        fb.innerHTML = (sp.apps.length ? `<h3 style="margin:24px 0 10px">주요 용도</h3><div>${sp.apps.map(a => `<span class="tag gray">${esc(a)}</span>`).join("")}</div>` : "") +
          (sp.features.length ? `<h3 style="margin:24px 0 10px">주요 특징</h3><ul class="feat">${sp.features.map(a => `<li>${esc(a)}</li>`).join("")}</ul>` : "");
      }
    });
  }
  const specCache = {};
  function loadSpec(m) {
    if (!specCache[m.id]) specCache[m.id] = fetch("specs/" + m.id + ".json").then(r => r.ok ? r.json() : null).catch(() => null);
    return specCache[m.id];
  }

  // ---------- 4. 자료실 (분류, 검색) ----------
  function docRow(d) {
    const meta = [d.kind, d.lang, d.pages ? d.pages + "쪽" : "", d.size || ""].filter(Boolean).join(", ");
    return `<div class="dl"><span class="ic">${d.type === "AIK" ? "AIK" : "PDF"}</span>
      <div><b>${esc(d.title)}</b><br><small>${esc(meta)}</small></div>
      ${d.gated ? `<button class="btn ghost sm" data-doc="${d.id}">신청 후 받기</button>` : `<a class="btn ghost sm" href="${esc(d.url)}" target="_blank" rel="noopener">${d.ext ? "공식 페이지" : "받기"}</a>`}
    </div>`;
  }
  let docShown = 30, docKey = "";
  function viewDownloads(q) {
    q = q || new URLSearchParams();
    const all = [...C.docs.filter(d => d.type === "AIK"), ...X.docs];
    const f = { kind: q.getAll("kind"), topic: q.getAll("topic"), cat: q.get("cat"), kw: (q.get("kw") || "").trim().toLowerCase() };
    const list = all.filter(d =>
      (!f.kind.length || f.kind.includes(d.kind)) &&
      (!f.topic.length || f.topic.some(t => (d.topics || []).includes(t))) &&
      (!f.cat || (d.cats || []).includes(f.cat)) &&
      (!f.kw || d.title.toLowerCase().includes(f.kw)));
    const key = q.toString();
    if (key !== docKey) { docKey = key; docShown = 30; }
    const kinds = [...new Set(all.map(d => d.kind))];
    const cb = (k, v, n) => `<label><input type="checkbox" data-k="${k}" value="${esc(v)}" ${q.getAll(k).includes(v) ? "checked" : ""}> ${esc(v)} <small>${n}</small></label>`;
    shell("자료실", `
      <div class="wrap"><div class="crumb"><a href="#/">개요</a> / 자료실</div>
      <div class="plist">
        <aside class="filters" id="dflt">
          <h4>자료명 검색</h4><input type="search" id="dKw" value="${esc(q.get("kw") || "")}" placeholder="예: Liquid Cooling, X14" aria-label="자료명 검색">
          <h4>자료 종류</h4>${kinds.map(k => cb("kind", k, all.filter(d => d.kind === k).length)).join("")}
          <h4>주제</h4>${X.doc_topics.map(t => cb("topic", t, all.filter(d => (d.topics || []).includes(t)).length)).join("")}
          <p style="margin:14px 0 0"><a class="btn ghost sm" href="#/downloads">필터 초기화</a></p>
        </aside>
        <div>
          <h2 style="margin-top:0">카탈로그, 브로슈어, 데이터시트, 백서</h2>
          <p class="sub"><b>${list.length}</b>건 / 전체 ${all.length}건. Supermicro 발행 자료는 영문 원문이며 바로 받을 수 있습니다. AIK 통합 카탈로그는 간단한 정보 입력 후 이메일로 보내 드립니다.</p>
          ${list.slice(0, docShown).map(docRow).join("") || `<div class="card">조건에 맞는 자료가 없습니다.</div>`}
          ${list.length > docShown ? `<p style="text-align:center;margin:20px 0 0"><button type="button" class="btn ghost" id="dMore">더 보기 (남은 ${list.length - docShown}건)</button></p>` : ""}
        </div>
      </div></div>`);
    const apply = () => {
      const p = new URLSearchParams();
      document.querySelectorAll("#dflt input:checked").forEach(i => p.append(i.dataset.k, i.value));
      const kw = $("#dKw").value.trim();
      if (kw) p.set("kw", kw);
      location.hash = "#/downloads" + (p.toString() ? "?" + p : "");
    };
    $("#dflt").addEventListener("change", apply);
    $("#dKw").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); apply(); } });
    const more = $("#dMore");
    if (more) more.addEventListener("click", () => { const y = window.pageYOffset; docShown += 30; viewDownloads(q); window.scrollTo(0, y); });
    bindDocs();
  }

  // ---------- 5-b. 사양 선택 후 견적 요청 (가격 데이터가 없는 모델) ----------
  const SPEC_FIELDS = [
    { k: "cpu", label: "CPU 등급", when: m => !m.part, opts: ["담당자 추천", "코어 수 우선 (가상화, 컨테이너)", "클럭 우선 (DB, EDA)", "전력 효율 우선", "직접 지정 (요청 사항에 기재)"] },
    { k: "mem", label: "메모리 총 용량 (대당)", when: m => !m.part, opts: ["담당자 추천", "128GB 이하", "256GB", "512GB", "1TB", "2TB 이상"] },
    { k: "drive", label: "데이터 저장 용량 (대당)", when: m => !m.part, opts: ["담당자 추천", "부팅 드라이브만", "10TB 이하", "10~50TB", "50~200TB", "200TB 이상"] },
    { k: "gpu", label: "GPU", when: m => m.gpu > 0, opts: ["담당자 추천", "NVIDIA 학습용 (최상위 등급)", "NVIDIA 추론, 파인튜닝용", "AMD Instinct", "Intel Gaudi", "GPU 없이 구성"] },
    { k: "net", label: "네트워크", when: m => !m.part, opts: ["담당자 추천", "10/25GbE", "100GbE", "200/400GbE", "InfiniBand"] },
    { k: "cool", label: "냉각 방식", when: m => !m.part, opts: m => m.dlc ? ["DLC 수냉 (Cold Plate)", "공랭 가능 여부 문의"] : ["공랭", "수냉 전환 검토 요청"] },
    { k: "war", label: "보증", when: () => true, opts: ["3년 기본 보증", "5년 보증 연장", "5년 익일 방문 (NBD Onsite)"] },
  ];
  function viewConfigure(id, q) {
    const m = BYID[id];
    if (m && m.cfg) return viewConfigureSmc(id, q);       // Supermicro 구성기 자료가 있는 모델 (cfg_app.js)
    if (!m) { location.replace("#/products"); return; }   // 공개하지 않는 모델의 옛 주소
    if (m.live) return viewConfigureLive(id, q);
    S = null;
    const fields = SPEC_FIELDS.filter(f => f.when(m));
    const optsOf = f => typeof f.opts === "function" ? f.opts(m) : f.opts;
    shell("서버 구성하기", `
      <div class="wrap"><div class="crumb"><a href="#/">개요</a> / <a href="#/product/${m.id}">${esc(m.sku)}</a> / ${m.part ? "견적 요청" : "사양 구성"}</div>
      <div class="cfg">
        <div class="panel" id="specCfg">
          <h2>${m.part ? "견적 요청" : "사양 구성"}</h2>
          <p class="sub">${esc(m.sku)} 모델은 옵션 조합이 다양해 부품 단위 구성 화면을 제공하지 않습니다. 필요한 수준만 골라 주시면 담당자가 구성안과 견적서를 회신드립니다.</p>
          <div class="note info">부품을 직접 골라 구성하려면 <a href="#/products?live=y" style="text-decoration:underline">바로 구성 가능 모델</a>을 이용해 주십시오.</div>
          <div class="grp">수량 <span class="qty"><button type="button" data-d="-1">−</button><span id="spQty">1</span><button type="button" data-d="1">+</button></span></div>
          <div class="form" style="margin-top:8px">
            ${fields.map(f => `<label>${esc(f.label)}<select data-f="${f.k}">${optsOf(f).map(o => `<option>${esc(o)}</option>`).join("")}</select></label>`).join("")}
            <label>설치 서비스<select data-f="svc"><option>필요 없음</option><option>랙 설치, 케이블링</option><option>랙 설치 + OS, 드라이버 설치</option><option>DC 냉각 설계 컨설팅 포함</option></select></label>
          </div>
          <p style="margin-top:20px"><button type="button" class="btn" id="spSend">이 구성으로 견적 요청</button> <a class="btn ghost" href="#/product/${m.id}">상세 사양 보기</a></p>
        </div>
        <aside class="sum">
          <div class="hd"><small>${esc(m.sku)}</small><b>${esc(m.name)}</b></div>
          <div class="bd">${(CATOF[m.cat] || {}).name && (CATOF[m.cat] || {}).name.replace(/s$/, "") !== m.name.replace(/s$/, "") ? `<div class="line"><span>${esc(CATOF[m.cat].name)}</span><span></span></div>` : ""}
            ${m.sum ? `<div class="line"><span>${esc(m.sum)}</span><span></span></div>` : ""}</div>
          <div class="ft"><div style="font-size:13px;color:var(--ink-3)">가격</div><div class="big">${smcPrice(m.id)}</div>${smcKrw(m.id)}${smcPriceSub(m.id)}
            <div class="disc">${esc(C.meta.disclaimer)}</div></div>
        </aside>
      </div></div>`);
    let qty = 1;
    $("#specCfg").querySelectorAll(".qty button").forEach(b => b.addEventListener("click", () => { qty = Math.max(1, Math.min(999, qty + Number(b.dataset.d))); $("#spQty").textContent = qty; }));
    $("#spSend").addEventListener("click", () => {
      const pick = [...$("#specCfg").querySelectorAll("select[data-f]")].map(s => `- ${s.parentNode.firstChild.textContent.trim()}: ${s.value}`);
      openModal(`<h2 style="margin-top:0">견적 요청</h2>
        <p class="sub">${esc(m.sku)} x ${qty}대 / ${smcQuoteLine(m.id)}<br>선택한 사양이 담당자에게 함께 전달됩니다. 영업일 기준 1일 내 회신.</p>
        ${leadForm(true)}`, null, () => {
        const f = Object.fromEntries(new FormData($("#lf")));
        const body = ["[웹 사양 구성 견적 요청]", `회사: ${f.co} / 담당: ${f.nm} / ${f.em} / ${f.tel || ""}`, `납품 희망: ${f.due || "-"} / 설치: ${f.site}`, `모델: ${m.sku} x ${qty}대`, ...pick, `요청: ${f.memo || "-"}`, `페이지: ${location.href}`].join("\n");
        location.href = `mailto:${C.meta.quote_email}?subject=${encodeURIComponent("[서버 견적요청] " + f.co + " / " + m.sku)}&body=${encodeURIComponent(body)}`;
      });
    });
  }

  // ---------- 추천 구성 배너 (화면 우측 가운데 고정) ----------
  // 판매 실적 자료가 없어 "인기"가 아니라 "추천" 구성으로 표기한다. 구성은 아래 RECO 를 고친다.
  const RECO = [
    { use: "AI 학습", title: "HGX B300 8-GPU 수냉 4U", parts: ["Xeon 6 듀얼, DDR5 2TB급", "DLC 수냉 + CDU 냉각 설계", "400G 백엔드 네트워크"], id: "sys-422gs-nb3rt-lcc" },
    { use: "AI 추론, 파인튜닝", title: "Hyper 2U + L40S 2장", parts: ["Xeon 6 듀얼, DDR5 1TB급", "NVIDIA L40S 48GB x2", "100GbE 2포트"], id: "sys-222h-tn" },
    { use: "AI 스토리지", title: "Petascale All-NVMe 2U", parts: ["E3.S NVMe 24베이", "데이터 레이크, 체크포인트 저장", "고대역 네트워크"], id: "ssg-222b-ne3x24r" },
  ].filter(r => MODELS[r.id]);
  (function recoBanner() {
    const host = document.getElementById("smc");
    if (!host || !RECO.length || document.getElementById("smcReco")) return;
    const el = document.createElement("aside");
    el.id = "smcReco";
    el.setAttribute("aria-label", "추천 구성");
    el.innerHTML = `<button type="button" class="tab" aria-expanded="false" aria-controls="smcRecoPanel"><b>BEST</b><span>추천 구성</span></button>
      <div class="rp" id="smcRecoPanel">
        <div class="hd"><b>추천 구성 BEST ${RECO.length}</b><button type="button" class="x" aria-label="추천 구성 닫기">&times;</button></div>
        <p class="lead">용도별로 많이 검토하는 조합입니다. 누르면 해당 구성으로 바로 시작합니다.</p>
        ${RECO.map((r, i) => `<a class="it" href="#/configure/${r.id}"><span class="no">${i + 1}</span><span class="tx"><em>${esc(r.use)}</em><strong>${esc(r.title)}</strong><small>${r.parts.map(esc).join("<br>")}</small></span></a>`).join("")}
        <a class="all" href="#/products?live=y">바로 구성 가능 모델 전체 보기</a>
      </div>`;
    host.appendChild(el);
    const tab = el.querySelector(".tab");
    const set = on => { el.classList.toggle("open", on); tab.setAttribute("aria-expanded", on ? "true" : "false"); };
    tab.addEventListener("click", () => set(!el.classList.contains("open")));
    el.querySelector(".x").addEventListener("click", () => set(false));
    el.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { if (window.innerWidth < 1800) set(false); }));
    document.addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
    if (window.innerWidth >= 1800) set(true);   // 넓은 화면에서는 본문을 가리지 않으므로 펼쳐서 시작
  })();

/* Shared by the online configurator and the authenticated quotation service. */
function createSmcRules(K, airLimit = 20) {
  const won = n => Math.round(n).toLocaleString();
  const AC_FACTOR = 1.04;
  const kc = () => K.d.cfgs[K.ci];
  const kl = i => (i === undefined || i === null) ? [] : (K.d.L[i] || []);
  const kp = pn => K.d.parts[pn] || { d: pn };
  const pick = (cur, list) => list.indexOf(cur) >= 0 ? cur : (list[0] || null);
  function memOf() {
    const alt = ((K.d.cfgs.find(x => x.memalt) || {}).memalt || []).find(a => a.cpus.indexOf(K.cpu) >= 0);
    return alt || kc().mem || null;
  }
  function storGroups() {
    const c = kc(), g = [];
    (c.stor || []).forEach(s => s.types.forEach(t => g.push({ key: s.slot + "|" + t.t, label: s.name, t: t.t, loc: t.loc, list: kl(t.list), max: t.max, ff: t.ff || [] })));
    const ad = (c.ctrl || []).find(x => x.pn === K.ctrl);
    if (ad) ad.types.forEach(t => g.push({ key: "+" + ad.pn + "|" + t.t, label: ad.name, t: t.t, loc: t.loc, list: kl(t.list), max: t.max, ff: t.ff || [], add: 1 }));
    return g;
  }
  // 구성을 바꾸거나 주소에서 상태를 읽은 뒤, 지금 구성에서 고를 수 없는 값을 기본값으로 되돌린다
  function kFix() {
    const c = kc();
    K.cpu = c.cpu ? pick(K.cpu, kl(c.cpu.list)) : null;
    const qdef = (o, cur) => o.qty.indexOf(cur) >= 0 ? cur : (o.qty.indexOf(o.qsel) >= 0 ? o.qsel : o.qty[0]);   // 기본 수량은 구성기의 기본값
    K.cpuQty = c.cpu ? qdef(c.cpu, K.cpuQty) : 0;
    const mm = memOf();
    K.mem = mm ? pick(K.mem, kl(mm.list)) : null;
    K.memQty = mm ? (mm.qty.length ? qdef(mm, K.memQty) : Math.max(1, Math.min(mm.slots || 64, K.memQty || 1))) : 0;
    K.ctrl = (c.ctrl || []).some(x => x.pn === K.ctrl) ? K.ctrl : null;
    if (!K.ctrl && (c.req || {})["SAS CONTROLLER"]) K.ctrl = ((c.ctrl || []).find(isSasCtrl) || {}).pn || null;
    const groups = storGroups(), drv = {};
    groups.forEach(g => { const s = (K.drv || {})[g.key]; if (s && g.list.indexOf(s.pn) >= 0) drv[g.key] = { pn: s.pn, qty: Math.max(1, Math.min(g.max || 1, s.qty || 1)) }; });
    K.drv = drv;
    const aiom = {};
    (c.aiom || []).forEach(a => { const v = (K.aiom || {})[a.slot]; if (v && kl(a.list).indexOf(v) >= 0) aiom[a.slot] = v; });
    K.aiom = aiom;
    const slot = {};
    (c.slots || []).forEach(s => { const v = (K.slot || {})[s.id]; if (v && s.types[v.t] !== undefined) slot[s.id] = { t: v.t, pn: kl(s.types[v.t]).indexOf(v.pn) >= 0 ? v.pn : null }; });
    K.slot = slot;
    K.gpub = c.gpub !== undefined ? pick(K.gpub, kl(c.gpub)) : null;
    K.tpm = kl(c.tpm).indexOf(K.tpm) >= 0 ? K.tpm : null;
    K.psu = c.psu ? pick(K.psu || c.psu.sel, kl(c.psu.list)) : null;
    K.psuQty = c.psu ? qdef(c.psu, K.psuQty) : 0;
    K.os = kl(c.os).indexOf(K.os) >= 0 ? K.os : null;
    K.war = kl(c.war).indexOf(K.war) >= 0 ? K.war : null;
    K.sw = (K.sw || []).filter(p => kl(c.sw).indexOf(p) >= 0);
    const optOk = new Set((c.addon || []).reduce((a, g) => a.concat(kl(g.list)), []));
    const opt = {};
    Object.keys(K.opt || {}).forEach(p => { if (optOk.has(p)) opt[p] = Math.max(1, Math.min(99, K.opt[p] || 1)); });
    K.opt = opt;
    K.units = Math.max(1, Math.min(999, K.units || 1));
  }

  function kLines() {
    const c = kc(), L = [];
    const add = (grp, pn, qty) => { if (pn && qty > 0) L.push({ grp, pn, qty, p: kp(pn) }); };
    L.push({ grp: "시스템", pn: K.d.sku, qty: 1, p: { d: [K.d.form, K.d.mb, K.d.chassis].filter(Boolean).join(", "), w: (c.pw || {}).base || 0 } });
    add("CPU", K.cpu, K.cpuQty);
    add("메모리", K.mem, K.memQty);
    add("GPU", K.gpub, 1);
    storGroups().forEach(g => { const s = K.drv[g.key]; if (s) add("스토리지", s.pn, s.qty); });
    add("스토리지 컨트롤러", K.ctrl, 1);
    Object.keys(K.aiom).forEach(k => add("네트워크", K.aiom[k], 1));
    Object.keys(K.slot).forEach(k => { const s = K.slot[k]; add(s.t === "GPU" ? "GPU" : s.t === "NETWORK" ? "네트워크" : "확장 카드", s.pn, 1); });
    add("전원", K.psu, K.psuQty);
    add("TPM", K.tpm, 1);
    add("OS", K.os, 1);
    K.sw.forEach(p => add("소프트웨어", p, 1));
    add("보증", K.war, 1);
    Object.keys(K.opt).forEach(p => add("옵션", p, K.opt[p]));
    return L;
  }
  const kWatts = () => Math.round(kLines().reduce((s, l) => s + (l.p.w || 0) * l.qty, 0) * AC_FACTOR);   // 노드 1개(단일 노드 모델은 서버 1대) 기준
  const kNodes = () => K.d.nodes > 1 ? K.d.nodes : 1;
  const kWattsAll = () => kWatts() * kNodes();                                                           // 시스템 1대(모든 노드) 기준
  const kMemGb = () => (kp(K.mem).gb || 0) * (K.memQty || 0);
  const kDriveQty = () => storGroups().reduce((s, g) => s + (K.drv[g.key] && g.t !== "M.2" ? K.drv[g.key].qty : 0), 0);
  const kNicQty = () => Object.keys(K.aiom).length + Object.keys(K.slot).filter(k => K.slot[k].t === "NETWORK" && K.slot[k].pn).length;
  const kGpuQty = () => Object.keys(K.slot).filter(k => K.slot[k].t === "GPU" && K.slot[k].pn).length;

  // 구성기의 최소 수량 조건(req)별로 세는 방법. can 은 화면에서 채울 수 있는 조건인지 (목록이 없으면 막지 않고 안내만 한다)
  const kDrv = test => storGroups().reduce((s, g) => s + (K.drv[g.key] && test(g.t) ? K.drv[g.key].qty : 0), 0);
  const kDrvCan = test => storGroups().some(g => test(g.t) && g.list.length) || (kc().ctrl || []).some(x => x.types.some(t => test(t.t) && kl(t.list).length));
  const kNicCan = () => (kc().aiom || []).some(a => kl(a.list).length) || (kc().slots || []).some(s => s.types["NETWORK"] !== undefined);
  const isM2 = t => /M\.2/i.test(t), isNvme = t => /^NVME/i.test(t), isAny = () => true;
  const REQ = {
    "HDD_SSD_NVME_M2": { st: 3, name: "드라이브 (HDD, SSD, NVMe, M.2)", n: () => kDrv(isAny), can: () => kDrvCan(isAny) },
    "HDD_SSD_M2": { st: 3, name: "드라이브 (HDD, SSD, M.2)", n: () => kDrv(t => !isNvme(t)), can: () => kDrvCan(t => !isNvme(t)) },
    "HDD_SSD": { st: 3, name: "드라이브 (HDD, SSD)", n: () => kDrv(t => !isM2(t) && !isNvme(t)), can: () => kDrvCan(t => !isM2(t) && !isNvme(t)) },
    "NVME": { st: 3, name: "NVMe 드라이브", n: () => kDrv(isNvme), can: () => kDrvCan(isNvme) },
    "M2": { st: 3, name: "M.2 드라이브", n: () => kDrv(isM2), can: () => kDrvCan(isM2) },
    "NIC_AIOM": { st: 4, name: "네트워크 카드 (AIOM 또는 확장 슬롯)", n: () => kNicQty(), can: kNicCan },
    "NETWORK": { st: 4, name: "네트워크 카드", n: () => kNicQty(), can: kNicCan },
    "GPU": { st: 5, name: "GPU", n: () => kGpuQty() + (K.gpub ? 1 : 0), can: () => kc().gpub !== undefined || (kc().slots || []).some(s => s.types["GPU"] !== undefined) },
  };
  const REQ_SKIP = ["SAS CONTROLLER", "NODE", "ONSITESERVICE"];      // 컨트롤러는 따로 검사, 노드 수와 현장 서비스는 화면에서 고르지 않는다
  const isSasCtrl = x => (x.proto || []).some(p => /SAS|SATA/i.test(p));

  function kValidate() {
    const c = kc(), out = [], req = c.req || {};
    for (const s of c.slots || []) {
      if (K.slot[s.id] && Number(s.cpu) > K.cpuQty && K.cpuQty) out.push({ lv: "err", st: 5, msg: `슬롯 ${s.id}에는 CPU ${s.cpu} 장착이 필요합니다.` });
    }
    if (c.cpu && !K.cpu) out.push({ lv: "err", st: 1, msg: "CPU를 선택하세요." });
    const mm = memOf();
    if (mm) {
      const cap = (mm.cap || (c.cpu || {}).memcap || 0) * Math.max(1, K.cpuQty || 1);   // 구성기 한도 값은 CPU 1개 기준
      if (!K.mem) out.push({ lv: "err", st: 2, msg: "메모리를 선택하세요." });
      else if (cap && kMemGb() > cap) out.push({ lv: "err", st: 2, msg: `메모리 총 용량이 이 구성의 한도(${cap.toLocaleString()}GB)를 넘습니다.` });
    }
    const groups = storGroups(), bays = c.bays || {};
    groups.forEach(g => { const s = K.drv[g.key]; if (s && g.max && s.qty > g.max) out.push({ lv: "err", st: 3, msg: `${g.label} ${g.t} 드라이브는 최대 ${g.max}개입니다.` }); });
    // 같은 위치(전면, 후면)의 베이는 컨트롤러와 드라이브 규격(2.5", 3.5")이 달라도 함께 쓴다
    // 구성기 자료에 베이 수가 없는 위치(추가 컨트롤러에만 연결되는 후면 베이 등)는 그 위치 드라이브 줄의 최대 수량을 베이 수로 본다
    const bayG = groups.filter(g => g.loc && !isM2(g.t));
    [...new Set(bayG.map(g => g.loc))].forEach(loc => {
      const cap = (c.locbay || {})[loc] || Math.max(0, ...bayG.filter(g => g.loc === loc).map(g => g.max || 0));
      const used = bayG.reduce((s, g) => s + (g.loc === loc && K.drv[g.key] ? K.drv[g.key].qty : 0), 0);
      if (cap && used > cap) out.push({ lv: "err", st: 3, msg: `드라이브 ${used}개를 골랐는데 같은 위치의 드라이브 베이는 ${cap}개입니다. 컨트롤러와 규격이 달라도 같은 베이를 나눠 씁니다.` });
    });
    const m2 = groups.reduce((s, g) => s + (!g.add && isM2(g.t) && K.drv[g.key] ? K.drv[g.key].qty : 0), 0);
    if (bays["M.2"] && m2 > bays["M.2"]) out.push({ lv: "err", st: 3, msg: `M.2 드라이브 ${m2}개를 골랐는데 기본 M.2 자리는 ${bays["M.2"]}개입니다.` });
    if (req["SAS CONTROLLER"]) {
      const ad = (c.ctrl || []).find(x => x.pn === K.ctrl);
      if (!ad || !isSasCtrl(ad)) out.push({ lv: (c.ctrl || []).some(isSasCtrl) ? "err" : "warn", st: 3, msg: "이 구성은 SAS, SATA 드라이브용 스토리지 컨트롤러(RAID, HBA)가 필요합니다." });
      else if (req["SAS CONTROLLER"] > 1) out.push({ lv: "warn", st: 3, msg: `이 구성은 스토리지 컨트롤러가 ${req["SAS CONTROLLER"]}개 필요합니다. 화면에서는 1개만 고를 수 있으며 나머지는 견적 단계에서 담당자가 추가합니다.` });
    }
    Object.keys(req).forEach(k => {
      const r = REQ[k], q = req[k];
      if (REQ_SKIP.indexOf(k) >= 0) return;
      if (!r) { out.push({ lv: "warn", st: 8, msg: `구성기 조건(${k} 최소 ${q})은 견적 단계에서 담당자가 확인합니다.` }); return; }
      if (r.n() >= q) return;
      const st = r.st === 4 && !(c.aiom || []).length ? 5 : r.st;
      if (r.can()) out.push({ lv: "err", st, msg: `${r.name}: ${q}개 이상 선택해야 합니다.` });
      else out.push({ lv: "warn", st, msg: `${r.name}: ${q}개 이상 필요하지만 화면에 고를 목록이 없습니다. 견적 요청 시 담당자가 구성합니다.` });
    });
    // 추가 스토리지 컨트롤러는 정해진 슬롯에만 꽂힌다. 그 슬롯이 모두 다른 카드로 차 있으면 꽂을 자리가 없다 (목록에 없는 번호는 전용 자리)
    const ad2 = (c.ctrl || []).find(x => x.pn === K.ctrl);
    if (ad2 && (ad2.slots || []).length) {
      const ids = (c.slots || []).map(s => String(s.id));
      if (!ad2.slots.some(s => ids.indexOf(String(s)) < 0 || !K.slot[s])) out.push({ lv: "err", st: 5, msg: `추가 스토리지 컨트롤러를 꽂을 수 있는 슬롯(${ad2.slots.join(", ")})이 모두 다른 카드로 차 있습니다. 그 가운데 한 슬롯을 비워 주세요.` });
    }
    Object.keys(K.slot).forEach(k => { if (!K.slot[k].pn) out.push({ lv: "warn", st: 5, msg: `슬롯 ${k}에 카드 종류만 고르고 제품을 고르지 않았습니다.` }); });
    const dis = new Set(c.dis || []);
    const hit = kLines().filter(l => dis.has(l.pn)).map(l => l.pn);
    if (hit.length) out.push({ lv: "warn", st: 5, msg: `${hit.join(", ")}: CPU 전력 등급에 따라 장착이 제한되는 부품입니다. 구성 유의사항을 확인하세요.` });
    const w = kWattsAll(), psu = kp(K.psu);
    // 멀티노드 모델은 전원 여러 개가 노드 전체를 나눠 맡고 이중화 방식이 모델마다 달라 용량 비교를 하지 않는다 (견적 단계에서 확인)
    if (kNodes() === 1 && K.psu && psu.cap && w > psu.cap * (K.psuQty >= 2 ? 1 : Math.max(1, K.psuQty))) out.push({ lv: "warn", st: 6, msg: `예상 전력 ${won(w)}W가 전원 용량 ${won(psu.cap)}W를 넘습니다. 더 큰 전원을 고르거나 구성을 낮춰 주세요.` });
    const kw = (w * K.units) / 1000;
    if (kw > airLimit) out.push({ lv: "warn", st: 6, msg: `${K.units}대를 한 랙에 설치하면 총 ${kw.toFixed(1)}kW로 공랭 랙 한계(약 ${airLimit}kW/랙)를 넘을 수 있습니다. AIK DLC, CDU 냉각 설계를 함께 검토하세요.` });
    return out;
  }

  return { kc, kl, kp, memOf, storGroups, kFix, kLines, kWatts, kNodes, kWattsAll, kMemGb, kDriveQty, kNicQty, kGpuQty, kValidate };
}
if (typeof module !== "undefined" && module.exports) module.exports = createSmcRules;
/* Supermicro 구성 자료를 사용하는 화면. cfg_index.js와 cfg/<id>.json은 build_smc_cfg.py가 생성한다.
   목록·수량·호환 조건에 공통 검증 규칙을 적용한다. 부품별 케이블 키트 등은 제조사 확인이 필요하다. */
  const SMC = window.SMC_CFG || { models: {}, fams: [], gens: [] };
  Object.keys(SMC.models).forEach(id => {
    const e = SMC.models[id];
    let m = BYID[id];
    if (!m) {
      m = { id, sku: e.sku, name: e.fam, cat: e.cat, u: e.u, cpu: e.cpu, gen: e.gen, sum: e.sum, added: 1 };
      ALL.push(m); BYID[id] = m;
    }
    m.fam = e.fam; m.grp = e.grp; m.cfg = e.n || 0; m.isNew = !!e.new;
    if (e.image) { m.photo = e.image; HASIMG.add(id); }
    if (!m.gen) m.gen = e.gen;
    if (e.gpu && !m.gpu) m.gpuOk = 1;
  });
  // Supermicro 구성기 자료가 있는 모델에 부품 선택을 연결한다.
  ALL.forEach(m => { if (m.live && !m.cfg) m.live = false; });
  const cfgCache = {};
  const loadCfg = id => cfgCache[id] || (cfgCache[id] = fetch("cfg/" + id + ".json").then(r => r.ok ? r.json() : null).catch(() => null));

  const KSTEPS = [
    { key: "model", name: "구성 선택" }, { key: "cpu", name: "CPU" }, { key: "mem", name: "메모리" },
    { key: "storage", name: "스토리지" }, { key: "net", name: "네트워크" }, { key: "gpu", name: "확장 슬롯" },
    { key: "power", name: "전원" }, { key: "svc", name: "부가 품목" }, { key: "review", name: "견적 확인" },
  ];
  const SLOT_KO = { "GPU": "GPU, 가속기", "NETWORK": "네트워크 카드", "EXTERNAL CONTROLLER": "외장 컨트롤러", "STORAGE": "스토리지 컨트롤러" };
  let K = null;

  let kc, kl, kp, memOf, storGroups, kFix, kLines, kWatts, kNodes, kWattsAll, kMemGb, kDriveQty, kNicQty, kGpuQty, kValidate;

  // ---------- 화면 조각 ----------
  const kOpt = (name, pn, sel, extra) => { const p = kp(pn); return `<label class="opt ${sel ? "sel" : ""}"><input type="radio" name="${name}" value="${esc(pn)}" ${sel ? "checked" : ""}>
      <div><div class="t">${esc(p.d)}</div><div class="d">${p.d === pn ? "" : esc(pn)}${p.w ? ` · ${p.w}W` : ""}${extra || ""}</div></div><div class="p"></div></label>`; };
  const kNone = (name, sel, text) => `<label class="opt ${sel ? "sel" : ""}"><input type="radio" name="${name}" value="" ${sel ? "checked" : ""}><div><div class="t">${text}</div></div><div class="p"></div></label>`;
  const kSel = (k, g, list, cur, none) => `<select class="ksel" data-k="${k}" data-g="${esc(g)}"><option value="">${none}</option>${list.map(pn => `<option value="${esc(pn)}" ${pn === cur ? "selected" : ""}>${esc(kp(pn).d)}${kp(pn).d === pn ? "" : ` (${esc(pn)})`}</option>`).join("")}</select>`;
  const kNum = (k, g, list, cur) => `<select class="ksel num" data-k="${k}" data-g="${esc(g)}">${list.map(n => `<option value="${n}" ${n === cur ? "selected" : ""}>${n}</option>`).join("")}</select>`;
  const range = n => Array.from({ length: Math.max(1, n) }, (_, i) => i + 1);
  const kNotes = c => (c.notes || []).length ? `<div class="note info knotes"><b>구성 유의사항 (Supermicro 구성기 원문)</b><ul>${c.notes.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : "";

  function kStepBody() {
    const c = kc(), st = KSTEPS[K.step].key;
    const issues = kValidate().filter(i => i.st === K.step).map(i => `<div class="note ${i.lv}">${esc(i.msg)}</div>`).join("");
    let h = "";
    if (st === "model") {
      h = `<h2>구성 선택</h2><p class="sub">${K.d.cfgs.length > 1 ? `${esc(K.d.sku)} 모델은 드라이브 베이와 확장 슬롯 배치에 따라 ${K.d.cfgs.length}가지 구성이 있습니다. 구성을 바꾸면 고를 수 없게 된 부품은 기본값으로 돌아갑니다.` : `${esc(K.d.sku)} 모델은 한 가지 구성으로 제공됩니다. 다음 단계에서 부품을 고르세요.`}</p>
        ${K.d.nodes > 1 ? `<div class="note info">이 모델은 ${K.d.nodes}노드 시스템입니다. 이 화면에서 고르는 부품과 예상 전력은 노드 1개 기준이며, 견적은 모든 노드에 같은 구성을 적용해 산출합니다.</div>` : ""}
        <div class="opts">${K.d.cfgs.map((x, i) => `<label class="opt ${i === K.ci ? "sel" : ""}"><input type="radio" name="k-cfg" value="${i}" ${i === K.ci ? "checked" : ""}>
          <div><div class="t">구성 ${esc(x.num)}</div><div class="d">${x.desc.map(esc).join("<br>")}</div></div><div class="p"></div></label>`).join("")}</div>
        ${kNotes(c)}
        <p style="margin-top:14px"><a class="btn ghost sm" href="#/products?live=y">다른 모델 고르기</a> <a class="btn ghost sm" href="#/product/${K.id}">상세 사양 보기</a></p>`;
    }
    if (st === "cpu") {
      if (!c.cpu) h = `<h2>CPU</h2><p class="sub">이 구성은 CPU가 기본 장착되어 있거나 선택 항목이 없습니다.</p>`;
      else h = `<h2>CPU</h2><p class="sub">선택 가능한 CPU ${kl(c.cpu.list).length}종. CPU에 따라 고를 수 있는 메모리가 달라질 수 있습니다.</p>
        <div class="grp">수량 ${kNum("cpuq", "", c.cpu.qty, K.cpuQty)}</div>
        <div class="opts scroll">${kl(c.cpu.list).map(pn => kOpt("k-cpu", pn, K.cpu === pn)).join("")}</div>${kNotes(c)}`;
    }
    if (st === "mem") {
      const mm = memOf();
      if (!mm) h = `<h2>메모리</h2><p class="sub">이 구성은 메모리 선택 항목이 없습니다. 필요한 용량은 견적 요청 시 적어 주세요.</p>`;
      else h = `<h2>메모리</h2><p class="sub">${mm.slots || (kc().mem || {}).slots ? `DIMM 슬롯 ${mm.slots || kc().mem.slots}개. ` : ""}현재 총 <b>${kMemGb().toLocaleString()}GB</b></p>
        <div class="grp">수량 ${mm.qty.length ? kNum("memq", "", mm.qty, K.memQty) : kNum("memq", "", range(64), K.memQty)}</div>
        <div class="opts scroll">${kl(mm.list).map(pn => kOpt("k-mem", pn, K.mem === pn)).join("")}</div>`;
    }
    if (st === "storage") {
      const groups = storGroups();
      const bays = Object.entries(c.bays || {}).map(([k, v]) => `${k} ${v}개`).join(", ");
      const row = g => { const s = K.drv[g.key]; return `<div class="krow"><div class="kl"><b>${esc(g.label)}</b><small>${esc(g.t)}${g.max ? ` · 최대 ${g.max}개` : ""}</small></div>
          <div class="kv2">${g.list.length ? kSel("drv", g.key, g.list, s ? s.pn : "", "선택 안 함") + (s ? kNum("drvq", g.key, range(g.max || 1), s.qty) : "") : `<span class="sub">목록 준비 중 (견적 요청 시 적어 주세요)</span>`}</div></div>`; };
      h = `<h2>스토리지</h2><p class="sub">${bays ? `베이 구성: ${bays}. ` : ""}컨트롤러별로 드라이브와 수량을 고릅니다.</p>
        ${groups.filter(g => !g.add).map(row).join("") || `<p class="sub">이 구성은 기본 컨트롤러의 드라이브 선택 항목이 없습니다.</p>`}
        ${(c.ctrl || []).length ? `<div class="grp">추가 스토리지 컨트롤러 (RAID, HBA)</div>
          <div class="krow"><div class="kl"><b>컨트롤러</b><small>확장 슬롯 1개 사용</small></div><div class="kv2">${kSel("ctrl", "", c.ctrl.map(x => x.pn), K.ctrl || "", "추가하지 않음")}</div></div>
          ${groups.filter(g => g.add).map(row).join("")}` : ""}`;
    }
    if (st === "net") {
      h = `<h2>네트워크</h2><p class="sub">${(c.onboard || []).length ? `기본 장착: ${c.onboard.map(esc).join(", ")}. ` : ""}AIOM(OCP 3.0) 슬롯에 장착할 카드를 고릅니다. 일반 PCIe 네트워크 카드는 다음 단계(확장 슬롯)에서 고릅니다.</p>
        ${(c.aiom || []).map(a => `<div class="krow"><div class="kl"><b>AIOM 슬롯 ${esc(a.slot)}</b></div><div class="kv2">${kSel("aiom", a.slot, kl(a.list), K.aiom[a.slot] || "", "선택 안 함")}</div></div>`).join("") || `<p class="sub">이 구성은 AIOM 슬롯이 없습니다. 다음 단계로 진행하세요.</p>`}`;
    }
    if (st === "gpu") {
      const gb = c.gpub !== undefined ? `<div class="grp">GPU 보드 (기본 장착)</div><div class="opts">${kl(c.gpub).map(pn => kOpt("k-gpub", pn, K.gpub === pn)).join("")}</div>` : "";
      const row = s => { const v = K.slot[s.id], types = Object.keys(s.types);
        return `<div class="krow"><div class="kl"><b>슬롯 ${s.id}</b><small>${s.cpu ? `CPU ${esc(s.cpu)}` : ""}${s.pcie ? ` · ${esc(s.pcie)}` : ""}</small></div>
          <div class="kv2"><select class="ksel typ" data-k="slt" data-g="${s.id}"><option value="">사용 안 함</option>${types.map(t => `<option value="${esc(t)}" ${v && v.t === t ? "selected" : ""}>${esc(SLOT_KO[t] || t)}</option>`).join("")}</select>
          ${v ? kSel("slp", String(s.id), kl(s.types[v.t]), v.pn || "", "제품 선택") : ""}</div></div>`; };
      h = `<h2>확장 슬롯</h2><p class="sub">PCIe 확장 슬롯 ${(c.slots || []).length}개. 슬롯마다 카드 종류를 고른 뒤 제품을 고릅니다.</p>${gb}
        ${(c.slots || []).map(row).join("") || (gb ? "" : `<p class="sub">이 구성은 선택할 수 있는 확장 슬롯이 없습니다.</p>`)}${kNotes(c)}`;
    }
    if (st === "power") {
      const w = kWattsAll(), psu = kp(K.psu), kw = (w * K.units) / 1000, rr = kw / C.meta.air_limit_kw_per_rack;
      const ratio = psu.cap ? w / psu.cap : 0;
      h = `<h2>전원</h2><p class="sub">선택한 부품의 전력을 더해 예상 소비전력을 계산합니다. 일부 부품은 추정값이며 확정값은 견적서로 안내합니다.</p>
        <div class="card"><div class="row2" style="display:flex;justify-content:space-between"><span>${kNodes() > 1 ? `시스템 1대 예상 소비전력 (노드 ${kNodes()}개 합계, AC 240V 환산)` : "서버 1대 예상 소비전력 (AC 240V 환산)"}</span><b>${won(w)} W</b></div>
        ${kNodes() > 1 ? `<small style="color:var(--ink-3)">멀티노드 모델의 전원 수량과 이중화 방식은 견적 단계에서 담당자가 확인합니다.</small>` : psu.cap ? `<div class="meter"><i class="${ratio > 1 ? "over" : ratio > .85 ? "hot" : ""}" style="width:${Math.min(100, ratio * 100)}%"></i></div><small style="color:var(--ink-3)">전원 1개 용량 대비 ${Math.round(ratio * 100)}%</small>` : ""}
        <div class="row2" style="display:flex;justify-content:space-between;margin-top:14px"><span>${K.units}대 합계 발열</span><b>${kw.toFixed(1)} kW (${won(w * K.units * 3.412)} BTU/h)</b></div>
        <div class="meter"><i class="${rr > 1 ? "over" : rr > .8 ? "hot" : ""}" style="width:${Math.min(100, rr * 100)}%"></i></div><small style="color:var(--ink-3)">공랭 랙 1개 기준(${C.meta.air_limit_kw_per_rack}kW) 대비</small></div>
        ${c.psu ? `<div class="grp">전원 공급 장치 ${kNum("psuq", "", c.psu.qty, K.psuQty)}</div><div class="opts">${kl(c.psu.list).map(pn => kOpt("k-psu", pn, K.psu === pn, kp(pn).cap ? ` · ${kp(pn).cap}W` : "")).join("")}</div>` : `<p class="sub" style="margin-top:14px">이 모델은 전원이 섀시에 포함되어 있어 선택 항목이 없습니다.</p>`}
        <div class="note info">AIK는 데이터센터 냉각 EPC 전문 기업입니다. 랙 밀도가 높거나 수냉(DLC) 모델이면 CDU, 매니폴드, 배관 설계 견적을 함께 드립니다.</div>`;
    }
    if (st === "svc") {
      const chk = (k, pn, on) => `<label class="opt ${on ? "sel" : ""}"><input type="checkbox" name="${k}" value="${esc(pn)}" ${on ? "checked" : ""}><div><div class="t">${esc(kp(pn).d)}</div><div class="d">${esc(pn)}</div></div><div class="p"></div></label>`;
      h = `<h2>부가 품목</h2><p class="sub">보안 모듈, 운영체제, 소프트웨어, 보증 연장, 선택 부속을 고릅니다. 모두 선택 사항입니다.</p>
        ${kl(c.tpm).length ? `<div class="grp">TPM (보안 모듈)</div><div class="opts">${kNone("k-tpm", !K.tpm, "선택 안 함")}${kl(c.tpm).map(pn => kOpt("k-tpm", pn, K.tpm === pn)).join("")}</div>` : ""}
        ${kl(c.os).length ? `<div class="grp">운영체제</div><div class="krow"><div class="kv2">${kSel("os", "", kl(c.os), K.os || "", "선택 안 함")}</div></div>` : ""}
        ${kl(c.war).length ? `<div class="grp">보증 연장</div><div class="krow"><div class="kv2">${kSel("war", "", kl(c.war), K.war || "", "기본 보증")}</div></div>` : ""}
        ${kl(c.sw).length ? `<div class="grp">소프트웨어 (복수 선택)</div><div class="opts scroll">${kl(c.sw).map(pn => chk("k-sw", pn, K.sw.indexOf(pn) >= 0)).join("")}</div>` : ""}
        ${(c.addon || []).map(g => `<div class="grp">${esc(g.cat)} (복수 선택)</div><div class="opts">${kl(g.list).map(pn => chk("k-opt", pn, K.opt[pn] > 0)).join("")}</div>`).join("")}
        ${(c.acc || []).length ? `<details class="kacc"><summary>기본 포함 부속 ${c.acc.length}종</summary><table class="kv">${c.acc.map(a => `<tr><th>${esc(a[0])}</th><td>${esc(kp(a[0]).d)}${a[1] > 1 ? ` x${a[1]}` : ""}</td></tr>`).join("")}</table></details>` : ""}`;
    }
    if (st === "review") {
      const all = kValidate(), L = kLines();
      h = `<h2>견적 확인</h2><p class="sub">구성을 확인하고 수량을 정한 뒤 견적을 요청하세요.</p>
        <div class="grp">서버 수량 ${qtyBox("units", K.units)}</div>
        ${all.length ? all.map(i => `<div class="note ${i.lv}">[${KSTEPS[i.st].name}] ${esc(i.msg)}</div>`).join("") : `<div class="note ok">선택한 부품의 수량 조건을 통과했습니다. 최종 호환성은 견적 단계에서 담당자가 확인합니다.</div>`}
        <table class="kv kbom" style="margin-top:12px"><tr><th>구분</th><td>품명, 부품 번호</td><td class="q">수량</td></tr>${L.map(l => `<tr><th>${esc(l.grp)}</th><td>${esc(l.p.d)}<small>${esc(l.pn)}</small></td><td class="q">${l.qty}</td></tr>`).join("")}</table>
        <div class="navbtns" style="justify-content:flex-start;gap:8px">
          <button class="btn" id="kQuote" ${all.some(i => i.lv === "err") ? "disabled" : ""}>이 구성으로 견적 요청</button>
          <button class="btn ghost" id="kPrint">요약서 PDF 저장</button>
          <button class="btn ghost" id="kShare">구성 링크 복사</button></div>`;
    }
    return h + (st === "review" ? "" : issues) + `<div class="navbtns">
      <button class="btn ghost" data-kgo="${K.step - 1}" ${K.step === 0 ? "disabled" : ""}>이전</button>
      ${K.step < KSTEPS.length - 1 ? `<button class="btn" data-kgo="${K.step + 1}">다음: ${KSTEPS[K.step + 1].name}</button>` : ""}</div>`;
  }

  function kSummary() {
    const L = kLines(), errs = kValidate().filter(i => i.lv === "err").length, c = kc();
    return `<div class="hd"><small>${esc(K.d.sku)}</small><b>${esc(K.d.fam)} ${esc(K.d.form)}</b></div>
      <div class="bd"><div class="line"><span>구성 ${esc(c.num)}: ${esc(c.desc.slice(0, 2).join(", "))}</span><span></span></div>
        ${L.slice(1).map(l => `<div class="line"><span>${esc(l.p.d)}${l.qty > 1 ? " x" + l.qty : ""}</span><span></span></div>`).join("")}</div>
      <div class="ft">
        <div class="row2"><span>수량</span><b>${K.units}대</b></div>
        <div class="row2"><span>납기</span><b>견적 문의</b></div>
        <div class="row2"><span>예상 전력</span><b>${won(kWatts())}W/${K.d.nodes > 1 ? "노드" : "대"}</b></div>
        <div style="margin-top:8px;font-size:13px;color:var(--ink-3)">가격</div>
        <div class="big">${smcPrice(K.id, 1)}</div>${smcKrw(K.id)}${smcPriceSubCfg(K.id)}
        ${errs ? `<div class="note err">해결이 필요한 항목 ${errs}건</div>` : ""}
        <div class="disc">부품 목록과 수량 한도는 Supermicro 구성기 자료(${esc(SMC.updated || "")} 기준)이며 수시로 바뀝니다. 전력은 참고용 예상치입니다. 확정 사양과 가격, 납기는 견적서로 안내드립니다.</div>
        <div class="acts">${K.quoteId ? `<button class="btn" id="kSaveAgent">수정한 견적 저장</button>` : ``}<button class="btn" data-kgo="${KSTEPS.length - 1}">견적 확인으로</button></div>
      </div>`;
  }

  function kSend3d() {
    const c = kc(), bays = {};
    Object.keys(c.bays || {}).forEach(k => { if (k !== "M.2") bays[k] = c.bays[k]; });
    const gq = kGpuQty() + (K.gpub ? 8 : 0), dq = kDriveQty();
    const detail = {
      sku: K.d.sku, step: KSTEPS[K.step].key, u: K.d.u || 2, sockets: Math.max(1, K.cpuQty || 1), cpu: !!K.cpu || !c.cpu,
      dimmSlots: (memOf() || {}).slots || (c.mem || {}).slots || Math.max(K.memQty || 0, 16), memQty: K.mem ? K.memQty : 0,
      bays, driveForm: Object.keys(bays)[0] || null, driveQty: dq, gpuQty: gq, gpuFixed: !!K.gpub, gpuDw: gq > 0,
      nic: kNicQty(), psu: Math.max(1, K.psuQty || 2), dlc: /LC/.test(K.d.sku),
      caption: [K.d.sku, K.cpu ? "CPU " + K.cpuQty + "개" : "", K.mem ? "메모리 " + kMemGb().toLocaleString() + "GB" : "", dq ? "드라이브 " + dq + "개" : "", gq ? "GPU " + gq + "개" : ""].filter(Boolean).join(", "),
    };
    const fire = () => window.dispatchEvent(new CustomEvent("smc3d", { detail }));
    if (window.SMC3D_READY) fire(); else window.addEventListener("smc3d-ready", fire, { once: true });
  }

  const K_KEYS = ["ci", "cpu", "cpuQty", "mem", "memQty", "drv", "ctrl", "aiom", "slot", "gpub", "tpm", "psu", "psuQty", "os", "war", "sw", "opt", "units"];
  function kEncode() { const o = {}; K_KEYS.forEach(k => o[k] = K[k]); return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(o))))); }
  function kDecode(c) { try { return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(c))))); } catch (e) { return null; } }

  function kRender() {
    $("#cfgSteps").innerHTML = KSTEPS.map((s, i) => `<button class="${i === K.step ? "on" : i < K.step ? "done" : ""}" data-kgo="${i}"><b>STEP ${i + 1}</b>${s.name}</button>`).join("");
    $("#cfgPanel").innerHTML = kStepBody();
    $("#cfgSum").innerHTML = kSummary();
    history.replaceState(null, "", "#/configure/" + K.id + "?c=" + kEncode() + (K.quoteId ? "&quote=" + K.quoteId + "&rev=" + K.quoteRevision : ""));
    kSend3d();
  }

  function kQuote() {
    const L = kLines(), w = kWatts(), c = kc();
    openModal(`<h2 style="margin-top:0">견적 요청</h2>
      <p class="sub">${esc(K.d.sku)} x ${K.units}대 / ${smcQuoteLine(K.id)}<br>구성 내역과 링크가 담당자에게 함께 전달됩니다. 영업일 기준 1일 내 회신.</p>
      ${leadForm(true)}`, null, () => {
      const f = Object.fromEntries(new FormData($("#lf")));
      const body = ["[웹 구성기 견적 요청]", `회사: ${f.co} / 담당: ${f.nm} / ${f.em} / ${f.tel || ""}`, `납품 희망: ${f.due || "-"} / 설치: ${f.site}`, `모델: ${K.d.sku} x ${K.units}대 (구성 ${c.num}: ${c.desc.join(", ")})`, ...(K.d.nodes > 1 ? [`노드 수: ${K.d.nodes} (아래 부품은 노드 1개 기준)`] : []),
        ...L.slice(1).map(l => `- [${l.grp}] ${l.pn} x${l.qty} : ${l.p.d}`), `예상 전력 ${w}W/${kNodes() > 1 ? "노드" : "대"}`,`요청: ${f.memo || "-"}`, `구성 링크: ${location.href}`].join("\n");
      location.href = `mailto:${C.meta.quote_email}?subject=${encodeURIComponent("[서버 견적요청] " + f.co + " / " + K.d.sku)}&body=${encodeURIComponent(body)}`;
    });
  }

  function viewConfigureSmc(id, q) {
    const m = BYID[id];
    S = null; K = null;
    shell("서버 구성하기", `<div class="wrap"><div class="crumb"><a href="#/">개요</a> / <a href="#/product/${m.id}">${esc(m.sku)}</a> / 서버 구성하기</div>
      <div class="cfg has3d"><aside class="v3d" id="cfg3d"><div class="v3d-stage"></div><p class="v3d-cap"></p><p class="v3d-note">드래그하면 돌려 볼 수 있고, Ctrl + 휠로 확대합니다. 실제 제품 형상이 아닌 구성 개념도입니다.</p></aside><div><div class="steps" id="cfgSteps"></div><div class="panel" id="cfgPanel"><p class="sub">구성 자료를 불러오는 중입니다.</p></div></div><aside class="sum" id="cfgSum"></aside></div></div>`);
    loadCfg(id).then(d => {
      if (location.hash.indexOf("#/configure/" + id) !== 0 || !$("#cfgPanel")) return;
      if (!d || !(d.cfgs || []).length) { $("#cfgPanel").innerHTML = `<p class="sub">구성 자료를 불러오지 못했습니다. <a href="#/product/${id}" style="text-decoration:underline">제품 상세</a>에서 견적을 요청해 주십시오.</p>`; return; }
      const s = kDecode(q.get("c") || "") || {};
      K = Object.assign({}, s, { id, d, step: Math.max(0, Math.min(KSTEPS.length - 1, +(q.get("s") || 0) || 0)) });
      K.ci = Math.max(0, Math.min(d.cfgs.length - 1, K.ci | 0));
      ({ kc, kl, kp, memOf, storGroups, kFix, kLines, kWatts, kNodes, kWattsAll, kMemGb, kDriveQty, kNicQty, kGpuQty, kValidate } = createSmcRules(K, C.meta.air_limit_kw_per_rack));
      K.quoteId = null;
      K.quoteRevision = Number(q.get("rev")) || 0;
      kFix();
      const root = $(".cfg");
      root.addEventListener("click", e => {
        const go = e.target.closest("[data-kgo]");
        if (go && !go.disabled) { K.step = Math.max(0, Math.min(KSTEPS.length - 1, +go.dataset.kgo)); kRender(); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
        const qb = e.target.closest("[data-q]");
        if (qb) { e.preventDefault(); if (qb.dataset.q === "units") K.units = Math.max(1, Math.min(999, K.units + (+qb.dataset.d))); kRender(); return; }
        if (e.target.id === "kSaveAgent") {
          const selection = Object.fromEntries(K_KEYS.map(key => [key, K[key]]));
          window.AikQuote.saveManual(e.target, K.quoteId, K.quoteRevision, K.id, selection);
          return;
        }
        if (e.target.id === "kPrint") window.print();
        if (e.target.id === "kShare") { if (navigator.clipboard) navigator.clipboard.writeText(location.href); e.target.textContent = "링크 복사됨"; }
        if (e.target.id === "kQuote") kQuote();
      });
      root.addEventListener("change", e => {
        const i = e.target, v = i.value, k = i.dataset.k, g = i.dataset.g, c = kc();
        if (i.name === "k-cfg") { K.ci = +v; kFix(); }
        else if (i.name === "k-cpu") { K.cpu = v; kFix(); }
        else if (i.name === "k-mem") K.mem = v;
        else if (i.name === "k-gpub") K.gpub = v;
        else if (i.name === "k-tpm") K.tpm = v || null;
        else if (i.name === "k-psu") K.psu = v;
        else if (i.name === "k-sw") K.sw = i.checked ? K.sw.concat([v]) : K.sw.filter(x => x !== v);
        else if (i.name === "k-opt") { if (i.checked) K.opt[v] = 1; else delete K.opt[v]; }
        else if (k === "cpuq") K.cpuQty = +v;
        else if (k === "memq") K.memQty = +v;
        else if (k === "psuq") K.psuQty = +v;
        else if (k === "drv") { if (v) K.drv[g] = { pn: v, qty: (K.drv[g] || {}).qty || 1 }; else delete K.drv[g]; }
        else if (k === "drvq") { if (K.drv[g]) K.drv[g].qty = +v; }
        else if (k === "ctrl") { K.ctrl = v || null; kFix(); }
        else if (k === "aiom") { if (v) K.aiom[g] = v; else delete K.aiom[g]; }
        else if (k === "slt") { if (v) K.slot[g] = { t: v, pn: null }; else delete K.slot[g]; }
        else if (k === "slp") { if (K.slot[g]) K.slot[g].pn = v || null; }
        else if (k === "os") K.os = v || null;
        else if (k === "war") K.war = v || null;
        else return;
        kRender();
      });
      kRender();
    });
  }

  // ---------- 서버 교체 로봇 (영상) ----------
  const ROBOT_VIDEOS = [
    { title: "자동 랙 교체 및 서버 교체 AMR", ko: "video/robot_auto_ko.mp4", en: "video/robot_auto_en.mp4" },
    { title: "수동 서버 교체 장비", ko: "video/robot_manual_ko.mp4", en: "video/robot_manual_en.mp4" },
  ];
  let robotLang = "ko";
  function viewRobot() {
    const cards = ROBOT_VIDEOS.map(v => `<figure class="vid-card">
        <video class="vid" controls playsinline preload="metadata" src="${v[robotLang]}#t=4"></video>
        <figcaption><b>${esc(v.title)}</b><span>${robotLang === "ko" ? "국문" : "English"}</span></figcaption>
      </figure>`).join("");
    shell("서버 교체 로봇", `
      <section class="hero"><div class="wrap">
        <div class="eyebrow">DATA CENTER ROBOTICS</div>
        <h1>서버 랙 교체 AMR,<br>서버 트레이 교체 로봇</h1>
        <p>데이터센터의 서버 랙과 서버 트레이 교체 작업을 위해 에이아이코리아가 개발한 장비의 소개 영상입니다.</p>
        <div class="lang" role="group" aria-label="영상 언어">
          <button type="button" class="btn sm ${robotLang === "ko" ? "sky" : "ghost"}" data-lang="ko">국문</button>
          <button type="button" class="btn sm ${robotLang === "en" ? "sky" : "ghost"}" data-lang="en">English</button>
        </div>
      </div></section>
      <section class="blk" style="padding-top:0"><div class="wrap"><div class="vid-grid">${cards}</div></div></section>`);
    app.querySelectorAll(".lang [data-lang]").forEach(b => b.addEventListener("click", () => {
      if (robotLang === b.dataset.lang) return;
      const y = window.pageYOffset;
      robotLang = b.dataset.lang;
      viewRobot();
      window.scrollTo(0, y);
    }));
  }

/* dc-lab tab */
  function viewDcLab() {
    shell("DC구축 시뮬레이터", `<div class="dclab-wrap"><iframe class="dclab-frame" src="/dc-lab/?embed=1&amp;lang=${document.documentElement.lang === 'en' ? 'en' : 'ko'}" title="DC구축 시뮬레이터" allow="clipboard-write; fullscreen"></iframe></div>`);
  }

  // ---------- 라우터 ----------
  function route() {
    const [path, qs] = (location.hash.slice(1) || "/").split("?");
    const q = new URLSearchParams(qs || "");
    const seg = path.split("/").filter(Boolean);
    if (!seg.length || seg[0] === "overview") return viewHome();
    if (seg[0] === "products") return viewProducts(q);
    if (seg[0] === "product") return viewProduct(seg[1]);
    if (seg[0] === "configure") {
      if (S && S.model === seg[1] && $("#cfgPanel")) return; // 같은 화면 내 상태 변경
      return viewConfigure(seg[1], q);
    }
    if (seg[0] === "downloads") return viewDownloads(q);
    if (seg[0] === "dc-lab") return viewDcLab();
    if (seg[0] === "robot") { if (q.get("lang")) robotLang = q.get("lang") === "en" ? "en" : "ko"; return viewRobot(); }
    viewHome();
  }
  window.addEventListener("hashchange", route);
  route();
})();
