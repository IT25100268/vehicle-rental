import React from 'react';
import './BlogPage.css';

const BlogPage = () => {
  const posts = [
    { id: 1, title: 'Top 5 Scenic Drives in Sri Lanka', date: 'May 10, 2024', category: 'Travel', image: 'https://images.unsplash.com/photo-1544074052-965381622340?auto=format&fit=crop&q=80&w=800' },
    { id: 2, title: 'How to Choose the Right Rental Bike', date: 'May 05, 2024', category: 'Guides', image: 'https://images.unsplash.com/photo-1558981403-c5f97db94ad8?auto=format&fit=crop&q=80&w=800' },
    { id: 3, title: 'Essential Tips for First-Time Renters', date: 'Apr 28, 2024', category: 'Tips', image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=800' },
  ];

  return (
    <div className="blog-page page-with-navbar-spacing animate-in">
      <div className="container">
        <header className="blog-header">
          <span className="section-label">SmartRide Blog</span>
          <h1>Travel, Tips & Trends</h1>
          <p className="text-muted">Stories and guides to inspire your next adventure.</p>
        </header>

        <div className="featured-post glass">
          <img src={posts[0].image} alt="Featured" />
          <div className="post-content">
            <span className="badge badge-blue">{posts[0].category}</span>
            <h2>{posts[0].title}</h2>
            <p>From the misty mountains of Nuwara Eliya to the golden beaches of Mirissa, discover the most breathtaking routes you can drive this season.</p>
            <div className="post-meta">
              <span>{posts[0].date}</span>
              <button className="btn-primary">Read More</button>
            </div>
          </div>
        </div>

        <div className="blog-grid">
          {posts.slice(1).map(post => (
            <div key={post.id} className="blog-card glass hover-pop">
              <img src={post.image} alt={post.title} />
              <div className="blog-card-content">
                <span className="badge badge-indigo">{post.category}</span>
                <h3>{post.title}</h3>
                <p>Learn the ins and outs of renting with our comprehensive guide.</p>
                <div className="blog-card-footer">
                  <span>{post.date}</span>
                  <button className="btn-ghost btn-sm">Read</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
