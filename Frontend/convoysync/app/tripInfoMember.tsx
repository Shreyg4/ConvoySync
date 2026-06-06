import TripDetailScreen from '@/components/TripDetailScreen';

/**
 * Member route for trip details. Reuses the shared trip detail component in
 * read-only mode for joined convoy members.
 */
const TripInfoMember = () => <TripDetailScreen isOwner={false} />;

export default TripInfoMember;
