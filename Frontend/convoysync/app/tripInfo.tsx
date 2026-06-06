import TripDetailScreen from '@/components/TripDetailScreen';

/**
 * Owner route for trip details. Reuses the shared trip detail component with
 * itinerary editing enabled.
 */
const TripInfo = () => <TripDetailScreen isOwner />;

export default TripInfo;
