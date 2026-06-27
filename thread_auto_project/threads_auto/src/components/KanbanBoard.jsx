import React from 'react';
import KanbanColumn from './KanbanColumn';
import './KanbanBoard.css';

const KanbanBoard = ({ posts, selectedPostIds, onToggleSelect, onSelectColumn, onApprove, onDelete, onUpdate, onSchedule, onCancelSchedule }) => {
  // Group posts by status
  const getPostsByStatus = (status) => {
    return posts.filter(post => post.status === status);
  };

  return (
    <div className="kanban-board-container animate-fade-in">
      <div className="kanban-board-header">
        <div className="kanban-board-title">
          <span>🧵 안티그레비티 (Anti-gravity)</span>
          <span className="kanban-board-subtitle">마케팅 스케일업 파이프라인</span>
        </div>
      </div>

      <div className="kanban-columns-wrapper">
        <KanbanColumn 
          status="CREATED" 
          title="생성됨 (Created)" 
          posts={getPostsByStatus('CREATED')} 
          selectedPostIds={selectedPostIds}
          onToggleSelect={onToggleSelect}
          onSelectColumn={onSelectColumn}
          onApprove={onApprove}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onSchedule={onSchedule}
          onCancelSchedule={onCancelSchedule}
        />
        <KanbanColumn 
          status="APPROVED" 
          title="승인됨 (Approved)" 
          posts={getPostsByStatus('APPROVED')} 
          selectedPostIds={selectedPostIds}
          onToggleSelect={onToggleSelect}
          onSelectColumn={onSelectColumn}
          onApprove={onApprove}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onSchedule={onSchedule}
          onCancelSchedule={onCancelSchedule}
        />
        <KanbanColumn 
          status="SCHEDULED" 
          title="발송 예정 (Scheduled)" 
          posts={getPostsByStatus('SCHEDULED')} 
          selectedPostIds={selectedPostIds}
          onToggleSelect={onToggleSelect}
          onSelectColumn={onSelectColumn}
          onApprove={onApprove}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onSchedule={onSchedule}
          onCancelSchedule={onCancelSchedule}
        />
        <KanbanColumn 
          status="COMPLETED" 
          title="완료됨 (Completed)" 
          posts={getPostsByStatus('COMPLETED')} 
          selectedPostIds={selectedPostIds}
          onToggleSelect={onToggleSelect}
          onSelectColumn={onSelectColumn}
          onApprove={onApprove}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onSchedule={onSchedule}
          onCancelSchedule={onCancelSchedule}
        />
      </div>
    </div>
  );
};

export default KanbanBoard;
