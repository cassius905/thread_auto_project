import { useState } from 'react'
import './App.css'

const initialContents = [
  { 
    id: 1, 
    text: "첫 번째 스레드 콘텐츠입니다! 여기에 500자 제한이 적용됩니다. #마케팅 #자동화", 
    status: "created", 
    media: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500" 
  },
  { 
    id: 2, 
    text: "승인 완료되어 예약 대기 중인 콘텐츠 샘플입니다. 토글을 켜서 시간을 지정해보세요.", 
    status: "approved", 
    scheduledTime: "" 
  },
  { 
    id: 3, 
    text: "오후 6시에 발송 예정인 스레드 타래 내용입니다.", 
    status: "scheduled", 
    scheduledTime: "2026-06-26T18:00" 
  },
  { 
    id: 4, 
    text: "이미 발송이 완료된 성공적인 스레드 마케팅 콘텐츠입니다.", 
    status: "completed", 
    threadLink: "https://threads.net" 
  },
];

function App() {
  const [contents, setContents] = useState(initialContents);

  const updateStatus = (id, newStatus, extraFields = {}) => {
    setContents(prev => prev.map(item => 
      item.id === id ? { ...item, status: newStatus, ...extraFields } : item
    ));
  };

  const deleteContent = (id) => {
    setContents(prev => prev.filter(item => item.id !== id));
  };

  const createdItems = contents.filter(item => item.status === "created");
  const approvedItems = contents.filter(item => item.status === "approved");
  const scheduledItems = contents.filter(item => item.status === "scheduled");
  const completedItems = contents.filter(item => item.status === "completed");

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>🧵 Threads 자동화 대시보드</h1>
        <p>콘텐츠 생성부터 발송 완료까지 한눈에 관리하는 파이프라인</p>
      </header>

      <div className="kanban-board">
        
        {/* 1. 생성됨 */}
        <div className="kanban-column">
          <div className="column-header">
            <span className="column-title">
              <span className="badge bg-blue"></span> 1. 생성됨
            </span>
            <span className="item-count">{createdItems.length}</span>
          </div>
          <div className="card-list">
            {createdItems.map(item => (
              <div key={item.id} className="content-card">
                <div className="card-no">#NO-{item.id}</div>
                <p className="card-text">{item.text}</p>
                {item.media && (
                  <div className="media-preview">
                    <img src={item.media} alt="미디어 프리뷰" />
                  </div>
                )}
                <div className="card-footer">
                  <span className={`char-count ${item.text.length > 500 ? 'text-danger' : ''}`}>
                    {item.text.length} / 500자
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => deleteContent(item.id)} className="btn-reject">거부</button>
                    <button onClick={() => updateStatus(item.id, "approved")} className="btn-approve">승인</button>
                  </div>
                </div>
              </div>
            ))}
            {createdItems.length === 0 && <p className="empty-msg">대기 중인 콘텐츠가 없습니다.</p>}
          </div>
        </div>

        {/* 2. 승인됨 */}
        <div className="kanban-column">
          <div className="column-header">
            <span className="column-title">
              <span className="badge bg-purple"></span> 2. 승인됨
            </span>
            <span className="item-count">{approvedItems.length}</span>
          </div>
          <div className="card-list">
            {approvedItems.map(item => (
              <div key={item.id} className="content-card">
                <div className="card-no">#NO-{item.id}</div>
                <p className="card-text">{item.text}</p>
                <div className="scheduler-box">
                  <label className="toggle-label">
                    <span>발송 예약 설정</span>
                    <input 
                      type="checkbox" 
                      checked={!!item.scheduledTime}
                      onChange={(e) => updateStatus(item.id, "approved", { scheduledTime: e.target.checked ? new Date().toISOString().slice(0, 16) : "" })}
                    />
                  </label>
                  {item.scheduledTime && (
                    <div className="time-input-wrapper">
                      <input 
                        type="datetime-local" 
                        value={item.scheduledTime}
                        onChange={(e) => updateStatus(item.id, "approved", { scheduledTime: e.target.value })}
                        className="time-input"
                      />
                      <button onClick={() => updateStatus(item.id, "scheduled")} className="btn-confirm-schedule">
                        예약 확정하기
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {approvedItems.length === 0 && <p className="empty-msg">승인된 콘텐츠가 없습니다.</p>}
          </div>
        </div>

        {/* 3. 발송 예정 */}
        <div className="kanban-column">
          <div className="column-header">
            <span className="column-title">
              <span className="badge bg-amber"></span> 3. 발송 예정
            </span>
            <span className="item-count">{scheduledItems.length}</span>
          </div>
          <div className="card-list">
            {scheduledItems.map(item => (
              <div key={item.id} className="content-card">
                <div className="card-no">
                  <span>#NO-{item.id}</span>
                  <span style={{ color: '#f59e0b', fontWeight: '500' }}>⏳ {item.scheduledTime?.replace('T', ' ')}</span>
                </div>
                <p className="card-text">{item.text}</p>
                <div className="btn-group">
                  <button onClick={() => updateStatus(item.id, "approved", { scheduledTime: "" })} className="btn-cancel">
                    발송 취소 (회수)
                  </button>
                  <button onClick={() => updateStatus(item.id, "completed", { threadLink: "https://threads.net" })} className="btn-direct">
                    즉시발송
                  </button>
                </div>
              </div>
            ))}
            {scheduledItems.length === 0 && <p className="empty-msg">예약된 대기열이 비어있습니다.</p>}
          </div>
        </div>

        {/* 4. 완료됨 */}
        <div className="kanban-column">
          <div className="column-header">
            <span className="column-title">
              <span className="badge bg-green"></span> 4. 완료됨
            </span>
            <span className="item-count">{completedItems.length}</span>
          </div>
          <div className="card-list">
            {completedItems.map(item => (
              <div key={item.id} className="content-card">
                <div className="card-no">
                  <span>#NO-{item.id}</span>
                  <span style={{ color: '#10b981', fontWeight: '500' }}>✅ 발송 완료</span>
                </div>
                <p className="card-text" style={{ color: '#868e96' }}>{item.text}</p>
                <div className="btn-group" style={{ alignItems: 'center' }}>
                  <a href={item.threadLink} target="_blank" rel="noreferrer" className="btn-link">
                    스레드 이동 🔗
                  </a>
                  <button onClick={() => deleteContent(item.id)} className="btn-delete" title="기록 삭제">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            {completedItems.length === 0 && <p className="empty-msg">발송 완료된 내역이 없습니다.</p>}
          </div>
        </div>

      </div>
    </div>
  )
}

export default App