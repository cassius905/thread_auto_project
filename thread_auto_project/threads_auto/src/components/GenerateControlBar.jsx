import React, { useState } from 'react';
import './GenerateControlBar.css';
import { generateThreadsContent } from '../utils/gemini';
import { createPosts, getSetting, updateSetting } from '../utils/api';

const GenerateControlBar = ({ onGenerateComplete }) => {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isTopicFocused, setIsTopicFocused] = useState(false);
  const textareaRef = React.useRef(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      if (isTopicFocused) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      } else {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [topic, isTopicFocused]);

  React.useEffect(() => {
    const loadLastTopic = async () => {
      try {
        const data = await getSetting('last_topic');
        if (data && data.value) {
          setTopic(data.value);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadLastTopic();
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('생성할 주제나 키워드를 입력해 주세요.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      // 프롬프트를 DB에 저장
      await updateSetting('last_topic', topic);

      // 1번의 API 호출로 count 개의 콘텐츠를 배열로 받아옴
      const results = await generateThreadsContent(topic, count);

      const newPostsPayload = results.map(res => ({
        content: res.content,
        status: 'CREATED',
        media_urls: []
      }));

      // 생성된 데이터를 백엔드(MySQL)로 전송하여 저장
      const savedPosts = await createPosts(newPostsPayload);

      if (onGenerateComplete) {
        onGenerateComplete(savedPosts);
      }
      // setTopic(''); // 초기화 주석 처리 (고정시키기 위해)
    } catch (err) {
      setError(err.message || '콘텐츠 생성 및 저장 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="generate-bar-container glass-panel animate-fade-in">
      <div className="generate-inputs">
        <div className="input-group topic-group">
          <label>
            <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>프롬프트 입력</span>
            <span style={{ fontSize: '0.6rem', color: 'blue', display: 'block', marginTop: '4px' }}>*가장 마지막에 입력했던 내용이 저장되어 있습니다</span>
          </label>
          <div style={{ position: 'relative', width: '100%' }}>
            <textarea
              ref={textareaRef}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onFocus={() => setIsTopicFocused(true)}
              onBlur={() => setIsTopicFocused(false)}
              placeholder="AI가 생성할 스레드의 주제를 입력하세요..."
              disabled={isGenerating}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isGenerating) handleGenerate();
                }
              }}
              style={isTopicFocused ? { position: 'absolute', top: 0, left: 0, zIndex: 50 } : {}}
            />
            {isTopicFocused && (
              <textarea
                rows={1}
                disabled
                style={{ visibility: 'hidden' }}
              />
            )}
          </div>
        </div>

        <div className="input-group action-group">
          <label>
            <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>생성 개수</span>
            <span style={{ fontSize: '0.6rem', color: 'blue', display: 'block', marginTop: '4px' }}>*최소 1개 / 최대 10개</span>
          </label>
          <div className="action-row">
            <div className="select-wrapper">
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                disabled={isGenerating}
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}개</option>
                ))}
              </select>
            </div>
            <button
              className={`btn-primary generate-btn ${isGenerating ? 'generating' : ''}`}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <div className="loading-content">
                  <span className="spinner"></span>
                  생성 중...
                </div>
              ) : (
                '✨ AI 대량 생성'
              )}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="generate-error">{error}</div>}
    </div>
  );
};

export default GenerateControlBar;
