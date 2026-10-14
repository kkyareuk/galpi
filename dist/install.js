export function setupInstall(openDialog,toast){
 const appURL=new URL('./',import.meta.url).href;
 let deferred=null;const button=document.querySelector('#install-app');
 const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 if(installed()){button.textContent='앱 사용 중';button.disabled=true}
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferred=event;button.textContent='앱 설치'});
 window.addEventListener('appinstalled',()=>{deferred=null;button.textContent='앱 설치됨';toast('갈피를 설치했습니다.')});
 button.onclick=async()=>{if(deferred){const prompt=deferred;deferred=null;await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='accepted')button.textContent='앱 설치됨';return}
 openDialog('<h2>갈피 앱 설치</h2><p>현재 사이트를 홈 화면에 설치해 별도 창으로 사용할 수 있습니다.</p><ol class="install-help"><li><strong>Android · Chrome</strong><br>브라우저 메뉴 ⋮ → 앱 설치 또는 홈 화면에 추가</li><li><strong>iPhone · Safari</strong><br>공유 → 홈 화면에 추가 → 추가</li><li><strong>PC · Chrome / Edge</strong><br>주소창 오른쪽 설치 아이콘 또는 브라우저 메뉴 → 앱 설치</li></ol><p>앱 안의 미니 브라우저에서는 설치 메뉴가 없을 수 있습니다. 아래 주소를 Chrome이나 Safari에서 열어 주세요.</p><input aria-label="갈피 주소" readonly value="'+appURL+'" style="width:100%"><p>처음 접속할 때 인터넷이 필요합니다. 이후 이 기기에 저장한 원고를 오프라인으로 읽고 쓸 수 있습니다. Google 로그인과 동기화에는 인터넷이 필요합니다.</p><button class="btn" data-close>닫기</button>')};
 if('serviceWorker' in navigator && !['localhost','127.0.0.1'].includes(location.hostname)){navigator.serviceWorker.register('./sw.js').then(registration=>{navigator.serviceWorker.ready.then(()=>{button.title='오프라인 준비 완료';button.dataset.offlineReady='true'});registration.addEventListener('updatefound',()=>{const next=registration.installing;next?.addEventListener('statechange',()=>{if(next.state==='installed'&&navigator.serviceWorker.controller)toast('새 버전이 준비됐어요. 원고 저장 후 앱을 모두 닫았다 다시 열면 적용됩니다.')})})}).catch(()=>toast('오프라인 기능을 준비하지 못했습니다. 온라인으로 계속 사용할 수 있습니다.'))}
}
