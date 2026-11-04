export type Answers = { responsiveness: string; breathing: string; bleeding: string; breathingDetail?: string; bleedingDetail?: string };
export const questions = [
  { key: 'responsiveness', icon: 'voice', title: 'Gọi họ có phản ứng không?', hint: 'Chọn điều bạn nhìn hoặc nghe thấy.', choices: [
    { value: 'responsive', label: 'Có phản ứng', hint: 'Trả lời, mở mắt hoặc cử động đáp lại.' },
    { value: 'unresponsive', label: 'Không thấy phản ứng', hint: 'Không thấy đáp lại khi bạn gọi.' },
    { value: 'unknown', label: 'Chưa rõ', hint: 'Chưa kiểm tra hoặc không chắc.' },
  ] },
  { key: 'breathing', icon: 'breath', title: 'Bạn thấy họ thở thế nào?', hint: 'Không cần xác định nguyên nhân hay tên bệnh.', choices: [
    { value: 'normal', label: 'Có vẻ thở đều', hint: 'Nhìn thấy nhịp thở đều.' },
    { value: 'difficulty', label: 'Có vẻ khó thở', hint: 'Thở gắng sức hoặc có vẻ hụt hơi.' },
    { value: 'gasping', label: 'Thở ngáp, ngắt quãng', hint: 'Chỉ thấy vài nhịp ngáp bất thường.' },
    { value: 'not_seen', label: 'Không thấy thở', hint: 'Bạn không quan sát thấy nhịp thở.' },
    { value: 'unknown', label: 'Chưa rõ', hint: 'Không chắc họ đang thở thế nào.' },
  ] },
  { key: 'bleeding', icon: 'drop', title: 'Bạn có thấy máu đang chảy?', hint: 'Chỉ hỏi chảy máu nhìn thấy bên ngoài.', choices: [
    { value: 'none_seen', label: 'Không thấy', hint: 'Không nhìn thấy máu đang chảy.' },
    { value: 'small', label: 'Có thấy máu', hint: 'Thấy máu chảy nhưng không rõ là nhiều.' },
    { value: 'heavy', label: 'Có vẻ chảy nhiều', hint: 'Máu chảy liên tục hoặc thấm ướt quần áo.' },
    { value: 'unknown', label: 'Chưa rõ', hint: 'Chưa quan sát hoặc không chắc.' },
  ] },
] as const;
export function chooseAnswer(previous: Answers, key: string, value: string): Answers {
  const next = { ...previous };
  if (key === 'responsiveness') next.responsiveness = value;
  if (key === 'breathing') { delete next.breathingDetail; next.breathing = ['difficulty', 'gasping', 'not_seen'].includes(value) ? 'abnormal' : value; if (next.breathing === 'abnormal') next.breathingDetail = value; }
  if (key === 'bleeding') { delete next.bleedingDetail; next.bleeding = ['small', 'heavy'].includes(value) ? 'visible' : value; if (next.bleeding === 'visible') next.bleedingDetail = value; }
  return next;
}
export function selectedAnswer(answers: Answers, key: 'responsiveness' | 'breathing' | 'bleeding') {
  return key === 'breathing' ? answers.breathingDetail || answers.breathing : key === 'bleeding' ? answers.bleedingDetail || answers.bleeding : answers.responsiveness;
}
