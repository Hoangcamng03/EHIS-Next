import { TextInput } from './AppTextInput';
import { Text } from './AppText';
import { Button } from './ActionButton';
import { CheckboxRow } from './CheckboxRow';
import { useState } from 'react';
import { View } from 'react-native';

import { callable, firebaseClient, readableError } from '../lib/firebase';
import { ui, statusLabel } from '../lib/ui';

const levels = {
  first_aid: 'Đào tạo sơ cứu',
  clinical_student: 'Sinh viên có thực hành lâm sàng',
  clinical_staff: 'Nhân sự có thực hành lâm sàng',
};
export function VolunteerApplication({
  status,
  initial,
}: {
  status?: string;
  initial?: Record<string, unknown>;
}) {
  const [form, setForm] = useState(() => {
    const defaults = {
      fullName: '',
      phone: '',
      experience: '',
      trainingLevel: 'first_aid',
      clinicalMonths: '0',
      homeAddress: '',
      workAddress: '',
      serviceArea: '',
    };
    for (const key of Object.keys(defaults) as (keyof typeof defaults)[])
      if (
        typeof initial?.[key] === 'string' ||
        (key === 'clinicalMonths' && typeof initial?.[key] === 'number')
      )
        defaults[key] = String(initial![key]);
    return defaults;
  });
  const [skills, setSkills] = useState<string[]>(
    Array.isArray(initial?.specialties) ? (initial.specialties as string[]) : ['basic_aid'],
  );
  const skillLabels = {
    basic_aid: 'Sơ cứu cơ bản',
    cpr: 'Hồi sinh tim phổi',
    respiratory: 'Hỗ trợ hô hấp',
    trauma: 'Chảy máu / chấn thương',
  };
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [sent, setSent] = useState(false),
    [editing, setEditing] = useState(status !== 'pending');
  function field(
    key: keyof typeof form,
    label: string,
    maxLength: number,
    keyboardType: 'default' | 'phone-pad' | 'email-address' | 'number-pad' = 'default',
  ) {
    return (
      <View style={{ gap: 4 }}>
        <Text>{label}</Text>
        <TextInput
          accessibilityLabel={label}
          value={form[key]}
          onChangeText={(value) => setForm((previous) => ({ ...previous, [key]: value }))}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          style={ui.input}
          editable={!busy}
          multiline={key === 'experience'}
        />
      </View>
    );
  }
  async function submit() {
    setBusy(true);
    setError('');
    try {
      await callable(firebaseClient().functions, 'applyVolunteer', { timeout: 15000 })({
        ...form,
        specialties: skills,
        phone: form.phone.replace(/[\s().-]/g, ''),
        clinicalMonths: Number(form.clinicalMonths),
      });
      setSent(true);
      setEditing(false);
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={ui.card}>
      <Text style={ui.heading}>Đăng ký tình nguyện viên</Text>
      <Text style={ui.body}>Gửi hồ sơ và kỹ năng. Admin xác minh rồi mở quyền nhận ca.</Text>
      {(status === 'pending' || sent) && (
        <>
          <Text style={ui.success}>Đã gửi hồ sơ · Chờ admin duyệt.</Text>
          <Button
            variant="secondary"
            title={editing ? 'Ẩn biểu mẫu' : 'Sửa và gửi lại hồ sơ'}
            onPress={() => setEditing((value) => !value)}
            disabled={busy}
          />
        </>
      )}
      {editing && (
        <>
          {!!status && status !== 'pending' && (
            <Text>{statusLabel[status] || status}. Bạn có thể gửi lại.</Text>
          )}
          <Text style={ui.heading}>1. Thông tin của bạn</Text>
          {field('fullName', 'Họ và tên', 100)}
          {field('phone', 'Số điện thoại', 40, 'phone-pad')}
          <Text style={ui.heading}>2. Đào tạo và kinh nghiệm</Text>
          {Object.entries(levels).map(([key, label]) => (
            <Button
              key={key}
              variant={form.trainingLevel === key ? 'primary' : 'secondary'}
              title={`${form.trainingLevel === key ? '✓ ' : ''}${label}`}
              disabled={busy}
              onPress={() =>
                setForm((previous) => ({
                  ...previous,
                  trainingLevel: key,
                  clinicalMonths: key === 'first_aid' ? '0' : previous.clinicalMonths,
                }))
              }
            />
          ))}
          {form.trainingLevel !== 'first_aid' &&
            field('clinicalMonths', 'Số tháng thực hành lâm sàng', 3, 'number-pad')}
          {field('experience', 'Khóa đào tạo / nơi thực hành', 500)}
          <Text style={ui.heading}>3. Đơn vị và khu vực</Text>
          {field('homeAddress', 'Khu vực cư trú (phường/xã, tỉnh/thành)', 200)}
          {field('workAddress', 'Đơn vị học tập / làm việc và địa chỉ', 200)}
          {field('serviceArea', 'Khu vực có thể hỗ trợ', 100)}
          <Text style={ui.heading}>Kỹ năng đề nghị xác minh</Text>
          {Object.entries(skillLabels).map(([key, label]) => (
            <CheckboxRow
              key={key}
              label={label}
              value={skills.includes(key)}
              disabled={busy}
              onValueChange={(value) =>
                setSkills((old) => (value ? [...old, key] : old.filter((x) => x !== key)))
              }
            />
          ))}
          <Text style={ui.caption}>
            Admin đối chiếu đào tạo và phạm vi hỗ trợ. Kỹ năng tự khai chưa được dùng để ưu tiên
            điều phối.
          </Text>
          {(status === 'pending' || sent) && (
            <Text>Gửi lại sẽ thay hồ sơ đang chờ admin duyệt.</Text>
          )}
          <Button
            loading={busy}
            title="Gửi hồ sơ xác minh"
            disabled={
              busy ||
              !skills.length ||
              Object.values(form).some((value) => !value.trim()) ||
              !/^\d+$/.test(form.clinicalMonths) ||
              Number(form.clinicalMonths) > 600
            }
            onPress={submit}
          />
        </>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
