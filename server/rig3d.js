/* 내 서버 만들기: 3D 조립 미리보기
 * 구성기에서 고른 CPU, 메모리, 드라이브, GPU, NIC, 전원이 섀시 안에 순서대로 조립되는 모습을 실시간으로 그린다.
 * 실제 제품 형상이 아니라 구성 이해를 돕는 개념도다. 모든 형상은 코드로 만든다 (외부 3D 파일 없음).
 * app.js 가 구성이 바뀔 때마다 window 에 "smc3d" 이벤트(detail = 구성 요약)를 보낸다.
 *
 * 구조: layout() 이 구성 요약을 부품 목록(key, 만드는 함수, 자리, 들어오는 방향)으로 바꾸고,
 *       update() 가 이전 목록과 비교해 새 부품은 끼우고 빠진 부품은 뺀다.
 */
import * as THREE from "../globe/three.module.min.js";

const W = 4.4, D = 7.6, UH = 0.44, T = 0.05;          // 섀시 폭, 깊이, 1U 높이, 판 두께 (임의 단위)
const C = {
  steel: 0xb4bccb, steelDark: 0x6a7488, black: 0x15181e, board: 0x0e3b2d, gold: 0xd9b25a, sink: 0xd4d9e2, ihs: 0xb9c0cc,
  plate: 0x1c7fe0, copper: 0xc47a3c, hot: 0xe2503f, cold: 0x2bb5f4, dimm: 0x16233a, dimmLabel: 0xe9eef7, latch: 0xf3f5f8,
  tray: 0x9aa3b3, trayFace: 0x2a303b, ledG: 0x35e08a, ledB: 0x3aa0ff, fan: 0x1d2129, blade: 0x3a4250, hub: 0x9aa3b3,
  gpu: 0x20242c, nv: 0x76b900, nic: 0x0f5a3c, psu: 0x7c8698, cage: 0x2f3643,
};
const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const easeOutBack = t => { const a = 1.5, b = a + 1; return 1 + b * Math.pow(t - 1, 3) + a * Math.pow(t - 1, 2); };
const easeInOut = t => t * t * (3 - 2 * t);

// ---------- 재질, 무늬 ----------
const mats = new Map();
function mat(color, o = {}) {
  const k = color + "|" + (o.metal ?? 0.4) + "|" + (o.rough ?? 0.5) + "|" + (o.emissive ?? 0) + "|" + (o.ei ?? 1);
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, metalness: o.metal ?? 0.4, roughness: o.rough ?? 0.5, emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1 }));
  return mats.get(k);
}
function rng(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }
function canvasTex(size, draw, repeat) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
let texPcb, texVent;
function textures() {
  texPcb = canvasTex(512, (g, s) => {
    g.fillStyle = "#0d3a2c"; g.fillRect(0, 0, s, s);
    const r = rng(7);
    g.lineWidth = 2;
    for (let i = 0; i < 90; i++) {                      // 배선
      g.strokeStyle = `rgba(60,170,120,${0.18 + r() * 0.3})`;
      let x = r() * s, y = r() * s; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 4; k++) { if (r() < 0.5) x += (r() - 0.5) * 180; else y += (r() - 0.5) * 180; g.lineTo(x, y); }
      g.stroke();
    }
    for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.7 ? "rgba(214,178,90,.85)" : "rgba(20,24,30,.9)"; const w = 3 + r() * 9; g.fillRect(r() * s, r() * s, w, 3 + r() * 6); }
  });
  texVent = canvasTex(128, (g, s) => {
    g.fillStyle = "#586176"; g.fillRect(0, 0, s, s);
    g.fillStyle = "#11141a";
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.beginPath(); g.arc(x * 16 + (y % 2 ? 12 : 4), y * 16 + 8, 5, 0, 6.3); g.fill(); }
  }, [10, 3]);
}
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const cyl = (r, h, m, seg = 20) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m);
function at(o, x, y, z) { o.position.set(x, y, z); return o; }

// ---------- 부품 형상 ----------
function mkBoard(len) {
  const side = mat(0x0a2a20, { metal: 0.1, rough: 0.8 });
  const top = new THREE.MeshStandardMaterial({ map: texPcb, metalness: 0.15, roughness: 0.65 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(W - 0.3, 0.05, len), [side, side, top, side, side, side]);
  return m;
}
function mkSocket(cw) {
  const g = new THREE.Group();
  g.add(box(cw + 0.14, 0.035, cw + 0.14, mat(C.black, { metal: 0.2, rough: 0.7 })));
  g.add(at(box(cw + 0.06, 0.02, cw + 0.06, mat(C.gold, { metal: 0.9, rough: 0.35 })), 0, 0.02, 0));
  return g;
}
function mkCpu(cw) {
  const g = new THREE.Group();
  g.add(box(cw * 0.86, 0.05, cw * 0.86, mat(C.ihs, { metal: 0.95, rough: 0.22 })));
  g.add(at(box(cw * 0.6, 0.012, cw * 0.6, mat(0xdde2ea, { metal: 0.95, rough: 0.15 })), 0, 0.03, 0));
  return g;
}
function mkSink(cw, h) {
  const g = new THREE.Group(), m = mat(C.sink, { metal: 0.9, rough: 0.28 });
  g.add(at(box(cw, 0.05, cw, m), 0, 0.025, 0));
  const n = 16;
  for (let i = 0; i < n; i++) g.add(at(box(cw / n * 0.42, h, cw * 0.96, m), -cw / 2 + (cw / n) * (i + 0.5), 0.05 + h / 2, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(at(cyl(0.035, 0.07, mat(C.steelDark, { metal: 0.8 }), 10), sx * cw * 0.42, 0.06, sz * cw * 0.42));
  return g;
}
function mkColdPlate(cw, run) {
  const g = new THREE.Group();
  g.add(at(box(cw * 0.9, 0.04, cw * 0.9, mat(C.copper, { metal: 0.95, rough: 0.25 })), 0, 0.02, 0));
  g.add(at(box(cw * 0.96, 0.12, cw * 0.96, mat(C.plate, { metal: 0.6, rough: 0.3 })), 0, 0.1, 0));
  g.add(at(box(cw * 0.5, 0.02, cw * 0.5, mat(0xffffff, { metal: 0.2, rough: 0.4 })), 0, 0.17, 0));
  [[-1, C.cold], [1, C.hot]].forEach(([sx, col]) => {       // 공급(파랑), 회수(빨강) 호스
    const t = cyl(0.05, run, mat(col, { metal: 0.1, rough: 0.45 }), 12); t.rotation.x = Math.PI / 2;
    g.add(at(t, sx * cw * 0.24, 0.2, -run / 2 - cw * 0.3));
    g.add(at(cyl(0.065, 0.1, mat(C.steel, { metal: 0.9, rough: 0.3 }), 12), sx * cw * 0.24, 0.16, -cw * 0.3));
  });
  return g;
}
function mkManifold(width, h) {
  const g = new THREE.Group();
  g.add(at(box(width, 0.14, 0.16, mat(C.cold, { metal: 0.3, rough: 0.4 })), 0, 0.02, 0.1));
  g.add(at(box(width, 0.14, 0.16, mat(C.hot, { metal: 0.3, rough: 0.4 })), 0, 0.02, -0.1));
  return g;
}
function mkDimmSlot(len) {
  const g = new THREE.Group();
  g.add(box(0.05, 0.03, len, mat(C.black, { metal: 0.1, rough: 0.8 })));
  for (const sz of [-1, 1]) g.add(at(box(0.06, 0.07, 0.05, mat(C.latch, { metal: 0, rough: 0.6 })), 0, 0.03, sz * (len / 2 + 0.02)));
  return g;
}
function mkDimm(len, h) {
  const g = new THREE.Group();
  g.add(at(box(0.022, h, len, mat(C.dimm, { metal: 0.2, rough: 0.55 })), 0, h / 2, 0));
  g.add(at(box(0.026, 0.035, len * 0.96, mat(C.gold, { metal: 0.9, rough: 0.3 })), 0, 0.018, 0));
  const chip = mat(C.black, { metal: 0.3, rough: 0.5 });
  for (let i = 0; i < 6; i++) g.add(at(box(0.034, h * 0.42, len / 8, chip), 0, h * 0.55, -len / 2 + (len / 6) * (i + 0.5)));
  g.add(at(box(0.036, h * 0.16, len * 0.3, mat(C.dimmLabel, { metal: 0, rough: 0.7 })), 0, h * 0.86, 0));
  return g;
}
function mkFan(w, h) {
  const g = new THREE.Group(), r = Math.min(w, h) * 0.42;
  const frame = mat(C.fan, { metal: 0.2, rough: 0.7 });
  for (const sy of [-1, 1]) g.add(at(box(w, h * 0.08, 0.34, frame), 0, sy * h * 0.46, 0));
  for (const sx of [-1, 1]) g.add(at(box(w * 0.08, h, 0.34, frame), sx * w * 0.46, 0, 0));
  const rotor = new THREE.Group();
  const hub = cyl(r * 0.36, 0.2, mat(C.hub, { metal: 0.7, rough: 0.35 }), 18); hub.rotation.x = Math.PI / 2; rotor.add(hub);
  for (let i = 0; i < 7; i++) {
    const b = box(r * 0.8, r * 0.34, 0.03, mat(C.blade, { metal: 0.2, rough: 0.6 }));
    const a = (i / 7) * Math.PI * 2;
    b.position.set(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, 0); b.rotation.set(0.5, 0, a);
    rotor.add(b);
  }
  g.add(rotor); g.userData.spin = rotor;
  return g;
}
function mkCage(cols, rows, bw, bh, bd) {
  const g = new THREE.Group(), m = mat(C.cage, { metal: 0.6, rough: 0.5 });
  const w = cols * bw, h = rows * bh;
  for (let c = 0; c <= cols; c++) g.add(at(box(0.015, h, bd, m), -w / 2 + c * bw, h / 2, 0));
  for (let r = 0; r <= rows; r++) g.add(at(box(w, 0.012, bd, m), 0, r * bh, 0));
  return g;
}
function mkDrive(bw, bh, bd) {
  const g = new THREE.Group();
  g.add(box(bw * 0.84, bh * 0.76, bd * 0.96, mat(C.tray, { metal: 0.75, rough: 0.32 })));
  g.add(at(box(bw * 0.9, bh * 0.84, 0.05, mat(C.trayFace, { metal: 0.3, rough: 0.55 })), 0, 0, bd / 2));
  g.add(at(box(bw * 0.5, bh * 0.12, 0.03, mat(C.steel, { metal: 0.8, rough: 0.3 })), -bw * 0.1, bh * 0.2, bd / 2 + 0.03));
  g.add(at(box(bw * 0.1, bh * 0.12, 0.02, mat(C.ledG, { emissive: C.ledG, ei: 1.6 })), bw * 0.3, -bh * 0.22, bd / 2 + 0.03));
  g.add(at(box(bw * 0.1, bh * 0.12, 0.02, mat(C.ledB, { emissive: C.ledB, ei: 1.2 })), bw * 0.16, -bh * 0.22, bd / 2 + 0.03));
  return g;
}
function mkGpuCard(gw, gh, gl) {
  const g = new THREE.Group();
  g.add(box(gw, gh, gl, mat(C.gpu, { metal: 0.55, rough: 0.4 })));
  g.add(at(box(gw + 0.012, gh * 0.1, gl * 0.94, mat(C.nv, { emissive: C.nv, ei: 0.7, metal: 0.2 })), 0, gh * 0.36, 0));
  g.add(at(box(0.02, gh * 0.92, gl * 0.98, mat(C.steel, { metal: 0.85, rough: 0.3 })), -gw / 2 - 0.012, 0, 0));           // 백플레이트
  g.add(at(box(gw * 1.05, gh, 0.04, mat(C.steel, { metal: 0.9, rough: 0.3 })), 0, 0, -gl / 2 - 0.02));                    // 브래킷
  const n = 5;
  for (let i = 0; i < n; i++) g.add(at(box(0.012, gh * 0.5, gl * 0.12, mat(C.black, { rough: 0.8 })), gw / 2 + 0.005, -gh * 0.08, -gl / 2 + (gl / n) * (i + 0.5)));
  return g;
}
function mkGpuModule(gw, gh, gl) {                                // HGX 계열: 방열 핀이 드러난 GPU 모듈
  const g = new THREE.Group(), fin = mat(C.sink, { metal: 0.9, rough: 0.3 });
  g.add(at(box(gw, gh * 0.18, gl, mat(C.gpu, { metal: 0.5, rough: 0.45 })), 0, -gh * 0.41, 0));
  const n = Math.max(6, Math.round(gw / 0.045));
  for (let i = 0; i < n; i++) g.add(at(box(gw / n * 0.45, gh * 0.74, gl * 0.94, fin), -gw / 2 + (gw / n) * (i + 0.5), 0.02, 0));
  g.add(at(box(gw, gh * 0.08, gl * 0.2, mat(C.nv, { emissive: C.nv, ei: 0.8, metal: 0.2 })), 0, gh * 0.46, gl * 0.34));
  return g;
}
function mkGpuTray(width, len) {
  return box(width, 0.04, len, mat(C.steelDark, { metal: 0.7, rough: 0.45 }));
}
function mkNic(h) {
  const g = new THREE.Group();
  g.add(box(0.03, h, 1.5, mat(C.nic, { metal: 0.15, rough: 0.6 })));
  g.add(at(box(0.16, h, 0.03, mat(C.steel, { metal: 0.9, rough: 0.3 })), 0, 0, -0.765));
  for (const sy of [-1, 1]) g.add(at(box(0.12, h * 0.26, 0.34, mat(C.steel, { metal: 0.85, rough: 0.35 })), 0.05, sy * h * 0.22, -0.6));
  g.add(at(box(0.1, h * 0.3, 0.4, mat(C.black, { rough: 0.5 })), 0.05, 0, 0.2));
  return g;
}
function mkPsu(pw, ph) {
  const g = new THREE.Group();
  g.add(box(pw, ph, 1.6, mat(C.psu, { metal: 0.8, rough: 0.38 })));
  const grill = new THREE.MeshStandardMaterial({ map: texVent, metalness: 0.5, roughness: 0.5 });
  g.add(at(box(pw * 0.94, ph * 0.9, 0.02, grill), 0, 0, -0.81));
  g.add(at(box(pw * 0.34, ph * 0.16, 0.08, mat(C.black, { rough: 0.6 })), pw * 0.2, -ph * 0.2, -0.85));              // 손잡이
  g.add(at(box(0.04, 0.04, 0.02, mat(C.ledG, { emissive: C.ledG, ei: 1.6 })), -pw * 0.34, ph * 0.3, -0.825));
  return g;
}

// ---------- 배치 ----------
function layout(s) {
  const H = Math.max(1, s.u) * UH, items = [];
  const zF = D / 2 - 0.08, zR = -D / 2 + 0.08, y0 = T;
  const put = (group, key, make, pos, from) => items.push({ group, key, make, pos, from });
  // 드라이브 베이 (전면)
  const form = s.driveForm || Object.keys(s.bays || {})[0] || "2.5인치";
  const nBay = (s.bays && s.bays[form]) || 0;
  const rows = Math.max(1, Math.min(Math.ceil(nBay / 12), Math.max(1, Math.floor(Math.min(s.u, 4) * 1.5))));
  const cols = Math.max(1, Math.ceil(nBay / rows));
  const bw = Math.min(0.42, (W - 0.5) / cols), bh = Math.min(0.34, (Math.min(H, 1.4) - 0.1) / rows), bd = 1.3;
  const zBay = zF - bd / 2;
  if (nBay) put("cage", "cage" + cols + "x" + rows, () => mkCage(cols, rows, bw, bh, bd), [0, y0 + 0.02, zBay], [0, 0, 1.6]);
  for (let i = 0; i < Math.min(nBay, s.driveQty || 0); i++) {
    const c = i % cols, r = Math.floor(i / cols);
    put("drive", "drv" + i, () => mkDrive(bw, bh, bd), [-((cols - 1) * bw) / 2 + c * bw, y0 + 0.02 + bh / 2 + r * bh, zBay], [0, 0, 2.2]);
  }
  // 팬
  const zFan = zF - bd - 0.42, nFan = Math.max(3, Math.min(8, Math.round(W / 0.62))), fh = Math.min(H - 0.1, 0.9), fw = W / nFan - 0.05;
  for (let i = 0; i < nFan; i++) put("fan", "fan" + i, () => mkFan(fw, fh), [-W / 2 + (W / nFan) * (i + 0.5), y0 + fh / 2 + 0.01, zFan], [0, 2.4, 0]);
  // 메인보드
  const zB0 = zFan - 0.3, zB1 = zR + 0.1, bl = zB0 - zB1, yB = y0 + 0.05;
  put("board", "board", () => mkBoard(bl), [0, y0 + 0.03, (zB0 + zB1) / 2], [0, 2.6, 0]);
  // CPU, 메모리
  const ns = Math.max(1, s.sockets || 1), zc = zB0 - 1.2, cw = Math.min(0.92, (W - 1.2) / (ns * 1.9));
  const slotsPer = Math.max(2, Math.round((s.dimmSlots || 16) / ns)), side = Math.ceil(slotsPer / 2);
  const dp = Math.min(0.085, (W - 0.5 - ns * (cw + 0.34)) / (ns * side * 2));
  const groupW = cw + side * dp * 2 + 0.3, x0 = -((ns - 1) * groupW) / 2;
  const dLen = 1.45, dH = Math.min(0.32, H - 0.16), sinkH = Math.min(0.6, Math.max(0.16, H - 0.24));
  for (let c = 0; c < ns; c++) {
    const cx = x0 + c * groupW;
    put("socket", "sock" + c, () => mkSocket(cw), [cx, yB + 0.02, zc], [0, 2.2, 0]);
    for (let k = 0; k < slotsPer; k++) {
      const sx = k % 2 === 0 ? -1 : 1, n = Math.floor(k / 2), dx = cx + sx * (cw / 2 + 0.14 + n * dp);
      put("slot", "slot" + c + "_" + k, () => mkDimmSlot(dLen), [dx, yB + 0.015, zc], [0, 2.0, 0]);
    }
    if (s.cpu) {
      put("cpu", "cpu" + c, () => mkCpu(cw), [cx, yB + 0.07, zc], [0, 2.4, 0]);
      if (s.dlc) put("sink", "plate" + c, () => mkColdPlate(cw, Math.max(0.6, zc - zB1 - cw * 0.3 - 0.2)), [cx, yB + 0.095, zc], [0, 2.6, 0]);
      else put("sink", "sink" + c + "_" + Math.round(sinkH * 100), () => mkSink(cw, sinkH), [cx, yB + 0.095, zc], [0, 2.6, 0]);
    }
    const filled = Math.floor((s.memQty || 0) / ns) + (c < (s.memQty || 0) % ns ? 1 : 0);
    for (let k = 0; k < Math.min(filled, slotsPer); k++) {
      const sx = k % 2 === 0 ? -1 : 1, n = Math.floor(k / 2), dx = cx + sx * (cw / 2 + 0.14 + n * dp);
      put("dimm", "dimm" + c + "_" + k, () => mkDimm(dLen, dH), [dx, yB + 0.03, zc], [0, 2.2, 0]);
    }
  }
  if (s.dlc && s.cpu) put("mani", "mani", () => mkManifold(Math.min(W - 0.8, ns * groupW), H), [0, yB + 0.3, zB1 + 0.25], [0, 0, -1.8]);
  // GPU
  const nG = Math.min(s.gpuQty || 0, 10);
  if (nG) {
    const tray = s.gpuFixed || s.u >= 4;
    if (tray) {
      const gw = Math.min(0.46, (W - 0.5) / nG - 0.04), gh = Math.min(1.15, H * 0.44), gl = 3.0, pitch = gw + 0.04;
      const gy = H - gh / 2 - 0.1, gz = zR + gl / 2 + 0.35;
      put("gtray", "gtray", () => mkGpuTray(W - 0.3, gl + 0.2), [0, gy - gh / 2 - 0.03, gz], [0, 0, -3.6]);
      for (let i = 0; i < nG; i++) put("gpu", "gpuT" + i, () => mkGpuModule(gw, gh, gl), [-((nG - 1) * pitch) / 2 + i * pitch, gy, gz], [0, 2.8, 0]);
    } else {
      const gw = s.gpuDw ? 0.36 : 0.18, gh = Math.min(1.0, Math.max(0.3, H - 0.24)), gl = 2.5, pitch = gw + 0.07;
      for (let i = 0; i < nG; i++) put("gpu", "gpuC" + i + (s.gpuDw ? "d" : "s"), () => mkGpuCard(gw, gh, gl), [W / 2 - 0.34 - gw / 2 - i * pitch, yB + 0.04 + gh / 2, zR + gl / 2 + 0.12], [0, 2.8, 0]);
    }
  }
  // NIC, 전원 (후면 왼쪽)
  const nh = Math.min(0.5, H - 0.2);
  for (let i = 0; i < Math.min(s.nic || 0, 4); i++) put("nic", "nic" + i, () => mkNic(nh), [-W / 2 + 0.42 + i * 0.24, yB + 0.04 + nh / 2, zR + 0.72], [0, 2.4, 0]);
  const nP = Math.max(1, Math.min(6, s.psu || 2)), pw = 0.5, ph = Math.min(0.36, H - 0.1);
  const perRow = Math.floor((H - 0.1) / (ph + 0.03)) >= 2 ? Math.ceil(nP / 2) : nP;
  for (let i = 0; i < nP; i++) put("psu", "psu" + i, () => mkPsu(pw, ph), [-W / 2 + 1.6 + (i % perRow) * (pw + 0.05), y0 + ph / 2 + 0.01 + Math.floor(i / perRow) * (ph + 0.03), zR + 0.86], [0, 0, -2.4]);
  return { items, H, zc, zF, zR };
}
const ORDER = ["board", "cage", "fan", "socket", "slot", "cpu", "sink", "mani", "dimm", "drive", "gtray", "gpu", "nic", "psu"];
const STAGGER = { board: 0, cage: 0, fan: 45, socket: 110, slot: 8, cpu: 140, sink: 140, mani: 0, dimm: 38, drive: 48, gtray: 0, gpu: 120, nic: 100, psu: 100 };
const GAP = { board: 260, cage: 120, fan: 160, socket: 120, slot: 140, cpu: 160, sink: 200, mani: 160, dimm: 180, drive: 200, gtray: 220, gpu: 200, nic: 140, psu: 0 };
const VIEW = {                                                     // 단계별 시점 (tz: 바라볼 위치, d: 거리 배율, yaw 가 null 이면 자동 회전)
  model: { tz: "c", d: 1, pitch: 0.62, yaw: null }, review: { tz: "c", d: 1, pitch: 0.62, yaw: null }, svc: { tz: "c", d: 1, pitch: 0.62, yaw: null },
  cpu: { tz: "cpu", d: 0.6, pitch: 0.95, yaw: 0.45 }, mem: { tz: "cpu", d: 0.6, pitch: 0.95, yaw: -0.45 },
  storage: { tz: "front", d: 0.66, pitch: 0.48, yaw: 0.5 }, gpu: { tz: "rear", d: 0.74, pitch: 0.72, yaw: 2.45 },
  net: { tz: "back", tx: -1.5, d: 0.52, pitch: 0.42, yaw: 3.85, low: 0.24 }, power: { tz: "back", tx: -0.3, d: 0.6, pitch: 0.36, yaw: 3.2, low: 0.2 },
};

// ---------- 장면 ----------
let renderer, scene, camera, root, frame, host, capEl, legEl, autoBtn;
let parts = new Map(), leaving = [], spinners = [], curKey = "", lastState = null, geo = null;
// 움직임 설정. PC 에서 "애니메이션 효과"를 꺼 둔 방문자(prefers-reduced-motion)에게는 처음에 정지 상태로 보여 주되,
// 방문자가 "다시 조립"이나 "자동 회전"을 직접 누르면 그때부터는 움직인다 (calm = false). 예전에는 버튼을 눌러도 움직이지 않았다.
let calm = reduce;                 // true 면 조립 동작, 팬 회전, 자동 회전을 하지 않는다
let auto = !reduce;                // 전체 모습을 보는 단계(모델, 보증, 견적 확인)에서 천천히 도는지
let forceOrbit = false;            // 부품을 가까이 보는 단계에서 방문자가 회전을 직접 켰는지 (단계가 바뀌면 꺼진다)
const orbiting = () => !calm && ((auto && goal.orbit) || forceOrbit);
let cam = { yaw: 0.6, pitch: 0.62, dist: 20, tx: 0, ty: 0, tz: 0 }, goal = { ...cam }, userYaw = false, raf = 0, lastT = 0, visible = true;
let obsResize = null, obsView = null;                              // 화면 크기, 보임 여부 감지 (3D 창이 바뀌면 반드시 해제)

function makeEnv() {                                                // 간단한 스튜디오 조명 환경 (금속 반사용)
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x8b93a3);
  const add = (w, h, color, x, y, z, rx, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m); };
  add(30, 30, 0xffffff, 0, 14, 0, Math.PI / 2, 0);
  add(16, 10, 0xdfe8ff, -14, 4, 0, 0, Math.PI / 2);
  add(16, 10, 0xfff1dc, 14, 4, 4, 0, -Math.PI / 2);
  add(40, 40, 0x6a7385, 0, -6, 0, -Math.PI / 2, 0);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.03).texture;
  pm.dispose();
  return tex;
}
function init(el) {
  host = el.querySelector(".v3d-stage"); capEl = el.querySelector(".v3d-cap");
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); }
  catch (e) { el.style.display = "none"; return false; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.22;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  textures();
  scene = new THREE.Scene();
  scene.environment = makeEnv();
  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa3b5, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(7, 12, 9); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -9; key.shadow.camera.right = 9; key.shadow.camera.top = 9; key.shadow.camera.bottom = -9; key.shadow.camera.far = 40;
  key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9cc8ff, 0.7); rim.position.set(-9, 5, -8); scene.add(rim);
  root = new THREE.Group(); scene.add(root);
  frame = new THREE.Group(); root.add(frame);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.2 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.005; floor.receiveShadow = true; root.add(floor);

  // 조작 버튼과 범례
  let ui = el.querySelector(".v3d-ui");
  if (!ui) {
    ui = document.createElement("div"); ui.className = "v3d-ui";
    ui.innerHTML = `<button type="button" data-a="replay">다시 조립</button><button type="button" data-a="auto" aria-pressed="false">자동 회전</button><button type="button" data-a="reset">시점 초기화</button>`;
    host.after(ui);
    legEl = document.createElement("ul"); legEl.className = "v3d-leg"; ui.after(legEl);
  } else legEl = el.querySelector(".v3d-leg");
  autoBtn = ui.querySelector('[data-a="auto"]');
  ui.onclick = e => {
    const a = e.target.dataset.a;
    if (!a) return;
    if (a === "replay" && lastState) { calm = false; curKey = ""; update(lastState); }
    if (a === "auto") {
      if (orbiting()) { if (goal.orbit) auto = false; forceOrbit = false; }       // 도는 중이면 끈다
      else { calm = false; if (goal.orbit) auto = true; else forceOrbit = true; }  // 멈춰 있으면 켠다 (가까이 보는 단계에서도 돈다)
    }
    if (a === "reset") { userYaw = false; forceOrbit = false; if (lastState) aim(lastState.step, true); }   // 시점만 되돌린다. 회전을 켜고 끈 선택은 그대로 둔다
    syncAuto();
    if (!raf) { visible = true; raf = requestAnimationFrame(tick); }
  };
  syncAuto();
  // 드래그 회전, 휠 확대
  const dom = renderer.domElement; let drag = null;
  dom.style.touchAction = "pan-y";
  dom.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY }; userYaw = true; dom.setPointerCapture(e.pointerId); });
  dom.addEventListener("pointermove", e => { if (!drag) return; goal.yaw += -(e.clientX - drag.x) * 0.008; goal.pitch = Math.max(0.12, Math.min(1.35, goal.pitch + (e.clientY - drag.y) * 0.006)); drag = { x: e.clientX, y: e.clientY }; });
  const end = () => { drag = null; };
  dom.addEventListener("pointerup", end); dom.addEventListener("pointercancel", end);
  dom.addEventListener("wheel", e => { if (!e.ctrlKey && !e.shiftKey) return; e.preventDefault(); goal.dist = Math.max(6, Math.min(40, goal.dist * (e.deltaY > 0 ? 1.1 : 0.9))); }, { passive: false });
  const myHost = host;
  obsResize = new ResizeObserver(() => { if (host === myHost) resize(); });
  obsResize.observe(host);
  obsView = new IntersectionObserver(en => {
    if (host !== myHost) return;                                     // 이미 교체된 예전 창의 신호는 무시
    visible = en[en.length - 1].isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(tick);
  });
  obsView.observe(host);
  visible = true;
  resize();
  raf = requestAnimationFrame(tick);
  return true;
}
// "자동 회전" 버튼은 지금 실제로 돌고 있을 때만 켜진 모양으로 보인다
function syncAuto() {
  if (!autoBtn) return;
  const on = orbiting();
  autoBtn.setAttribute("aria-pressed", on ? "true" : "false");
  autoBtn.title = on ? "누르면 회전을 멈춥니다" : calm ? "PC 의 애니메이션 효과가 꺼져 있어 멈춘 상태입니다. 누르면 회전합니다" : goal.orbit ? "누르면 천천히 회전합니다" : "이 단계는 부품이 잘 보이는 고정 시점입니다. 누르면 회전합니다";
}
function resize() {
  if (!renderer) return;
  const w = host.clientWidth || 380, h = host.clientHeight || 420;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
function shadowize(o) { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; }

function buildFrame(H) {
  while (frame.children.length) frame.remove(frame.children[0]);
  const m = mat(C.steel, { metal: 0.55, rough: 0.42 }), dk = mat(C.steelDark, { metal: 0.55, rough: 0.48 });
  frame.add(at(box(W, T, D, m), 0, T / 2, 0));
  for (const sx of [-1, 1]) {
    frame.add(at(box(T, H, D, m), sx * (W / 2 - T / 2), H / 2, 0));
    frame.add(at(box(0.12, 0.03, D, dk), sx * (W / 2 - 0.08), H - 0.015, 0));                   // 윗단 접힘
    frame.add(at(box(0.36, H, 0.06, dk), sx * (W / 2 + 0.18), H / 2, D / 2 - 0.03));              // 랙 귀
    frame.add(at(box(0.05, Math.min(H * 0.6, 0.5), 0.14, mat(C.black, { rough: 0.5 })), sx * (W / 2 + 0.2), H / 2, D / 2 + 0.07));   // 손잡이
    for (const sy of [0.2, 0.8]) { const h = cyl(0.035, 0.07, mat(C.black, { rough: 0.6 }), 10); h.rotation.x = Math.PI / 2; frame.add(at(h, sx * (W / 2 + 0.2), H * sy, D / 2 - 0.02)); }
  }
  for (const y of [0.035, H - 0.035]) frame.add(at(box(W, 0.07, T, dk), 0, y, -D / 2 + T / 2));   // 뒷면은 틀만: 전원, NIC, GPU 브래킷이 뒤에서 보인다
  shadowize(frame);
}

function aim(step, snapYaw) {
  if (!geo) return;
  const v = VIEW[step] || VIEW.model;
  const base = 18.2 + geo.H * 2.2;
  const tall = geo.H > 1.5;                                          // 4U 이상: 위쪽 GPU 트레이에 가리지 않게 낮은 각도로 본다
  goal.tz = v.tz === "cpu" ? geo.zc : v.tz === "front" ? geo.zF - 0.9 : v.tz === "rear" ? geo.zR + 1.6 : v.tz === "back" ? geo.zR + 0.5 : 0;
  goal.ty = v.tz === "back" ? Math.min(geo.H * 0.45, 0.45) : geo.H * 0.45; goal.tx = v.tx || 0;
  goal.dist = base * v.d * (tall && v.tz === "back" ? 0.8 : 1); goal.pitch = tall && v.low ? v.low : v.pitch;
  if (v.yaw !== null && (!userYaw || snapYaw)) {
    let d = (v.yaw - goal.yaw) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
    goal.yaw += d;
  }
  goal.orbit = v.yaw === null;
  if (step !== aim.last) { forceOrbit = false; aim.last = step; }     // 단계가 바뀌면 직접 켠 회전은 끄고 그 단계의 기본 시점으로
  syncAuto();
}

function update(s) {
  if (!renderer) return;
  const prevStep = lastState && lastState.step;
  lastState = s;
  const L = layout(s);
  geo = L;
  const key = s.sku + "|" + s.u;
  const fresh = key !== curKey;
  if (fresh) { curKey = key; buildFrame(L.H); userYaw = false; }
  if (fresh || prevStep !== s.step) { if (prevStep !== s.step) userYaw = false; aim(s.step); }
  if (fresh) { cam.dist = goal.dist * 1.25; cam.ty = goal.ty; cam.tz = 0; }
  const now = performance.now();
  const want = new Map(L.items.map(i => [i.key, i]));
  for (const [k, p] of parts) if (fresh || !want.has(k)) { p.state = "out"; p.t0 = now; p.at = p.obj.position.clone(); parts.delete(k); leaving.push(p); }
  const add = L.items.filter(i => !parts.has(i.key));
  // 처음 조립: 부품 종류 순서대로. 옵션 변경: 바뀐 부품만 차례로.
  let t = fresh ? 250 : 0;
  for (const g of ORDER) {
    const list = add.filter(i => i.group === g);
    list.forEach((it, n) => {
      const obj = shadowize(it.make());
      obj.position.set(it.pos[0] + it.from[0], it.pos[1] + it.from[1], it.pos[2] + it.from[2]); obj.visible = false;
      root.add(obj);
      if (obj.userData.spin) spinners.push(obj.userData.spin);
      parts.set(it.key, { obj, pos: it.pos, from: it.from, t0: now + (calm ? 0 : t + n * (fresh ? STAGGER[g] : Math.max(40, STAGGER[g]))), state: "in", dur: g === "board" ? 560 : 420 });
    });
    if (list.length) t += list.length * (fresh ? STAGGER[g] : Math.max(40, STAGGER[g])) + (fresh ? GAP[g] : 60);
  }
  for (const it of L.items) { const p = parts.get(it.key); if (p && p.state !== "in") { p.pos = it.pos; p.obj.position.set(...it.pos); } else if (p) { p.pos = it.pos; } }
  if (capEl) capEl.textContent = s.caption || "";
  if (legEl) {
    const bays = s.bays ? Object.values(s.bays).reduce((a, b) => a + b, 0) : 0;
    const rowsL = [["#d4d9e2", "CPU", (s.cpu ? s.sockets : 0) + " / " + s.sockets], ["#16233a", "메모리", (s.memQty || 0) + " / " + (s.dimmSlots || 0)],
      ["#9aa3b3", "드라이브", (s.driveQty || 0) + " / " + bays], ["#76b900", "GPU", String(s.gpuQty || 0)], ["#0f5a3c", "NIC", String(s.nic || 0)], ["#7c8698", "전원", String(s.psu || 0)]];
    legEl.innerHTML = rowsL.map(r => `<li><i style="background:${r[0]}"></i><span>${r[1]}</span><b>${r[2]}</b></li>`).join("") + (s.dlc ? `<li class="dlc"><i style="background:#1c7fe0"></i><span>냉각</span><b>DLC 수냉</b></li>` : "");
  }
  if (!raf) { visible = true; raf = requestAnimationFrame(tick); }   // 구성이 바뀌면 항상 다시 그린다
}

function tick(t) {
  raf = 0;
  if (!visible || !renderer) return;
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0); lastT = t;
  const now = performance.now();
  if (orbiting()) goal.yaw += dt * 0.22;
  const k = calm ? 1 : 1 - Math.pow(0.0015, dt);
  for (const n of ["yaw", "pitch", "dist", "tx", "ty", "tz"]) cam[n] += (goal[n] - cam[n]) * k;
  for (const p of parts.values()) {
    if (p.state === "in") {
      const u = (now - p.t0) / p.dur;
      if (u <= 0) continue;
      p.obj.visible = true;
      if (u >= 1 || calm) { p.obj.position.set(...p.pos); p.state = "seat"; p.seat = now; continue; }
      const e = 1 - easeOutBack(u);
      p.obj.position.set(p.pos[0] + p.from[0] * e, p.pos[1] + p.from[1] * e, p.pos[2] + p.from[2] * e);
    } else if (p.state === "seat") {                                // 끼워질 때 살짝 튀는 효과
      const u = (now - p.seat) / 170;
      if (u >= 1) { p.obj.scale.setScalar(1); p.state = "set"; } else p.obj.scale.setScalar(1 + 0.06 * Math.sin(Math.PI * u));
    }
  }
  for (let i = leaving.length - 1; i >= 0; i--) {
    const p = leaving[i], u = (now - p.t0) / 240;
    if (u >= 1 || calm) { root.remove(p.obj); if (p.obj.userData.spin) spinners = spinners.filter(x => x !== p.obj.userData.spin); leaving.splice(i, 1); continue; }
    const e = easeInOut(u);
    p.obj.position.set(p.at.x + p.from[0] * e * 0.8, p.at.y + p.from[1] * e * 0.8, p.at.z + p.from[2] * e * 0.8);
    p.obj.scale.setScalar(1 - 0.4 * e);
  }
  if (!calm) for (const r of spinners) r.rotation.z -= dt * 16;
  const cp = Math.cos(cam.pitch);
  camera.position.set(cam.tx + Math.sin(cam.yaw) * cp * cam.dist, cam.ty + Math.sin(cam.pitch) * cam.dist, cam.tz + Math.cos(cam.yaw) * cp * cam.dist);
  camera.lookAt(cam.tx, cam.ty, cam.tz);
  renderer.render(scene, camera);
  raf = requestAnimationFrame(tick);
}

// ---------- app.js 와 연결: 구성 화면이 열릴 때마다 #cfg3d 가 새로 만들어진다 ----------
let mountedEl = null;
window.addEventListener("smc3d", e => {
  const el = document.getElementById("cfg3d");
  if (!el) return;
  if (el !== mountedEl) {
    if (obsResize) { obsResize.disconnect(); obsResize = null; }
    if (obsView) { obsView.disconnect(); obsView = null; }
    if (renderer) { cancelAnimationFrame(raf); raf = 0; renderer.dispose(); renderer = null; }
    parts = new Map(); leaving = []; spinners = []; curKey = ""; lastState = null; forceOrbit = false; userYaw = false; aim.last = null;   // auto(회전을 켜고 끈 선택)는 다른 모델로 옮겨도 유지한다
    cam = { yaw: 0.6, pitch: 0.62, dist: 20, tx: 0, ty: 0, tz: 0 }; goal = { ...cam, orbit: true };
    mountedEl = el;
    if (!init(el)) return;
  }
  update(e.detail);
});
window.SMC3D_READY = true;
window.dispatchEvent(new Event("smc3d-ready"));
