import { useState, useEffect, useCallback } from 'react';
import { getFeed, getLeaderboard, getFriends, sendFriendRequest, getPendingRequests, acceptRequest, rejectRequest, unfriend, searchUsers, vote } from '../../api/social.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Modal from '../../components/UI/Modal.jsx';
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx';
import { MagnifyingGlassIcon, TrophyIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

const TABS = ['Feed', 'Friends', 'Leaderboard'];

function ActivityCard({ activity, currentUserId, onVote }) {
  const { user, type, data, createdAt, votes, voteScore, userVote } = activity;
  const [localScore, setLocalScore] = useState(voteScore);
  const [localUserVote, setLocalUserVote] = useState(userVote);

  const typeInfo = {
    habit_completed: { icon: '🎯', label: 'completed a habit', color: 'text-green-400' },
    meal_logged: { icon: '🥗', label: 'logged a meal', color: 'text-yellow-400' },
    workout_logged: { icon: '💪', label: 'logged a workout', color: 'text-indigo-400' },
  };
  const info = typeInfo[type] || { icon: '⭐', label: 'did something', color: 'text-slate-400' };

  const handleVote = async (value) => {
    try {
      await onVote(activity.id, value);
      if (localUserVote === value) {
        setLocalScore(localScore - value);
        setLocalUserVote(0);
      } else {
        setLocalScore(localScore - localUserVote + value);
        setLocalUserVote(value);
      }
    } catch {}
  };

  return (
    <div className="card space-y-3">
      <div className="flex items-start gap-3">
        <div className="bg-slate-700 rounded-full h-9 w-9 flex items-center justify-center text-sm font-bold text-slate-300 flex-shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-100 text-sm">{user.name}</span>
            <span className={`text-xs ${info.color}`}>{info.icon} {info.label}</span>
          </div>

          <div className="mt-1 bg-slate-700/40 rounded-xl p-2.5">
            {type === 'habit_completed' && (
              <p className="text-sm text-slate-300">✅ {data.habitName}</p>
            )}
            {type === 'meal_logged' && (
              <p className="text-sm text-slate-300">
                {data.mealType}: {data.foodName} ({data.quantity}{data.unit})
              </p>
            )}
            {type === 'workout_logged' && (
              <p className="text-sm text-slate-300">
                {data.exerciseName} · {data.duration}min · {data.caloriesBurned}kcal
              </p>
            )}
          </div>

          <p className="text-xs text-slate-600 mt-1">
            {new Date(createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {user.id !== currentUserId && (
        <div className="flex items-center gap-3 pt-1 border-t border-slate-700/50">
          <button
            onClick={() => handleVote(1)}
            className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-xl transition-all ${localUserVote === 1 ? 'bg-green-500/20 text-green-400' : 'text-slate-500 hover:text-green-400 hover:bg-green-500/10'}`}
          >
            👍 {localUserVote === 1 ? 'Liked' : 'Like'}
          </button>
          <button
            onClick={() => handleVote(-1)}
            className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-xl transition-all ${localUserVote === -1 ? 'bg-red-500/20 text-red-400' : 'text-slate-500 hover:text-red-400 hover:bg-red-500/10'}`}
          >
            👎
          </button>
          <span className={`text-sm font-medium ml-auto ${localScore > 0 ? 'text-green-400' : localScore < 0 ? 'text-red-400' : 'text-slate-500'}`}>
            {localScore > 0 ? '+' : ''}{localScore}
          </span>
        </div>
      )}
    </div>
  );
}

function LeaderboardRow({ user, rank, isCurrentUser }) {
  const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${isCurrentUser ? 'bg-indigo-500/10 border border-indigo-500/30' : 'hover:bg-slate-700/30'} transition-colors`}>
      <span className="text-xl w-8 text-center">{rankEmoji}</span>
      <div className="bg-slate-700 rounded-full h-9 w-9 flex items-center justify-center text-sm font-bold text-slate-300 flex-shrink-0">
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${isCurrentUser ? 'text-indigo-300' : 'text-slate-100'}`}>{user.name} {isCurrentUser && '(You)'}</p>
        <p className="text-xs text-slate-500">{user.habitLogs} habits · {user.workouts} workouts · {user.habitRate}% rate</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-indigo-400">{user.score}</p>
        <p className="text-xs text-slate-500">pts</p>
      </div>
    </div>
  );
}

export default function SocialPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('Feed');
  const [feed, setFeed] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

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
      setSearchResults((prev) => prev.filter((u) => u.id !== receiverId));
      alert('Friend request sent!');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not send request');
    }
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
    if (!confirm('Remove this friend?')) return;
    await unfriend(id);
    setFriends((prev) => prev.filter((f) => f.id !== id));
  };

  const handleVote = async (activityId, value) => {
    await vote(activityId, value);
  };

  return (
    <div className="space-y-4 py-4">
      {/* Tabs */}
      <div className="flex bg-slate-800 rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {tab === 'Feed' ? '📰' : tab === 'Friends' ? '👥' : '🏆'} {tab}
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
                <div className="text-center py-12 text-slate-500">
                  <p className="text-4xl mb-3">📰</p>
                  <p>No activity yet.</p>
                  <p className="text-sm mt-1">Add friends to see their progress here.</p>
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
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Requests ({requests.length})
                  </h3>
                  <div className="space-y-2">
                    {requests.map((req) => (
                      <div key={req.id} className="card flex items-center gap-3">
                        <div className="bg-slate-700 rounded-full h-9 w-9 flex items-center justify-center font-bold flex-shrink-0">
                          {req.sender.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-100 text-sm">{req.sender.name}</p>
                          <p className="text-xs text-slate-500">{req.sender.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleAccept(req.id)} className="bg-green-500/20 text-green-400 hover:bg-green-500/30 p-2 rounded-xl">
                            <CheckIcon className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleReject(req.id)} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 p-2 rounded-xl">
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search */}
              <button onClick={() => setShowSearch(true)} className="btn-primary w-full flex items-center justify-center gap-2">
                <MagnifyingGlassIcon className="h-4 w-4" />
                Find Friends
              </button>

              {/* Friends list */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Friends ({friends.length})
                </h3>
                {friends.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No friends yet. Search for people to add!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {friends.map((friend) => (
                      <div key={friend.id} className="card flex items-center gap-3">
                        <div className="bg-slate-700 rounded-full h-9 w-9 flex items-center justify-center font-bold text-slate-300 flex-shrink-0">
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-100 text-sm">{friend.name}</p>
                          <p className="text-xs text-slate-500">{friend.email}</p>
                        </div>
                        <button onClick={() => handleUnfriend(friend.id)} className="text-slate-600 hover:text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-400/10">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LEADERBOARD */}
          {activeTab === 'Leaderboard' && (
            <div className="space-y-3">
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <TrophyIcon className="h-5 w-5 text-yellow-400" />
                  <h3 className="font-semibold text-slate-100">Weekly Rankings</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">Based on habit completion, workouts, and meal tracking</p>
                {leaderboard.length === 0 ? (
                  <p className="text-center text-slate-500 text-sm py-4">Add friends to see rankings!</p>
                ) : (
                  <div className="space-y-1">
                    {leaderboard.map((entry) => (
                      <LeaderboardRow
                        key={entry.id}
                        user={entry}
                        rank={entry.rank}
                        isCurrentUser={entry.id === currentUser.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Search Modal */}
      <Modal isOpen={showSearch} onClose={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }} title="Find Friends">
        <div className="space-y-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              className="input-field pl-9"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          {searching && <div className="text-center py-3"><LoadingSpinner size="sm" /></div>}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-700/50">
                <div className="bg-slate-700 rounded-full h-9 w-9 flex items-center justify-center font-bold text-slate-300 flex-shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-100 text-sm">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
                <button onClick={() => handleSendRequest(u.id)} className="btn-primary text-xs py-1.5 px-3">
                  Add
                </button>
              </div>
            ))}
            {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
              <p className="text-center text-slate-500 text-sm py-3">No users found</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
