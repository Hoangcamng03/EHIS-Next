import { Text } from './AppText';
import { useRef, useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { Button } from './ActionButton';
import { ui } from '../lib/ui';
export function ConfirmAction({ title, explanation, disabled, onConfirm, tone = 'danger' }: { title: string; explanation: string; disabled: boolean; onConfirm(): void; tone?: 'danger' | 'complete' }) {
  const [confirming, setConfirming] = useState(false);
  const submitted = useRef(false);
  const color = tone === 'danger' ? '#a12626' : undefined;
  // Keep the action's footprint stable while the underlying feed/GPS updates.
  return <>
    <Button title={title} onPress={() => { submitted.current = false; setConfirming(true); }} disabled={disabled} color={color} variant={tone === 'danger' ? 'secondary' : 'primary'} />
    <Modal visible={confirming} transparent animationType="fade" onRequestClose={() => setConfirming(false)}>
      <View style={{ flex: 1, backgroundColor: '#102d2ab3', justifyContent: 'center', padding: 20 }}>
        <View accessibilityViewIsModal style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '85%', width: '100%', maxWidth: 520, alignSelf: 'center' }}>
          <ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={{ gap: 16 }}>
            <Text accessibilityRole="header" style={ui.heading}>{title}</Text>
            <Text style={ui.body}>{explanation}</Text>
            <Button title="Xác nhận" accessibilityLabel={`Xác nhận: ${title.toLocaleLowerCase('vi-VN')}`} onPress={() => { if (!disabled && !submitted.current) { submitted.current = true; setConfirming(false); onConfirm(); } }} disabled={disabled} color={color} />
            <Button title="Quay lại" onPress={() => setConfirming(false)} disabled={disabled} variant="secondary" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  </>;
}
