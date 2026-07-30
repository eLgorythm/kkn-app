const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
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
                const menuMsg = `🤖 *MENU BOT KKN DESA SOKARAJA*\n\n` +
                                `📌 *!jadwal* - Menampilkan daftar kegiatan KKN\n` +
                                `📊 *!progress* - Menampilkan statistik & % progress\n` +
                                `ℹ️ *!menu* - Menampilkan bantuan ini\n\n` +
                                `_0xfndLabs KKN System_`;
                await sock.sendMessage(remoteJid, { text: menuMsg }, { quoted: msg });
            } 
            else if (text === '!progress') {
                const data = await fetchRundownData();
                if (data.length === 0) {
                    await sock.sendMessage(remoteJid, { text: "⚠️ Belum ada data kegiatan di database." }, { quoted: msg });
                    return;
                }

                const total = data.length;
                const selesai = data.filter(i => i.status === 'Selesai').length;
                const sedang = data.filter(i => i.status === 'Sedang').length;
                const belum = total - selesai - sedang;
                const percentage = Math.round((selesai / total) * 100);

                const progMsg = `📊 *PROGRESS KKN DESA SOKARAJA*\n\n` +
                                `✅ Selesai: *${selesai}*\n` +
                                `🔄 Sedang: *${sedang}*\n` +
                                `⏳ Belum: *${belum}*\n` +
                                `📦 Total Kegiatan: *${total}*\n\n` +
                                `📈 *Total Selesai: ${percentage}%*`;
                await sock.sendMessage(remoteJid, { text: progMsg }, { quoted: msg });
            }
            else if (text.startsWith('!jadwal')) {
                const data = await fetchRundownData();
                if (data.length === 0) {
                    await sock.sendMessage(remoteJid, { text: "⚠️ Belum ada data kegiatan." }, { quoted: msg });
                    return;
                }

                const parts = text.split(/\s+/);
                const weekParam = parseInt(parts[1]);

                let filtered = data;
                let title = "📅 *DAFTAR KEGIATAN KKN (Mendatang)*\n\n";

                if (!isNaN(weekParam) && weekParam >= 1 && weekParam <= 6) {
                    filtered = data.filter(i => i.week === weekParam);
                    title = `📅 *DAFTAR KEGIATAN KKN MINGGU KE-${weekParam}*\n\n`;
                } else {
                    // Show up to 20 items (prioritizing Belum/Sedang, filling with Selesai up to 20)
                    const active = data.filter(i => i.status !== 'Selesai');
                    const done = data.filter(i => i.status === 'Selesai');
                    filtered = [...active, ...done].slice(0, 20);
                }

                let jadwalMsg = title;

                if (filtered.length === 0) {
                    jadwalMsg += `Tidak ada kegiatan yang ditemukan.`;
                } else {
                    filtered.forEach((item, index) => {
                        jadwalMsg += `${index + 1}. *[M${item.week}] ${item.proker}*\n`;
                        jadwalMsg += `   🗓️ ${item.date} (${item.time})\n`;
                        jadwalMsg += `   📝 ${item.activity}\n`;
                        jadwalMsg += `   Status: [${item.status || 'Belum'}]\n\n`;
                    });
                }
                jadwalMsg += `_Tip: Ketik !jadwal [1-6] untuk lihat per minggu (Cth: !jadwal 4)._`;
                await sock.sendMessage(remoteJid, { text: jadwalMsg }, { quoted: msg });
            }
        } catch (err) {
            console.error("Error handling message:", err);
        }
    });
}

startBot();
