import './App.css';
import instagramLogo from './IMG/download.webp';
import Posts from './Posts';
import { useEffect, useState } from 'react';
// Import Appwrite services instead of Firebase
import { account, databases, client } from './appwrite.js'; 
import { ID, Query } from './appwrite';
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

  // APPWRITE REALTIME: Fetches and listens for posts
  useEffect(() => {
    // 1. Initial Fetch
    const fetchPosts = async () => {
      const response = await databases.listDocuments(
        'YOUR_DATABASE_ID', 
        'YOUR_COLLECTION_ID',
        [Query.orderDesc('$createdAt')] // Appwrite uses $createdAt by default
      );
      setPosts(response.documents.map(doc => ({ id: doc.$id, post: doc })));
    };

    fetchPosts();

    // 2. Realtime Subscription (Equivalent to onSnapshot)
    const unsubscribe = client.subscribe(
      `databases.YOUR_DATABASE_ID.collections.YOUR_COLLECTION_ID.documents`, 
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          // If a new post is created, re-fetch or update state
          fetchPosts(); 
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // AUTH: Check for current session (Equivalent to onAuthStateChanged)
  useEffect(() => {
    const checkUser = async () => {
      try {
        const session = await account.get();
        setUser(session);
      } catch (err) {
        setUser(null);
        console.log(err)
      }
    };
    checkUser();
  }, []);

  const style = { /* ... your existing style ... */ };

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
                Sign I
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
      {user ? (
        <Button onClick={handleLogout}>LogOut</Button>
      ) : (
        <div className="app_loginContainer">
           <Button onClick={() => setOpenSignIn(true)}>Sign In</Button>
           <Button onClick={() => setOpen(true)}>Sign Up</Button>
        </div>
      )}

      <div className="app">
      {/* Rendering Posts remains almost identical */}
      <div className="app_postLeft">
      <div className="app_posts">
        {posts.map(({ id, post }) => (
          <Posts 
            key={id} 
            postId={id} 
            username={post.username} 
            imageUrl={post.imageUrl} 
            caption={post.caption} 
            user={user} 
          />
        ))}
      </div>
      </div>

      <div className="app_postsRight">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <InstagramEmbed url="https://www.instagram.com/p/CUbHfhpswxt/" width={328} />
        </div>
      </div>
      </div>
    </>
  );
}

export default App;