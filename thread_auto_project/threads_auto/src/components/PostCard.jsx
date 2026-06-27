import React, { useState } from 'react';
import './PostCard.css';

const PostCard = ({ post, isSelected, onToggleSelect, onApprove, onDelete, onUpdate, onSchedule, onCancelSchedule }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  const handleSave = () => {
    onUpdate(post.id, editContent);
    setIsEditing(false);
  };

  const handleConfirmSchedule = () => {
    if (!scheduleDate) {
      alert('발송 날짜 및 시간을 선택해주세요.');
      return;
    }
    const isoDate = new Date(scheduleDate).toISOString();
    onSchedule(post.id, isoDate);
    setIsScheduling(false);
  };

  const handleOpenSchedule = () => {
    if (post.scheduled_at) {
      const date = new Date(post.scheduled_at);
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      setScheduleDate(localDate.toISOString().slice(0, 16));
    } else {
      setScheduleDate('');
    }
    setIsScheduling(true);
  };

  const charCount = post.content.length;
  const isOverLimit = charCount > 500;
  const isWarning = charCount > 450 && !isOverLimit;

  const charClass = isOverLimit ? 'danger' : isWarning ? 'warning' : 'safe';

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div 
      className={`glass-card post-card animate-fade-in ${isSelected ? 'selected' : ''}`} 
      style={isSelected ? { borderColor: 'var(--accent-primary)', backgroundColor: 'rgba(255,255,255,0.08)' } : {}}
      draggable="true"
    >
      
      <div className="post-card-id-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={() => onToggleSelect(post.id)}
          style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
        />
        <span className="post-card-id">#{post.id}</span>
      </div>
      
      <div className="post-card-main">
        <div className="post-card-content">
          {isEditing ? (
            <textarea 
              value={editContent} 
              onChange={(e) => setEditContent(e.target.value)}
              className="edit-textarea"
              rows={4}
            />
          ) : (
            post.content
          )}
        </div>

        <div className="post-card-footer">
          <div className={`char-count ${charClass}`}>
            {charCount} / 500
            {isOverLimit && <span title="글자 수 초과">⚠️</span>}
          </div>

          {post.media_urls && post.media_urls.length > 0 && (
            <div className="post-card-media">
              {post.media_urls.map((url, idx) => (
                <img key={idx} src={url} alt={`Media ${idx}`} className="media-thumbnail" />
              ))}
            </div>
          )}

          {post.status === 'SCHEDULED' && post.scheduled_at && (
            <div className="schedule-badge">
              🕒 {formatDate(post.scheduled_at)}
            </div>
          )}

          {post.status === 'COMPLETED' && (
            <>
              <div className="schedule-badge completed">
                ✓ {formatDate(post.sent_at || post.scheduled_at)}
              </div>
              {post.thread_url && (
                <a href={post.thread_url} target="_blank" rel="noreferrer" className="thread-link">
                  스레드 이동 ↗
                </a>
              )}
            </>
          )}
        </div>
      </div>

      <div className="post-card-actions">
        {isEditing ? (
          <>
            <button className="btn-icon" title="저장" onClick={handleSave}>💾</button>
            <button className="btn-icon" title="취소" onClick={() => { setIsEditing(false); setEditContent(post.content); }}>❌</button>
          </>
        ) : isScheduling ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
            <input 
              type="datetime-local" 
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              style={{ fontSize: '0.7rem', width: '110px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '2px' }}
            />
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="btn-icon" title="예약 확인" onClick={handleConfirmSchedule}>✔️</button>
              <button className="btn-icon" title="취소" onClick={() => setIsScheduling(false)}>❌</button>
            </div>
          </div>
        ) : (
          <>
            {post.status === 'CREATED' && (
              <button className="btn-icon" title="승인" onClick={() => onApprove(post.id)}>✅</button>
            )}
            {(post.status === 'APPROVED' || post.status === 'SCHEDULED') && (
              <button className="btn-icon" title="발송 예약" onClick={handleOpenSchedule}>🗓️</button>
            )}
            {post.status === 'SCHEDULED' && (
              <button className="btn-icon" title="발송 예약 취소" onClick={() => onCancelSchedule(post.id)}>↩️</button>
            )}
            <button className="btn-icon" title="수정" onClick={() => setIsEditing(true)}>✏️</button>
            <button className="btn-icon delete-btn" title="삭제" onClick={() => onDelete(post.id)}>🗑️</button>
          </>
        )}
      </div>

    </div>
  );
};

export default PostCard;
