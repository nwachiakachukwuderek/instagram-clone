import React, { useState } from 'react'
import { Button } from '@mui/material'
// Import Appwrite config
import { storage, db } from './appwrite'; 
import { ID } from 'appwrite';
import './imageupload.css'

function ImageUpload({ username }) {
    const [caption, setCaption] = useState('');
    const [progress, setProgress] = useState(0)
    const [image, setImage] = useState(null)

    const handleChange = (e) => {
        if (e.target.files[0]) {
            setImage(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!image) return;

        try {
            // 1. Upload file to Appwrite Storage (Bucket)
            // You need to create a Bucket in Appwrite Console and get its ID
            const fileUpload = await storage.createFile(
                'YOUR_BUCKET_ID', 
                ID.unique(), 
                image
            );

            setProgress(100); // Set to 100 once upload finishes

            // 2. Generate the File View URL
            // This replaces getDownloadURL
            const downloadURL = storage.getFileView('YOUR_BUCKET_ID', fileUpload.$id);

            // 3. Add metadata to Appwrite Databases
            await db.createDocument(
                'YOUR_DATABASE_ID', 
                'YOUR_COLLECTION_ID', 
                ID.unique(), 
                {
                    caption: caption,
                    imageUrl: downloadURL.href, // Use .href to get the string URL
                    username: username,
                    // Appwrite automatically adds a $createdAt timestamp, 
                    // so you don't strictly need serverTimestamp()
                }
            );

            // Reset the form
            setProgress(0);
            setCaption("");
            setImage(null);
            alert("Post uploaded successfully!");

        } catch (error) {
            console.error(error);
            alert(error.message);
            setProgress(0);
        }
    };

    return (
        <div className='imageupload'>
            <progress value={progress} max='100' className='progress' />
            <input 
                type="text" 
                placeholder='Enter A Caption...' 
                value={caption}
                onChange={event => setCaption(event.target.value)} 
            />
            <input type="file" onChange={handleChange} />
            <Button onClick={handleUpload}>
                Upload
            </Button>
        </div>
    )
}

export default ImageUpload;