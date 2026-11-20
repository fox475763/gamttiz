/* Shared detail presentation. Data is controlled by friends-data.js. */
(()=>{'use strict';
  const {number,image}=globalThis.GTZFriends;
  globalThis.GTZProfile=(c,{daily=false}={})=>`
    <div class="profile-art" style="--friend-color:${c.color}"><div class="profile-art-top"><span>NO. ${number(c.id)}</span><span>${daily?'TODAY’S PICK':'GAMTTIZ DEX'}</span></div><img src="${image(c.id)}" alt="${c.name} 캐릭터 일러스트"><span class="profile-type">${c.type}</span></div>
    <div class="profile-info"><p class="fx-kicker">${c.english}</p><h2>${c.name}</h2><p class="profile-tagline">${c.tagline}</p><p class="profile-origin">${c.origin}</p><blockquote>“${c.quote}”</blockquote>
    ${daily?`<div class="profile-message"><span>MESSAGE FOR TODAY</span><h3>오늘의 한마디</h3><p>${c.message}</p></div>`:''}
    <h3>감띠 이야기</h3><p class="profile-story">${c.story}</p><dl class="profile-facts"><div><dt>좋아하는 것</dt><dd>${c.likes}</dd></div><div><dt>작은 습관</dt><dd>${c.habit}</dd></div><div><dt>친구 관계</dt><dd>${c.friend}</dd></div></dl>
    ${daily?`<a class="fx-profile-link" href="collection.html#friend-${number(c.id)}">도감에서 더 알아보기 ↗</a>`:`<a class="fx-profile-link" href="assets/keyring-${number(c.id)}.png" target="_blank" rel="noopener">원본 키링 이미지 보기 ↗</a>`}</div>`;
})();
