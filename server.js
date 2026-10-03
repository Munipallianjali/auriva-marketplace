
const express=require("express");
const cors=require("cors");
const fs=require("fs");
const path=require("path");
const {v4:uuid}=require("uuid");
const app=express();
const PORT=process.env.PORT||3000;
const DATA=path.join(__dirname,"data.json");

app.use(cors()); app.use(express.json()); app.use(express.static(path.join(__dirname,"public")));

const seed={
 products:[
  {id:"p1",name:"Pearl Drop Earrings",category:"Earrings",price:599,oldPrice:899,seller:"Luna Studio",rating:4.9,stock:28,trend:92,emoji:"🤍",pattern:"pearl"},
  {id:"p2",name:"Moon Charm Necklace",category:"Necklaces",price:749,oldPrice:999,seller:"Mira Finds",rating:4.8,stock:19,trend:88,emoji:"🌙",pattern:"moon"},
  {id:"p3",name:"Rose Gold Cuff",category:"Bracelets",price:449,oldPrice:699,seller:"Aster & Co.",rating:4.7,stock:35,trend:81,emoji:"✨",pattern:"rose"},
  {id:"p4",name:"Daisy Everyday Ring",category:"Rings",price:299,oldPrice:449,seller:"Petal Lane",rating:4.9,stock:42,trend:79,emoji:"🌼",pattern:"daisy"},
  {id:"p5",name:"Satin Bow Clip Set",category:"Hair",price:349,oldPrice:499,seller:"Bow & Bloom",rating:4.8,stock:12,trend:95,emoji:"🎀",pattern:"bow"},
  {id:"p6",name:"Mini Shoulder Bag",category:"Bags",price:899,oldPrice:1299,seller:"Naya Edit",rating:4.6,stock:9,trend:91,emoji:"👜",pattern:"bag"},
  {id:"p7",name:"Initial Charm Bracelet",category:"Gifts",price:549,oldPrice:799,seller:"Little Letters",rating:4.9,stock:22,trend:86,emoji:"💖",pattern:"heart"},
  {id:"p8",name:"Crystal Hair Claw",category:"Hair",price:279,oldPrice:399,seller:"Shine Club",rating:4.7,stock:7,trend:90,emoji:"💎",pattern:"crystal"}
 ],
 sellers:[
  {id:"s1",name:"Luna Studio",city:"Hyderabad",products:12,sales:38400,status:"Active"},
  {id:"s2",name:"Mira Finds",city:"Bengaluru",products:8,sales:27100,status:"Active"},
  {id:"s3",name:"Aster & Co.",city:"Mumbai",products:16,sales:42200,status:"Active"},
  {id:"s4",name:"Petal Lane",city:"Hyderabad",products:7,sales:19800,status:"Review"}
 ],
 orders:[
  {id:"AU1048",customer:"Priya",product:"Pearl Drop Earrings",amount:599,status:"Delivered",city:"Hyderabad"},
  {id:"AU1047",customer:"Sneha",product:"Satin Bow Clip Set",amount:299,status:"Shipped",city:"Bengaluru"},
  {id:"AU1046",customer:"Ananya",product:"Moon Charm Necklace",amount:749,status:"Processing",city:"Hyderabad"},
  {id:"AU1045",customer:"Kavya",product:"Mini Shoulder Bag",amount:899,status:"Delivered",city:"Chennai"},
  {id:"AU1044",customer:"Megha",product:"Initial Charm Bracelet",amount:549,status:"Delivered",city:"Pune"}
 ],
 customers:1296,
 events:[
  {type:"view",productId:"p1",value:1},{type:"view",productId:"p5",value:1},
  {type:"cart",productId:"p5",value:1},{type:"purchase",productId:"p5",value:1},
  {type:"view",productId:"p6",value:1},{type:"purchase",productId:"p1",value:1}
 ]
};

function load(){if(!fs.existsSync(DATA))fs.writeFileSync(DATA,JSON.stringify(seed,null,2));return JSON.parse(fs.readFileSync(DATA))}
function save(d){fs.writeFileSync(DATA,JSON.stringify(d,null,2))}
let db=load();

function aiInsights(){
 const sales=db.orders.reduce((a,o)=>a+o.amount,0);
 const counts={}; db.orders.forEach(o=>counts[o.product]=(counts[o.product]||0)+1);
 const top=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
 const low=db.products.filter(p=>p.stock<10);
 const hot=[...db.products].sort((a,b)=>b.trend-a.trend).slice(0,3);
 const avg=sales/(db.orders.length||1);
 return {
  summary:`Auriva AI scanned ${db.products.length} products, ${db.orders.length} recent orders and ${db.sellers.length} sellers.`,
  revenueScore:Math.min(99,Math.round(55+sales/80)),
  demandScore:Math.round(db.products.reduce((a,p)=>a+p.trend,0)/db.products.length),
  riskScore:Math.min(95,Math.round(30+low.length*12)),
  insights:[
   {type:"opportunity",title:"Trend cluster detected",text:`${hot[0].name}, ${hot[1].name} and ${hot[2].name} have the strongest demand signals. Consider a themed collection around these styles.`},
   {type:"inventory",title:"Low-stock alert",text:low.length?`${low.map(p=>p.name).join(", ")} are below 10 units. Replenishment could prevent missed sales.`:"No critical low-stock products detected."},
   {type:"pricing",title:"Bundle opportunity",text:`Average recent order value is ₹${Math.round(avg)}. Bundling a ₹299–₹599 accessory with a higher-value item could lift basket size.`},
   {type:"retention",title:"Personalization idea",text:"Customers browsing hair accessories can receive a 'complete the look' recommendation with earrings or bracelets."}
  ],
  hotProducts:hot.map(p=>({name:p.name,trend:p.trend,stock:p.stock})),
  categoryPulse:Object.entries(db.products.reduce((a,p)=>(a[p.category]=(a[p.category]||0)+p.trend,a),{})).sort((a,b)=>b[1]-a[1])
 };
}

app.get("/api/health",(req,res)=>res.json({ok:true,service:"AURIVA API",time:new Date().toISOString()}));
app.get("/api/products",(req,res)=>res.json(db.products));
app.get("/api/sellers",(req,res)=>res.json(db.sellers));
app.get("/api/orders",(req,res)=>res.json(db.orders));
app.get("/api/dashboard",(req,res)=>{
 const revenue=db.orders.reduce((a,o)=>a+o.amount,0);
 res.json({revenue,orders:db.orders.length,sellers:db.sellers.filter(s=>s.status==="Active").length,customers:db.customers,products:db.products.length,ai:aiInsights()});
});
app.get("/api/ai/analysis",(req,res)=>res.json(aiInsights()));

app.post("/api/products",(req,res)=>{
 const {name,category,price,oldPrice,seller,stock,emoji="✨"}=req.body;
 if(!name||!category||!price||!seller)return res.status(400).json({error:"name, category, price and seller are required"});
 const p={id:uuid().slice(0,8),name,category,price:Number(price),oldPrice:Number(oldPrice||price),seller,stock:Number(stock||0),rating:5,trend:Math.round(60+Math.random()*35),emoji,pattern:"new"};
 db.products.unshift(p);save(db);res.status(201).json(p);
});
app.post("/api/sellers",(req,res)=>{
 const {name,city}=req.body;if(!name||!city)return res.status(400).json({error:"name and city are required"});
 const s={id:uuid().slice(0,8),name,city,products:0,sales:0,status:"Review"};db.sellers.push(s);save(db);res.status(201).json(s);
});
app.post("/api/orders",(req,res)=>{
 const {customer,productId,city}=req.body;const p=db.products.find(x=>x.id===productId);
 if(!p)return res.status(404).json({error:"Product not found"});
 if(p.stock<1)return res.status(409).json({error:"Out of stock"});
 p.stock--;
 const o={id:"AU"+Math.floor(1000+Math.random()*8999),customer:customer||"Guest",product:p.name,amount:p.price,status:"Processing",city:city||"Hyderabad"};
 db.orders.unshift(o);db.events.push({type:"purchase",productId:p.id,value:1});save(db);res.status(201).json(o);
});
app.post("/api/ai/ask",(req,res)=>{
 const q=(req.body.question||"").toLowerCase();
 const a=aiInsights();
 let answer;
 if(q.includes("sell")||q.includes("product")) answer=`Based on current signals, prioritize ${a.hotProducts.map(x=>x.name).join(", ")} and create a limited themed drop.`;
 else if(q.includes("stock")||q.includes("inventory")) answer=a.insights[1].text;
 else if(q.includes("price")||q.includes("pricing")) answer=a.insights[2].text;
 else answer=`Auriva AI recommends focusing on ${a.hotProducts[0].name}, improving cross-sells, and monitoring low-stock items.`;
 res.json({answer,confidence:Math.round(84+Math.random()*12),generatedAt:new Date().toISOString()});
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`AURIVA running at http://localhost:${PORT}`));
