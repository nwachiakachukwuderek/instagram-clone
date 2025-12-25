import React, { useEffect, useState } from 'react'
import './post.css'
import Avatar from '@mui/material/Avatar';
// Import Appwrite config
import { db, client } from './appwrite.js';
import { ID, Query } from './appwrite.js';

function Posts({ postId, username, caption, imageUrl, user }) {
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');


  const DATABASE_ID = '694d5b970031eb81aa51';
  const COMMENTS_COLLECTION_ID = 'YOUR_COMMENTS_COLLECTION_ID';

  useEffect(() => {
    if (!postId) return;

    // 1. Fetch existing comments for this specific post
    const fetchComments = async () => {
      try {
        const response = await db.listDocuments(
          DATABASE_ID,
          'COMMENTS_COLLECTION_ID',
          [
            Query.equal('postId', postId), // Only get comments for THIS post
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
      `databases.${DATABASE_ID}.collections.${COMMENTS_COLLECTION_ID}.documents`,
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

    try {
      await db.createDocument(
        DATABASE_ID,
        COMMENTS_COLLECTION_ID,
        ID.unique(),
        {
          text: comment,
          username: user.name, // In Appwrite, it's usually user.name or user.email
          postId: postId,      // Manual link to the parent post
        }
      );
      setComment('');
    } catch (error) {
      alert(error.message);
    }
  }

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
        <form className='post_commentBox'>
          <input
            type="text"
            className='post_input'
            placeholder='Add Comments Here'
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            className='post_button'
            disabled={!comment}
            type='submit'
            onClick={postComment}
          >
            Post
          </button>
        </form>
      )}
    </div>
  )
}

export default Posts;