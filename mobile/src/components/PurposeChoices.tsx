import { Pressable, View } from 'react-native';
import { Text } from './AppText';
import { accountPurposes, AccountPurpose } from '../lib/account-purpose';
import { ui } from '../lib/ui';

export function PurposeChoices({ onChoose }: { onChoose(purpose: AccountPurpose): void }) {
  return <View style={{ gap: 16 }}>
    {(['patient', 'volunteer'] as const).map(purpose => {
      const item = accountPurposes[purpose];
      return <Pressable key={purpose} accessibilityRole="button" accessibilityLabel={`Chọn ${item.title}`}
        accessibilityHint={`${item.description} ${item.nextStep}`} onPress={() => onChoose(purpose)}
        style={({ pressed }) => [ui.card, { padding: 16, gap: 10, borderWidth: 2, borderColor: '#87b9a6', opacity: pressed ? 0.8 : 1 }]}>
        <Text style={ui.heading}>{item.title}</Text>
        <Text style={ui.body}>{item.description}</Text>
        {purpose === 'volunteer' && <Text style={ui.body}>Cần xét duyệt trước khi nhận ca.</Text>}
        <Text style={{ color: '#096951', fontWeight: '700' }}>Chọn {item.title} →</Text>
      </Pressable>;
    })}
  </View>;
}
