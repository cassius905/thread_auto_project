import React from 'react';
import PostCard from './PostCard';
import './KanbanColumn.css';

const KanbanColumn = ({ status, title, posts, selectedPostIds, onToggleSelect, onSelectColumn, onApprove, onDelete, onUpdate, onSchedule, onCancelSchedule }) => {
  const statusClass = status.toLowerCase();

  const isAllSelected = posts.length > 0 && posts.every(p => selectedPostIds.includes(p.id));

  return (
    <div className={`kanban-column column-${statusClass}`}>
      <div className={`glass-panel kanban-column-header ${statusClass}`}>
        <div className="kanban-column-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="checkbox" 
            checked={isAllSelected}
            onChange={() => onSelectColumn(status, !isAllSelected)}
            style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
            disabled={posts.length === 0}
          />
          <span className="status-dot"></span>
          {title}
        </div>
        <div className="post-count">{posts.length}</div>
      </div>
      
      <div className="kanban-column-body">
        {posts.length > 0 ? (
          posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              isSelected={selectedPostIds.includes(post.id)}
              onToggleSelect={onToggleSelect}
              onApprove={onApprove} 
              onDelete={onDelete}
              onUpdate={onUpdate}
              onSchedule={onSchedule}
              onCancelSchedule={onCancelSchedule}
            />
          ))
        ) : (
          <div className="empty-state">
            이동된 콘텐츠가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
