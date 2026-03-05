import { View } from 'react-native';
import Profile from '../../components/Profile';
import { useSession } from '../../hooks/useSession';

export default function TabOneScreen() {
  const { session } = useSession();

  if (!session?.user) return null;

  return (
    <View style={{ flex: 1 }}>
      <Profile key={session.user.id} session={session} />
    </View>
  );
}
