import './App.css';
import instagramLogo from './IMG/Gemini.png';
import Posts from './Posts';
import ImageUpload from './ImageUpload';
import { useEffect, useState } from 'react';
// Import Appwrite services
import { account, db, client, storage } from './appwrite.js';
import { ID, Query } from './appwrite';
import { APPWRITE_CONFIG } from './constants';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
import { InstagramEmbed } from 'react-social-media-embed';

function App() {
  const [openSignIn, setOpenSignIn] = useState(false);
  const [posts, setPosts] = useState([]);
  const [open, setOpen] = useState(false);
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '400px',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    display: 'flex',
    flexDirection: 'column'
  };

  // APPWRITE REALTIME: Fetches and listens for posts
  useEffect(() => {
    // 1. Initial Fetch
    const fetchPosts = async () => {
      try {
        const response = await db.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.POSTS_COLLECTION_ID,
          [Query.orderDesc('$createdAt')]
        );
        setPosts(response.documents.map(doc => ({ id: doc.$id, post: doc })));
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    fetchPosts();

    // 2. Realtime Subscription
    const unsubscribe = client.subscribe(
      `databases.${APPWRITE_CONFIG.DATABASE_ID}.collections.${APPWRITE_CONFIG.POSTS_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          // If a new post is created, re-fetch posts
          fetchPosts();
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // AUTH: Check for current session
  useEffect(() => {
    const checkUser = async () => {
      try {
        const session = await account.get();
        setUser(session);
        // You can use this session object to get the entire session but you dont need it you can just fetch what you want
      } catch (err) {
        setUser(null);
        console.log('No active session:', err);
      }
    };
    checkUser();
  }, []);

  // SIGN UP FUNCTION
  const signUp = async (event) => {
    event.preventDefault();
    try {
      // 1. Create account
      await account.create(ID.unique(), email, password, username);
      // 2. Create session (Login automatically)
      await account.createEmailPasswordSession(email, password);
      // 3. Update state
      const currentUser = await account.get();
      setUser(currentUser);
      setOpen(false);
    } catch (error) {
      alert(error.message);
    }
  };

  // SIGN IN FUNCTION
  const signIn = async (event) => {
    event.preventDefault();
    try {
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();
      setUser(currentUser);
      setOpenSignIn(false);
    } catch (error) {
      alert(error.message);
    }
  };

  // LOGOUT FUNCTION
  const handleLogout = async () => {
    await account.deleteSession('current');
    setUser(null);
  };

  const imageUrl = storage.getFilePreview('bucketID', posts.imageID)

  return (
    <>
    <Modal
            open={openSignIn}
            onClose={() => setOpenSignIn(false)}
          >
          <Box sx={style}>
            <form className='app_signup'>
              <center>
              <img
              className='app_headerImage'
              src={instagramLogo}
              alt="InstagramLogo" />
              </center>
              <Input 
              placeholder="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              />
              <Input 
              placeholder="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              />
              <Button onClick={signIn} type='submit'>
                Sign In
              </Button>
            </form>
        </Box>
    </Modal>

   <Modal
          open={open}
          onClose={() => setOpen(false)}
        >
        <Box sx={style}>
          <form className='app_signup'>
            <center>
            <img
            className='app_headerImage'
            src={instagramLogo}
            alt="InstagramLogo" />
            </center>
            <Input 
            placeholder="username"
            type="text"
            value={username}
            onChange={(e) => setUserName(e.target.value)}
            />
            <Input 
            placeholder="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            />
            <Input 
            placeholder="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={signUp} type='submit'>
              Sign Up
            </Button>
          </form>
      </Box>
   </Modal>

      {/* Just change the Logout button to: */}


      <div className="app">
      {/* Rendering Posts remains almost identical */}
      <div className="app_header">
        <div className="info">
        <span>
           <img
          className='app_headerImage'
          src={instagramLogo}
          alt="Instagram Logo"
        />
        </span>
        <span>
          {user ? (
          <Button onClick={handleLogout}>Logout</Button>
        ) : (
          <div className="app_loginContainer">
            <Button onClick={() => setOpenSignIn(true)}>Sign In</Button>
            <Button onClick={() => setOpen(true)}>Sign Up</Button>
          </div>
        )}
        </span>
        </div>
        {user && <ImageUpload username={user.name || user.email} />}
      </div>
        <div className="app_bottom">
          <div className="app_postsRight">
            <div>
              <InstagramEmbed url="https://www.instagram.com/p/CUbHfhpswxt/" width={328} />
            </div>
          </div>

          <div className="app_postLeft">
          <div className="app_posts">
            {posts.map(({ id, post }) => (
              <Posts 
                key={id} 
                postId={id} 
                username={post.username} 
                imageUrl={imageUrl} 
                caption={post.caption} 
                user={user} 
              />
            ))}
          </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;