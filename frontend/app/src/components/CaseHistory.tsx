import { useState } from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import { Button } from './ActionButton';
import { callable, firebaseClient, readableError } from '../lib/firebase';
import { observationLabels, type ObservationAnswers } from '../lib/observations';
import { ui, statusLabel } from '../lib/ui';
type Case = {
  incidentId: string;
  status: string;
  createdAtMs: number | null;
  closedAtMs: number | null;
  wasHandedOver: boolean;
  summaryReason: string | null;
  clinicalSummary: {
    fullName: string;
    medicalConditions: string[];
    allergies: string[];
    answers: ObservationAnswers | null;
  } | null;
};
export function CaseHistory({ role }: { role: 'patient' | 'volunteer' }) {
  const [items, setItems] = useState<Case[]>([]),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function load() {
    setBusy(true);
    setError('');
    setOpen(true);
    setItems([]);
    try {
      const result = await callable<{ role: string }, { cases: Case[] }>(
        firebaseClient().functions,
        'getCaseHistory',
      )({ role });
      setItems(result.data.cases);
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={ui.card}>
      <Text style={ui.heading}>Lịch sử hỗ trợ</Text>
      <Button
        title={busy ? 'Đang tải…' : open ? 'Tải lại lịch sử' : 'Xem lịch sử ca'}
        variant="quiet"
        disabled={busy}
        onPress={load}
      />
      {open && (
        <>
          <Text style={ui.caption}>
            Tối đa 30 ca gần đây. Tóm tắt sức khỏe chỉ giữ 30 ngày sau kết thúc khi chủ thẻ đã đồng
            ý.
          </Text>
          {!busy && !items.length && !error && (
            <Text>Chưa có ca đã tham gia trong danh sách gần đây.</Text>
          )}
          {items.map((item) => (
            <View
              key={item.incidentId}
              style={{ gap: 6, paddingVertical: 12, borderTopWidth: 1, borderColor: '#c3d5cb' }}
            >
              <Text style={ui.heading}>
                {item.clinicalSummary?.fullName || `Ca ${item.incidentId.slice(0, 8)}`}
              </Text>
              <Text>
                {item.createdAtMs
                  ? new Date(item.createdAtMs).toLocaleString('vi-VN')
                  : 'Chưa có thời điểm'}{' '}
                · {statusLabel[item.status] || item.status}
              </Text>
              {item.wasHandedOver && <Text>Đã có bàn giao người phụ trách.</Text>}
              {item.clinicalSummary ? (
                <>
                  <Text>
                    Bệnh nền lúc báo tin:{' '}
                    {item.clinicalSummary.medicalConditions.join(', ') || 'Chưa khai báo'}
                  </Text>
                  <Text>
                    Dị ứng: {item.clinicalSummary.allergies.join(', ') || 'Chưa khai báo'}
                  </Text>
                  {item.clinicalSummary.answers && (
                    <Text>
                      Quan sát cuối:{' '}
                      {Object.values(observationLabels(item.clinicalSummary.answers)).join(' · ')}
                    </Text>
                  )}
                  <Text style={ui.caption}>
                    Hồ sơ tự khai và quan sát của người báo; không phải chẩn đoán.
                  </Text>
                </>
              ) : (
                <Text style={ui.caption}>
                  {item.summaryReason === 'active'
                    ? 'Ca đang diễn ra; xem chi tiết tại màn đang hỗ trợ.'
                    : item.summaryReason === 'retention-expired'
                      ? 'Đã hết thời gian lưu chi tiết sức khỏe.'
                      : 'Ca chưa có đồng ý lưu tóm tắt hoặc thuộc dữ liệu cũ.'}
                </Text>
              )}
            </View>
          ))}
          <Button
            variant="quiet"
            title="Ẩn lịch sử"
            onPress={() => {
              setOpen(false);
              setItems([]);
            }}
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
