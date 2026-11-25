const $=(s,r=document)=>r.querySelector(s);
const rp=n=>'Rp'+Math.round(n).toLocaleString('id-ID');
const DB={get:()=>JSON.parse(localStorage.getItem('orders')||'[]'),set:v=>localStorage.setItem('orders',JSON.stringify(v))};
const STATUS=['Diterima','Diproses','Selesai','Siap Diambil'];
// Harga contoh per lembar (ubah sesuai harga mitra)
const HARGA={fotocopy:{bw:300,color:1500},print:{bw:500,color:2000},scan:{bw:2000,color:2000},laminating:{bw:3000,color:3000}};
const UKURAN={A4:1,F4:1.2,A3:2};
const JILID={tanpa:0,lakban:3000,spiral:7000,hardcover:25000};

// Navbar & footer
$('#nav').innerHTML=`<nav><div class="wrap"><a class="logo" href="index.html"><i></i>Karya Fotocopy</a>
<a href="index.html">Beranda</a><a href="index.html#harga">Harga</a><a href="lacak.html">Lacak Pesanan</a><a href="admin.html">Mitra</a>
<a class="btn sm" href="pesan.html">Buat pesanan</a></div></nav>`;
$('#foot').innerHTML=`<footer><div class="wrap"><b>Karya Fotocopy</b><br>Jl. Karya No.110 Karang Berombak, Medan<br>Buka setiap hari 07.30 - 22.00 WIB. Pembayaran tunai dan QRIS.</div></footer>`;

// Tabel harga (beranda)
if($('#hargaBody'))$('#hargaBody').innerHTML=Object.entries(HARGA).map(([k,v])=>`<tr><td>${k[0].toUpperCase()+k.slice(1)}</td><td>${rp(v.bw)}</td><td>${rp(v.color)}</td></tr>`).join('');

// Form pemesanan + kalkulator
const f=$('#orderForm');
if(f){
  const hitung=()=>{
    const d=Object.fromEntries(new FormData(f));
    const lembar=(+d.halaman||0)*(+d.salinan||0);
    const sub=lembar*HARGA[d.layanan][d.warna]*UKURAN[d.ukuran]*(d.duplex?0.9:1);
    const total=sub+JILID[d.jilid];
    $('#sumRinci').innerHTML=`${lembar} lembar × ${rp(HARGA[d.layanan][d.warna]*UKURAN[d.ukuran])}<br>Jilid: ${rp(JILID[d.jilid])}`;
    $('#total').textContent=rp(total);return total;
  };
  f.addEventListener('input',hitung);hitung();
  f.addEventListener('submit',e=>{
    e.preventDefault();const d=Object.fromEntries(new FormData(f));
    const file=f.file.files[0];
    if(!file)return alert('Unggah dokumen terlebih dahulu.');
    const kode='KF-'+Date.now().toString().slice(-6);
    DB.set([...DB.get(),{kode,nama:d.nama,hp:d.hp,layanan:d.layanan,detail:`${d.ukuran}, ${d.warna==='bw'?'Hitam putih':'Warna'}, ${d.salinan}x, jilid ${d.jilid}`,file:file.name,bayar:d.bayar,total:hitung(),status:0,waktu:new Date().toISOString()}]);
    $('#hasil').innerHTML=`<div class="card"><h3>Pesanan terkirim</h3><p>Kode pesanan Anda:</p><p class="total">${kode}</p><p>Simpan kode ini untuk <a href="lacak.html?kode=${kode}">melacak pesanan</a>.</p></div>`;
    f.reset();hitung();
  });
}

// Lacak pesanan
const lf=$('#lacakForm');
if(lf){
  const cari=k=>{
    const o=DB.get().find(x=>x.kode.toLowerCase()===k.trim().toLowerCase());
    $('#lacakHasil').innerHTML=o?`<div class="card"><h3>${o.kode} · ${o.nama}</h3><p>${o.layanan} — ${o.detail}</p>
    <div class="steps">${STATUS.map((s,i)=>`<div class="${i<=o.status?'on':''}">${s}</div>`).join('')}</div><p>Total ${rp(o.total)} (${o.bayar})</p></div>`
    :'<p>Kode tidak ditemukan. Periksa kembali kode pesanan Anda.</p>';
  };
  lf.addEventListener('submit',e=>{e.preventDefault();cari(lf.kode.value)});
  const k=new URLSearchParams(location.search).get('kode');if(k){lf.kode.value=k;cari(k)}
}

// Dashboard mitra
if($('#adminBody')){
  const render=()=>{
    const q=$('#cari').value.toLowerCase(),fs=$('#fStatus').value,all=DB.get();
    const rows=all.filter(o=>(!fs||STATUS[o.status]===fs)&&(o.kode+o.nama).toLowerCase().includes(q));
    $('#adminBody').innerHTML=rows.map(o=>`<tr><td>${o.kode}</td><td>${o.nama}</td><td>${o.layanan}<br><small>${o.detail}</small></td><td>${o.file}</td><td>${rp(o.total)}<br><small>${o.bayar}</small></td>
    <td><select data-k="${o.kode}">${STATUS.map((s,i)=>`<option value="${i}" ${i==o.status?'selected':''}>${s}</option>`).join('')}</select></td></tr>`).join('')||'<tr><td colspan="6">Belum ada pesanan.</td></tr>';
    const hari=all.filter(o=>o.waktu.slice(0,10)===new Date().toISOString().slice(0,10));
    const sum=m=>hari.filter(o=>o.bayar===m).reduce((a,o)=>a+o.total,0);
    $('#sPesanan').textContent=hari.length;$('#sTunai').textContent=rp(sum('Tunai'));$('#sQris').textContent=rp(sum('QRIS'));
    $('#sProses').textContent=all.filter(o=>o.status<2).length;
  };
  $('#adminBody').addEventListener('change',e=>{
    const all=DB.get();all.find(o=>o.kode===e.target.dataset.k).status=+e.target.value;DB.set(all);render();
  });
  $('#cari').oninput=$('#fStatus').onchange=render;render();
}

// Widget chatbot (jawaban berbasis kata kunci; ganti dengan API AI di backend)
document.body.insertAdjacentHTML('beforeend',`<button id="chatBtn" aria-label="Buka chat"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg></button>
<div id="chatBox"><div class="top">Asisten Karya Fotocopy</div><div id="chatLog"><div class="m bot">Halo! Saya asisten Karya Fotocopy. Ada yang bisa dibantu?</div></div>
<div class="qr"><button>Cek harga</button><button>Jam buka</button><button>Cara pesan</button><button>Status pesanan</button></div>
<form id="chatForm" style="display:flex;gap:6px;padding:8px"><input id="chatIn" placeholder="Tulis pertanyaan..."><button class="btn sm">Kirim</button></form></div>`);
const jawab=t=>{t=t.toLowerCase();
  if(/harga|biaya/.test(t))return 'Fotocopy hitam putih '+rp(HARGA.fotocopy.bw)+'/lembar, warna '+rp(HARGA.fotocopy.color)+'. Lihat tabel lengkap di Beranda.';
  if(/jam|buka/.test(t))return 'Kami buka setiap hari pukul 07.30 - 22.00 WIB.';
  if(/cara|pesan/.test(t))return 'Pilih layanan, unggah dokumen, pilih pembayaran (Tunai/QRIS), lalu simpan kode pesanan.';
  if(/status|lacak/.test(t))return 'Buka halaman Lacak Pesanan dan masukkan kode pesanan Anda.';
  return 'Maaf, saya belum paham. Coba tanya soal harga, jam buka, cara pesan, atau status pesanan.'};
const kirim=t=>{const l=$('#chatLog');l.insertAdjacentHTML('beforeend',`<div class="m me"></div><div class="m bot"></div>`);
  l.children[l.children.length-2].textContent=t;l.lastChild.textContent=jawab(t);l.scrollTop=l.scrollHeight};
$('#chatBtn').onclick=()=>$('#chatBox').classList.toggle('open');
$('.qr').onclick=e=>{if(e.target.tagName==='BUTTON')kirim(e.target.textContent)};
$('#chatForm').onsubmit=e=>{e.preventDefault();if($('#chatIn').value.trim())kirim($('#chatIn').value);$('#chatIn').value=''};