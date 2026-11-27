(() => {
  /* GitHub Pages 판에서는 production/build_pages.py 가 Apps Script 웹 앱 주소를 넣는다. 비어 있으면 Node 서버의 /api/inquiries */
  const APPS_SCRIPT = "";
  const field = (form, name) => form.elements.namedItem(name)?.value.trim() || "";
  const base64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  /* Apps Script 는 여러 부분(multipart) 양식을 읽지 못해 JSON 으로 보낸다. text/plain 이라 브라우저 사전 확인 요청이 생기지 않는다 */
  async function sendToAppsScript(data) {
    const body = {files:[]};
    for (const [key, value] of data) {
      if (typeof value === "string") body[key] = value;
      else body.files.push({name:value.name, type:value.type, data:await base64(value)});
    }
    const response = await fetch(APPS_SCRIPT,{method:"POST",body:JSON.stringify(body),headers:{"Content-Type":"text/plain;charset=utf-8"}});
    const result = await response.json().catch(()=>({}));
    const status = result.error === "invalid_file" ? 422 : result.error === "rate_limited" ? 429 : result.error ? 500 : response.status;
    return {ok:status >= 200 && status < 300, status, json:async()=>result};
  }
  const drafts = new WeakMap();
  function newRequestId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, b=>b.toString(16).padStart(2,"0")).join("");
    return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join("-");
  }
  async function submit(form) {
    const detailed = form.id === "inqForm";
    const english = document.documentElement.lang === "en" || location.pathname.startsWith("/en/");
    const text = (ko, en) => english ? en : ko;
    const button = form.querySelector('[type="submit"]');
    if (button.disabled) return;
    const status = document.getElementById(detailed ? "inqErr" : "aikQuickMsg");
    const data = new FormData();
    const parts = key => [1,2,3].map(n=>field(form,key+n));
    const telephone = (key, fallback) => {
      const split = parts(key);
      return split[1] || split[2] ? split.join("-") : field(form,fallback);
    };
    const payload = {
      source:detailed ? "detail" : "quick", language:english ? "en" : "ko", kind:field(form,"kind"),
      company:field(form,"company"), name:field(form,"name"), email:detailed ? field(form,"email1")+"@"+field(form,"email2") : field(form,"email"),
      mobile:telephone("hp","hp"), phone:telephone("tel","tel"), area:field(form,"biz"), call_time:field(form,"call_time"),
      message:field(form,"message"), consent:document.getElementById(detailed ? "inqAgree" : "aikQuickAgree").checked ? "yes" : ""
    };
    for (const [name,value] of Object.entries(payload)) data.set(name,value);
    const signature = [payload];
    for (const key of ["file1","file2"]) {
      const file = form.elements.namedItem(key)?.files?.[0];
      if (file) { data.set(key,file); signature.push([key,file.name,file.size,file.lastModified]); }
    }
    const fingerprint = JSON.stringify(signature);
    const last = drafts.get(form);
    const requestId = last?.fingerprint === fingerprint ? last.id : newRequestId();
    drafts.set(form,{fingerprint,id:requestId});
    data.set("request_id",requestId);
    button.disabled = true;
    status.className = detailed ? "err" : "msg";
    status.textContent = text("문의 전송 중…","Submitting your inquiry…");
    status.style.display = "block";
    try {
      const response = APPS_SCRIPT ? await sendToAppsScript(data)
        : await fetch("/api/inquiries",{method:"POST",body:data,headers:{"X-AIK-Request":"inquiry"},credentials:"same-origin"});
      const result = await response.json().catch(()=>({}));
      if (!response.ok || !/^AIK-[A-F0-9]{16}$/.test(result.receipt || "")) {
        if (response.status === 422 && result.error === "invalid_file") throw Error(text("첨부파일 형식과 크기를 확인해 주세요.","Check the file type and size of your attachments."));
        if (response.status === 429) throw Error(text("잠시 후 다시 제출해 주세요.","Please wait before submitting again."));
        throw Error();
      }
      const receipt = text("접수번호 ","Reference ") + result.receipt;
      if (detailed) {
        status.style.display = "none";
        form.hidden = true;
        form.style.display = "none";
        const done = document.getElementById("inqDone");
        done.querySelector("[data-receipt]").textContent = receipt;
        done.style.display = "block";
        done.scrollIntoView({block:"center"});
      } else {
        form.reset();
        status.className = "msg ok";
        status.textContent = text("문의가 접수되었습니다. ","Your inquiry was received. ") + receipt;
      }
      drafts.delete(form);
    } catch (error) {
      status.className = detailed ? "err" : "msg err";
      status.textContent = text("접수 여부를 확인하지 못했습니다. 입력 내용은 유지됩니다. ","We could not confirm receipt. Your entries are preserved. ") +
        (error.message && !(error instanceof TypeError) ? error.message : text("다시 제출해 주세요.","Please try again."));
    } finally { button.disabled = false; }
  }
  window.aikSubmitInquiry = submit;
})();
