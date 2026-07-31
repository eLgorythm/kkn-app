const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { createClient } = require('@supabase/supabase-js');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');

// Konfigurasi Firebase (sesuai web KKN)
const firebaseConfig = {
  apiKey: "AIzaSyB96Oztmn8x5k7zeytEM8Ria3KzaDGRhwM",
  authDomain: "kknunsiq-613c1.firebaseapp.com",
  projectId: "kknunsiq-613c1",
  storageBucket: "kknunsiq-613c1.firebasestorage.app",
  messagingSenderId: "58429514757",
  appId: "1:58429514757:web:5f9046a87e77f15708e86c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Konfigurasi Supabase (sesuai rundown.html)
const SUPABASE_URL = "https://mtxtfkivxmpnsakktzpw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eHRma2l2eG1wbnNha2t0enB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MDc1MDIsImV4cCI6MjEwMDk4MzUwMn0.XQul1dsbkvI96UFs93tF9mRuXHCrF5PmipGVaAizorE";
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BOT_FOOTER = `\n_— 0xfndLabs KKN System_ 🤖`;

async function fetchRundownData() {
    try {
        const querySnapshot = await getDocs(collection(db, "rundown_kkn"));
        let data = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        data.sort((a, b) => String(a.id).localeCompare(String(b.id)));
        return data;
    } catch (e) {
        console.error("Gagal ambil data Firestore:", e);
        return [];
    }
}

// Ambil data jadwal harian dari Supabase (rundown.html)
async function fetchRundownSupabase() {
    try {
        const { data, error } = await supabaseClient.from('kkn_rundown').select('*');
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("Gagal ambil data Supabase:", e);
        return [];
    }
}

function parseDateString(dateStr) {
    const months = { Jan:0, Feb:1, Mar:2, Apr:3, Mei:4, Jun:5, Jul:6, Aug:7, Sep:8, Okt:9, Nov:10, Des:11 };
    const parts = String(dateStr || '').split(",")[1]?.trim().split(" ");
    if (!parts || parts.length < 3) return 0;
    const day = parseInt(parts[0]) || 0;
    const month = months[parts[1]] ?? 0;
    const year = parseInt(parts[2]) || 0;
    return new Date(year, month, day).getTime();
}

function sortByWeekAndDate(a, b) {
    const wa = parseInt(a.week) || 0;
    const wb = parseInt(b.week) || 0;
    if (wa !== wb) return wa - wb;
    return parseDateString(a.date) - parseDateString(b.date);
}

function getMessageText(msg) {
    let m = msg.message;
    if (!m) return '';
    if (m.ephemeralMessage) m = m.ephemeralMessage.message;
    if (m.viewOnceMessage) m = m.viewOnceMessage.message;
    if (m.viewOnceMessageV2) m = m.viewOnceMessageV2.message;
    if (m.documentWithCaptionMessage) m = m.documentWithCaptionMessage.message;

    return m.conversation || 
           m.extendedTextMessage?.text || 
           m.imageMessage?.caption || 
           m.videoMessage?.caption || '';
}

async function startBot() {
    if (!fs.existsSync('auth_info_baileys')) {
        fs.mkdirSync('auth_info_baileys', { recursive: true });
    }
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus, mencoba menghubungkan kembali...', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('🤖 Bot WhatsApp KKN Desa Sokaraja berhasil terhubung!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        console.log('📥 messages.upsert event, type:', type);
        if (type !== 'notify') return;
        
        try {
            const msg = messages[0];
            const remoteJid = msg.key.remoteJid;
            if (!msg.message || remoteJid === 'status@broadcast') return;

            const messageText = getMessageText(msg);
            console.log(`💬 Pesan dari ${remoteJid} (fromMe: ${msg.key.fromMe}): "${messageText}"`);

            const text = messageText.trim();
            if (!text.startsWith('!')) return;

            console.log(`Pesan diterima dari ${remoteJid}: ${text}`);

            if (text === '!menu' || text === '!help') {
const menuMsg = `🤖 *SELAMAT DATANG DI BOT KKN DESA SOKARAJA!* 🎉\n\n` +
                                 `Halo kawan-kawan! 🙌 Bot ini siap nemenin agenda KKN kita sehari-hari. Tinggal ketik perintahnya, deh:\n\n` +
                                 `📌 *!jadwal* - Intip daftar kegiatan KKN\n` +
                                 `📌 *!jadwal [1-6]* - Lihat kegiatan per minggu\n` +
                                 `📅 *!hariini* - Ada apa aja hari ini?\n` +
                                 `📅 *!besok* - Recap dulu buat besok\n` +
                                 `📢 *!broadcast* - Info lengkap semua agenda\n` +
                                  `📩 *!kirim [nomor] [pesan]* - Kirim pesan via WA\n` +
                                  `📊 *!progress* - Cek seberapa jauh kita jalan\n` +
                                  `⚡ *!ping* - Tes koneksi bot\n` +
                                  `ℹ️ *!menu* - Bantuan ini\n\n` +
                                  `Jangan bosen, jangan lupa, see you di lapangan! 🔥` + BOT_FOOTER;
                await sock.sendMessage(remoteJid, { text: menuMsg }, { quoted: msg });
            } 
            else if (text === '!ping') {
                const start = Date.now();
                await sock.sendMessage(remoteJid, { text: '🏓 *Pong!*' }, { quoted: msg });
                const latency = Date.now() - start;
                await sock.sendMessage(remoteJid, { text: `⚡ *Latency: ${latency} ms*\n🤖 Bot KKN aktif & responsif!` + BOT_FOOTER });
            }
            else if (text === '!progress') {
                const data = await fetchRundownData();
                if (data.length === 0) {
                    await sock.sendMessage(remoteJid, { text: "⚠️ Belum ada data kegiatan di database." + BOT_FOOTER }, { quoted: msg });
                    return;
                }

                const total = data.length;
                const selesai = data.filter(i => i.status === 'Selesai').length;
                const sedang = data.filter(i => i.status === 'Sedang').length;
                const belum = total - selesai - sedang;
                const percentage = Math.round((selesai / total) * 100);

                const progMsg = `📊 *LAPORAN PROGRESS KKN DESA SOKARAJA* 📊\n\n` +
                                `Halo kawan-kawan, ini laporan perkembangan kita sejauh ini:\n\n` +
                                `✅ Selesai: *${selesai}*\n` +
                                `🔄 Sedang jalan: *${sedang}*\n` +
                                `⏳ Menunggu giliran: *${belum}*\n` +
                                `📦 Total: *${total}*\n\n` +
                                `📈 *Progress kita: ${percentage}%*\n\n` +
                                `Alhamdulillah, kita sudah melangkah sejauh ini! Tinggal *${belum}* lagi yang menanti. Selama kita kompak, semua pasti kebawa. Semangat terus, kawan-kawan! 🌟` + BOT_FOOTER;
                await sock.sendMessage(remoteJid, { text: progMsg }, { quoted: msg });
            }
else if (text.startsWith('!jadwal')) {
                 const data = await fetchRundownData();
                 if (data.length === 0) {
                     await sock.sendMessage(remoteJid, { text: "⚠️ Belum ada data kegiatan." + BOT_FOOTER }, { quoted: msg });
                     return;
                 }

                 const parts = text.split(/\s+/);
                 const weekParam = parseInt(parts[1]);

                 let filtered = data;
                 let title = "📅 *YUK INTIP JADWAL KKN DESA SOKARAJA!* 📅\n\n";
                 let opening = `Kawan-kawan, ini rangkuman kegiatan yang masih berjalan & mendatang buat kalian! Jangan sampai miss, ya! 😎\n\n`;

                 if (!isNaN(weekParam) && weekParam >= 1 && weekParam <= 6) {
                     filtered = data.filter(i => i.week === weekParam).sort(sortByWeekAndDate);
                     title = `📅 *DAFTAR KEGIATAN KKN MINGGU KE-${weekParam}* 📅\n\n`;
                     opening = `Kawan-kawan, ini serangkaian agenda minggu ke-${weekParam}! Catat baik-baik, siapkan tenaga, kita kerjakan dengan kompak! 💪\n\n`;
                 } else {
                     const active = data.filter(i => i.status !== 'Selesai').sort(sortByWeekAndDate);
                     const done = data.filter(i => i.status === 'Selesai').sort(sortByWeekAndDate);
                     filtered = [...active, ...done].slice(0, 20);
                 }

                 let jadwalMsg = title + opening;

                 if (filtered.length === 0) {
                     jadwalMsg += `Tidak ada kegiatan yang ditemukan. Sepertinya minggu ini kosong, jadikan waktu santai dulu, ya! 😄`;
                 } else {
                     filtered.forEach((item, index) => {
                         jadwalMsg += `${index + 1}. *[M${item.week}] ${item.proker}*\n`;
                         jadwalMsg += `   🗓️ ${item.date} (${item.time})\n`;
                         jadwalMsg += `   📝 ${item.activity}\n`;
                         jadwalMsg += `   Status: [${item.status || 'Belum'}]\n\n`;
                     });
                     jadwalMsg += `Jangan lupa, satu kegiatan beres = satu langkah kita maju. Semangat, kawan-kawan! 🔥`;
                 }
                 jadwalMsg += `\n_Tip: Ketik !jadwal [1-6] untuk lihat per minggu (Cth: !jadwal 4)._` + BOT_FOOTER;
                 await sock.sendMessage(remoteJid, { text: jadwalMsg }, { quoted: msg });
             }
             else if (text === '!hariini' || text === '!today') {
                 const data = await fetchRundownSupabase();
                 if (data.length === 0) {
                     await sock.sendMessage(remoteJid, { text: "⚠️ Belum ada data kegiatan di database." + BOT_FOOTER }, { quoted: msg });
                     return;
                 }

                 const today = new Date();
                 const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                 const todayName = dayNames[today.getDay()];
                 const todayStr = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

                 const todayItems = data.filter(i => i.day === todayName);

                 let hariIniMsg = `📅 *HALO KAWAN! INI JADWAL HARI INI* 🔥\n\n`;
                 hariIniMsg += `Khusus buat ${todayName}, ${todayStr.toUpperCase()} - catat baik-baik ya, jangan sampe kelewat! 😤\n\n`;

                 if (todayItems.length === 0) {
                     hariIniMsg += `Tidak ada agenda untuk hari ini. Jadikan hari istirahat yang berkualitas. 😄`;
                 } else {
                     todayItems.forEach((item, index) => {
                         hariIniMsg += `${index + 1}. *${item.title}*\n`;
                         hariIniMsg += `   ⏰ Jam: ${item.time}\n`;
                         hariIniMsg += `   📍 Lokasi: ${item.location || '-'}\n`;
                         hariIniMsg += `   👤 Penanggung Jawab: ${item.pj || '-'}\n`;
                         hariIniMsg += `   📌 Catatan: ${item.notes || '-'}\n\n`;
                     });
                     hariIniMsg += `Semangat kerjanya, kawan-kawan! Kita kumpul, kita gas, kita menang! 💪🔥`;
                 }

                 await sock.sendMessage(remoteJid, { text: hariIniMsg + BOT_FOOTER }, { quoted: msg });
             }
             else if (text === '!besok' || text === '!tomorrow') {
                 const data = await fetchRundownSupabase();
                 if (data.length === 0) {
                     await sock.sendMessage(remoteJid, { text: "⚠️ Belum ada data kegiatan di database." + BOT_FOOTER }, { quoted: msg });
                     return;
                 }

                 const today = new Date();
                 const tomorrow = new Date(today);
                 tomorrow.setDate(today.getDate() + 1);

                 const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                 const tomorrowName = dayNames[tomorrow.getDay()];
                 const tomorrowStr = tomorrow.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

                 const tomorrowItems = data.filter(i => i.day === tomorrowName);

                 let besokMsg = `📅 *SELF-REMINDER BUAT BESOK!* ⏰\n\n`;
                 besokMsg += `Jangan sampe lupa ya, besok ${tomorrowName}, ${tomorrowStr.toUpperCase()} kita ada agenda nih:\n\n`;

                 if (tomorrowItems.length === 0) {
                     besokMsg += `Tidak ada agenda untuk besok. Tanggal yang beda, semangat yang sama. ✨`;
                 } else {
                     tomorrowItems.forEach((item, index) => {
                         besokMsg += `${index + 1}. *${item.title}*\n`;
                         besokMsg += `   ⏰ Jam: ${item.time}\n`;
                         besokMsg += `   📍 Lokasi: ${item.location || '-'}\n`;
                         besokMsg += `   👤 Penanggung Jawab: ${item.pj || '-'}\n`;
                         besokMsg += `   📌 Catatan: ${item.notes || '-'}\n\n`;
                     });
                     besokMsg += `Tidur cukup, datang on time, bawa semangat! Besok kita kumpul bareng! 🚀`;
                 }

                 await sock.sendMessage(remoteJid, { text: besokMsg + BOT_FOOTER }, { quoted: msg });
             }
             else if (text === '!broadcast') {
                 const data = await fetchRundownData();
                 if (data.length === 0) {
                     await sock.sendMessage(remoteJid, { text: "⚠️ Belum ada data kegiatan untuk di-broadcast." + BOT_FOOTER }, { quoted: msg });
                     return;
                 }

                 const activeItems = data.filter(i => i.status !== 'Selesai').sort(sortByWeekAndDate);
                 const selesaiItems = data.filter(i => i.status === 'Selesai').sort(sortByWeekAndDate);

                 let broadcastMsg = `📢 *PENGUMUMAN RESMI DIVISI ACARA!* 📢\n`;
                 broadcastMsg += `==========================================\n\n`;
                 broadcastMsg += `Kawan-kawan sekalian, ini rangkuman seluruh agenda KKN Desa Sokaraja. Mohon disimak dan disesuaikan jadwalnya! 🙏\n\n`;

                 if (activeItems.length > 0) {
                     broadcastMsg += `🔴 *SEDANG BERJALAN:*\n\n`;
                     activeItems.forEach((item, index) => {
                         broadcastMsg += `${index + 1}. *[M${item.week}] ${item.proker}*\n`;
                         broadcastMsg += `   🗓️ ${item.date} (${item.time})\n`;
                         broadcastMsg += `   📝 ${item.activity}\n`;
                         broadcastMsg += `   🏷️ Prioritas: ${item.priority || 'Sedang'}\n\n`;
                     });
                 }

                 if (selesaiItems.length > 0) {
                     broadcastMsg += `✅ *TELAH SELESAI:*\n\n`;
                     broadcastMsg += `${selesaiItems.length} kegiatan sudah tuntas. Kerja bagus, kawan! 👏\n`;
                 }

                 broadcastMsg += `\n==========================================\n`;
                 broadcastMsg += `_Tetap jaga kekompakan, ya. Kita satu tim, satu tujuan! 🤝_` + BOT_FOOTER;

                 await sock.sendMessage(remoteJid, { text: broadcastMsg }, { quoted: msg });
                 await sock.sendMessage(remoteJid, { text: `✅ Broadcast berhasil dikirim!` + BOT_FOOTER }, { quoted: msg });
             }
             else if (text.startsWith('!kirim')) {
                 const parts = text.split(/\s+/);
                 if (parts.length < 2) {
                     await sock.sendMessage(remoteJid, { text: "📩 *KIRIM PESAN KE MANA, KAWAN?* 🤔\n\nFormat: !kirim [nomor_wa] [pesan]\nContoh: !kirim 082338704085 Halo, jangan lupa rapat posko besok!" + BOT_FOOTER }, { quoted: msg });
                     return;
                 }

                 let targetNumber = parts[1];
                 const pesan = parts.slice(2).join(' ') || 'Tidak ada pesan';

                 if (!targetNumber.endsWith('@s.whatsapp.net')) {
                     targetNumber = targetNumber.replace(/[^0-9]/g, '');
                     if (targetNumber.startsWith('0')) {
                         targetNumber = '62' + targetNumber.slice(1);
                     }
                     targetNumber = targetNumber + '@s.whatsapp.net';
                 }

                 try {
                     await sock.sendMessage(targetNumber, { text: pesan });
                     await sock.sendMessage(remoteJid, { text: `✅ *PESAN BERHASIL TERKIRIM!* 🎉\n\n📤 Dikirim ke: *${targetNumber}*\n📝 Isi pesan:\n_"${pesan}"_\n\nSiap, kawan! Semoga dibalas dengan kabar baik! 😄` + BOT_FOOTER }, { quoted: msg });
                 } catch (sendErr) {
                     console.error("Gagal kirim:", sendErr);
                     await sock.sendMessage(remoteJid, { text: "❌ *Yah, gagal terkirim!* 😅\n\nNomor mungkin tidak valid atau belum pernah di-save di kontak. Coba periksa lagi nomornya, ya!" + BOT_FOOTER }, { quoted: msg });
                 }
             }
        } catch (err) {
            console.error("Error handling message:", err);
        }
    });
}

startBot();
