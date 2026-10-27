import { Pressable, View } from 'react-native';
import { Text } from './AppText';
import { accountPurposes, AccountPurpose } from '../lib/account-purpose';
import { ui } from '../lib/ui';
import { palette } from '../lib/palette';

export function PurposeChoices({ onChoose }: { onChoose(purpose: AccountPurpose): void }) {
  return <View style={{ gap: 16 }}>
    {(['patient', 'volunteer'] as const).map(purpose => {
      const item = accountPurposes[purpose];
      return <Pressable key={purpose} accessibilityRole="button" accessibilityLabel={`Chọn ${item.title}`}
        hitSlop={6} pressRetentionOffset={32} unstable_pressDelay={0} android_ripple={{ color: '#dbe8e3' }} accessibilityHint={`${item.description} ${item.nextStep}`} onPress={() => onChoose(purpose)}
        style={({ pressed }) => [ui.card, { padding: 16, gap: 10, borderWidth: 2, borderColor: palette[purpose].primary, backgroundColor: palette[purpose].background, opacity: pressed ? 0.8 : 1 }]}>
        <Text style={[ui.heading, { color: palette[purpose].ink }]}>{item.title}</Text>
        <Text style={ui.body}>{item.description}</Text>
        {purpose === 'volunteer' && <Text style={ui.body}>Cần xét duyệt trước khi nhận ca.</Text>}
        <Text style={{ color: palette[purpose].primary, fontWeight: '700' }}>Chọn {item.title} →</Text>
      </Pressable>;
    })}
  </View>;
}
