'use client';
import { useEffect, useState } from 'react';
import { adminClient, callable, readableError } from '@/lib/firebase-client';
import { specialties } from './AdminApplicationReview';
import { levels } from '@/lib/volunteer-application';
type Person = {
  verifiedSpecialties: string[];
  uid: string;
  fullName: string;
  phone: string;
  homeAddress: string;
  workAddress: string;
  organisation: string;
  serviceArea: string;
  trainingLevel: string | null;
  clinicalMonths: number | null;
  hasActiveCase: boolean;
  isAvailable: boolean;
  verificationStatus: string;
  verificationPolicyVersion: number | null;
  readyForDispatch: boolean;
  locationFresh: boolean;
  lastSeenAtMs: number | null;
};
function PersonRow({ person, changed, now }: { person: Person; changed: () => void; now: number }) {
  const [area, setArea] = useState(person.serviceArea),
    [reason, setReason] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const [skills, setSkills] = useState<string[]>(person.verifiedSpecialties || []),
    [evidence, setEvidence] = useState(''),
    [confirmed, setConfirmed] = useState(false);
  const skillsChanged =
    [...skills].sort().join(',') !== [...(person.verifiedSpecialties || [])].sort().join(',');
  async function save(suspend = false) {
    setBusy(true);
    setMessage('');
    try {
      if (suspend)
        await callable(
          adminClient().functions,
          'setVolunteerSuspension',
        )({ uid: person.uid, suspended: person.verificationStatus !== 'suspended', reason });
      else
        await callable(
          adminClient().functions,
          'updateVolunteerRegion',
        )({
          uid: person.uid,
          serviceArea: area,
          ...(skillsChanged
            ? { specialties: skills, skillEvidence: evidence, skillsConfirmed: confirmed }
            : {}),
        });
      setMessage('Đã lưu.');
      changed();
    } catch (e) {
      setMessage(readableError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="report-panel">
      <h3>{person.fullName}</h3>
      <p>
        {person.organisation || 'Chưa có đơn vị xác minh'} · {person.serviceArea || 'Chưa xếp vùng'}
      </p>
      <p>
        {levels[person.trainingLevel as keyof typeof levels] || 'Hồ sơ cũ chưa có phân loại'} ·{' '}
        {person.clinicalMonths ?? '?'} tháng ·{' '}
        {person.hasActiveCase
          ? 'Đang có ca'
          : person.verificationStatus === 'suspended'
            ? 'Tạm dừng quyền'
            : person.readyForDispatch &&
                person.lastSeenAtMs !== null &&
                now - person.lastSeenAtMs <= 300000 &&
                person.lastSeenAtMs <= now + 60000
              ? 'Sẵn sàng nhận ca'
              : person.isAvailable
                ? 'GPS cũ · cần làm mới'
                : 'Chưa sẵn sàng'}
      </p>
      <p>
        Kỹ năng:{' '}
        {(person.verifiedSpecialties || [])
          .map((code) => specialties[code as keyof typeof specialties] || code)
          .join(', ') || 'Chưa xác minh nhóm kỹ năng'}
      </p>
      <details>
        <summary>Liên hệ và quản lý vùng</summary>
        <p>
          {person.phone || 'Chưa có số'}
          <br />
          Cư trú: {person.homeAddress || 'Chưa có'}
          <br />
          Nơi làm việc: {person.workAddress || 'Chưa có'}
        </p>
        <label>
          Khu vực quản lý
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            maxLength={100}
            disabled={busy}
          />
        </label>
        <fieldset disabled={busy || person.hasActiveCase}>
          <legend>Kỹ năng admin đã đối chiếu</legend>
          {Object.entries(specialties).map(([key, label]) => (
            <label className="confirm" key={key}>
              <input
                type="checkbox"
                checked={skills.includes(key)}
                onChange={(e) => {
                  setSkills((old) =>
                    e.target.checked ? [...old, key] : old.filter((x) => x !== key),
                  );
                  setConfirmed(false);
                }}
              />
              {label}
            </label>
          ))}
        </fieldset>
        {skillsChanged && (
          <>
            <label>
              Căn cứ đối chiếu kỹ năng
              <textarea
                value={evidence}
                maxLength={500}
                disabled={busy}
                onChange={(e) => setEvidence(e.target.value)}
              />
            </label>
            <label className="confirm">
              <input
                type="checkbox"
                checked={confirmed}
                disabled={busy}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              Tôi đã đối chiếu đào tạo và phạm vi hỗ trợ.
            </label>
          </>
        )}
        <button
          className="secondary"
          disabled={
            busy ||
            area.trim().length < 2 ||
            (!skillsChanged && area === person.serviceArea) ||
            (skillsChanged &&
              (person.hasActiveCase || !skills.length || !confirmed || evidence.trim().length < 10))
          }
          onClick={() => save()}
        >
          {skillsChanged ? 'Lưu khu vực và kỹ năng' : 'Lưu khu vực'}
        </button>
        <label>
          Lý do tạm dừng / khôi phục quyền
          <input
            value={reason}
            maxLength={300}
            onChange={(e) => setReason(e.target.value)}
            disabled={busy}
          />
        </label>
        <button
          className="secondary danger-action"
          disabled={busy || person.hasActiveCase || reason.trim().length < 10}
          onClick={() => save(true)}
        >
          {person.verificationStatus === 'suspended'
            ? 'Khôi phục quyền · giữ OFF'
            : 'Tạm dừng quyền nhận ca'}
        </button>
        {person.hasActiveCase && (
          <p className="hint">
            Cần bàn giao/kết thúc ca qua người phụ trách trước; không tự bỏ ca khi khóa quyền.
          </p>
        )}
      </details>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
export function VolunteerRoster() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const t = setInterval(() => {
      if (!document.hidden) setNow(Date.now());
    }, 10000);
    return () => clearInterval(t);
  }, []);
  const [area, setArea] = useState(''),
    [organisation, setOrganisation] = useState(''),
    [items, setItems] = useState<Person[]>([]),
    [next, setNext] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  async function load(more = false) {
    setBusy(true);
    setMessage('');
    try {
      const r = await callable<unknown, { volunteers: Person[]; next: string | null }>(
        adminClient().functions,
        'listVolunteerRoster',
      )({ serviceArea: area, organisation, ...(more && next ? { after: next } : {}) });
      setItems((old) => (more ? [...old, ...r.data.volunteers] : r.data.volunteers));
      setNext(r.data.next);
      if (!r.data.volunteers.length) setMessage('Không có TNV trong bộ lọc này.');
    } catch (e) {
      setMessage(readableError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="report-panel">
      <summary>Danh sách TNV theo đơn vị và khu vực</summary>
      <p className="hint">
        Khu vực dùng để quản lý. Điều phối vẫn theo GPS gần nhất trong 5 km, gồm cả TNV gần ranh
        giới.
      </p>
      <label>
        Đơn vị · đúng tên đã lưu
        <input
          value={organisation}
          maxLength={150}
          onChange={(e) => {
            setOrganisation(e.target.value);
            setNext(null);
          }}
          disabled={busy}
        />
      </label>
      <label>
        Khu vực · đúng tên đã lưu
        <input
          value={area}
          maxLength={100}
          onChange={(e) => {
            setArea(e.target.value);
            setNext(null);
          }}
          disabled={busy}
        />
      </label>
      <button className="primary" disabled={busy} onClick={() => load()}>
        Tải danh sách TNV
      </button>
      <p className="hint">Tối đa 50 người mỗi trang. Để trống để xem tất cả.</p>
      {items.map((person) => (
        <PersonRow
          now={now}
          key={
            person.uid +
            person.serviceArea +
            person.verificationStatus +
            (person.verifiedSpecialties || []).join()
          }
          person={person}
          changed={() => {
            void load();
          }}
        />
      ))}
      {next && (
        <button className="secondary" disabled={busy} onClick={() => load(true)}>
          Tải 50 người tiếp theo
        </button>
      )}
      {message && <p role="status">{message}</p>}
    </details>
  );
}
