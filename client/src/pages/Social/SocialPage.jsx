import { useState, useEffect, useCallback } from 'react';
import {
  getFeed, getLeaderboard, getFriends, sendFriendRequest,
  getPendingRequests, acceptRequest, rejectRequest, unfriend,
  searchUsers, vote,
} from '../../api/social.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Modal from '../../components/UI/Modal.jsx';
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx';

function Avatar({ name, size = 'md' }) {
  const s = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm';
  return (
    <div className={`${s} rounded-full bg-ht-elevated border border-ht-border-2 flex items-center justify-center font-semibold text-ht-text-2 flex-shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function ThumbIcon({ up }) {
  return up ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" />
      <path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17" />
    </svg>
  );
}

const ACTIVITY_INFO = {
  habit_completed: { emoji: '✅', label: 'completed a habit',  color: 'text-ht-success' },
  meal_logged:     { emoji: '🥗', label: 'logged a meal',      color: 'text-ht-warning' },
  workout_logged:  { emoji: '💪', label: 'logged a workout',   color: 'text-ht-accent-2' },
};

function ActivityCard({ activity, currentUserId, onVote }) {
  const { user, type, data, createdAt, voteScore, userVote } = activity;
  const [localScore, setLocalScore] = useState(voteScore);
  const [localVote, setLocalVote]   = useState(userVote);
  const info = ACTIVITY_INFO[type] || { emoji: '⭐', label: 'did something', color: 'text-ht-text-3' };

  const handleVote = async (value) => {
    try {
      await onVote(activity.id, value);
      if (localVote === value) {
        setLocalScore((s) => s - value);
        setLocalVote(0);
      } else {
        setLocalScore((s) => s - localVote + value);
        setLocalVote(value);
      }
    } catch {}
  };

  const timeAgo = new Date(createdAt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="card space-y-3 animate-fade-in">
      <div className="flex items-start gap-3">
        <Avatar name={user.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-ht-text-1">{user.name}</span>
            <span className={`text-xs ${info.color}`}>{info.label}</span>
          </div>
          <div className="mt-2 px-3 py-2 bg-ht-elevated rounded-lg border border-ht-border">
            {type === 'habit_completed' && (
              <p className="text-sm text-ht-text-1">{info.emoji} {data.habitName}</p>
            )}
            {type === 'meal_logged' && (
              <p className="text-sm text-ht-text-1">
                {info.emoji} {data.mealType}: {data.foodName} ({data.quantity}{data.unit})
              </p>
            )}
            {type === 'workout_logged' && (
              <p className="text-sm text-ht-text-1">
                {info.emoji} {data.exerciseName} · {data.duration}min
                {data.caloriesBurned ? ` · ${data.caloriesBurned}kcal` : ''}
              </p>
            )}
          </div>
          <p className="text-[11px] text-ht-text-3 mt-1.5">{timeAgo}</p>
        </div>
      </div>

      {user.id !== currentUserId && (
        <div className="flex items-center gap-2 pt-2 border-t border-ht-border">
          <button
            onClick={() => handleVote(1)}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium transition-all ${
              localVote === 1
                ? 'bg-ht-success/15 text-ht-success'
                : 'text-ht-text-3 hover:text-ht-success hover:bg-ht-success/10'
            }`}
          >
            <ThumbIcon up={true} /> {localVote === 1 ? 'Liked' : 'Like'}
          </button>
          <button
            onClick={() => handleVote(-1)}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium transition-all ${
              localVote === -1
                ? 'bg-ht-danger/15 text-ht-danger'
                : 'text-ht-text-3 hover:text-ht-danger hover:bg-ht-danger/10'
            }`}
          >
            <ThumbIcon up={false} />
          </button>
          <span className={`text-xs font-semibold ml-auto tabular-nums ${
            localScore > 0 ? 'text-ht-success' : localScore < 0 ? 'text-ht-danger' : 'text-ht-text-3'
          }`}>
            {localScore > 0 ? '+' : ''}{localScore}
          </span>
        </div>
      )}
    </div>
  );
}

function LeaderboardRow({ user, rank, isCurrentUser }) {
  const medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : null;
  return (
    <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
      isCurrentUser ? 'bg-ht-accent/10 border border-ht-accent/20' : 'hover:bg-ht-elevated'
    }`}>
      <div className="w-7 text-center flex-shrink-0">
        {medal ? (
          <span className="text-lg leading-none">{medal}</span>
        ) : (
          <span className="text-xs font-bold text-ht-text-3">#{rank}</span>
        )}
      </div>
      <Avatar name={user.name} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isCurrentUser ? 'text-ht-accent-2' : 'text-ht-text-1'}`}>
          {user.name}{isCurrentUser ? ' (You)' : ''}
        </p>
        <p className="text-[11px] text-ht-text-3">
          {user.habitLogs} habits · {user.workouts} workouts · {user.habitRate}% rate
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-ht-accent-2 tabular-nums">{user.score}</p>
        <p className="text-[10px] text-ht-text-3">pts</p>
      </div>
    </div>
  );
}

const TABS = ['Feed', 'Friends', 'Leaderboard'];

export default function SocialPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab]     = useState('Feed');
  const [feed, setFeed]               = useState([]);
  const [friends, setFriends]         = useState([]);
  const [requests, setRequests]       = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showSearch, setShowSearch]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]     = useState(false);
  const [requestSent, setRequestSent] = useState(new Set());

  const loadTab = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'Feed') {
        setFeed(await getFeed());
      } else if (activeTab === 'Friends') {
        const [f, r] = await Promise.all([getFriends(), getPendingRequests()]);
        setFriends(f);
        setRequests(r);
      } else if (activeTab === 'Leaderboard') {
        setLeaderboard(await getLeaderboard());
      }
    } catch {}
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { loadTab(); }, [loadTab]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (searchQuery.trim().length < 2) { setSearchResults([]); return; }
      setSearching(true);
      try { setSearchResults(await searchUsers(searchQuery)); } catch {}
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSendRequest = async (receiverId) => {
    try {
      await sendFriendRequest(receiverId);
      setRequestSent((prev) => new Set(prev).add(receiverId));
    } catch {}
  };

  const handleAccept = async (id) => {
    await acceptRequest(id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
    const f = await getFriends();
    setFriends(f);
  };

  const handleReject = async (id) => {
    await rejectRequest(id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUnfriend = async (id) => {
    // Two-step: flag then remove on confirm — simplified: just remove with a subtle state
    await unfriend(id);
    setFriends((prev) => prev.filter((f) => f.id !== id));
  };

  const handleVote = async (activityId, value) => {
    await vote(activityId, value);
  };

  return (
    <div className="space-y-4 py-4">

      {/* Tab bar */}
      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? 'tab-item-active' : 'tab-item'}
          >
            {tab}
            {tab === 'Friends' && requests.length > 0 && (
              <span className="ml-1 h-4 w-4 rounded-full bg-ht-danger text-white text-[9px] font-bold flex items-center justify-center">
                {requests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : (
        <>
          {/* FEED */}
          {activeTab === 'Feed' && (
            <div className="space-y-3">
              {feed.length === 0 ? (
                <div className="card flex flex-col items-center text-center py-10 gap-3">
                  <span className="text-4xl">👥</span>
                  <div>
                    <p className="text-sm font-semibold text-ht-text-1">Nothing to show yet</p>
                    <p className="text-xs text-ht-text-3 mt-1">Add friends to see their progress here.</p>
                  </div>
                  <button onClick={() => setActiveTab('Friends')} className="btn-ghost h-8 px-4 text-xs">
                    Find friends
                  </button>
                </div>
              ) : (
                feed.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    currentUserId={currentUser.id}
                    onVote={handleVote}
                  />
                ))
              )}
            </div>
          )}

          {/* FRIENDS */}
          {activeTab === 'Friends' && (
            <div className="space-y-4">
              {/* Pending requests */}
              {requests.length > 0 && (
                <div className="space-y-2">
                  <p className="section-label">Requests ({requests.length})</p>
                  {requests.map((req) => (
                    <div key={req.id} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-ht-surface border border-ht-border">
                      <Avatar name={req.sender.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ht-text-1 truncate">{req.sender.name}</p>
                        <p className="text-xs text-ht-text-3 truncate">{req.sender.email}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleAccept(req.id)}
                          className="h-8 w-8 rounded-lg bg-ht-success/10 text-ht-success hover:bg-ht-success/20 flex items-center justify-center transition-all"
                        >
                          <CheckIcon />
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="h-8 w-8 rounded-lg bg-ht-danger/10 text-ht-danger hover:bg-ht-danger/20 flex items-center justify-center transition-all"
                        >
                          <XIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Find friends button */}
              <button
                onClick={() => setShowSearch(true)}
                className="btn-ghost w-full gap-2 justify-center"
              >
                <SearchIcon /> Find friends
              </button>

              {/* Friends list */}
              <div className="space-y-2">
                {friends.length > 0 && <p className="section-label">Friends ({friends.length})</p>}
                {friends.length === 0 ? (
                  <div className="card text-center py-8">
                    <p className="text-sm text-ht-text-3">No friends yet. Search to add people!</p>
                  </div>
                ) : (
                  friends.map((friend) => (
                    <div key={friend.id} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-ht-surface border border-ht-border group">
                      <Avatar name={friend.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ht-text-1 truncate">{friend.name}</p>
                        <p className="text-xs text-ht-text-3 truncate">{friend.email}</p>
                      </div>
                      <button
                        onClick={() => handleUnfriend(friend.id)}
                        className="text-xs text-ht-text-3 hover:text-ht-danger px-2 h-7 rounded-md hover:bg-ht-danger/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* LEADERBOARD */}
          {activeTab === 'Leaderboard' && (
            <div className="card space-y-1">
              <div className="flex items-center justify-between pb-3 border-b border-ht-border mb-1">
                <p className="section-label">Weekly rankings</p>
                <p className="text-[11px] text-ht-text-3">habits · workouts · meals</p>
              </div>
              {leaderboard.length === 0 ? (
                <p className="text-center text-ht-text-3 text-sm py-6">Add friends to see rankings</p>
              ) : (
                leaderboard.map((entry) => (
                  <LeaderboardRow
                    key={entry.id}
                    user={entry}
                    rank={entry.rank}
                    isCurrentUser={entry.id === currentUser.id}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Find Friends Modal */}
      <Modal
        isOpen={showSearch}
        onClose={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}
        title="Find Friends"
      >
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ht-text-3">
              <SearchIcon />
            </span>
            <input
              type="text"
              className="input-field pl-9"
              placeholder="Search by email or name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {searching && <div className="flex justify-center py-3"><LoadingSpinner size="sm" /></div>}

          <div className="space-y-px max-h-64 overflow-y-auto">
            {searchResults.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-ht-elevated transition-colors">
                <Avatar name={u.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ht-text-1 truncate">{u.name}</p>
                  <p className="text-xs text-ht-text-3 truncate">{u.email}</p>
                </div>
                {requestSent.has(u.id) ? (
                  <span className="text-xs text-ht-success font-medium">Sent ✓</span>
                ) : (
                  <button onClick={() => handleSendRequest(u.id)} className="btn-primary h-7 px-3 text-xs">
                    Add
                  </button>
                )}
              </div>
            ))}
            {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
              <p className="text-center text-ht-text-3 text-sm py-4">No users found</p>
            )}
            {searchQuery.length < 2 && (
              <p className="text-center text-ht-text-3 text-xs py-4">
                Type at least 2 characters to search
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
