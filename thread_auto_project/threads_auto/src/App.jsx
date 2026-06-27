import React, { useState, useEffect } from 'react';
import KanbanBoard from './components/KanbanBoard';
import GenerateControlBar from './components/GenerateControlBar';
import { fetchPosts, deletePost, updatePostStatus, updatePostContent, login, bulkApprove, bulkDelete, bulkSchedule, bulkCancelSchedule } from './utils/api';
import './App.css';

function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem('auth_token'));
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // App state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Selection state
  const [selectedPostIds, setSelectedPostIds] = useState([]);

  // Load posts from MySQL DB via FastAPI on mount and setup WebSocket
  useEffect(() => {
    if (!isAuthenticated) return;

    setLoading(true);
    const loadPosts = async () => {
      try {
        const data = await fetchPosts();
        setPosts(data);
      } catch (err) {
        console.error(err);
        setError('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인하세요.');
      } finally {
        setLoading(false);
      }
    };

    // 최초 데이터 로드
    loadPosts();

    // WebSocket 연결 설정
    const wsUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'ws://localhost:8000/ws'
      : `ws://${window.location.hostname}:8000/ws`;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.action === 'refresh') {
          console.log('WebSocket: Received refresh signal, reloading posts...');
          loadPosts();
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const data = await login(passwordInput);
      if (data.success) {
        sessionStorage.setItem('auth_token', data.token);
        setIsAuthenticated(true);
      }
    } catch (err) {
      setLoginError(err.message || '로그인 실패');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setPosts([]);
    setSelectedPostIds([]);
  };

  const handleGenerateComplete = (newPosts) => {
    // 백엔드에서 생성 후 WebSocket이 즉시 동작하지 않을 경우를 대비한 낙관적 업데이트
    setPosts(prevPosts => [...newPosts, ...prevPosts]);
  };

  const handleApprovePost = async (postId) => {
    try {
      await updatePostStatus(postId, { status: 'APPROVED' });
    } catch (err) {
      console.error(err);
      alert('승인 중 오류가 발생했습니다.');
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await deletePost(postId);
      setSelectedPostIds(prev => prev.filter(id => id !== postId));
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleUpdatePostContent = async (postId, newContent) => {
    try {
      await updatePostContent(postId, newContent);
    } catch (err) {
      console.error(err);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleSchedulePost = async (postId, scheduledAt) => {
    try {
      await updatePostStatus(postId, { status: 'SCHEDULED', scheduled_at: scheduledAt });
    } catch (err) {
      console.error(err);
      alert('예약 중 오류가 발생했습니다.');
    }
  };

  const handleCancelSchedulePost = async (postId) => {
    try {
      await updatePostStatus(postId, { status: 'APPROVED', scheduled_at: null });
    } catch (err) {
      console.error(err);
      alert('예약 취소 중 오류가 발생했습니다.');
    }
  };

  // Selection handlers
  const handleToggleSelect = (postId) => {
    setSelectedPostIds(prev =>
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const handleSelectColumn = (status, selectAll) => {
    const columnPostIds = posts.filter(p => p.status === status).map(p => p.id);
    if (selectAll) {
      setSelectedPostIds(prev => Array.from(new Set([...prev, ...columnPostIds])));
    } else {
      setSelectedPostIds(prev => prev.filter(id => !columnPostIds.includes(id)));
    }
  };

  const [isBulkScheduling, setIsBulkScheduling] = useState(false);
  const [bulkScheduleDate, setBulkScheduleDate] = useState('');

  // Bulk action handlers
  const handleBulkApprove = async () => {
    if (!window.confirm(`선택한 ${selectedPostIds.length}개의 게시물을 일괄 승인하시겠습니까?`)) return;
    try {
      await bulkApprove(selectedPostIds);
      setSelectedPostIds([]);
    } catch (err) {
      console.error(err);
      alert('일괄 승인 중 오류가 발생했습니다.');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`선택한 ${selectedPostIds.length}개의 게시물을 일괄 삭제하시겠습니까?`)) return;
    try {
      await bulkDelete(selectedPostIds);
      setSelectedPostIds([]);
    } catch (err) {
      console.error(err);
      alert('일괄 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleBulkScheduleConfirm = async () => {
    if (!bulkScheduleDate) {
      alert('발송 날짜 및 시간을 선택해주세요.');
      return;
    }
    const isoDate = new Date(bulkScheduleDate).toISOString();
    try {
      await bulkSchedule(selectedPostIds, isoDate);
      setSelectedPostIds([]);
      setIsBulkScheduling(false);
      setBulkScheduleDate('');
    } catch (err) {
      console.error(err);
      alert('일괄 예약 중 오류가 발생했습니다.');
    }
  };

  const handleBulkCancelSchedule = async () => {
    if (!window.confirm(`선택한 ${selectedPostIds.length}개의 예약 발송을 일괄 취소하시겠습니까?`)) return;
    try {
      await bulkCancelSchedule(selectedPostIds);
      setSelectedPostIds([]);
    } catch (err) {
      console.error(err);
      alert('일괄 예약 취소 중 오류가 발생했습니다.');
    }
  };

  const selectedPosts = posts.filter(p => selectedPostIds.includes(p.id));
  const selectedStatuses = Array.from(new Set(selectedPosts.map(p => p.status)));
  const canBulkApprove = selectedStatuses.length === 1 && selectedStatuses[0] === 'CREATED';
  const canBulkSchedule = selectedStatuses.length > 0 && selectedStatuses.every(s => s === 'APPROVED' || s === 'SCHEDULED');
  const canBulkCancelSchedule = selectedStatuses.length === 1 && selectedStatuses[0] === 'SCHEDULED';
  const canBulkDelete = selectedPostIds.length > 0;

  if (!isAuthenticated) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="bg-glow top-left"></div>
        <div className="bg-glow bottom-right"></div>
        <div className="glass-card" style={{ padding: '40px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '24px', fontSize: '1.8rem' }}>🪐 Anti-gravity</h1>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(0,0,0,0.2)',
                color: 'white',
                fontSize: '1rem'
              }}
            />
            {loginError && <p style={{ color: '#ef4444', fontSize: '0.9rem', margin: 0 }}>{loginError}</p>}
            <button type="submit" className="primary-button" style={{ padding: '12px', fontSize: '1rem' }}>
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="bg-glow top-left"></div>
      <div className="bg-glow bottom-right"></div>

      <header className="app-header glass-panel">
        <div className="logo">
          <span className="logo-icon">🪐</span>
          <h1>Anti-gravity</h1>
        </div>
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={handleLogout} className="btn-icon" style={{ padding: '6px 12px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px' }}>
            로그아웃
          </button>
          <div className="avatar">A</div>
        </div>
      </header>

      <main className="app-main" style={{ paddingTop: '24px', paddingBottom: '80px', paddingLeft: '100px', paddingRight: '100px' }}>
        <GenerateControlBar onGenerateComplete={handleGenerateComplete} />

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <span className="spinner" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent', width: '32px', height: '32px' }}></span>
            <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>데이터베이스에서 게시물을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="empty-state" style={{ margin: '24px', borderColor: '#ef4444' }}>
            {error}
          </div>
        ) : (
          <KanbanBoard
            posts={posts}
            selectedPostIds={selectedPostIds}
            onToggleSelect={handleToggleSelect}
            onSelectColumn={handleSelectColumn}
            onApprove={handleApprovePost}
            onDelete={handleDeletePost}
            onUpdate={handleUpdatePostContent}
            onSchedule={handleSchedulePost}
            onCancelSchedule={handleCancelSchedulePost}
          />
        )}
      </main>

      {/* Bulk Action Bar */}
      {selectedPostIds.length > 0 && (
        <div className="bulk-action-bar animate-fade-in" style={{
          position: 'fixed',
          bottom: '224px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(20, 20, 30, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '12px',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 1000
        }}>
          <span style={{ fontWeight: '500' }}>{selectedPostIds.length}개 선택됨</span>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }}></div>
          {isBulkScheduling ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="datetime-local"
                value={bulkScheduleDate}
                onChange={(e) => setBulkScheduleDate(e.target.value)}
                style={{ fontSize: '0.9rem', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '4px' }}
              />
              <button onClick={handleBulkScheduleConfirm} className="primary-button" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                ✔️ 예약
              </button>
              <button onClick={() => setIsBulkScheduling(false)} className="btn-icon" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                취소
              </button>
            </div>
          ) : (
            <>
              {canBulkApprove && (
                <button onClick={handleBulkApprove} className="primary-button" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                  ✅ 일괄 승인
                </button>
              )}
              {canBulkSchedule && (
                <button onClick={() => setIsBulkScheduling(true)} className="primary-button" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                  🗓️ 일괄 예약
                </button>
              )}
              {canBulkCancelSchedule && (
                <button onClick={handleBulkCancelSchedule} className="btn-icon" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                  ↩️ 예약 취소
                </button>
              )}
              {canBulkDelete && (
                <button onClick={handleBulkDelete} className="btn-icon delete-btn" style={{ padding: '6px 12px', fontSize: '0.9rem', border: '1px solid #ef4444' }}>
                  🗑️ 일괄 삭제
                </button>
              )}
              <button onClick={() => { setSelectedPostIds([]); setIsBulkScheduling(false); setBulkScheduleDate(''); }} className="btn-icon" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                선택 해제
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;