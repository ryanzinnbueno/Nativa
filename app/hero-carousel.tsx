'use client';
import {useEffect,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,Pause,Play} from 'lucide-react';

const slides=[
 {category:'Grãos e cereais',tag:'O NATURAL EM CADA ESCOLHA',title:'Pequenos grãos.',accent:'Novas possibilidades.',description:'Aveia, sementes e cereais para dar mais sabor às suas receitas do dia a dia.',cta:'Explorar grãos',image:'/images/carousel-graos.webp',alt:'Aveia e sementes em uma tigela de cerâmica sobre uma mesa verde'},
 {category:'Castanhas',tag:'UMA PAUSA CHEIA DE SABOR',title:'Uma porção de sabor.',accent:'Um momento seu.',description:'Castanhas, amêndoas e combinações para acompanhar as pequenas pausas da rotina.',cta:'Conhecer castanhas',image:'/images/carousel-castanhas.webp',alt:'Castanhas de caju, amêndoas e castanhas-do-pará em uma tigela'},
 {category:'Chás e ervas',tag:'RESPIRE. DESACELERE. SABOREIE.',title:'O tempo de uma xícara.',accent:'O prazer de cuidar.',description:'Ervas e infusões naturais para transformar um instante simples em um ritual gostoso.',cta:'Descobrir chás',image:'/images/carousel-chas.webp',alt:'Xícara de chá âmbar com flores de camomila e hibisco'}
];

export default function HeroCarousel({onExplore}:{onExplore:(category:string)=>void}){
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[hovered,setHovered]=useState(false),[focused,setFocused]=useState(false),[reduced,setReduced]=useState(true),[visible,setVisible]=useState(true);
 const touch=useRef<{x:number;y:number}|null>(null);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);const visibility=()=>setVisible(!document.hidden);document.addEventListener('visibilitychange',visibility);return()=>{media.removeEventListener('change',update);document.removeEventListener('visibilitychange',visibility)}},[]);
 const playing=!paused&&!hovered&&!focused&&!reduced&&visible;
 useEffect(()=>{if(!playing)return;const timer=setTimeout(()=>setIndex(i=>(i+1)%slides.length),6500);return()=>clearTimeout(timer)},[index,playing]);
 const go=(i:number)=>{setIndex((i+slides.length)%slides.length);setPaused(true)};
 const slide=slides[index];
 return <section className="nativa-carousel" aria-roledescription="carrossel" aria-label="Inspirações naturais" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocused(false)}} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();go(index+1)}if(e.key==='ArrowLeft'){e.preventDefault();go(index-1)}}} onTouchStart={e=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};setPaused(true)}} onTouchEnd={e=>{if(!touch.current)return;const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))go(index+(dx<0?1:-1));touch.current=null}}>
  <div className={`nativa-banner nativa-banner-${index}`} key={index} role="group" aria-roledescription="slide" aria-label={`${index+1} de 3: ${slide.category}`}>
   <img className="banner-image" src={slide.image} alt={slide.alt} fetchPriority={index===0?'high':'auto'}/>
   <div className="banner-top"><span>{slide.tag}</span><p>{slide.title}<br/>{slide.accent}</p></div>
   <div className="banner-message"><h1>{index===0?<>Grãos <span>& cereais</span></>:index===1?<>Castanhas <span>& sabores</span></>:<>Chás <span>naturais</span></>}</h1><p>{slide.description}</p><button onClick={()=>onExplore(slide.category)}>{slide.cta}</button></div>
  </div>
  <button className="banner-arrow banner-previous" aria-label="Conteúdo anterior" onClick={()=>go(index-1)}><ChevronLeft size={23}/></button><button className="banner-arrow banner-next" aria-label="Próximo conteúdo" onClick={()=>go(index+1)}><ChevronRight size={23}/></button>
  <div className="banner-controls"><div className="banner-indicators" role="group" aria-label="Escolher banner">{slides.map((s,i)=><button key={s.category} className={i===index?'selected':''} aria-label={`Mostrar ${s.category}`} aria-pressed={i===index} onClick={()=>go(i)}><span/></button>)}</div><button className="banner-pause" aria-label={reduced?'Reprodução automática desativada por preferência de movimento':paused?'Retomar carrossel':'Pausar carrossel'} disabled={reduced} onClick={()=>{if(paused){setFocused(false);setHovered(false)}setPaused(p=>!p)}}>{paused||reduced?<Play size={15}/>:<Pause size={15}/>}</button></div>
 </section>
}

