import { Text } from './AppText';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from './ActionButton';
import { ui } from '../lib/ui';
export function ConfirmAction({ title, explanation, disabled, onConfirm, tone = 'danger' }: { title: string; explanation: string; disabled: boolean; onConfirm(): void; tone?: 'danger' | 'complete' }) {
  const [confirming, setConfirming] = useState(false);
  const color = tone === 'danger' ? '#a12626' : undefined;
  return confirming ? <View style={ui.notice}><Text style={ui.body}>{explanation}</Text><Button title={`Xác nhận: ${title.toLocaleLowerCase('vi-VN')}`} onPress={() => { setConfirming(false); onConfirm(); }} disabled={disabled} color={color} /><Button title="Quay lại" onPress={() => setConfirming(false)} disabled={disabled} variant="secondary" /></View> : <Button title={title} onPress={() => setConfirming(true)} disabled={disabled} color={color} variant={tone === 'danger' ? 'secondary' : 'primary'} />;
}
