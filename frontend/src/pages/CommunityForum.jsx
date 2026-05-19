import React, { useState, useEffect } from 'react';
import './CommunityForum.css';
import * as forumService from '../services/forumService';
import { getCurrentUser } from '../services/authService';

const CommunityForum = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const data = await forumService.getAllPosts();
      setTopics(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch forum topics');
    } finally {
      setLoading(false);
    }
  };

  const handleNewTopic = async () => {
    if (!user) {
      alert('Please login to post a topic.');
      return;
    }
    const title = prompt('Enter topic title:');
    if (title) {
      try {
        await forumService.createPost({
          title,
          content: '',
          authorId: user.id,
          authorName: user.name
        });
        fetchTopics();
      } catch (error) {
        alert('Failed to create topic');
      }
    }
  };

  const formatTime = (time) => {
    if (!time) return 'Just now';
    const date = new Date(time);
    return date.toLocaleDateString();
  };

  if (loading) return <div className="loading">Loading forum...</div>;

  return (
    <div className="forum-page page-with-navbar-spacing animate-in">
      <div className="container">
        <header className="forum-header">
          <span className="section-label">Community Space</span>
          <h1>SmartRide Forum</h1>
          <p className="text-muted">Connect with fellow travelers and share your experiences.</p>
        </header>

        <div className="forum-layout">
          <main className="forum-main">
            <div className="forum-actions glass">
              <input type="text" placeholder="Search topics..." className="glass-input" />
              <button className="btn-primary" onClick={handleNewTopic}>New Topic</button>
            </div>

            <div className="topics-list">
              {topics.map(t => (
                <div key={t.id} className="topic-card glass hover-pop" onClick={() => forumService.incrementViews(t.id)}>
                  <div className="topic-info">
                    <h4>{t.title}</h4>
                    <div className="topic-meta">
                      <span>By {t.authorName}</span>
                      <span>•</span>
                      <span>{formatTime(t.createdAt)}</span>
                    </div>
                  </div>
                  <div className="topic-stats">
                    <div className="stat">
                      <span className="val">{t.replies}</span>
                      <span className="lab">Replies</span>
                    </div>
                    <div className="stat">
                      <span className="val">{t.views}</span>
                      <span className="lab">Views</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>

          <aside className="forum-sidebar">
            <div className="sidebar-card glass">
              <h3>Top Contributors</h3>
              <div className="contributor-list">
                {['UserA', 'UserB', 'UserC'].map(u => (
                  <div key={u} className="contributor">
                    <div className="avatar-sm"></div>
                    <span>{u}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CommunityForum;

