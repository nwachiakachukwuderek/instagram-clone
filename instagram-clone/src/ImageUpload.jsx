import React, { useState, useRef } from 'react';
import { Button } from '@mui/material';
// Import Appwrite config
import { storage, db, ID } from './appwrite';
import { APPWRITE_CONFIG } from './constants';
import './imageupload.css';

function ImageUpload({ username }) {
    const [caption, setCaption] = useState('');
    const [progress, setProgress] = useState(0);
    const [image, setImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [fileName, setFileName] = useState('')
    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name)
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }
            setImage(file);
        }
    };

    const handleUpload = async () => {
        if (!image || !caption.trim()) {
            alert('Please select an image and enter a caption');
            return;
        }

        setUploading(true);
        setProgress(10);

        try {
            // 1. Upload file to Appwrite Storage
            setProgress(30);
            const fileUpload = await storage.createFile(
                APPWRITE_CONFIG.BUCKET_ID,
                ID.unique(),
                image
            );
            console.log('File uploaded:', fileUpload);

            setProgress(70);

            // 2. Generate the File View URL
            const downloadURL = storage.getFileView(APPWRITE_CONFIG.BUCKET_ID, fileUpload.$id);
            const imageUrl = typeof downloadURL === 'string' ? downloadURL : downloadURL.href;
            console.log('Download URL:', imageUrl);

            // 3. Add metadata to Appwrite Databases
            setProgress(90);
            const doc = await db.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.POSTS_COLLECTION_ID,
                ID.unique(),
                {
                    caption: caption.trim(),
                    imageUrl: imageUrl,
                    username: username,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }
            );
            console.log('Document created:', doc);

            setProgress(100);

            // Reset the form
            setTimeout(() => {
                setProgress(0);
                setCaption("");
                setImage(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                setUploading(false);
                alert("Post uploaded successfully!");
            }, 1000);

        } catch (error) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error.message}`);
            setProgress(0);
            setUploading(false);
        }
    };

    return (
        <div className='imageupload'>
            <form action="" className='imageupload-form'>
                <label htmlFor="file-upload"  id='upload-image'>Choose File</label>
                <input
                type="text"
                placeholder={fileName || 'Enter a caption...'}
                value={caption}
                onChange={event => setCaption(event.target.value)}
                disabled={uploading}
                id='upload-text'
                />
                <input
                id='file-upload'
                type="file"
                accept="image/*"
                onChange={handleChange}
                disabled={uploading}
                ref={fileInputRef}
                />
            </form>
            <Button
                onClick={handleUpload}
                disabled={uploading || !image || !caption.trim()}
                variant="contained"
                className='button-upload'
                >
                {uploading ? 'Uploading...' : 'Upload'}
                </Button>
            <progress value={progress} max='100' className='progress'/>
        </div>
    );
}

export default ImageUpload;