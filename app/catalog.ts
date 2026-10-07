export const products = [
 {id:'caju',name:'Castanha de caju',subtitle:'Torrada • sem sal',category:'Castanhas',weight:'200 g',price:2290,tag:'Queridinho',image:'/images/caju.jpg',description:'Crocância e sabor para acompanhar suas pausas. Uma opção para petiscar ou dar um toque especial às receitas.',ingredients:'Castanha de caju. Contém castanhas.'},
 {id:'granola',name:'Granola artesanal',subtitle:'Aveia, sementes e castanhas',category:'Grãos e cereais',weight:'300 g',price:1890,tag:'Para começar o dia',image:'/images/granola.jpg?v=2',description:'Um mix crocante para sua tigela de frutas ou iogurte. Feita para trazer mais textura ao café da manhã.',ingredients:'Aveia, sementes e castanhas. Consulte o rótulo quanto a glúten.'},
 {id:'hibisco',name:'Chá de hibisco',subtitle:'Flores desidratadas',category:'Chás e ervas',weight:'50 g',price:1290,tag:'Uma pausa para você',image:'/images/hibisco.jpg',description:'Flores de hibisco para uma infusão de cor intensa e sabor levemente ácido. Experimente quente ou com gelo.',ingredients:'Flores de hibisco desidratadas.'},
 {id:'mix',name:'Mix de castanhas',subtitle:'Uma seleção cheia de sabor',category:'Castanhas',weight:'200 g',price:2490,tag:'Seleção Nativa',image:'/images/mix.jpg',description:'Castanhas e frutas secas para levar com você e compartilhar. Um pouco de cada sabor em uma só seleção.',ingredients:'Castanha de caju, amêndoas, nozes e uvas-passas. Contém castanhas.'},
 {id:'aveia',name:'Aveia em flocos',subtitle:'Versátil para suas receitas',category:'Grãos e cereais',weight:'500 g',price:990,tag:'Na despensa',image:'/images/aveia.jpg',description:'Do mingau às receitas de forno: um ingrediente simples que faz parte de muitos momentos do dia.',ingredients:'Aveia em flocos. Consulte o rótulo quanto a glúten.'},
 {id:'frutas',name:'Damasco seco',subtitle:'Sabor e doçura natural',category:'Frutas secas',weight:'150 g',price:1690,tag:'Doçura natural',image:'/images/frutas.jpg',description:'Sabores intensos para um lanche ou para acompanhar sua seleção de castanhas.',ingredients:'Damasco seco. Consulte o rótulo para sulfitos.'}
];
export const money=(cents:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
export const statuses=['Novo','Em preparo','Pronto','Concluído','Cancelado'];


