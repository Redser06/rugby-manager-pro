import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Share2, Copy, Check, Twitter, Facebook, Linkedin, ExternalLink, Trophy, Users, Target, TrendingUp } from 'lucide-react';
import { useSeasonShare } from '@/hooks/useSeasonShare';
import { toast } from 'sonner';

interface ShareDialogProps {
  trigger?: React.ReactNode;
}

export function ShareDialog({ trigger }: ShareDialogProps) {
  const { isGenerating, currentSnapshot, shareLink, createShareLink } = useSeasonShare();
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleGenerateLink = async () => {
    const link = await createShareLink();
    if (link) {
      toast.success('Share link created!', {
        description: 'Your season snapshot is ready to share.',
      });
    } else {
      toast.error('Failed to create share link', {
        description: 'Please try again.',
      });
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    
    try {
      await navigator.clipboard.writeText(shareLink.url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleSocialShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    if (!shareLink || !currentSnapshot) return;

    const text = `Check out my ${currentSnapshot.teamName} season progress! ${currentSnapshot.standing.position}${getOrdinalSuffix(currentSnapshot.standing.position)} in ${currentSnapshot.leagueName} with ${currentSnapshot.standing.won} wins.`;
    const url = shareLink.url;

    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(`${currentSnapshot.teamName} Season Progress`)}&summary=${encodeURIComponent(text)}`;
        break;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  function getOrdinalSuffix(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share Season
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Your Season Progress
          </DialogTitle>
          <DialogDescription>
            Create a shareable snapshot of your season to show your friends.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!shareLink ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                Generate a link to share your current standings, squad highlights, and tactical identity.
              </p>
              <Button 
                onClick={handleGenerateLink} 
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? 'Generating...' : 'Generate Share Link'}
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              {/* Preview Card */}
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">{currentSnapshot?.teamName}</h3>
                    <Badge>Season {currentSnapshot?.season}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span>{currentSnapshot?.standing.position}{getOrdinalSuffix(currentSnapshot?.standing.position || 0)} in {currentSnapshot?.leagueName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span>{currentSnapshot?.standing.won}W - {currentSnapshot?.standing.drawn}D - {currentSnapshot?.standing.lost}L</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>{currentSnapshot?.squadHighlights.squadSize} players</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-500" />
                      <span>{currentSnapshot?.tacticalIdentity.attackStyle}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Copy Link */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Share Link</label>
                <div className="flex gap-2">
                  <Input 
                    value={shareLink.url} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => window.open(shareLink.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Social Share Buttons */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Share on Social Media</label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={() => handleSocialShare('twitter')}
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={() => handleSocialShare('facebook')}
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={() => handleSocialShare('linkedin')}
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
