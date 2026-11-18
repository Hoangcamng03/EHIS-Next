'use client';
import { useState } from 'react';
import { adminClient, callable, readableError } from '@/lib/firebase-client';
import { levels, type Application } from '@/lib/volunteer-application';

export const specialties = {
  basic_aid: 'Sơ cứu cơ bản',
  cpr: 'Hồi sinh tim phổi',
  respiratory: 'Hỗ trợ hô hấp',
  trauma: 'Chảy máu / chấn thương',
};
const checks = {
  identityChecked: 'Danh tính',
  affiliationChecked: 'Đơn vị / nơi học tập',
  trainingChecked: 'Đào tạo và kỹ năng',
  scopeExplained: 'Phạm vi hỗ trợ',
};
export function AdminApplicationReview({
  item,
  saved,
}: {
  item: Application & { specialties?: string[] };
  saved: () => Promise<void>;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [skills, setSkills] = useState<string[]>(item.specialties || ['basic_aid']);
  const [level, setLevel] = useState(item.trainingLevel || 'first_aid');
  const [months, setMonths] = useState(String(item.clinicalMonths ?? 0));
  const [evidence, setEvidence] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const valid =
    Object.keys(checks).every((key) => checked[key]) &&
    skills.length > 0 &&
    evidence.trim().length > 0 &&
    /^\d+$/.test(months) &&
    Number(months) <= 600;
  async function submit() {
    if (!decision) return;
    setBusy(true);
    setError('');
    try {
      await callable(
        adminClient().functions,
        'reviewVolunteerApplication',
      )({
        uid: item.uid,
        applicationRevision: item.applicationRevision,
        decision,
        ...(decision === 'approved'
          ? {
              verification: {
                checklist: checked,
                trainingLevel: level,
                clinicalMonths: Number(months),
                specialties: skills,
                evidence,
              },
            }
          : {}),
      });
      await saved();
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="report-panel">
      <h2>{item.fullName}</h2>
      <p>
        {item.phone} · {item.serviceArea}
      </p>
      <p>{item.workAddress}</p>
      <p>Cư trú: {item.homeAddress}</p>
      <p>
        Đào tạo tự khai: {levels[item.trainingLevel]} · {item.clinicalMonths} tháng
      </p>
      <p>{item.experience}</p>
      <fieldset disabled={busy}>
        <legend>Admin xác minh trực tiếp</legend>
        {Object.entries(checks).map(([key, label]) => (
          <label className="confirm" key={key}>
            <input
              type="checkbox"
              checked={checked[key] === true}
              onChange={(e) => {
                setChecked((old) => ({ ...old, [key]: e.target.checked }));
                setDecision(null);
              }}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <label className="phone-label">
        Mức đào tạo đã kiểm tra
        <select
          value={level}
          disabled={busy}
          onChange={(e) => {
            setLevel(e.target.value as typeof level);
            if (e.target.value === 'first_aid') setMonths('0');
            setDecision(null);
          }}
        >
          {Object.entries(levels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="phone-label">
        Số tháng lâm sàng
        <input
          type="number"
          min="0"
          max="600"
          value={months}
          disabled={busy || level === 'first_aid'}
          onChange={(e) => {
            setMonths(e.target.value);
            setDecision(null);
          }}
        />
      </label>
      <fieldset disabled={busy}>
        <legend>Kỹ năng đã xác minh</legend>
        {Object.entries(specialties).map(([key, label]) => (
          <label className="confirm" key={key}>
            <input
              type="checkbox"
              checked={skills.includes(key)}
              onChange={(e) => {
                setSkills((old) =>
                  e.target.checked ? [...old, key] : old.filter((x) => x !== key),
                );
                setDecision(null);
              }}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <label className="phone-label">
        Căn cứ xác minh / giới hạn hỗ trợ
        <textarea
          maxLength={500}
          value={evidence}
          disabled={busy}
          onChange={(e) => {
            setEvidence(e.target.value);
            setDecision(null);
          }}
          placeholder="Khóa đào tạo, chứng nhận, ngày đối chiếu"
        />
      </label>
      {decision ? (
        <div className="review-confirm">
          <p>
            {decision === 'approved'
              ? 'Cấp quyền nhận ca theo kỹ năng đã xác minh?'
              : 'Từ chối đơn này để người đăng ký bổ sung?'}
          </p>
          <button
            className="primary"
            disabled={busy || (decision === 'approved' && !valid)}
            onClick={submit}
          >
            Xác nhận {decision === 'approved' ? 'duyệt đơn' : 'từ chối'}
          </button>
          <button className="secondary" disabled={busy} onClick={() => setDecision(null)}>
            Quay lại
          </button>
        </div>
      ) : (
        <>
          <button
            className="primary"
            disabled={busy || !valid}
            onClick={() => setDecision('approved')}
          >
            Duyệt đơn
          </button>
          <button className="secondary" disabled={busy} onClick={() => setDecision('rejected')}>
            Từ chối đơn
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}
