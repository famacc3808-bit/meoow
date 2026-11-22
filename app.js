'use strict';
const $=id=>document.getElementById(id);
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
let state='closed',timer,angle=0,drag=null;

// Populate letter body
const paragraphs=window.birthdayLetter||[];
paragraphs.forEach(text=>{
 const p=document.createElement('p');
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

 timer=setTimeout(()=>{
  state='open';
  $('open').hidden=true;
  $('reveal').hidden=false;
  $('title').textContent='Твой маленький лебедь';
  const fallback=$('scene-wrap').classList.contains('fallback');
  $('inspect').hidden=fallback;
  $('hint').hidden=true;
  $('gift').disabled=fallback;
  $('gift').classList.add('inspectable');
  $('gift').setAttribute('aria-label','Повернуть украшение: перетяни или используй стрелки');
  $('read').focus();
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
 $('read').focus();
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
 $('inspect').hidden=true;
 $('hint').hidden=false;
 $('open').hidden=false;
 $('open').disabled=false;
 $('gift').disabled=false;
 $('gift').setAttribute('aria-expanded','false');
 $('gift').setAttribute('aria-label','Открыть коробочку с подарком');
 $('gift').classList.remove('inspectable');
 $('scene-wrap').classList.remove('opened');
 $('title').textContent='Киса, это тебе';
 $('hint').textContent='Нажми на кнопку или на коробочку';
 $('open').focus({preventScroll:true});
});

const preview=new URLSearchParams(location.search).get('test')==='1';
const countdownTarget=preview?Date.now()+10_000:Date.parse('2026-12-18T00:00:00+03:00');
const countdownScreen=$('countdown-screen');
let showedCountdown=false;

function unlockMainSite(){
 const header=document.querySelector('header');
 const main=document.querySelector('main');
 header.inert=false;
 if(!showedCountdown||reduce.matches){
  countdownScreen.hidden=true;
  main.inert=false;
  return;
 }
 countdownScreen.inert=true;
 countdownScreen.classList.add('leaving');
 main.classList.add('arriving');
 setTimeout(()=>{
  countdownScreen.hidden=true;
  main.classList.remove('arriving');
  main.inert=false;
 },1050);
}

function updateCountdown(){
 const remaining=countdownTarget-Date.now();
 if(remaining<=0){
  unlockMainSite();
  return;
 }
 showedCountdown=true;
 const seconds=Math.ceil(remaining/1000);
 const values=[Math.floor(seconds/86400),Math.floor(seconds/3600)%24,Math.floor(seconds/60)%60,seconds%60];
 ['cd-days','cd-hours','cd-mins','cd-secs'].forEach((id,i)=>{
  $(id).textContent=String(values[i]).padStart(2,'0');
 });
 setTimeout(updateCountdown,remaining%1000||1000);
}

if(preview){
 document.querySelector('.countdown-headline').textContent='Тестовый отсчёт';
 document.querySelector('.countdown-note').textContent='Подарок откроется через 10 секунд';
}
updateCountdown();

const winterCanvas=$('winter-snow');
const winterContext=winterCanvas?.getContext('2d');
if(winterContext){
 let width,height,flakes,frame=0,previousTime;
 function snowX(near){
  const position=Math.random();
  if(!near)return width*position;
  return width*(position<.5?position*.54:1-(1-position)*.54);
 }

 function paintSnow(time){
  frame=0;
  const elapsed=previousTime===undefined?0:Math.min((time-previousTime)/1000,.05);
  previousTime=time;
  winterContext.clearRect(0,0,width,height);
  for(const flake of flakes){
   flake.y+=flake.speed*elapsed;
   if(flake.y>height+flake.radius){
    flake.y=-flake.radius;
    flake.x=snowX(flake.near);
   }
   const x=flake.x+Math.sin(flake.phase+flake.y*.018)*flake.drift;
   winterContext.globalAlpha=flake.alpha;
   winterContext.fillStyle=flake.near?'#f1f6ff':'#dbeaff';
   winterContext.beginPath();
   winterContext.arc(x,flake.y,flake.radius,0,Math.PI*2);
   winterContext.fill();
  }
  if(!reduce.matches&&!document.hidden)frame=requestAnimationFrame(paintSnow);
 }

 function restartSnow(){
  cancelAnimationFrame(frame);
  previousTime=undefined;
  if(!document.hidden)paintSnow(performance.now());
 }

 function sizeSnow(){
  width=winterCanvas.clientWidth;
  height=winterCanvas.clientHeight;
  const ratio=Math.min(window.devicePixelRatio||1,2);
  winterCanvas.width=Math.round(width*ratio);
  winterCanvas.height=Math.round(height*ratio);
  winterContext.setTransform(ratio,0,0,ratio,0,0);
  const count=Math.round(Math.min(112,Math.max(34,width/12)));
  flakes=Array.from({length:count},(_,index)=>{
   const near=index%8===0;
   return {
    near,
    x:snowX(near),
    y:Math.random()*height,
    radius:near?1.7+Math.random()*1.4:.55+Math.random()*.8,
    alpha:near?.38+Math.random()*.22:.22+Math.random()*.28,
    speed:near?24+Math.random()*15:8+Math.random()*12,
    drift:near?13:5,
    phase:Math.random()*Math.PI*2
   };
  });
  restartSnow();
 }

 window.addEventListener('resize',sizeSnow);
 document.addEventListener('visibilitychange',restartSnow);
 reduce.addEventListener('change',restartSnow);
 sizeSnow();
}

// ----------------------------------------------------------------------------
// Audio Experience: Romantic Instrumental Ambient & Tactile Micro-Sounds
// ----------------------------------------------------------------------------
let audioCtx=null,isPlayingMusic=false,musicEnabled=true,musicTimeout=null,masterMusicGain=null,delayNode=null;
const musicVoices=new Set();
const musicButton=$('music-toggle');

function getAudioContext(){
 if(!audioCtx){
  const AudioContext=window.AudioContext||window.webkitAudioContext;
  if(!AudioContext)return null;
  audioCtx=new AudioContext();
  audioCtx.addEventListener('statechange',playMusicWhenReady);
 }
 if(audioCtx.state==='suspended'||audioCtx.state==='interrupted')audioCtx.resume().catch(()=>{});
 return audioCtx;
}

function setupMusicBus(ctx){
 if(masterMusicGain)return;
 masterMusicGain=ctx.createGain();
 masterMusicGain.gain.setValueAtTime(0,ctx.currentTime);

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

 for(const voice of [osc,osc2]){
  musicVoices.add(voice);
  voice.onended=()=>musicVoices.delete(voice);
 }
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
 const ctx=audioCtx;
 const now=ctx.currentTime;
 for(const item of melody){
  playPianoNote(ctx,item.f,now+item.t,item.d,item.v);
 }
 musicTimeout=setTimeout(scheduleMusicLoop,(loopDur-.2)*1000);
}

function playMusicWhenReady(){
 const ctx=audioCtx;
 if(!musicEnabled||isPlayingMusic||ctx?.state!=='running')return;
 setupMusicBus(ctx);
 isPlayingMusic=true;
 masterMusicGain.gain.setTargetAtTime(.22,ctx.currentTime,.1);
 musicButton.classList.add('playing');
 musicButton.setAttribute('aria-pressed','true');
 musicButton.setAttribute('aria-label','Выключить фоновую музыку');
 scheduleMusicLoop();
}

function stopMusic(){
 musicEnabled=false;
 isPlayingMusic=false;
 clearTimeout(musicTimeout);
 masterMusicGain.gain.setTargetAtTime(0,audioCtx.currentTime,.025);
 for(const voice of musicVoices)voice.stop(audioCtx.currentTime+.08);
 musicVoices.clear();
 musicButton.classList.remove('playing');
 musicButton.setAttribute('aria-pressed','false');
 musicButton.setAttribute('aria-label','Включить фоновую музыку');
}

function startMusic(){
 musicEnabled=true;
 getAudioContext();
 playMusicWhenReady();
}

musicButton.addEventListener('click',()=>{
 if(isPlayingMusic)stopMusic();
 else startMusic();
});

function retryAutoplay(event){
 if(musicEnabled&&audioCtx?.state!=='running'&&!musicButton.contains(event.target))startMusic();
}

document.addEventListener('pointerup',retryAutoplay);
document.addEventListener('keydown',retryAutoplay);
startMusic();

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
