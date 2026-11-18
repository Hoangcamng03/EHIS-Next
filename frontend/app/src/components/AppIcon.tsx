import Svg, { Path, Circle, Rect } from 'react-native-svg';
export type IconName =
  | 'link'
  | 'user'
  | 'card'
  | 'home'
  | 'activity'
  | 'phone'
  | 'heart'
  | 'pin'
  | 'people'
  | 'book'
  | 'check'
  | 'alert'
  | 'chevron'
  | 'share'
  | 'breath'
  | 'drop';
const paths: Record<IconName, string> = {
  link: 'M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-2 2 M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l2-2 M8 16l8-8',
  user: 'M4 21v-3a8 8 0 0116 0v3Z',
  card: 'M3 7h18 M7 12h4 M7 16h7',
  home: 'M3 10l9-7 9 7 M5 9v12h14V9 M9 21v-7h6v7',
  activity: 'M5 4h14v17H5Z M9 4V2h6v2 M8 10h8 M8 14h8 M8 18h5',
  phone: 'M6 3l4 4-3 3a17 17 0 007 7l3-3 4 4-3 3C10 22 2 14 3 6Z',
  heart: 'M12 21L3 12a5 5 0 017-7l2 2 2-2a5 5 0 017 7Z',
  pin: 'M12 22s8-8 8-13a8 8 0 00-16 0c0 5 8 13 8 13Z',
  people: 'M2 22v-4a6 6 0 0112 0v4 M16 12a6 6 0 016 6v4',
  book: 'M12 5v17 M2 4h4a6 6 0 016 3 6 6 0 016-3h4v15h-4a6 6 0 00-6 3 6 6 0 00-6-3H2Z',
  check: 'M5 12l4 4L20 5',
  alert: 'M12 3L1 22h22Z M12 9v6 M12 18v1',
  chevron: 'M9 4l8 8-8 8',
  share: 'M6 12l12-7 M6 12l12 7',
  breath: 'M12 3v9 M10 7C7 8 3 13 3 18c0 5 7 2 7-1V7 M14 7c3 1 7 6 7 11 0 5-7 2-7-1V7',
  drop: 'M12 2S4 12 4 16a8 8 0 0016 0c0-4-8-14-8-14Z',
};
export function AppIcon({
  name,
  size = 22,
  color = '#123c37',
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
    >
      {name === 'card' && <Rect x={2} y={3} width={20} height={18} rx={3} />}
      {name === 'user' && <Circle cx={12} cy={6} r={4} />}
      {name === 'people' && (
        <>
          <Circle cx={8} cy={6} r={4} />
          <Circle cx={18} cy={7} r={3} />
        </>
      )}
      {name === 'pin' && <Circle cx={12} cy={9} r={2.5} />}
      {name === 'share' && (
        <>
          <Circle cx={4} cy={12} r={2.5} />
          <Circle cx={20} cy={4} r={2.5} />
          <Circle cx={20} cy={20} r={2.5} />
        </>
      )}
      <Path d={paths[name]} />
    </Svg>
  );
}
