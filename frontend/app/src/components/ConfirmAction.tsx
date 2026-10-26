import { Text } from './AppText';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from './ActionButton';
import { ui } from '../lib/ui';
export function ConfirmAction({ title, explanation, disabled, onConfirm }: { title: string; explanation: string; disabled: boolean; onConfirm(): void }) {
  const [confirming, setConfirming] = useState(false);
  return confirming ? <View style={ui.notice}><Text style={ui.body}>{explanation}</Text><Button title={`Xác nhận: ${title.toLocaleLowerCase('vi-VN')}`} onPress={() => { setConfirming(false); onConfirm(); }} disabled={disabled} color="#a12626" /><Button title="Quay lại, chưa thực hiện" onPress={() => setConfirming(false)} disabled={disabled} color="#526f67" /></View> : <Button title={title} onPress={() => setConfirming(true)} disabled={disabled} color="#a12626" />;
}
