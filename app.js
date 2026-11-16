'use strict';
const $=id=>document.getElementById(id);
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
let state='closed',timer,angle=0,drag=null,lastSparkle=0;

// Populate letter body
const paragraphs=window.birthdayLetter||[];
paragraphs.forEach((text,i)=>{
 const p=document.createElement('p');
 p.style.setProperty('--delay',`${.15+i*.12}s`);
 if(text.includes('«Эту вещь создала Милана»')){
  const parts=text.split('«Эту вещь создала Милана»');
  p.append(parts[0]);
  const span=document.createElement('span');
  span.className='quote-highlight';
  span.textContent='«Эту вещь создала Милана»';
  p.append(span);
  p.append(parts[1]);
 }else{
  p.textContent=text;
 }
 $('letter-body').append(p);
});

// Cursor sparkles
function spawnSparkle(x,y){
 if(reduce.matches)return;
 const s=document.createElement('span');
 s.className='cursor-sparkle';
 s.style.left=`${x}px`;s.style.top=`${y}px`;
 s.style.setProperty('--dx',`${(Math.random()-.5)*42}px`);
 s.style.setProperty('--dy',`${Math.random()*28+8}px`);
 s.style.setProperty('--rot',`${Math.random()*90-45}deg`);
 document.body.appendChild(s);
 setTimeout(()=>s.remove(),700);
}

window.addEventListener('pointermove',e=>{
 const now=performance.now();
 if(now-lastSparkle<38)return;
 lastSparkle=now;
 spawnSparkle(e.clientX,e.clientY);
});

function turn(value){
 if(state!=='open'||$('scene-wrap').classList.contains('fallback'))return;
 angle=Math.max(-35,Math.min(35,value));
 window.giftScene?.setTurn(angle);
 $('angle').textContent=`${Math.round(angle)}°`;
}

function openGift(){
 if(state!=='closed')return;
 state='opening';
 playBoxClick();
 setTimeout(playChime,420);
 $('open').disabled=true;
 $('gift').disabled=true;
 $('gift').setAttribute('aria-expanded','true');
 $('scene-wrap').classList.add('opened');
 window.giftScene?.setOpen(true);
 $('hint').textContent='С днём рождения, киса.';

 const rect=$('open').getBoundingClientRect();
 for(let i=0;i<14;i++){
  setTimeout(()=>spawnSparkle(rect.left+rect.width*Math.random(),rect.top+rect.height*Math.random()),i*45);
 }

 timer=setTimeout(()=>{
  state='open';
  $('open').hidden=true;
  $('reveal').hidden=false;
  $('title').textContent='Твой маленький лебедь.';
  $('chapter').textContent='Рассмотри поближе';
  const fallback=$('scene-wrap').classList.contains('fallback');
  $('inspect').hidden=fallback;
  $('gift').disabled=fallback;
  $('gift').classList.add('inspectable');
  $('gift').setAttribute('aria-label','Повернуть украшение: перетяни или используй стрелки');
  $('read').focus({preventScroll:true});
 },reduce.matches?0:1450);
}

$('open').addEventListener('click',openGift);
$('gift').addEventListener('click',openGift);
$('turn-left').addEventListener('click',()=>turn(angle-10));
$('turn-right').addEventListener('click',()=>turn(angle+10));

$('gift').addEventListener('keydown',e=>{
 if(state==='open'&&['ArrowLeft','ArrowRight','Home'].includes(e.key)){
  e.preventDefault();
  turn(e.key==='Home'?0:angle+(e.key==='ArrowLeft'?-10:10));
 }
});

$('gift').addEventListener('pointerdown',e=>{
 if(state!=='open')return;
 drag={x:e.clientX,angle};
 $('gift').setPointerCapture(e.pointerId);
});

$('gift').addEventListener('pointermove',e=>{
 if(drag){
  turn(drag.angle+(e.clientX-drag.x)*.23);
  spawnSparkle(e.clientX,e.clientY);
 }
});

for(const event of ['pointerup','pointercancel','lostpointercapture'])$('gift').addEventListener(event,()=>{drag=null;});

$('read').addEventListener('click',()=>{
 playPaperRustle();
 $('gift-page').hidden=true;
 $('letter').hidden=false;
 window.scrollTo({top:0,behavior:'instant'});
 $('letter-title').focus({preventScroll:true});
});

function closeLetter(){
 playPaperRustle();
 $('letter').hidden=true;
 $('gift-page').hidden=false;
 window.scrollTo({top:0,behavior:'instant'});
 $('read').focus({preventScroll:true});
}

$('back').addEventListener('click',closeLetter);
$('close-letter').addEventListener('click',closeLetter);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('letter').hidden)closeLetter();});

$('reset').addEventListener('click',()=>{
 clearTimeout(timer);
 turn(0);
 state='closed';
 drag=null;
 window.giftScene?.setOpen(false);
 $('reveal').hidden=true;
 $('open').hidden=false;
 $('open').disabled=false;
 $('gift').disabled=false;
 $('gift').setAttribute('aria-expanded','false');
 $('gift').setAttribute('aria-label','Открыть коробочку с подарком');
 $('gift').classList.remove('inspectable');
 $('scene-wrap').classList.remove('opened');
 $('title').textContent='Киса, это тебе.';
 $('chapter').textContent='Твой день. Твой подарок.';
 $('hint').textContent='Нажми на кнопку или на коробочку';
 $('open').focus({preventScroll:true});
});

// Atmospheric falling snow
const snowCanvas=$('snow-canvas');
if(snowCanvas&&!reduce.matches){
 const ctx=snowCanvas.getContext('2d');
 let w=snowCanvas.width=window.innerWidth,h=snowCanvas.height=window.innerHeight;
 window.addEventListener('resize',()=>{w=snowCanvas.width=window.innerWidth;h=snowCanvas.height=window.innerHeight;});
 const count=Math.min(95,Math.max(45,Math.floor(window.innerWidth/15)));
 const flakes=[];
 for(let i=0;i<count;i++){
  flakes.push({
   x:Math.random()*w,
   y:Math.random()*h,
   r:Math.random()*2.5+1,
   speed:Math.random()*.85+.45,
   sway:Math.random()*.75+.25,
   angle:Math.random()*Math.PI*2,
   opacity:Math.random()*.5+.35
  });
 }
 function drawSnow(){
  ctx.clearRect(0,0,w,h);
  for(let i=0;i<flakes.length;i++){
   const f=flakes[i];
   f.y+=f.speed;
   f.angle+=.015;
   f.x+=Math.sin(f.angle)*f.sway;
   if(f.y>h+10){f.y=-10;f.x=Math.random()*w;}
   if(f.x>w+10)f.x=-10;else if(f.x<-10)f.x=w+10;
   ctx.beginPath();
   ctx.arc(f.x,f.y,f.r,0,Math.PI*2);
   ctx.fillStyle=`rgba(255,255,255,${f.opacity})`;
   if(f.r>2.2){ctx.shadowBlur=5;ctx.shadowColor='rgba(255,255,255,0.7)';}else{ctx.shadowBlur=0;}
   ctx.fill();
  }
  if(!reduce.matches)requestAnimationFrame(drawSnow);
 }
 requestAnimationFrame(drawSnow);
}

// Countdown screen system (Fullscreen intro lock screen)
let cdInterval=null;
const pad=n=>String(Math.max(0,Math.floor(n))).padStart(2,'0');

function unlockMainSite(){
 playChime();
 const screen=$('countdown-screen');
 if(!screen)return;
 screen.classList.add('fade-out');
 const rect=$('open')?.getBoundingClientRect();
 if(rect){
  for(let i=0;i<32;i++){
   setTimeout(()=>spawnSparkle(rect.left+rect.width*Math.random(),rect.top+rect.height*Math.random()),i*30);
  }
 }
 setTimeout(()=>{
  screen.hidden=true;
 },reduce.matches?0:1200);
}

function updateCountdown(){
 const target=new Date('2026-12-18T00:00:00+03:00').getTime();
 const diff=target-Date.now();
 if(diff<=0){
  $('cd-days').textContent='00';$('cd-hours').textContent='00';$('cd-mins').textContent='00';$('cd-secs').textContent='00';
  clearInterval(cdInterval);cdInterval=null;
  unlockMainSite();
 }else{
  const days=Math.floor(diff/(1000*60*60*24));
  const hours=Math.floor((diff%(1000*60*60*24))/(1000*60*60));
  const mins=Math.floor((diff%(1000*60*60))/(1000*60));
  const secs=Math.floor((diff%(1000*60))/1000);
  $('cd-days').textContent=pad(days);
  $('cd-hours').textContent=pad(hours);
  $('cd-mins').textContent=pad(mins);
  $('cd-secs').textContent=pad(secs);
 }
}

function startCountdown(){
 if(cdInterval)clearInterval(cdInterval);
 updateCountdown();
 cdInterval=setInterval(updateCountdown,1000);
}

startCountdown();

// ----------------------------------------------------------------------------
// Audio Experience: Romantic Instrumental Ambient & Tactile Micro-Sounds
// ----------------------------------------------------------------------------
let audioCtx=null,isPlayingMusic=false,musicTimeout=null,masterMusicGain=null,delayNode=null;

function getAudioContext(){
 if(!audioCtx){
  const AudioContext=window.AudioContext||window.webkitAudioContext;
  if(AudioContext)audioCtx=new AudioContext();
 }
 if(audioCtx&&audioCtx.state==='suspended')audioCtx.resume();
 return audioCtx;
}

function setupMusicBus(ctx){
 if(masterMusicGain)return;
 masterMusicGain=ctx.createGain();
 masterMusicGain.gain.setValueAtTime(.22,ctx.currentTime);

 delayNode=ctx.createDelay();
 delayNode.delayTime.setValueAtTime(.38,ctx.currentTime);
 const feedback=ctx.createGain();
 feedback.gain.setValueAtTime(.32,ctx.currentTime);
 const dFilter=ctx.createBiquadFilter();
 dFilter.frequency.setValueAtTime(1100,ctx.currentTime);

 delayNode.connect(feedback);
 feedback.connect(dFilter);
 dFilter.connect(delayNode);
 delayNode.connect(masterMusicGain);
 masterMusicGain.connect(ctx.destination);
}

function playPianoNote(ctx,freq,time,duration=2.4,vel=.18){
 if(!isPlayingMusic)return;
 const osc=ctx.createOscillator(),osc2=ctx.createOscillator();
 const gain=ctx.createGain(),filter=ctx.createBiquadFilter();

 osc.type='triangle';osc2.type='sine';
 osc.frequency.setValueAtTime(freq,time);
 osc2.frequency.setValueAtTime(freq*2,time);

 filter.type='lowpass';
 filter.frequency.setValueAtTime(Math.min(2200,freq*3.5),time);
 filter.frequency.exponentialRampToValueAtTime(Math.max(250,freq*1.2),time+duration);

 gain.gain.setValueAtTime(.0001,time);
 gain.gain.linearRampToValueAtTime(vel,time+.025);
 gain.gain.exponentialRampToValueAtTime(.0001,time+duration);

 osc.connect(filter);osc2.connect(filter);
 filter.connect(gain);
 gain.connect(masterMusicGain);
 if(delayNode)gain.connect(delayNode);

 osc.start(time);osc2.start(time);
 osc.stop(time+duration);osc2.stop(time+duration);
}

const N={D3:146.83,G3:196,A3:220,B3:246.94,D4:293.66,E4:329.63,Fs4:369.99,G4:392,A4:440,B4:493.88,Cs5:554.37,D5:587.33,E5:659.25,Fs5:739.99};
const melody=[
 {t:0,f:N.G3,v:.16,d:3.2},{t:.4,f:N.D4,v:.12,d:2},{t:.8,f:N.Fs4,v:.14,d:2},{t:1.2,f:N.B4,v:.16,d:2.4},{t:1.6,f:N.D5,v:.15,d:2},{t:2.2,f:N.Fs5,v:.18,d:3},
 {t:3.2,f:N.D3,v:.16,d:3.2},{t:3.6,f:N.A3,v:.12,d:2},{t:4,f:N.Cs5,v:.15,d:2.4},{t:4.4,f:N.Fs4,v:.13,d:2},{t:4.8,f:N.A4,v:.15,d:2},{t:5.4,f:N.E5,v:.17,d:3},
 {t:6.4,f:N.B3,v:.16,d:3.2},{t:6.8,f:N.Fs4,v:.12,d:2},{t:7.2,f:N.A4,v:.14,d:2.4},{t:7.6,f:N.D5,v:.17,d:2.6},{t:8.2,f:N.Fs5,v:.18,d:3.2},
 {t:9.6,f:N.A3,v:.16,d:3.2},{t:10,f:N.E4,v:.12,d:2},{t:10.4,f:N.A4,v:.14,d:2},{t:10.8,f:N.Cs5,v:.15,d:2.4},{t:11.4,f:N.E5,v:.16,d:3.5}
];
const loopDur=12.8;

function scheduleMusicLoop(){
 if(!isPlayingMusic)return;
 const ctx=getAudioContext();
 setupMusicBus(ctx);
 const now=ctx.currentTime;
 for(const item of melody){
  playPianoNote(ctx,item.f,now+item.t,item.d,item.v);
 }
 musicTimeout=setTimeout(scheduleMusicLoop,(loopDur-.2)*1000);
}

function startMusic(){
 const ctx=getAudioContext();
 if(!ctx)return;
 setupMusicBus(ctx);
 isPlayingMusic=true;
 $('music-toggle')?.classList.add('playing');
 $('music-toggle')?.setAttribute('aria-label','Выключить фоновую музыку');
 scheduleMusicLoop();
}

function stopMusic(){
 isPlayingMusic=false;
 clearTimeout(musicTimeout);
 $('music-toggle')?.classList.remove('playing');
 $('music-toggle')?.setAttribute('aria-label','Включить фоновую музыку');
}

function toggleMusic(){
 if(isPlayingMusic)stopMusic();
 else startMusic();
}

$('music-toggle')?.addEventListener('click',toggleMusic);

// Auto-start music on first user gesture anywhere on page
function onFirstUserGesture(){
 if(!isPlayingMusic){
  startMusic();
 }
 window.removeEventListener('pointerdown',onFirstUserGesture);
 window.removeEventListener('keydown',onFirstUserGesture);
}
window.addEventListener('pointerdown',onFirstUserGesture,{once:true});
window.addEventListener('keydown',onFirstUserGesture,{once:true});

// Tactile micro-sounds
function playBoxClick(){
 const ctx=getAudioContext();if(!ctx)return;
 const now=ctx.currentTime;
 const osc=ctx.createOscillator(),g=ctx.createGain();
 osc.type='sine';osc.frequency.setValueAtTime(1300,now);
 osc.frequency.exponentialRampToValueAtTime(160,now+.05);
 g.gain.setValueAtTime(.35,now);
 g.gain.exponentialRampToValueAtTime(.001,now+.06);
 osc.connect(g);g.connect(ctx.destination);
 osc.start(now);osc.stop(now+.06);

 const thump=ctx.createOscillator(),tg=ctx.createGain();
 thump.type='sine';thump.frequency.setValueAtTime(150,now+.01);
 thump.frequency.exponentialRampToValueAtTime(35,now+.14);
 tg.gain.setValueAtTime(.3,now+.01);
 tg.gain.exponentialRampToValueAtTime(.001,now+.15);
 thump.connect(tg);tg.connect(ctx.destination);
 thump.start(now+.01);thump.stop(now+.15);
}

function playChime(){
 const ctx=getAudioContext();if(!ctx)return;
 const now=ctx.currentTime;
 const notes=[587.33,739.99,880,1174.66,1479.98];
 notes.forEach((freq,idx)=>{
  const osc=ctx.createOscillator(),g=ctx.createGain();
  const t=now+idx*.055;
  osc.type='sine';osc.frequency.setValueAtTime(freq,t);
  g.gain.setValueAtTime(.001,t);
  g.gain.linearRampToValueAtTime(.11,t+.01);
  g.gain.exponentialRampToValueAtTime(.0001,t+1.3);
  osc.connect(g);g.connect(ctx.destination);
  osc.start(t);osc.stop(t+1.3);
 });
}

function playPaperRustle(){
 const ctx=getAudioContext();if(!ctx)return;
 const now=ctx.currentTime;
 [0,.13].forEach((delay,idx)=>{
  const len=Math.floor(ctx.sampleRate*.16);
  const buf=ctx.createBuffer(1,len,ctx.sampleRate);
  const ch=buf.getChannelData(0);
  for(let i=0;i<len;i++)ch[i]=Math.random()*2-1;
  const src=ctx.createBufferSource();src.buffer=buf;
  const filter=ctx.createBiquadFilter();
  filter.type='bandpass';
  filter.frequency.setValueAtTime(idx===0?2300:1900,now+delay);
  filter.Q.setValueAtTime(1.7,now+delay);
  const g=ctx.createGain();
  g.gain.setValueAtTime(.001,now+delay);
  g.gain.linearRampToValueAtTime(.17,now+delay+.025);
  g.gain.exponentialRampToValueAtTime(.001,now+delay+.16);
  src.connect(filter);filter.connect(g);g.connect(ctx.destination);
  src.start(now+delay);src.stop(now+delay+.17);
 });
}
