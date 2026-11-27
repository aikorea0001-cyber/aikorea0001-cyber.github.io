/* 서버 구성기 데이터. 이 파일에는 가격을 싣지 않는다. tools/integrate_server.py 가 생성 */
window.CATALOG = {
  meta: {
    updated: "2026-11-10",
    partner_label: "Supermicro 국내 총판(Distributor)",
    quote_email: "jacob.song@aik.co.kr",                     // 운영 시 영업 공용 메일로 교체
    price_basis: "",
    price_band: 0.15,          // 예상가 표시 범위 ±15%
    assembly_weeks: 1,         // 조립, 검수
    lead_buffer_weeks: 2,      // 납기 범위 상단 여유
    psu_headroom: 1.2,         // PSU 여유율
    air_limit_kw_per_rack: 20, // 공랭 랙 한계 가정
    disclaimer: "전력은 참고용 예상치입니다. 가격과 납기는 견적서로 안내드립니다.",
  },

  families: [
    { id: "gpu", name: "GPU / AI 서버", desc: "NVIDIA HGX 8-GPU, PCIe GPU 기반 학습, 추론 서버" },
    { id: "hyper", name: "Hyper 랙마운트", desc: "고성능 범용 1U/2U. 가상화, DB, 추론" },
    { id: "clouddc", name: "CloudDC", desc: "클라우드, 웹, 범용 워크로드용 고효율 1U" },
    { id: "storage", name: "Petascale 스토리지", desc: "All-NVMe 고밀도 스토리지. AI 데이터 레이크" },
  ],

  use_cases: [
    { id: "train", name: "AI 학습 (LLM, 파운데이션 모델)", desc: "HGX B200/B300 8-GPU. 고밀도로 DLC 냉각 연계 권장" },
    { id: "infer", name: "AI 추론, 파인튜닝", desc: "PCIe GPU 2~4장, 전력 대비 효율 중심" },
    { id: "virt", name: "가상화, DB, 엔터프라이즈", desc: "듀얼 Xeon 6, 대용량 메모리" },
    { id: "cloud", name: "웹, 클라우드, 범용", desc: "랙 밀도, 전력 효율 중심 1U" },
    { id: "storage", name: "AI 스토리지, 데이터 레이크", desc: "E3.S NVMe 24베이, 고대역 네트워크" },
    { id: "hpc", name: "HPC, 시뮬레이션", desc: "고코어 CPU와 고속 인터커넥트" },
  ],

  models: [
    {
      id: "sys-122h-tn", family: "hyper", sku: "SYS-122H-TN", name: "Hyper 1U 듀얼 Xeon 6",
      summary: "1U에 Xeon 6 듀얼소켓, DIMM 32개. 가상화, DB용 범용 고성능 서버",
      u: 1, cpu_vendor: "Intel", sockets: 2, dimm_slots: 32, mem_channels: 8,
      bays: { "2.5인치": 8 }, gpu_max: 0, dlc: false, onboard_nic: "1GbE 관리 포트(BMC)",
      use_cases: ["virt", "cloud", "hpc"], base_price: 0, base_watts: 150, lead_weeks: [4, 6], price_mode: "on_request",
      url: "https://www.supermicro.com/en/products/system/hyper/1u/sys-122h-tn",
      specs: { "폼팩터": "1U 랙마운트", "CPU": "Intel Xeon 6700/6500 (P-core) x2", "메모리": "DIMM 32슬롯, 최대 8TB(2DPC)", "드라이브": "2.5인치 NVMe/SAS/SATA 8베이(옵션 12), M.2 2", "확장": "PCIe 5.0 x16 3, AIOM 1", "전원": "1200W 이중화 Titanium(옵션 상향, 확인 필요)" },
      opts: { cpu: ["cpu-x6-16", "cpu-x6-32", "cpu-x6-48", "cpu-x6-64"], mem: ["mem-32", "mem-64", "mem-96", "mem-128"], boot: ["boot-m2-480", "boot-m2-960"], drive: ["drv-u2-384", "drv-u2-768", "drv-u2-1536", "drv-sas-384"], raid: ["raid-none", "raid-hw", "raid-hba"], gpu: [], nic: ["nic-25-2", "nic-100-2", "nic-400-1"], psu: ["psu-1200", "psu-1600", "psu-2000"], cooling: ["cool-air", "cool-dlc"], warranty: ["war-3y", "war-5y", "war-5y-on"], svc: ["svc-rack", "svc-os", "svc-burn"] },
      defaults: { cpu: "cpu-x6-32", mem: "mem-64", mem_qty: 16, boot: "boot-m2-480", nic: ["nic-25-2"] },
    },
    {
      id: "sys-222h-tn", family: "hyper", sku: "SYS-222H-TN", name: "Hyper 2U 듀얼 Xeon 6, GPU 4장",
      summary: "2U에 더블와이드 GPU 최대 4장. 추론, 파인튜닝, VDI에 적합",
      u: 2, cpu_vendor: "Intel", sockets: 2, dimm_slots: 32, mem_channels: 8,
      bays: { "2.5인치": 8 }, gpu_max: 8, gpu_dw_max: 4, dlc: false, onboard_nic: "1GbE 관리 포트(BMC)",
      use_cases: ["infer", "virt", "hpc"], base_price: 0, base_watts: 200, lead_weeks: [4, 6], price_mode: "on_request",
      url: "https://www.supermicro.com/en/products/system/hyper/2u/sys-222h-tn",
      specs: { "폼팩터": "2U 랙마운트", "CPU": "Intel Xeon 6700/6500 x2", "메모리": "DIMM 32슬롯, 최대 8TB(2DPC)", "드라이브": "2.5인치 8베이 기본(16/24 옵션), M.2 2", "GPU": "더블와이드 4 또는 싱글와이드 8", "전원": "1200W 이중화 기본(상향 옵션, 확인 필요)" },
      opts: { cpu: ["cpu-x6-16", "cpu-x6-32", "cpu-x6-48", "cpu-x6-64"], mem: ["mem-32", "mem-64", "mem-96", "mem-128"], boot: ["boot-m2-480", "boot-m2-960"], drive: ["drv-u2-384", "drv-u2-768", "drv-u2-1536", "drv-sas-384"], raid: ["raid-none", "raid-hw", "raid-hba"], gpu: ["gpu-l4", "gpu-l40s", "gpu-rtxpro6000", "gpu-h200nvl"], nic: ["nic-25-2", "nic-100-2", "nic-400-1"], psu: ["psu-1200", "psu-2000", "psu-2600", "psu-2600x4"], cooling: ["cool-air"], warranty: ["war-3y", "war-5y", "war-5y-on"], svc: ["svc-rack", "svc-os", "svc-burn"] },
      defaults: { cpu: "cpu-x6-32", mem: "mem-64", mem_qty: 16, boot: "boot-m2-480", gpu: "gpu-l40s", gpu_qty: 2, nic: ["nic-100-2"] },
    },
    {
      id: "sys-121c-tn2r", family: "clouddc", sku: "SYS-121C-TN2R", name: "CloudDC 1U 듀얼소켓",
      summary: "전력 효율 중심 1U. 웹, 클라우드 인프라, 범용 서버 대량 도입용",
      u: 1, cpu_vendor: "Intel", sockets: 2, dimm_slots: 16, mem_channels: 8,
      bays: { "2.5인치": 8 }, gpu_max: 0, dlc: false, onboard_nic: "AIOM 슬롯 2(NIC 별도)",
      use_cases: ["cloud", "virt"], base_price: 0, base_watts: 120, lead_weeks: [4, 6], price_mode: "on_request",
      url: "https://www.supermicro.com/en/products/system/clouddc/1u/sys-121c-tn2r",
      specs: { "폼팩터": "1U 랙마운트", "CPU": "Intel Xeon Scalable x2 (세대 확인 필요)", "메모리": "DIMM 16슬롯, DDR5-5600 최대 4TB", "드라이브": "2.5인치 8베이(NVMe 2 하이브리드)", "확장": "PCIe 5.0 x16 2, AIOM 2", "전원": "860W 이중화 Titanium" },
      opts: { cpu: ["cpu-xs-16", "cpu-xs-32"], mem: ["mem5600-32", "mem5600-64"], boot: ["boot-m2-480", "boot-m2-960"], drive: ["drv-u2-384", "drv-u2-768", "drv-sas-384"], raid: ["raid-none", "raid-hw", "raid-hba"], gpu: [], nic: ["nic-25-2", "nic-100-2"], psu: ["psu-860"], cooling: ["cool-air"], warranty: ["war-3y", "war-5y", "war-5y-on"], svc: ["svc-rack", "svc-os", "svc-burn"] },
      defaults: { cpu: "cpu-xs-16", mem: "mem5600-32", mem_qty: 8, boot: "boot-m2-480", nic: ["nic-25-2"] },
    },
    {
      id: "ssg-222b-ne3x24r", family: "storage", sku: "SSG-222B-NE3X24R", name: "Petascale 2U E3.S 24베이",
      summary: "2U All-NVMe 24베이. AI 학습 데이터, 병렬 파일시스템 노드",
      u: 2, cpu_vendor: "Intel", sockets: 2, dimm_slots: 32, mem_channels: 8,
      bays: { "E3.S": 24 }, gpu_max: 2, gpu_dw_max: 2, dlc: false, onboard_nic: "1GbE 관리 포트(BMC)",
      use_cases: ["storage", "train"], base_price: 0, base_watts: 250, lead_weeks: [5, 8], price_mode: "on_request",
      url: "https://www.supermicro.com/en/products/system/storage/2u/ssg-222b-ne3x24r",
      specs: { "폼팩터": "2U 스토리지", "CPU": "Intel Xeon 6 6700 x2 (공랭 350W까지)", "메모리": "DIMM 32슬롯, 최대 8TB(2DPC)", "드라이브": "E3.S NVMe 24베이", "GPU": "더블와이드 최대 2", "전원": "2000W 이중화 Titanium" },
      opts: { cpu: ["cpu-x6-16", "cpu-x6-32", "cpu-x6-48"], mem: ["mem-32", "mem-64", "mem-96"], boot: ["boot-m2-480", "boot-m2-960"], drive: ["drv-e3-768", "drv-e3-1536", "drv-e3-3072"], raid: ["raid-none"], gpu: ["gpu-l4", "gpu-l40s"], nic: ["nic-100-2", "nic-400-1", "nic-400-2"], psu: ["psu-2000"], cooling: ["cool-air"], warranty: ["war-3y", "war-5y", "war-5y-on"], svc: ["svc-rack", "svc-os", "svc-burn"] },
      defaults: { cpu: "cpu-x6-32", mem: "mem-64", mem_qty: 16, boot: "boot-m2-480", drive: "drv-e3-1536", drive_qty: 12, nic: ["nic-400-1"] },
    },
    {
      id: "sys-822gs-nb3rt", family: "gpu", sku: "SYS-822GS-NB3RT", name: "HGX B300 8-GPU 공랭 8U",
      summary: "NVIDIA HGX B300 8-GPU(288GB) 공랭형. 기존 공랭 데이터센터에 대형 학습 서버 도입",
      u: 8, cpu_vendor: "Intel", sockets: 2, dimm_slots: 32, mem_channels: 8,
      bays: { "E1.S": 8 }, gpu_max: 8, gpu_fixed: true, gpu_fixed_label: "HGX B300 8-GPU", dlc: false, onboard_nic: "1GbE 관리 포트(BMC)",
      use_cases: ["train", "hpc"], base_price: 0, base_watts: 12500, lead_weeks: [10, 16], price_mode: "on_request",
      url: "https://www.supermicro.com/en/products/system/gpu/8u/sys-822gs-nb3rt",
      specs: { "폼팩터": "8U", "CPU": "Intel Xeon 6700 (P-core) x2, 350W까지", "메모리": "DIMM 32슬롯, 최대 8TB(2DPC)", "GPU": "NVIDIA HGX B300 8-GPU (288GB, SXM)", "드라이브": "E1.S NVMe 8베이, M.2 2", "전원": "6600W x6 (3+3) Titanium", "냉각": "공랭" },
      opts: { cpu: ["cpu-x6-32", "cpu-x6-48", "cpu-x6-64"], mem: ["mem-64", "mem-96", "mem-128"], boot: ["boot-m2-960"], drive: ["drv-e1-384", "drv-e1-768", "drv-e1-1536"], raid: ["raid-none"], gpu: [], nic: ["nic-400-1", "nic-400-2", "nic-cx8-8"], psu: ["psu-hgx-air"], cooling: ["cool-air"], warranty: ["war-3y", "war-5y", "war-5y-on"], svc: ["svc-rack", "svc-os", "svc-burn", "svc-dlc"] },
      defaults: { cpu: "cpu-x6-48", mem: "mem-96", mem_qty: 32, boot: "boot-m2-960", drive: "drv-e1-768", drive_qty: 8, nic: ["nic-cx8-8", "nic-400-2"], svc: ["svc-rack", "svc-burn"] },
    },
    {
      id: "sys-422gs-nb3rt-lcc", family: "gpu", sku: "SYS-422GS-NB3RT-LCC", name: "HGX B300 8-GPU 수냉(DLC) 4U",
      summary: "Direct-to-chip 수냉형. 8U 공랭 대비 절반 높이로 랙 밀도 2배. AIK CDU, 배관 설계와 패키지 제안",
      u: 4, cpu_vendor: "Intel", sockets: 2, dimm_slots: 32, mem_channels: 8,
      bays: { "E1.S": 8 }, gpu_max: 8, gpu_fixed: true, gpu_fixed_label: "HGX B300 8-GPU", dlc: true, needs_dlc: true, onboard_nic: "1GbE 관리 포트(BMC)",
      use_cases: ["train", "hpc"], base_price: 0, base_watts: 9500, lead_weeks: [12, 20], price_mode: "on_request",
      url: "https://www.supermicro.com/en/products/system/gpu/4u/sys-422gs-nb3rt-lcc",
      specs: { "폼팩터": "4U", "CPU": "Intel Xeon 6700 (P-core) x2", "메모리": "DIMM 32슬롯, 최대 4TB(1DPC)", "GPU": "NVIDIA HGX B300 8-GPU (288GB, SXM)", "전원": "6600W x4 (2+2) Titanium", "냉각": "DLC(Cold Plate), 랙 단위 CDU 연계 필수" },
      opts: { cpu: ["cpu-x6-32", "cpu-x6-48", "cpu-x6-64"], mem: ["mem-64", "mem-96", "mem-128"], boot: ["boot-m2-960"], drive: ["drv-e1-384", "drv-e1-768", "drv-e1-1536"], raid: ["raid-none"], gpu: [], nic: ["nic-400-1", "nic-400-2", "nic-cx8-8"], psu: ["psu-hgx-dlc"], cooling: ["cool-dlc"], warranty: ["war-3y", "war-5y", "war-5y-on"], svc: ["svc-rack", "svc-os", "svc-burn", "svc-dlc"] },
      defaults: { cpu: "cpu-x6-48", mem: "mem-96", mem_qty: 32, boot: "boot-m2-960", drive: "drv-e1-768", drive_qty: 8, nic: ["nic-cx8-8", "nic-400-2"], cooling: "cool-dlc", svc: ["svc-rack", "svc-burn", "svc-dlc"] },
    },
    {
      id: "sys-a22ga-nbrt", family: "gpu", sku: "SYS-A22GA-NBRT", name: "HGX B200 8-GPU 공랭 10U, Xeon 6900",
      summary: "Xeon 6900 고코어 CPU와 HGX B200 8-GPU 조합. 학습과 전처리를 한 노드에서",
      u: 10, cpu_vendor: "Intel", sockets: 2, dimm_slots: 24, mem_channels: 12,
      bays: { "2.5인치": 10 }, gpu_max: 8, gpu_fixed: true, gpu_fixed_label: "HGX B200 8-GPU", dlc: false, onboard_nic: "1GbE 관리 포트(BMC)",
      use_cases: ["train", "hpc"], base_price: 0, base_watts: 11000, lead_weeks: [10, 16], price_mode: "on_request",
      url: "https://www.supermicro.com/en/products/system/gpu/10u/sys-a22ga-nbrt",
      specs: { "폼팩터": "10U", "CPU": "Intel Xeon 6900 (P-core) x2, 500W까지", "메모리": "DIMM 24슬롯, 최대 6TB DDR5-6400 (MRDIMM 8800)", "GPU": "NVIDIA HGX B200 8-GPU (180GB)", "드라이브": "2.5인치 U.2 NVMe 10베이, M.2 2", "전원": "5250W x6 (3+3) Titanium" },
      opts: { cpu: ["cpu-x69-96", "cpu-x69-128"], mem: ["mem-64", "mem-96", "mem-128"], boot: ["boot-m2-960"], drive: ["drv-u2-384", "drv-u2-768", "drv-u2-1536"], raid: ["raid-none"], gpu: [], nic: ["nic-400-1", "nic-400-2"], psu: ["psu-hgx-a22"], cooling: ["cool-air"], warranty: ["war-3y", "war-5y", "war-5y-on"], svc: ["svc-rack", "svc-os", "svc-burn", "svc-dlc"] },
      defaults: { cpu: "cpu-x69-96", mem: "mem-96", mem_qty: 24, boot: "boot-m2-960", drive: "drv-u2-768", drive_qty: 4, nic: ["nic-400-2"] },
    },
  ],

  
  items: [

    { id: "cpu-x6-16", group: "cpu", name: "Intel Xeon 6 (P-core) 16코어급", desc: "6500P 계열, 범용, 라이선스 비용 절감", price: 0, lead: 3, watts: 150 },
    { id: "cpu-x6-32", group: "cpu", name: "Intel Xeon 6 (P-core) 32코어급", desc: "6700P 계열, 가상화, DB 표준", price: 0, lead: 3, watts: 250 },
    { id: "cpu-x6-48", group: "cpu", name: "Intel Xeon 6 (P-core) 48코어급", desc: "6700P 계열, GPU 서버 호스트 권장", price: 0, lead: 4, watts: 300 },
    { id: "cpu-x6-64", group: "cpu", name: "Intel Xeon 6 (P-core) 64코어급", desc: "6700P 계열 상위, HPC", price: 0, lead: 4, watts: 350 },
    { id: "cpu-x69-96", group: "cpu", name: "Intel Xeon 6900 (P-core) 96코어급", desc: "12채널 메모리, 고대역 전처리", price: 0, lead: 5, watts: 400 },
    { id: "cpu-x69-128", group: "cpu", name: "Intel Xeon 6900 (P-core) 128코어급", desc: "최상위 코어 수", price: 0, lead: 6, watts: 500 },
    { id: "cpu-xs-16", group: "cpu", name: "Intel Xeon Scalable 16코어급", desc: "CloudDC 표준", price: 0, lead: 2, watts: 185 },
    { id: "cpu-xs-32", group: "cpu", name: "Intel Xeon Scalable 32코어급", desc: "고밀도 VM", price: 0, lead: 3, watts: 250 },

    { id: "mem-32", group: "mem", name: "DDR5-6400 RDIMM 32GB", desc: "ECC Registered", price: 0, lead: 4, watts: 5, gb: 32 },
    { id: "mem-64", group: "mem", name: "DDR5-6400 RDIMM 64GB", desc: "ECC Registered, 가장 많이 선택", price: 0, lead: 4, watts: 6, gb: 64 },
    { id: "mem-96", group: "mem", name: "DDR5-6400 RDIMM 96GB", desc: "ECC Registered", price: 0, lead: 5, watts: 7, gb: 96 },
    { id: "mem-128", group: "mem", name: "DDR5-6400 RDIMM 128GB", desc: "ECC Registered, 대용량", price: 0, lead: 6, watts: 8, gb: 128 },
    { id: "mem5600-32", group: "mem", name: "DDR5-5600 RDIMM 32GB", desc: "ECC Registered", price: 0, lead: 3, watts: 5, gb: 32 },
    { id: "mem5600-64", group: "mem", name: "DDR5-5600 RDIMM 64GB", desc: "ECC Registered", price: 0, lead: 4, watts: 6, gb: 64 },
    // 부팅
    { id: "boot-m2-480", group: "boot", name: "M.2 NVMe 480GB x2 (미러)", desc: "OS 부팅용", price: 0, lead: 2, watts: 8 },
    { id: "boot-m2-960", group: "boot", name: "M.2 NVMe 960GB x2 (미러)", desc: "OS 부팅용, 로그 여유", price: 0, lead: 2, watts: 8 },

    { id: "drv-u2-384", group: "drive", name: "U.2 NVMe SSD 3.84TB", desc: "2.5인치, 데이터센터급", form: "2.5인치", iface: "NVMe", price: 0, lead: 3, watts: 12, min_qty: 2 },
    { id: "drv-u2-768", group: "drive", name: "U.2 NVMe SSD 7.68TB", desc: "2.5인치, 데이터센터급", form: "2.5인치", iface: "NVMe", price: 0, lead: 4, watts: 14, min_qty: 2 },
    { id: "drv-u2-1536", group: "drive", name: "U.2 NVMe SSD 15.36TB", desc: "2.5인치, 대용량", form: "2.5인치", iface: "NVMe", price: 0, lead: 5, watts: 16, min_qty: 2 },
    { id: "drv-sas-384", group: "drive", name: "SAS SSD 3.84TB", desc: "2.5인치, RAID 컨트롤러 필요", form: "2.5인치", iface: "SAS", price: 0, lead: 4, watts: 9, min_qty: 2 },
    { id: "drv-e3-768", group: "drive", name: "E3.S NVMe SSD 7.68TB", desc: "EDSFF", form: "E3.S", iface: "NVMe", price: 0, lead: 4, watts: 20, min_qty: 4 },
    { id: "drv-e3-1536", group: "drive", name: "E3.S NVMe SSD 15.36TB", desc: "EDSFF", form: "E3.S", iface: "NVMe", price: 0, lead: 5, watts: 22, min_qty: 4 },
    { id: "drv-e3-3072", group: "drive", name: "E3.S NVMe SSD 30.72TB", desc: "EDSFF, 고밀도", form: "E3.S", iface: "NVMe", price: 0, lead: 6, watts: 25, min_qty: 4 },
    { id: "drv-e1-384", group: "drive", name: "E1.S NVMe SSD 3.84TB", desc: "EDSFF", form: "E1.S", iface: "NVMe", price: 0, lead: 4, watts: 12, min_qty: 2 },
    { id: "drv-e1-768", group: "drive", name: "E1.S NVMe SSD 7.68TB", desc: "EDSFF", form: "E1.S", iface: "NVMe", price: 0, lead: 4, watts: 14, min_qty: 2 },
    { id: "drv-e1-1536", group: "drive", name: "E1.S NVMe SSD 15.36TB", desc: "EDSFF", form: "E1.S", iface: "NVMe", price: 0, lead: 5, watts: 16, min_qty: 2 },
    // RAID
    { id: "raid-none", group: "raid", name: "없음 (온보드 NVMe 직결)", desc: "NVMe 드라이브는 컨트롤러 불필요", price: 0, lead: 0, watts: 0 },
    { id: "raid-hw", group: "raid", name: "하드웨어 RAID 컨트롤러", desc: "SAS/SATA/NVMe 트라이모드, 캐시 보호", price: 0, lead: 3, watts: 20 },
    { id: "raid-hba", group: "raid", name: "HBA 컨트롤러", desc: "소프트웨어 RAID, ZFS용", price: 0, lead: 3, watts: 12 },

    { id: "gpu-l4", group: "gpu", name: "NVIDIA L4 24GB", desc: "싱글와이드, 72W, 영상, 경량 추론", price: 0, lead: 6, watts: 72 },
    { id: "gpu-l40s", group: "gpu", name: "NVIDIA L40S 48GB", desc: "더블와이드, 350W, 추론, 그래픽", price: 0, lead: 8, watts: 350, dw: true },
    { id: "gpu-rtxpro6000", group: "gpu", name: "NVIDIA RTX PRO 6000 Blackwell Server Edition 96GB", desc: "더블와이드, 600W", price: 0, lead: 10, watts: 600, dw: true },
    { id: "gpu-h200nvl", group: "gpu", name: "NVIDIA H200 NVL 141GB", desc: "더블와이드, 600W, LLM 추론", price: 0, lead: 12, watts: 600, dw: true },
    // NIC
    { id: "nic-25-2", group: "nic", name: "25GbE 2포트 (AIOM/OCP)", desc: "SFP28", price: 0, lead: 2, watts: 15 },
    { id: "nic-100-2", group: "nic", name: "100GbE 2포트", desc: "QSFP56", price: 0, lead: 3, watts: 20 },
    { id: "nic-400-1", group: "nic", name: "400Gb/s 1포트 (ConnectX-7)", desc: "InfiniBand/Ethernet", price: 0, lead: 6, watts: 25 },
    { id: "nic-400-2", group: "nic", name: "400Gb/s 2포트 (BlueField-3 DPU급)", desc: "스토리지, 프론트엔드 네트워크", price: 0, lead: 8, watts: 75 },
    { id: "nic-cx8-8", group: "nic", name: "GPU 백엔드 800Gb/s x8 (ConnectX-8 SuperNIC)", desc: "GPU 간 East-West 패브릭, 학습 클러스터 필수", price: 0, lead: 10, watts: 240 },
    // PSU (capacity = 이중화 기준 사용 가능 용량)
    { id: "psu-860", group: "psu", name: "860W 이중화 (1+1) Titanium", desc: "", capacity: 860, price: 0, lead: 0 },
    { id: "psu-1200", group: "psu", name: "1200W 이중화 (1+1) Titanium", desc: "", capacity: 1200, price: 0, lead: 0 },
    { id: "psu-1600", group: "psu", name: "1600W 이중화 (1+1) Titanium", desc: "", capacity: 1600, price: 0, lead: 2 },
    { id: "psu-2000", group: "psu", name: "2000W 이중화 (1+1) Titanium", desc: "", capacity: 2000, price: 0, lead: 2 },
    { id: "psu-2600", group: "psu", name: "2600W 이중화 (1+1) Titanium", desc: "", capacity: 2600, price: 0, lead: 3 },
    { id: "psu-2600x4", group: "psu", name: "2600W x4 (2+2) Titanium", desc: "", capacity: 5200, price: 0, lead: 4 },
    { id: "psu-hgx-air", group: "psu", name: "6600W x6 (3+3) Titanium", desc: "HGX 전용, 기본 포함", capacity: 19800, price: 0, lead: 0 },
    { id: "psu-hgx-dlc", group: "psu", name: "6600W x4 (2+2) Titanium", desc: "HGX DLC 전용, 기본 포함", capacity: 13200, price: 0, lead: 0 },
    { id: "psu-hgx-a22", group: "psu", name: "5250W x6 (3+3) Titanium", desc: "기본 포함", capacity: 15750, price: 0, lead: 0 },
    // 냉각
    { id: "cool-air", group: "cooling", name: "공랭 (기본)", desc: "섀시 팬 냉각", price: 0, lead: 0 },
    { id: "cool-dlc", group: "cooling", name: "DLC 수냉 (Cold Plate)", desc: "CPU/GPU 직접 수냉. CDU, 매니폴드, 배관은 AIK 별도 설계 견적", price: 0, lead: 4 },
    // 보증
    { id: "war-3y", group: "warranty", name: "3년 기본 보증 (센터 입고)", desc: "부품 3년, 제조사 기본", price: 0, lead: 0 },
    { id: "war-5y", group: "warranty", name: "5년 보증 연장 (센터 입고)", desc: "부품, 수리 5년", price: 0, lead: 0 },
    { id: "war-5y-on", group: "warranty", name: "5년 익일 방문 (NBD Onsite)", desc: "국내 엔지니어 방문", price: 0, lead: 0 },
    // 서비스
    { id: "svc-rack", group: "svc", name: "랙 설치, 케이블링", desc: "고객 IDC 현장 장착, 전원, 네트워크 연결", price: 0, lead: 0 },
    { id: "svc-os", group: "svc", name: "OS, 드라이버 설치", desc: "Ubuntu/RHEL/Windows Server, GPU 드라이버", price: 0, lead: 0 },
    { id: "svc-burn", group: "svc", name: "72시간 번인 테스트", desc: "출고 전 부하 시험, 결과 리포트", price: 0, lead: 1 },
    { id: "svc-dlc", group: "svc", name: "AIK DC 냉각 설계 컨설팅", desc: "랙 열부하, CDU 용량, 배관 경로 검토 (AIK EPC)", price: 0, lead: 0 },
  ],

  /* 자료실. Supermicro 자료는 자체 호스팅 대신 공식 페이지 링크 (사용 조건 서면 확인 전) */
  docs: [
    { id: "aik-catalog", type: "AIK", kind: "AIK 카탈로그", title: "AIKOREA Supermicro 서버 통합 카탈로그 (국문)", lang: "국문", size: "제작 예정", gated: true, models: ["*"] },
    { id: "aik-dlc", type: "AIK", kind: "AIK 카탈로그", title: "AIK AI 데이터센터 냉각 솔루션 소개서 (DLC, CDU)", lang: "국문", size: "제작 예정", gated: true, models: ["sys-422gs-nb3rt-lcc", "sys-822gs-nb3rt", "sys-a22ga-nbrt"] },
    ...[
      ["sys-122h-tn", "SYS-122H-TN"], ["sys-222h-tn", "SYS-222H-TN"], ["sys-121c-tn2r", "SYS-121C-TN2R"], ["ssg-222b-ne3x24r", "SSG-222B-NE3X24R"],
      ["sys-822gs-nb3rt", "SYS-822GS-NB3RT"], ["sys-422gs-nb3rt-lcc", "SYS-422GS-NB3RT-LCC"], ["sys-a22ga-nbrt", "SYS-A22GA-NBRT"],
    ].map(([id, sku]) => ({ id: "ds-" + id, type: "PDF", kind: "Supermicro 데이터시트", title: sku + " 제품 사양 (Supermicro 공식)", lang: "영문", size: "외부 링크", gated: false, models: [id], url: "https://www.supermicro.com/en/products/system/" })),
  ],
};
/* 데이터시트 링크는 각 모델의 공식 제품 페이지로 연결 */
window.CATALOG.docs.forEach(d => { if (d.id.startsWith("ds-")) { const m = window.CATALOG.models.find(x => "ds-" + x.id === d.id); d.url = m.url; } });
