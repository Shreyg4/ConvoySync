export type Suggestion = {
    id: string;
    userId: string;
    userName: string;
    label: string;
    latitude: number;
    longitude: number;
    timestamp: number;
};

export const MAX_USER_SUGGESTIONS = 3;

// Placeholder until auth is wired up — replace with Supabase real-time later
export const CURRENT_USER = { id: 'user-local', name: 'You' };

let suggestions: Suggestion[] = [];
const listeners = new Set<() => void>();

const notify = () => listeners.forEach(fn => fn());

export const getSuggestions = (): Suggestion[] => [...suggestions];

export const getUserSuggestionCount = (userId: string) =>
    suggestions.filter(s => s.userId === userId).length;

export const addSuggestion = (
    suggestion: Omit<Suggestion, 'id' | 'timestamp'>
): Suggestion | null => {
    if (getUserSuggestionCount(suggestion.userId) >= MAX_USER_SUGGESTIONS) return null;

    const next: Suggestion = {
        ...suggestion,
        id: Math.random().toString(36).slice(2, 10),
        timestamp: Date.now(),
    };
    suggestions = [...suggestions, next];
    notify();
    return next;
};

export const deleteSuggestion = (id: string, requestingUserId: string, isPartyLeader: boolean) => {
    const target = suggestions.find(s => s.id === id);
    if (!target) return;
    if (!isPartyLeader && target.userId !== requestingUserId) return;

    suggestions = suggestions.filter(s => s.id !== id);
    notify();
};

export const subscribeSuggestions = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};
