import TripDetailScreen from '@/components/TripDetailScreen';

// Member view of a trip — same screen as the owner view, without editing.
const TripInfoMember = () => <TripDetailScreen isOwner={false} />;

export default TripInfoMember;
