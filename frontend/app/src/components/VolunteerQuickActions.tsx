import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Text } from './AppText';
import { Button } from './ActionButton';
import { AppIcon } from './AppIcon';
import { LocationMap } from './LocationMap';
import type { MapPoint } from '../lib/map';

export function VolunteerQuickActions({
  point,
  organisation,
  area,
}: {
  point: MapPoint | null;
  organisation: string;
  area: string;
}) {
  const [panel, setPanel] = useState<'pin' | 'people' | 'book' | null>(null);
  return (
    <>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(
          [
            ['pin', 'Vị trí của tôi'],
            ['people', 'Đơn vị của tôi'],
            ['book', 'Hướng dẫn'],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() => setPanel(key)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 78,
              padding: 8,
              gap: 6,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? '#d9eee4' : 'white',
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#cee0d6',
            })}
          >
            <AppIcon name={key} size={23} color="#285e4d" />
            <Text style={{ fontSize: 13, textAlign: 'center' }}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <Modal visible={panel !== null} transparent onRequestClose={() => setPanel(null)}>
        <View
          style={{ flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#102c4588' }}
        >
          <ScrollView
            style={{
              flexGrow: 0,
              width: '100%',
              maxWidth: 600,
              alignSelf: 'center',
              borderRadius: 14,
              backgroundColor: 'white',
            }}
            contentContainerStyle={{ padding: 16, gap: 12 }}
          >
            <Text style={{ fontSize: 19, fontWeight: '700' }}>
              {panel === 'pin'
                ? 'Vị trí của tôi'
                : panel === 'people'
                  ? 'Đơn vị của tôi'
                  : 'Hướng dẫn nhận ca'}
            </Text>
            {panel === 'pin' &&
              (point ? (
                <>
                  <LocationMap point={point} title="Vị trí gần nhất đã gửi" />
                  <Text style={{ fontSize: 13 }}>
                    Điểm lưu trên máy chủ, không phải theo dõi trực tiếp. Bật Sẵn sàng để cập nhật
                    GPS.
                  </Text>
                </>
              ) : (
                <Text>Bật Sẵn sàng và cho phép vị trí để gửi GPS trước.</Text>
              ))}
            {panel === 'people' && (
              <>
                <Text>Đơn vị: {organisation || 'Chưa bổ sung'}</Text>
                <Text>Vùng quản lý: {area || 'Chưa bổ sung'}</Text>
                <Text style={{ fontSize: 13 }}>
                  Ca gần bạn được tìm bằng GPS. Thông tin đơn vị không thay cho việc xác minh kỹ
                  năng của admin.
                </Text>
              </>
            )}
            {panel === 'book' && (
              <>
                <Text>1. Kiểm tra quyền vị trí, thông báo và âm báo ở Tài khoản.</Text>
                <Text>2. Bật Sẵn sàng khi bạn có thể hỗ trợ.</Text>
                <Text>3. Xem yêu cầu và khoảng cách; chỉ nhận một ca.</Text>
                <Text>4. Sau khi nhận, mở Tiến độ để xác nhận lên đường và giờ đến dự kiến.</Text>
                <Text>
                  5. Theo dõi điểm đến, cập nhật tình trạng; xác nhận Đã đến nơi khi có mặt.
                </Text>
                <Text>
                  6. Gặp trở ngại: mở Tiến độ để báo chậm hoặc tìm người thay. Chờ bàn giao được xác
                  nhận.
                </Text>
                <Text>7. Hoàn tất ca sau khi kết thúc hỗ trợ.</Text>
              </>
            )}
            <Button title="Đóng" variant="secondary" onPress={() => setPanel(null)} />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
