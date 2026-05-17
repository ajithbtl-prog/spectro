// ─────────────────────────────────────────────────────────────
// REFERENCE SPECTRAL DATABASE
// Replace nitrogen/phosphorus/potassium arrays later
// with your measured AS7265X values
// ─────────────────────────────────────────────────────────────

const REFS = {

// AIR BASELINE (closed lid)
air: [
1089,954,2058,1030,1202,1308,
1360,1503,933,272,236,75,
1222,379,142,105,248,600
],

// PURE WATER
water: [con``
2550,1177,2925,1024,1261,1515,
1574,1584,905,342,218,76,
1184,400,132,110,244,770
],

// MIXED FERTILIZER
fertiliser: [
1541,975,1893,847,884,1271,
1270,1212,853,229,157,68,
1242,329,123,99,203,772
],

// NITROGEN SAMPLE
nitrogen: [
544,322,831,390,547,745,
701,828,590,195,209,62,
805,307,120,90,183,717
],

// PHOSPHORUS SAMPLE
phosphorus: [
1056,504,1312,381,488,666,
597,670,503,152,166,60,
565,235,91,70,128,486
],

// POTASSIUM SAMPLE
potassium: [
960,421,1082,278,311,394,
307,344,311,74,85,52,
269,109,50,42,52,142
],
};

// ─────────────────────────────────────────────────────────────
// CLASSIFICATION METADATA
// ─────────────────────────────────────────────────────────────

const REF_META = {

air: {
label:"Air",
emoji:"🌬",
desc:"Closed chamber air baseline",
col:"#94a3b8",
hint:"No sample detected. Ambient optical baseline."
},

water: {
label:"Water",
emoji:"💧",
desc:"Pure water sample",
col:"#38bdf8",
hint:"Pure water detected with strong VIS reflectance."
},

fertiliser: {
label:"Fertiliser",
emoji:"🌿",
desc:"Mixed fertilizer solution",
col:"#f59e0b",
hint:"Nutrient-rich fertilizer spectral response detected."
},

nitrogen: {
label:"Nitrogen",
emoji:"🟢",
desc:"Nitrogen dominant sample",
col:"#22c55e",
hint:"Nitrogen absorption characteristics detected."
},

phosphorus: {
label:"Phosphorus",
emoji:"🟠",
desc:"Phosphorus dominant sample",
col:"#fb923c",
hint:"Phosphate spectral signature detected."
},

potassium: {
label:"Potassium",
emoji:"🟣",
desc:"Potassium dominant sample",
col:"#a855f7",
hint:"Potassium spectral characteristics detected."
},
};

// ─────────────────────────────────────────────────────────────
// COSINE SIMILARITY
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// NORMALIZED COSINE SIMILARITY
// ─────────────────────────────────────────────────────────────

function normalize(arr){

  const min = Math.min(...arr);
  const max = Math.max(...arr);

  return arr.map(v =>
    (v - min) / (max - min + 1e-6)
  );
}

function cosineSim(a,b){

  const naArr = normalize(a);
  const nbArr = normalize(b);

  const dot = naArr.reduce(
    (s,v,i)=>s+v*nbArr[i],
    0
  );

  const na = Math.sqrt(
    naArr.reduce((s,v)=>s+v*v,0)
  );

  const nb = Math.sqrt(
    nbArr.reduce((s,v)=>s+v*v,0)
  );

  return na===0 || nb===0
    ? 0
    : dot/(na*nb);
}

// ─────────────────────────────────────────────────────────────
// LIVE SAMPLE CLASSIFICATION
// ─────────────────────────────────────────────────────────────

function classifyADC(adc){

if(!adc || adc.every(v=>v===0))
return null;

const scores = Object.fromEntries(

```
Object.entries(REFS).map(([k,ref])=>[
  k,
  Math.round(cosineSim(adc,ref)*10000)/100
])
```

);

const best = Object
.entries(scores)
.sort((a,b)=>b[1]-a[1])[0][0];

const sorted = Object.values(scores).sort((a,b)=>a-b);

const diff = Math.max(...Object.values(scores))
- sorted[sorted.length-2];

const confidence = Math.round(
Math.min(99, diff*8)

);
console.log("Scores:", scores);
console.log("Detected:", best);
return {
best,
scores,
confidence
};
}
// ─────────────────────────────────────────────────────────────
// SMART NPK ESTIMATION
// ─────────────────────────────────────────────────────────────

function computeSmartNPK(adc, refs) {

  // no signal
  if (!adc || adc.every(v => v === 0)) {
    return { N:0, P:0, K:0 };
  }

  // similarity score
  const sim = {};

  Object.entries(refs).forEach(([k,v])=>{
    sim[k] = cosineSim(adc,v);
  });

  // best matching sample
  const best = Object
    .entries(sim)
    .sort((a,b)=>b[1]-a[1])[0][0];

  console.log("Detected Sample:", best);

  // ───────── AIR ─────────
  if(best === "air"){

    return {
      N:0,
      P:0,
      K:0
    };
  }

  // ───────── WATER ─────────
  if(best === "water"){

    return {
      N:5,
      P:3,
      K:4
    };
  }

  // ───────── NITROGEN ─────────
  if(best === "nitrogen"){

    return {
      N:400,
      P:20,
      K:30
    };
  }

  // ───────── PHOSPHORUS ─────────
  if(best === "phosphorus"){

    return {
      N:25,
      P:200,
      K:40
    };
  }

  // ───────── POTASSIUM ─────────
  if(best === "potassium"){

    return {
      N:20,
      P:30,
      K:300
    };
  }

  // ───────── MIXED FERTILIZER ─────────
  if(best === "fertiliser"){

    return {
      N:300,
      P:180,
      K:250
    };
  }

  // fallback
  return {
    N:0,
    P:0,
    K:0
  };
}


