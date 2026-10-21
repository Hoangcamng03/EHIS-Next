import { ScrollView, StyleSheet, Text, View } from 'react-native';

export function ModuleOverview({ title, owner, tasks }: { title: string; owner: string; tasks: string[] }) {
  return <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.eyebrow}>EHIS NEXT · MODULE</Text>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>Phụ trách: {owner}</Text>
    <View style={styles.notice}><Text>Đây là khung phát triển. Các chức năng bên dưới chưa được triển khai; không có dữ liệu bệnh nhân thật.</Text></View>
    {tasks.map((task, index) => <View key={task} style={styles.task}>
      <Text style={styles.number}>{index + 1}</Text><Text style={styles.taskText}>{task}</Text>
    </View>)}
  </ScrollView>;
}
const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 24, gap: 18, backgroundColor: '#f4f8f6' },
  eyebrow: { color: '#256a62', fontWeight: '700', letterSpacing: 2 },
  title: { fontSize: 30, fontWeight: '700', color: '#123c37' },
  description: { fontSize: 16, color: '#47665f' },
  notice: { padding: 18, borderRadius: 16, backgroundColor: '#fff0ce' },
  task: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 16, backgroundColor: '#fff' },
  number: { fontSize: 20, fontWeight: '700', color: '#267062' },
  taskText: { flex: 1, fontSize: 16, color: '#243d37' },
});
