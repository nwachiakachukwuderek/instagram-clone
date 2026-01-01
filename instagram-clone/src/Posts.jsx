import React, { useEffect, useState } from 'react';
import './post.css';
import Avatar from '@mui/material/Avatar';
// Import Appwrite config
import { db, client } from './appwrite.js';
import { ID, Query } from './appwrite.js';
import { APPWRITE_CONFIG } from './constants';

function Posts({ postId, username, caption, imageUrl, user }) {
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!postId) return;

    // 1. Fetch existing comments for this specific post
    const fetchComments = async () => {
      try {
        const response = await db.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COMMENTS_COLLECTION_ID,
          [
            Query.equal('postId', postId),
            Query.orderDesc('$createdAt')
          ]
        );
        setComments(response.documents);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    fetchComments();

    // 2. Realtime listener for new comments
    const unsubscribe = client.subscribe(
      `databases.${APPWRITE_CONFIG.DATABASE_ID}.collections.${APPWRITE_CONFIG.COMMENTS_COLLECTION_ID}.documents`,
      (response) => {
        // If a new comment is added to the collection
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          const newComment = response.payload;
          // Only add to state if it belongs to this post
          if (newComment.postId === postId) {
            setComments((prev) => [newComment, ...prev]);
          }
        }
      }
    );

    return () => unsubscribe();
  }, [postId]);

  const postComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setPosting(true);
    try {
      await db.createDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COMMENTS_COLLECTION_ID,
        ID.unique(),
        {
          text: comment.trim(),
          username: user.name || user.email,
          postId: postId,
        }
      );
      setComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      alert(`Failed to post comment: ${error.message}`);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className='post'>
      <div className="post_header">
        <Avatar className='post_avatar' alt={username} src="/static/images/avatar/1.jpg" />
        <h3>{username}</h3>
      </div>

      <img className='post_image' src={imageUrl} alt="Post" />

      <h4 className='post_text'><strong>{username}</strong> {caption}</h4>

      <div className='post_comments'>
        {comments.map((c) => (
          <p key={c.$id}>
            <strong>{c.username}</strong> {c.text}
          </p>
        ))}
      </div>

      {user && (
        <form className='post_commentBox' onSubmit={postComment}>
          <input
            type="text"
            className='post_input'
            placeholder='Add a comment...'
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={posting}
          />
          <button
            className='post_button'
            disabled={!comment.trim() || posting}
            type='submit'
          >
            {posting ? 'Posting...' : 'Post'}
          </button>
        </form>
      )}
    </div>
  );
}

export default Posts;