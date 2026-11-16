const sharp=require('sharp');const fs=require('node:fs');const path=require('node:path');
async function main(){
 const {data,info}=await sharp('../photo_2026-11-16_11-56-25.jpg').resize(1205,1600).extract({left:325,top:465,width:610,height:580}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 // Keep the dark crystal facets opaque: brightness is not a foreground mask for a gemstone.
 // The contour follows the original photo, in its original coordinate system.
 const silhouette=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1220" height="1160" viewBox="325 465 610 580"><path fill="white" fill-rule="evenodd" d="M489 834 C473 836 463 845 462 861 L451 893 L478 875 C496 878 517 862 527 867 C531 881 495 896 464 915 C433 933 414 946 418 963 C421 993 455 1004 486 1012 C533 1031 608 1042 642 1026 C672 1007 684 943 694 891 C700 874 689 862 677 861 C652 868 625 878 598 890 L474 941 C467 939 475 926 489 918 C522 899 549 887 548 868 C548 847 520 831 489 834 Z"/></svg>`);
 const mask=await sharp(silhouette).resize(610,580).blur(.45).ensureAlpha().raw().toBuffer();
 const chains=[[[345,480],[372,530],[409,600],[442,677],[465,752],[489,834]],[[909,585],[874,633],[825,687],[777,746],[730,808],[685,870]]];
 function nearChain(x,y){return chains.some(points=>points.slice(1).some((b,j)=>{const a=points[j],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)<11;}));}
 for(let i=0;i<data.length;i+=4){
  const l=Math.max(data[i],data[i+1],data[i+2]);const x=(i/4)%info.width,y=Math.floor(i/4/info.width);
  const chain=nearChain(x+325,y+465)?Math.round(255*Math.max(0,Math.min(1,(l-50)/65))):0;
  data[i+3]=Math.max(chain,mask[i+3]);
 }
 // Resample only after the matte; this smooths the edge without inventing image detail.
 await sharp(data,{raw:info}).resize(1220,1160,{kernel:'lanczos3'}).png().toFile('assets/necklace-cutout.png');
 for(const name of ['manrope','literata']){for(const subset of ['cyrillic','latin']){const file=`${name}-${subset}-400-normal.woff2`;fs.copyFileSync(path.join('node_modules/@fontsource',name,'files',file),path.join('assets',file));}fs.copyFileSync(path.join('node_modules/@fontsource',name,'LICENSE'),`assets/${name}-LICENSE.txt`);}
 fs.copyFileSync('node_modules/three/LICENSE','assets/three-LICENSE.txt');console.log('Jewellery matte and local licensed fonts prepared; originals unchanged.');
}main().catch(e=>{console.error(e);process.exitCode=1;});
