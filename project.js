const names=["감띠","뚱감띠","케이준띠","탄감띠","덜감띠","케찹 감띠","빙빙이","휜감띠","감감이와 띠띠","울룩불룩띠","웨지감띠","부스러끼","두리감띠","촉촉감띠"];
const lineup=document.querySelector('#project-lineup');
names.forEach((name,i)=>{const figure=document.createElement('figure');const art=document.createElement('img');art.src='assets/illustrations/friend-'+String(i+1).padStart(2,'0')+'.svg';art.alt=name+' 원본 일러스트';art.loading='lazy';const caption=document.createElement('figcaption');caption.textContent=name;figure.append(art,caption);lineup.append(figure);});
const mockupTrack=document.querySelector('#mockup-track');
if(mockupTrack){const copy=mockupTrack.querySelector('.mockup-set').cloneNode(true);copy.setAttribute('aria-hidden','true');copy.querySelectorAll('img').forEach(img=>img.alt='');mockupTrack.append(copy);}
