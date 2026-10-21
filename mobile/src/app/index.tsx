import { useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const [status, setStatus] = useState('Chưa kiểm tra kết nối backend.');
  const [busy, setBusy] = useState(false);
  async function checkBackend() {
    const url = process.env.EXPO_PUBLIC_HEALTH_URL;
    if (!url) { setStatus('Chưa cấu hình EXPO_PUBLIC_HEALTH_URL trong .env.local.'); return; }
    setBusy(true);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const result = await response.json();
      if (!response.ok || result.service !== 'ehis-next' || result.status !== 'ok') throw new Error('Unexpected backend');
      setStatus('Đã kết nối health endpoint. Chưa xác nhận Auth hoặc Firestore.');
    } catch {
      setStatus('Không kết nối được. Kiểm tra emulator/cloud URL và địa chỉ LAN của laptop.');
    } finally { setBusy(false); }
  }
  return <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.eyebrow}>EMERGENCY HEALTHCARE INDIVIDUAL SMART CARD</Text>
    <Text style={styles.title}>EHIS Next</Text>
    <Text style={styles.intro}>Một app chung. Hai khu vực chức năng. Firebase riêng của nhóm.</Text>
    <View style={styles.notice}><Text>Bộ khởi đầu để phát triển và học. Chưa có luồng cấp cứu hoàn chỉnh.</Text></View>
    <Link href="/patient" asChild><Pressable style={styles.card}>
      <Text style={styles.cardTitle}>Bệnh nhân →</Text><Text>Hồ sơ · thẻ QR · NFC</Text>
    </Pressable></Link>
    <Link href="/volunteer" asChild><Pressable style={styles.card}>
      <Text style={styles.cardTitle}>Tình nguyện viên →</Text><Text>Lời mời · nhận ca · dẫn đường</Text>
    </Pressable></Link>
    <Pressable disabled={busy} onPress={checkBackend} style={[styles.button, busy && { opacity: 0.6 }]}>
      <Text style={styles.buttonText}>{busy ? 'Đang kiểm tra…' : 'Kiểm tra backend'}</Text>
    </Pressable>
    <Text accessibilityLiveRegion="polite" style={styles.status}>{status}</Text>
  </ScrollView>;
}
const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 24, gap: 20, backgroundColor: '#f4f8f6' },
  eyebrow: { color: '#256a62', fontSize: 11, letterSpacing: 1.5, fontWeight: '700' },
  title: { fontSize: 44, fontWeight: '800', color: '#123c37' },
  intro: { fontSize: 18, lineHeight: 27, color: '#47665f' },
  notice: { padding: 18, backgroundColor: '#fff0ce', borderRadius: 16 },
  card: { padding: 24, borderRadius: 20, backgroundColor: '#fff', gap: 8 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#123c37' },
  button: { padding: 18, borderRadius: 16, backgroundColor: '#0b6358', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  status: { color: '#47665f', lineHeight: 23 },
});
