import { Text } from './AppText';
import { Button } from './ActionButton';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { callable as httpsCallable, firebaseClient, readableError } from '../lib/firebase';
import { ui, statusLabel } from '../lib/ui';

export function VolunteerApplication({ status }: { status?: string }) {
  const [name, setName] = useState(''), [phone, setPhone] = useState(''), [experience, setExperience] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [sent, setSent] = useState(false);
  async function submit() {
    setBusy(true); setError('');
    try { await httpsCallable(firebaseClient().functions, 'applyVolunteer', { timeout: 15000 })({ fullName: name.trim(), phone: phone.replace(/[\s().-]/g, ''), experience: experience.trim() }); setSent(true); }
    catch (err) { setError(readableError(err)); } finally { setBusy(false); }
  }
  return <View style={ui.card}><Text style={ui.heading}>Đăng ký tham gia hỗ trợ</Text>
    <Text style={ui.body}>Chọn khu vực TNV không tự cấp quyền nhận ca. Nhóm quản trị cần xem xét đơn trước; đây không phải chứng nhận hành nghề y tế.</Text>
    {(status === 'pending' || sent) ? <Text style={ui.success}>Đã gửi đăng ký · đang chờ quản trị duyệt. Lần đăng nhập sau EHIS vẫn mở khu vực Tình nguyện viên của bạn.</Text> : <>
      {!!status && <Text>{statusLabel[status] || status}. Có thể bổ sung thông tin và gửi lại.</Text>}
      <Text>Họ và tên</Text><TextInput accessibilityLabel="Họ tên TNV" value={name} onChangeText={setName} maxLength={100} style={ui.input} editable={!busy} />
      <Text>Số điện thoại liên hệ</Text><TextInput accessibilityLabel="Số điện thoại TNV" value={phone} onChangeText={setPhone} maxLength={40} keyboardType="phone-pad" style={ui.input} editable={!busy} />
      <Text>Kinh nghiệm/đào tạo liên quan · thông tin tự khai</Text><TextInput accessibilityLabel="Kinh nghiệm TNV" value={experience} onChangeText={setExperience} multiline maxLength={500} style={ui.input} editable={!busy} />
      <Button title={busy ? 'Đang gửi…' : 'Gửi đăng ký TNV'} disabled={busy || !name.trim() || !phone.trim() || !experience.trim()} onPress={submit} />
    </>}{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
  </View>;
}
