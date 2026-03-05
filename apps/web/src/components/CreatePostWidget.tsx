import { useState, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '../stores/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, X } from 'lucide-react';

interface CreatePostWidgetProps {
    onPostCreated: (post: any) => void;
    placeholder?: string;
    parentId?: string;
    quotedPostId?: string;
    isReply?: boolean;
    autoFocus?: boolean;
}

export default function CreatePostWidget({
    onPostCreated,
    placeholder = "¿Qué estás analizando hoy? (ej. $BTC rompiendo resistencia...)",
    parentId,
    quotedPostId,
    isReply = false,
    autoFocus = false,
}: CreatePostWidgetProps) {
    const { user } = useAuthStore();
    const [newPostContent, setNewPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [attachedImage, setAttachedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAttachedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setAttachedImage(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim() && !attachedImage) return;
        setIsPosting(true);

        try {
            // Upload image first if exists
            let mediaUrls: any[] = [];
            if (attachedImage) {
                const formData = new FormData();
                formData.append('files', attachedImage);
                const uploadRes = await apiFetch('/posts/upload-media', {
                    method: 'POST',
                    headers: {},
                    body: formData,
                });
                if (!uploadRes.ok) throw new Error('Image upload failed');
                const uploadData = await uploadRes.json();
                mediaUrls = uploadData;
            }

            const matches = newPostContent.match(/\$[A-Za-z][A-Za-z0-9]{0,9}/g) || [];
            const tickers = Array.from(new Set(matches.map((t) => t.toUpperCase())));

            const res = await apiFetch('/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newPostContent,
                    tickers,
                    mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
                    parentId,
                    quotedPostId
                }),
            });

            if (!res.ok) throw new Error('Error creating post');

            const savedPost = await res.json();
            setNewPostContent('');
            handleRemoveImage();
            onPostCreated(savedPost);
        } catch (error) {
            console.error(error);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <Card className={`p-4 border-border/50 bg-secondary/10 backdrop-blur-sm ${isReply ? 'border-none shadow-none bg-transparent p-0' : ''}`}>
            <div className="flex gap-4">
                <Avatar className="w-10 h-10 border border-primary/20">
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3 pt-1">
                    <Textarea
                        autoFocus={autoFocus}
                        placeholder={placeholder}
                        className="w-full bg-transparent border-none focus-visible:ring-0 text-lg placeholder:text-muted-foreground/50 resize-none min-h-[60px]"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                    />

                    {previewUrl && (
                        <div className="relative inline-block mt-2">
                            <img src={previewUrl} alt="Preview" className="h-32 rounded-lg border border-border/50 object-cover" />
                            <button
                                onClick={handleRemoveImage}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-border/30 gap-2">
                        <div className="flex gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageSelect}
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-primary h-8 px-2 gap-2"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <ImageIcon className="w-4 h-4" /> Media
                            </Button>
                        </div>
                        <Button
                            size="sm"
                            className="rounded-full font-bold px-6 bg-primary text-primary-foreground hover:opacity-90 transition-opacity whitespace-nowrap"
                            onClick={handleCreatePost}
                            disabled={isPosting || (!newPostContent.trim() && !attachedImage)}
                        >
                            {isPosting ? 'Publicando...' : (isReply ? 'Responder' : 'Publicar')}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
