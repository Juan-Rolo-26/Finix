import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    User, MapPin, Briefcase, Calendar, Award, TrendingUp, Users,
    Linkedin, Twitter, Youtube, Instagram,
    Edit, Check, X, Camera, Share2, Globe, Shield,
    BarChart3, Target, PieChart
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/i18n';

interface UserProfile {
    id: string;
    username: string;
    email: string;
    bio?: string;
    bioLong?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    isInfluencer: boolean;
    isVerified: boolean;
    accountType: string;
    title?: string;
    company?: string;
    location?: string;
    website?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    youtubeUrl?: string;
    instagramUrl?: string;
    yearsExperience?: number;
    specializations?: string;
    certifications?: string;
    totalReturn?: number;
    winRate?: number;
    riskScore?: number;
    isProfilePublic: boolean;
    showPortfolio: boolean;
    showStats: boolean;
    acceptingFollowers: boolean;
    _count?: {
        posts: number;
        following: number;
        followedBy: number;
    };
    createdAt: string;
}

export default function Profile() {
    const t = useTranslation();
    const { username } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
    const [activeTab, setActiveTab] = useState('overview');
    const [isFollowing, setIsFollowing] = useState(false);

    const isOwnProfile = currentUser?.username === username || (!username && currentUser);

    useEffect(() => {
        loadProfile();
    }, [username]);

    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const targetUsername = username || currentUser?.username;
            if (!targetUsername) {
                navigate('/auth');
                return;
            }

            const res = await apiFetch(`/users/${targetUsername}`);
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setEditForm(data);
            } else {
                // If API fails, use current user data fallback
                if (targetUsername === currentUser?.username && currentUser) {
                    const fallbackProfile: UserProfile = {
                        id: currentUser.id || '1',
                        username: currentUser.username || 'User',
                        email: currentUser.email || 'user@finix.com',
                        bio: currentUser.bio || 'Finix Investor',
                        bioLong: undefined,
                        avatarUrl: currentUser.avatarUrl,
                        bannerUrl: undefined,
                        isInfluencer: false,
                        isVerified: false,
                        accountType: 'BASIC',
                        title: undefined,
                        company: undefined,
                        location: undefined,
                        website: undefined,
                        linkedinUrl: undefined,
                        twitterUrl: undefined,
                        youtubeUrl: undefined,
                        instagramUrl: undefined,
                        yearsExperience: undefined,
                        specializations: undefined,
                        certifications: undefined,
                        totalReturn: undefined,
                        winRate: undefined,
                        riskScore: undefined,
                        isProfilePublic: true,
                        showPortfolio: false,
                        showStats: false,
                        acceptingFollowers: true,
                        _count: {
                            posts: 0,
                            following: 0,
                            followedBy: 0,
                        },
                        createdAt: new Date().toISOString(),
                    };
                    setProfile(fallbackProfile);
                    setEditForm(fallbackProfile);
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            if (currentUser) {
                const fallbackProfile: UserProfile = {
                    id: currentUser.id || '1',
                    username: currentUser.username || 'User',
                    email: currentUser.email || 'user@finix.com',
                    bio: currentUser.bio || 'Finix Investor',
                    bioLong: undefined,
                    avatarUrl: currentUser.avatarUrl,
                    bannerUrl: undefined,
                    isInfluencer: false,
                    isVerified: false,
                    accountType: 'BASIC',
                    title: undefined,
                    company: undefined,
                    location: undefined,
                    website: undefined,
                    linkedinUrl: undefined,
                    twitterUrl: undefined,
                    youtubeUrl: undefined,
                    instagramUrl: undefined,
                    yearsExperience: undefined,
                    specializations: undefined,
                    certifications: undefined,
                    totalReturn: undefined,
                    winRate: undefined,
                    riskScore: undefined,
                    isProfilePublic: true,
                    showPortfolio: false,
                    showStats: false,
                    acceptingFollowers: true,
                    _count: {
                        posts: 0,
                        following: 0,
                        followedBy: 0,
                    },
                    createdAt: new Date().toISOString(),
                };
                setProfile(fallbackProfile);
                setEditForm(fallbackProfile);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            const res = await apiFetch('/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                const updated = await res.json();
                setProfile(updated);
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleUploadImage = async (type: 'avatar' | 'banner') => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const fakeUrl = URL.createObjectURL(file);
                setEditForm({
                    ...editForm,
                    [type === 'avatar' ? 'avatarUrl' : 'bannerUrl']: fakeUrl
                });
            }
        };
        input.click();
    };

    const toggleFollow = async () => {
        setIsFollowing(!isFollowing);
    };

    const getAccountTypeBadge = (type: string) => {
        const badges: Record<string, { label: string; color: string }> = {
            BASIC: { label: 'Basic', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
            PRO: { label: 'Pro', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
            CREATOR: { label: 'Creator', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
            ANALYST: { label: 'Analyst', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
        };

        const badge = badges[type] || badges.BASIC;
        return <Badge variant="outline" className={badge.color}>{badge.label}</Badge>;
    };

    const parseJsonArray = (str?: string): string[] => {
        if (!str) return [];
        try {
            return JSON.parse(str);
        } catch {
            return [];
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <User className="w-16 h-16 text-muted-foreground" />
                <h2 className="text-2xl font-bold">{t.profile.notFound}</h2>
                <Button onClick={() => navigate('/dashboard')}>{t.profile.backDashboard}</Button>
            </div>
        );
    }

    const specializations = parseJsonArray(profile.specializations);
    const certifications = parseJsonArray(profile.certifications);

    return (
        <div className="w-full space-y-6 pb-16">
            {/* Banner */}
            <Card className="overflow-hidden border-primary/20">
                <div className="relative h-64 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20">
                    {profile.bannerUrl ? (
                        <img
                            src={profile.bannerUrl}
                            alt="Banner"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-600/20 to-background" />
                    )}

                    {isOwnProfile && isEditing && (
                        <Button
                            size="sm"
                            className="absolute top-4 right-4"
                            onClick={() => handleUploadImage('banner')}
                        >
                            <Camera className="w-4 h-4 mr-2" />
                            {t.profile.changeBanner}
                        </Button>
                    )}

                    {/* Avatar */}
                    <div className="absolute -bottom-16 left-8">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-4 border-background bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                                {profile.avatarUrl ? (
                                    <img
                                        src={profile.avatarUrl}
                                        alt={profile.username}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    profile.username[0].toUpperCase()
                                )}
                            </div>
                            {isOwnProfile && isEditing && (
                                <Button
                                    size="icon"
                                    className="absolute bottom-0 right-0 rounded-full"
                                    onClick={() => handleUploadImage('avatar')}
                                >
                                    <Camera className="w-4 h-4" />
                                </Button>
                            )}
                            {profile.isVerified && (
                                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                                    <Check className="w-5 h-5 text-black" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="absolute bottom-4 right-4 flex gap-2">
                        {isOwnProfile ? (
                            <>
                                {isEditing ? (
                                    <>
                                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                                            <X className="w-4 h-4 mr-2" />
                                            {t.profile.cancel}
                                        </Button>
                                        <Button onClick={handleSaveProfile}>
                                            <Check className="w-4 h-4 mr-2" />
                                            {t.profile.save}
                                        </Button>
                                    </>
                                ) : (
                                    <Button onClick={() => setIsEditing(true)}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        {t.profile.edit}
                                    </Button>
                                )}
                            </>
                        ) : (
                            <>
                                <Button variant="outline" size="icon">
                                    <Share2 className="w-4 h-4" />
                                </Button>
                                <Button onClick={toggleFollow}>
                                    {isFollowing ? t.profile.following : t.profile.follow}
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Basic Info */}
                <CardContent className="pt-20 pb-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                {isEditing ? (
                                    <Input
                                        value={editForm.username}
                                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                        className="text-3xl font-bold max-w-xs"
                                    />
                                ) : (
                                    <h1 className="text-3xl font-bold">{profile.username}</h1>
                                )}
                                {getAccountTypeBadge(profile.accountType)}
                                {profile.isInfluencer && (
                                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                                        <Award className="w-3 h-3 mr-1" />
                                        Influencer
                                    </Badge>
                                )}
                            </div>

                            {isEditing ? (
                                <Input
                                    placeholder="e.g. Trading Analyst | Crypto Investor"
                                    value={editForm.title || ''}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="mb-2"
                                />
                            ) : profile.title && (
                                <p className="text-lg text-muted-foreground mb-2">{profile.title}</p>
                            )}

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                                {profile.company && (
                                    <div className="flex items-center gap-1">
                                        <Briefcase className="w-4 h-4" />
                                        <span>{profile.company}</span>
                                    </div>
                                )}
                                {profile.location && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        <span>{profile.location}</span>
                                    </div>
                                )}
                                {profile.yearsExperience && (
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>{profile.yearsExperience} {t.profile.experience}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>{profile._count?.followedBy || 0} {t.profile.followers}</span>
                                </div>
                            </div>

                            {isEditing ? (
                                <Textarea
                                    placeholder="Tell us about yourself..."
                                    value={editForm.bio || ''}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    className="mb-4"
                                    rows={3}
                                />
                            ) : profile.bio && (
                                <p className="text-foreground mb-4">{profile.bio}</p>
                            )}

                            {/* Social Media */}
                            <div className="flex gap-2">
                                {profile.linkedinUrl && (
                                    <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon">
                                            <Linkedin className="w-5 h-5" />
                                        </Button>
                                    </a>
                                )}
                                {profile.twitterUrl && (
                                    <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon">
                                            <Twitter className="w-5 h-5" />
                                        </Button>
                                    </a>
                                )}
                                {profile.youtubeUrl && (
                                    <a href={profile.youtubeUrl} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon">
                                            <Youtube className="w-5 h-5" />
                                        </Button>
                                    </a>
                                )}
                                {profile.instagramUrl && (
                                    <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon">
                                            <Instagram className="w-5 h-5" />
                                        </Button>
                                    </a>
                                )}
                                {profile.website && (
                                    <a href={profile.website} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon">
                                            <Globe className="w-5 h-5" />
                                        </Button>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Stats Cards */}
                        {profile.showStats && (
                            <div className="grid grid-cols-3 gap-3">
                                <Card className="bg-secondary/20 border-border/50">
                                    <CardContent className="p-4 text-center">
                                        <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                                        <div className="text-2xl font-bold text-emerald-400">
                                            {profile.totalReturn ? `+${profile.totalReturn.toFixed(1)}%` : 'N/A'}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{t.profile.stats.totalReturn}</div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-secondary/20 border-border/50">
                                    <CardContent className="p-4 text-center">
                                        <Target className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                                        <div className="text-2xl font-bold">
                                            {profile.winRate ? `${profile.winRate.toFixed(0)}%` : 'N/A'}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{t.profile.stats.winRate}</div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-secondary/20 border-border/50">
                                    <CardContent className="p-4 text-center">
                                        <Shield className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                                        <div className="text-2xl font-bold">
                                            {profile.riskScore ? profile.riskScore.toFixed(1) : 'N/A'}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{t.profile.stats.risk}</div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">{t.profile.tabs.overview}</TabsTrigger>
                    <TabsTrigger value="posts">{t.profile.tabs.posts} ({profile._count?.posts || 0})</TabsTrigger>
                    <TabsTrigger value="portfolio">{t.profile.tabs.portfolio}</TabsTrigger>
                    <TabsTrigger value="about">{t.profile.tabs.about}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Specializations */}
                        {specializations.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-primary" />
                                        {t.profile.about.specializations}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {specializations.map((spec, idx) => (
                                            <Badge key={idx} variant="secondary">
                                                {spec}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Certifications */}
                        {certifications.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-primary" />
                                        {t.profile.about.certifications}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {certifications.map((cert, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-emerald-400" />
                                                <span className="text-sm">{cert}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Extended Bio */}
                    {profile.bioLong && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t.profile.about.aboutUser} {profile.username}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground whitespace-pre-wrap">
                                    {profile.bioLong}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="posts">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t.profile.tabs.posts} - {profile.username}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-muted-foreground">
                                {/* Fallback or implement post list */}
                                No posts yet.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="portfolio">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-primary" />
                                {t.profile.tabs.portfolio}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {profile.showPortfolio ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    Portfolio content...
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">
                                        {isOwnProfile
                                            ? t.profile.about.privatePortfolioOwn
                                            : t.profile.about.privatePortfolio}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="about" className="space-y-6">
                    {isEditing && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t.profile.about.editInfo}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">{t.profile.about.title}</label>
                                        <Input
                                            placeholder="ej: Trading Analyst"
                                            value={editForm.title || ''}
                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">{t.profile.about.company}</label>
                                        <Input
                                            placeholder="ej: Goldman Sachs"
                                            value={editForm.company || ''}
                                            onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">{t.profile.about.location}</label>
                                        <Input
                                            placeholder="ej: Buenos Aires, Argentina"
                                            value={editForm.location || ''}
                                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">{t.profile.about.yearsExperience}</label>
                                        <Input
                                            type="number"
                                            placeholder="5"
                                            value={editForm.yearsExperience || ''}
                                            onChange={(e) => setEditForm({ ...editForm, yearsExperience: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">{t.profile.about.bioLong}</label>
                                    <Textarea
                                        placeholder="..."
                                        value={editForm.bioLong || ''}
                                        onChange={(e) => setEditForm({ ...editForm, bioLong: e.target.value })}
                                        rows={6}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">{t.profile.about.website}</label>
                                    <Input
                                        placeholder="https://..."
                                        value={editForm.website || ''}
                                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">LinkedIn</label>
                                        <Input
                                            placeholder="https://linkedin.com/in/..."
                                            value={editForm.linkedinUrl || ''}
                                            onChange={(e) => setEditForm({ ...editForm, linkedinUrl: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Twitter/X</label>
                                        <Input
                                            placeholder="https://twitter.com/..."
                                            value={editForm.twitterUrl || ''}
                                            onChange={(e) => setEditForm({ ...editForm, twitterUrl: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">YouTube</label>
                                        <Input
                                            placeholder="https://youtube.com/@..."
                                            value={editForm.youtubeUrl || ''}
                                            onChange={(e) => setEditForm({ ...editForm, youtubeUrl: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Instagram</label>
                                        <Input
                                            placeholder="https://instagram.com/..."
                                            value={editForm.instagramUrl || ''}
                                            onChange={(e) => setEditForm({ ...editForm, instagramUrl: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>{t.profile.about.accountDetails}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Email</p>
                                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{t.profile.about.memberSince}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(profile.createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
