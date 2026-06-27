const API_BASE_URL = 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const login = async (password) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    throw new Error('비밀번호가 일치하지 않습니다.');
  }
  return response.json();
};

export const fetchPosts = async () => {
  const response = await fetch(`${API_BASE_URL}/posts`);
  if (!response.ok) {
    throw new Error('데이터를 불러오는데 실패했습니다.');
  }
  return response.json();
};

export const createPosts = async (posts) => {
  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(posts),
  });
  if (!response.ok) {
    throw new Error('데이터를 저장하는데 실패했습니다.');
  }
  return response.json();
};

export const updatePostStatus = async (postId, statusData) => {
  const response = await fetch(`${API_BASE_URL}/posts/${postId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(statusData),
  });
  if (!response.ok) {
    throw new Error('상태를 업데이트하는데 실패했습니다.');
  }
  return response.json();
};

export const deletePost = async (postId) => {
  const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('데이터를 삭제하는데 실패했습니다.');
  }
  return response.json();
};

export const updatePostContent = async (postId, content) => {
  const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    throw new Error('내용을 업데이트하는데 실패했습니다.');
  }
  return response.json();
};

export const bulkApprove = async (postIds) => {
  const response = await fetch(`${API_BASE_URL}/posts/bulk/approve`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ post_ids: postIds }),
  });
  if (!response.ok) {
    throw new Error('일괄 승인에 실패했습니다.');
  }
  return response.json();
};

export const bulkDelete = async (postIds) => {
  const response = await fetch(`${API_BASE_URL}/posts/bulk/delete`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({ post_ids: postIds }),
  });
  if (!response.ok) {
    throw new Error('일괄 삭제에 실패했습니다.');
  }
  return response.json();
};

export const bulkSchedule = async (postIds, scheduledAt) => {
  const response = await fetch(`${API_BASE_URL}/posts/bulk/schedule`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ post_ids: postIds, scheduled_at: scheduledAt }),
  });
  if (!response.ok) {
    throw new Error('일괄 예약에 실패했습니다.');
  }
  return response.json();
};

export const bulkCancelSchedule = async (postIds) => {
  const response = await fetch(`${API_BASE_URL}/posts/bulk/cancel-schedule`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ post_ids: postIds }),
  });
  if (!response.ok) {
    throw new Error('일괄 예약 취소에 실패했습니다.');
  }
  return response.json();
};

export const getSetting = async (key) => {
  const response = await fetch(`${API_BASE_URL}/settings/${key}`);
  if (!response.ok) {
    return { key, value: '' };
  }
  return response.json();
};

export const updateSetting = async (key, value) => {
  const response = await fetch(`${API_BASE_URL}/settings/${key}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ value }),
  });
  if (!response.ok) {
    throw new Error('설정을 저장하는데 실패했습니다.');
  }
  return response.json();
};
