/* AI KOREA 사업장 지구본.
 * 구 위에 대륙을 점으로 찍고(대륙 데이터: world-atlas land-110m), 사업장에 핀과 본사 기점 연결선을 올린다.
 * 드래그 회전, 자동 회전, 목록 또는 핀 클릭 시 해당 위치로 회전.
 * 사업장 정보는 아래 SITES 만 고치면 된다. 좌표는 도시 기준 근사값.
 */
import * as THREE from "./three.module.min.js";

const SITES = [
  { name: "AI Korea 본사", place: "대한민국 수원", lat: 37.24, lon: 127.03, link: "../main/page__pid-103.html#Facilities01", hq: true },
  { name: "폴란드 법인", place: "Wroclaw", lat: 51.11, lon: 17.03, link: "../main/page__pid-103.html#Facilities02", anchor: "translate(-96%, -118%)" },
  { name: "헝가리 법인", place: "Budapest", lat: 47.5, lon: 19.04, link: "../main/page__pid-103.html#Facilities03", anchor: "translate(4%, -40%)" },
  { name: "미국 법인", place: "Ohio", lat: 40.4, lon: -82.9, link: "../main/page__pid-103.html#Facilities04" },
];

const canvas = document.getElementById("globe");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// 위도, 경도 -> 구면 좌표
const toVec = (lat, lon, r = 1) => {
  const a = ((90 - lat) * Math.PI) / 180, b = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(a) * Math.cos(b), r * Math.cos(a), r * Math.sin(a) * Math.sin(b));
};

// topojson(land) -> 경위도 다각형 목록
function landRings(topo) {
  const { scale, translate } = topo.transform;
  const arcs = topo.arcs.map(arc => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * scale[0] + translate[0], y * scale[1] + translate[1]]; });
  });
  const ring = idxs => {
    const pts = [];
    idxs.forEach(i => {
      const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
      a.forEach((p, k) => { if (k > 0 || !pts.length) pts.push(p); });
    });
    return pts;
  };
  const polys = [];
  topo.objects.land.geometries.forEach(g => {
    if (g.type === "Polygon") polys.push(g.arcs.map(ring));
    else if (g.type === "MultiPolygon") g.arcs.forEach(poly => polys.push(poly.map(ring)));
  });
  return polys;
}

// 대륙 여부를 묻는 함수: 720x360 캔버스에 대륙을 칠해 두고 픽셀로 판정
function landMask(polys, W = 720, H = 360) {
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.fillStyle = "#fff";
  const X = lon => ((lon + 180) / 360) * W, Y = lat => ((90 - lat) / 180) * H;
  polys.forEach(poly => {
    [0, -W, W].forEach(shift => {
      g.beginPath();
      poly.forEach(r => {
        let prev = null, wrap = 0;
        r.forEach(([lon, lat], k) => {
          if (prev !== null && Math.abs(lon - prev) > 180) wrap += lon < prev ? 360 : -360;
          prev = lon;
          const x = X(lon + wrap) + shift, y = Y(lat);
          k ? g.lineTo(x, y) : g.moveTo(x, y);
        });
        g.closePath();
      });
      g.fill("evenodd");
    });
  });
  const d = g.getImageData(0, 0, W, H).data;
  return (lat, lon) => d[(Math.min(H - 1, Math.floor(Y(lat))) * W + Math.min(W - 1, Math.floor(X(lon)))) * 4] > 128;
}

async function start() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    document.documentElement.classList.add("no-gl");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const globe = new THREE.Group();
  scene.add(globe);

  // 바다: 가운데는 진청, 가장자리는 밝은 청 (사이트 포인트 색 #083291 계열)
  globe.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.995, 64, 48),
    new THREE.ShaderMaterial({
      uniforms: { uA: { value: new THREE.Color(0x083291) }, uB: { value: new THREE.Color(0x6fa3e6) } },
      vertexShader: `varying vec3 vN; varying vec3 vV;
        void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 uA; uniform vec3 uB; varying vec3 vN; varying vec3 vV;
        void main(){ float f = pow(1.-max(dot(vN,vV),0.),2.2); gl_FragColor = vec4(mix(uA,uB,f),1.);
          #include <colorspace_fragment>
        }`,
    })
  ));

  // 대륙: 구 위에 고르게 뿌린 점 가운데 육지에 해당하는 것만 남긴다
  const topo = await (await fetch("./land-110m.json")).json();
  const isLand = landMask(landRings(topo));
  const N = 26000, pos = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const lat = (Math.asin(y) * 180) / Math.PI, lon = ((i * 137.50776) % 360) - 180;
    if (isLand(lat, lon)) { const v = toVec(lat, lon, 1); pos.push(v.x, v.y, v.z); }
  }
  const dots = new THREE.BufferGeometry();
  dots.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  globe.add(new THREE.Points(dots, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uSize: { value: 2.6 * renderer.getPixelRatio() }, uC: { value: new THREE.Color(0xe8f1ff) } },
    vertexShader: `uniform float uSize; varying float vF;
      void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vec3 n = normalize(normalMatrix*position);
        vF = clamp(dot(n, normalize(-mv.xyz))*1.6, 0., 1.); gl_PointSize = uSize; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uC; varying float vF;
      void main(){ vec2 p = gl_PointCoord-.5; if(dot(p,p)>.25) discard; gl_FragColor = vec4(uC, 0.30+0.70*vF);
        #include <colorspace_fragment>
      }`,
  })));

  // 핀: 기둥 + 머리 + 퍼지는 고리 (사이트 강조색 #CC2D29)
  const RED = new THREE.Color(0xcc2d29);
  const pinMat = new THREE.MeshBasicMaterial({ color: RED });
  const stemMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const ringGeo = new THREE.RingGeometry(0.03, 0.04, 40);
  const up = new THREE.Vector3(0, 1, 0);
  const pins = SITES.map(s => {
    const n = toVec(s.lat, s.lon, 1).normalize();
    const g = new THREE.Group();
    g.position.copy(n);
    g.quaternion.setFromUnitVectors(up, n);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.1, 8).translate(0, 0.05, 0), stemMat);
    const head = new THREE.Mesh(new THREE.SphereGeometry(s.hq ? 0.026 : 0.02, 16, 12).translate(0, 0.1, 0), pinMat);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: RED, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.003;
    g.add(stem, head, ring);
    globe.add(g);
    return { n, ring, g, tip: n.clone().multiplyScalar(1.12) };
  });

  // 본사에서 각 법인으로 가는 연결선
  const hq = toVec(SITES[0].lat, SITES[0].lon, 1);
  const arcMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });
  const arcs = SITES.map((s, i) => {
    if (i === 0) return null;
    const to = toVec(s.lat, s.lon, 1);
    const mid = hq.clone().add(to).multiplyScalar(0.5).normalize().multiplyScalar(1 + hq.distanceTo(to) * 0.32);
    const geo = new THREE.BufferGeometry().setFromPoints(new THREE.QuadraticBezierCurve3(hq, mid, to).getPoints(72));
    geo.setDrawRange(0, 0);
    const line = new THREE.Line(geo, arcMat);
    globe.add(line);
    return line;
  });

  // ---------- 화면 요소: 이름표, 목록 ----------
  const tagBox = document.getElementById("tags"), list = document.getElementById("sites"), more = document.getElementById("more");
  const tags = SITES.map((s, i) => {
    const el = document.createElement("div");
    el.className = "tag";
    el.innerHTML = `${s.name}<small>${s.place}</small>`;
    el.addEventListener("click", () => select(i, true));
    tagBox.appendChild(el);
    const li = document.createElement("li");
    li.innerHTML = `<button type="button"><b>${s.name}</b><span>${s.place}</span></button>`;
    li.firstChild.addEventListener("click", () => select(i, true));
    list.appendChild(li);
    return { el, li };
  });

  let cur = 0, idleUntil = 0;
  let yaw = 0, pitch = 0, tYaw = 0, tPitch = 0;
  const TILT = 0.3, PITCH_MAX = 0.75;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const near = (a, ref) => ref + Math.atan2(Math.sin(a - ref), Math.cos(a - ref)); // ref에 가장 가까운 같은 각
  const euler = new THREE.Euler(0, 0, 0, "XYZ");
  const apply = () => { euler.set(pitch, yaw, 0); globe.quaternion.setFromEuler(euler); };
  function select(i, byUser) {
    cur = i;
    const n = pins[i].n;
    tYaw = near(-Math.atan2(n.x, n.z), yaw);
    tPitch = clamp(Math.asin(n.y) - TILT, -PITCH_MAX, PITCH_MAX);
    tags.forEach((t, k) => { t.el.classList.toggle("on", k === i); t.li.classList.toggle("on", k === i); });
    more.href = SITES[i].link;
    more.textContent = SITES[i].name + " 시설 보기";
    if (byUser) idleUntil = performance.now() + 9000;
  }

  // ---------- 조작 ----------
  let drag = null;
  canvas.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); idleUntil = Infinity; });
  canvas.addEventListener("pointermove", e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag = { x: e.clientX, y: e.clientY };
    yaw += dx * 0.006;
    pitch = clamp(pitch + dy * 0.006, -PITCH_MAX, PITCH_MAX);
    tYaw = yaw; tPitch = pitch;
    apply();
  });
  const end = () => { if (drag) { drag = null; idleUntil = performance.now() + 5000; } };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    const fit = 1.2 / Math.tan((15 * Math.PI) / 180);
    camera.position.set(0, 0, Math.max(fit, fit / Math.min(1, camera.aspect)) * 1.12);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  select(0, false);
  yaw = tYaw; pitch = tPitch;
  apply();

  const v = new THREE.Vector3(), w = new THREE.Vector3();
  let last = 0, pulse = 0, nextPick = 0;
  let simulating = false;
  function tick(now) {
    if (!simulating) requestAnimationFrame(tick);
    const dt = Math.max(0, Math.min(0.05, (now - (last || now)) / 1000));
    last = now;
    if (!drag && now > idleUntil) {
      // 쉬는 동안 천천히 자전하고, 정면에 가장 가까운 사업장을 선택 표시
      yaw += dt * (reduce ? 0.04 : 0.14);
      pitch += (0.25 - pitch) * 0.02;
      tYaw = yaw; tPitch = pitch;
      apply();
      if (now > nextPick) {
        let best = -2, bi = cur;
        pins.forEach((p, i) => { const z = v.copy(p.n).applyQuaternion(globe.quaternion).z; if (z > best) { best = z; bi = i; } });
        if (bi !== cur) { select(bi, false); tYaw = yaw; tPitch = pitch; }
        nextPick = now + 500;
      }
    } else if (!drag) {
      const k = reduce ? 1 : 0.07;
      yaw += (tYaw - yaw) * k;
      pitch += (tPitch - pitch) * k;
      apply();
    }

    pulse = (pulse + dt * 0.9) % 1;
    pins.forEach((p, i) => {
      p.ring.scale.setScalar(i === cur ? 1 + pulse * 3 : 1);
      p.ring.material.opacity = i === cur ? 1 - pulse : 0.55;
    });
    arcs.forEach((line, i) => {
      if (!line) return;
      const total = line.geometry.attributes.position.count, shown = line.geometry.drawRange.count;
      const want = cur === 0 || cur === i ? total : 0; // 본사 선택 시 전체, 법인 선택 시 해당 선만
      if (shown !== want) line.geometry.setDrawRange(0, shown < want ? Math.min(want, shown + 3) : Math.max(0, shown - 5));
    });

    renderer.render(scene, camera);

    // 이름표를 핀 끝에 붙인다. 지구 뒤편으로 넘어간 것은 숨긴다
    const r = canvas.getBoundingClientRect();
    pins.forEach((p, i) => {
      const facing = v.copy(p.n).applyQuaternion(globe.quaternion).z;
      w.copy(p.tip).applyQuaternion(globe.quaternion).project(camera);
      const el = tags[i].el;
      const shown = facing > 0.1; // 가장자리 너머로 넘어가는 핀과 이름표는 함께 숨긴다
      p.g.visible = shown;
      el.style.opacity = shown ? 1 : 0;
      el.style.pointerEvents = shown ? "auto" : "none";
      el.style.zIndex = i === cur ? 3 : 1;
      el.style.transform = `translate(${(w.x * 0.5 + 0.5) * r.width}px, ${(-w.y * 0.5 + 0.5) * r.height}px) ${SITES[i].anchor || "translate(-50%, -112%)"}`;
    });
  }
  // 검수용: 주소에 ?sim=초 를 붙이면 그 시간만큼 미리 진행한 상태로 시작한다
  const sim = +(new URLSearchParams(location.search).get("sim") || 0);
  if (sim > 0) {
    simulating = true;
    for (let t = 0; t < sim; t += 1 / 30) tick(1 + t * 1000);
    simulating = false;
    last = 0;
    idleUntil = Infinity;
  }
  requestAnimationFrame(tick);
}

start().catch(e => { console.error(e); document.documentElement.classList.add("no-gl"); });
