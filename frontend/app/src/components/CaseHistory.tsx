import { useEffect, useState } from 'react';
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
  acceptedAtMs?: number | null;
  arrivedAtMs?: number | null;
  closedAtMs: number | null;
  patientEmergencyCount?: number;
  wasHandedOver: boolean;
  summaryReason: string | null;
  clinicalSummary: {
    fullName: string;
    medicalConditions: string[];
    allergies: string[];
    answers: ObservationAnswers | null;
    reporterPresence?: 'with_patient' | 'left_scene' | null;
  } | null;
};

type HistorySummary = {
  totalCases: number;
  completedCases: number;
};

const formatTime = (ms?: number | null) =>
  ms ? new Date(ms).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : null;

export function CaseHistory({ role }: { role: 'patient' | 'volunteer' }) {
  const [items, setItems] = useState<Case[]>([]),
    [summary, setSummary] = useState<HistorySummary | null>(null),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (cancelled) return undefined;
        setBusy(true);
        setError('');
        return callable<{ role: string }, { cases: Case[]; summary?: HistorySummary }>(
          firebaseClient().functions,
          'getCaseHistory',
        )({ role });
      })
      .then((result) => {
        if (cancelled || !result) return;
        setItems(result.data.cases);
        setSummary(
          result.data.summary ?? {
            totalCases: result.data.cases.length,
            completedCases: result.data.cases.filter((c) => c.status === 'completed').length,
          },
        );
        setLoaded(true);
      })
      .catch((err) => {
        if (!cancelled) setError(readableError(err));
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role, attempt]);

  return (
    <View style={ui.card}>
      <Text style={ui.heading}>Lịch sử hỗ trợ</Text>
      {role === 'volunteer' && (
        <Text style={ui.caption}>Hồ sơ nhận ca, số lần cấp cứu của bệnh nhân và chi tiết ca.</Text>
      )}
      {summary && (
        <View
          style={{
            padding: 10,
            borderRadius: 10,
            backgroundColor: role === 'volunteer' ? '#e7f4ee' : '#eef5ff',
            gap: 4,
          }}
        >
          {role === 'volunteer' ? (
            <Text style={{ fontWeight: '700' }}>
              Tổng số ca đã nhận: {summary.totalCases} · Đã hoàn thành: {summary.completedCases}
            </Text>
          ) : (
            <Text style={{ fontWeight: '700' }}>
              Tổng số lần yêu cầu hỗ trợ: {summary.totalCases}
            </Text>
          )}
          <Text style={ui.caption}>
            Hiển thị tối đa 30 ca gần đây. Chi tiết sức khỏe giữ 30 ngày sau khi kết thúc.
          </Text>
        </View>
      )}
      <Button
        title={busy ? 'Đang tải…' : 'Tải lại lịch sử ca'}
        variant="quiet"
        disabled={busy}
        onPress={() => setAttempt((value) => value + 1)}
      />
      {loaded && !busy && !items.length && !error && (
        <Text>Chưa có ca đã tham gia trong danh sách gần đây.</Text>
      )}
      {items.map((item) => {
        const timeline = [
          formatTime(item.acceptedAtMs) ? `Nhận ${formatTime(item.acceptedAtMs)}` : null,
          formatTime(item.arrivedAtMs) ? `Đến nơi ${formatTime(item.arrivedAtMs)}` : null,
          formatTime(item.closedAtMs) ? `Kết thúc ${formatTime(item.closedAtMs)}` : null,
        ].filter(Boolean);
        return (
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
            {typeof item.patientEmergencyCount === 'number' && (
              <Text style={{ fontWeight: '600', color: '#0b5962' }}>
                Số lần cấp cứu của bệnh nhân: {item.patientEmergencyCount}
              </Text>
            )}
            {!!timeline.length && <Text style={ui.caption}>{timeline.join(' → ')}</Text>}
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
                {item.clinicalSummary.reporterPresence && (
                  <Text>
                    Người báo tin:{' '}
                    {item.clinicalSummary.reporterPresence === 'left_scene'
                      ? 'Không ở cạnh bệnh nhân'
                      : 'Ở ngay cạnh bệnh nhân'}
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
        );
      })}
      {!!error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
