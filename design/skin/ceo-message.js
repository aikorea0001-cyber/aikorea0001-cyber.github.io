/* The original CEO page is a single print-layout image. Its mobile version
   uses the same copy and artwork, with real text that can wrap and resize. */
(function () {
  var poster = document.querySelector('#p_content_box > p > img');
  if (!poster) return;

  var english = document.documentElement.lang === 'en';
  var message = english ? {
    label: 'Message from the CEO',
    welcome: 'Welcome to AI KOREA, a technology leader accelerating innovation for a better future.',
    intro: [
      'Greetings, and thank you for visiting AI KOREA. We are deeply grateful for your interest in our company, which is committed to carbon neutrality and ESG-driven management.',
      'Guided by our vision of becoming a “leading provider of eco-friendly technologies for a sustainable future,” AI KOREA is continuously evolving and innovating. In response to the global climate crisis caused by global warming, we are dedicating ourselves to the development of green technologies through the following initiatives:'
    ],
    initiatives: [
      ['First,', 'we contribute to reducing air pollutants and greenhouse gas emissions through the development and mass production of products such as (ultra)low-temperature atmospheric plasma systems, USC technology, dust collectors, and gas capture devices.'],
      ['Second,', 'we are providing eco-friendly energy solutions by advancing technologies such as CESS (Central Electrolyte Supply System), BESS (Battery Energy Storage System), and ammonia (NH₃) cracking.'],
      ['Third,', 'to pioneer convergence robotics technologies for a better world, we are expanding investments in more systematic and specialized R&D through industry-academia-research collaboration.'],
      ['Fourth,', 'through continuous technological innovation, we are not only leading the green industry but also striving to expand into the global market.']
    ],
    closing: [
      'AI KOREA is committed to creating not only economic value but also social value, pursuing sustainable development for both current and future generations. To this end, we uphold transparent and responsible management, fostering mutual growth with all our stakeholders.',
      'Moving forward, AI KOREA will continue to contribute to national economic development through innovation in eco-friendly energy technologies and work toward a future where nature and humanity thrive in harmony. We sincerely appreciate your continued interest and support.',
      'Thank you.'
    ],
    signature: 'AI KOREA Co. Ltd., CEO Jin-ho Ahn'
  } : {
    label: 'CEO 인사말',
    welcome: '더 나은 미래를 앞당기는 기술혁신 기업 AI KOREA에 오신 것을 환영합니다.',
    intro: [
      '안녕하십니까, 탈탄소, ESG 경영을 목표로 노력하는 저희 AI KOREA를 찾아주신 여러분께 진심으로 감사드립니다.',
      '우리 기업은 "지속가능한 미래를 위한 친환경 기술선도 기업"이라는 비전 아래 끊임없이 발전하고 있습니다. 전 세계가 직면한 온난화로 인한 기후 위기를 극복하고자 친환경 기술개발을 위해, 우리는 다음과 같은 노력을 기울이고 있습니다.'
    ],
    initiatives: [
      ['첫째,', '(초)저온 대기압 플라즈마, USC, 집진기, 포집기 등 제품개발 및 양산을 통해 대기환경오염물질 제거 및 온실가스 저감에 기여하고 있습니다.'],
      ['둘째,', 'CESS(중앙전해액 이송 시스템), BESS(배터리 에너지 저장시스템), NH3를 Cracking 하는 기술을 통해 친환경 에너지 솔루션을 제공하고 있습니다.'],
      ['셋째,', '더 나은 세상을 위한 융합 로봇 기술 개발을 위해 산학연 연계 등 보다 체계적이고 전문적인 기술개발에 투자를 확대하고 있습니다.'],
      ['넷째,', '지속적 기술혁신을 통해 친환경 산업을 선도하며, 글로벌 시장으로의 확장을 추진하고 있습니다.']
    ],
    closing: [
      '우리는 단순히 경제적 가치를 넘어 사회적 가치를 창출하고, 현 세대와 미래 세대 모두를 위한 지속가능한 발전을 추구합니다. 이를 위해 투명하고 책임 있는 경영을 실천하며, 모든 이해관계자와의 상생을 도모하고 있습니다.',
      '앞으로도 저희 AI KOREA는 친환경 에너지 기술 혁신을 통해 국가 경제 발전에 이바지하고, 자연과 인간이 공존하는 행복한 미래를 열어가는 데 최선을 다하겠습니다. 여러분의 지속적인 관심과 성원을 부탁드립니다.',
      '감사합니다.'
    ],
    signature: '주식회사 에이아이코리아 대표이사 안진호'
  };

  function appendText(parent, tag, text) {
    var element = document.createElement(tag);
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  var article = document.createElement('article');
  article.className = 'ceo-message';
  article.setAttribute('aria-label', message.label);
  article.style.setProperty('--ceo-poster', 'url("' + poster.src + '")');
  var header = document.createElement('header');
  appendText(header, 'p', message.label);
  appendText(header, 'h2', '“TECHNOLOGICAL INNOVATIONS THAT ADVANCE A BETTER FUTURE”');
  appendText(header, 'strong', message.welcome);
  article.appendChild(header);
  message.intro.forEach(function (text) { appendText(article, 'p', text); });
  var list = document.createElement('ol');
  message.initiatives.forEach(function (initiative) {
    var item = document.createElement('li');
    appendText(item, 'strong', initiative[0]);
    appendText(item, 'p', initiative[1]);
    list.appendChild(item);
  });
  article.appendChild(list);
  message.closing.forEach(function (text) { appendText(article, 'p', text); });
  var signature = document.createElement('div');
  signature.className = 'ceo-signature';
  signature.setAttribute('role', 'img');
  signature.setAttribute('aria-label', message.signature);
  article.appendChild(signature);
  poster.parentElement.classList.add('ceo-poster');
  poster.parentElement.insertAdjacentElement('afterend', article);
})();
