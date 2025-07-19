import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function ApifyTestComponent() {
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [instagramData, setInstagramData] = useState<any>(null);
  const [tiktokData, setTiktokData] = useState<any>(null);
  const [loading, setLoading] = useState<{ instagram: boolean; tiktok: boolean }>({
    instagram: false,
    tiktok: false
  });
  const [errors, setErrors] = useState<{ instagram: string; tiktok: string }>({
    instagram: '',
    tiktok: ''
  });

  const testInstagram = async () => {
    setLoading(prev => ({ ...prev, instagram: true }));
    setErrors(prev => ({ ...prev, instagram: '' }));
    
    try {
      const { data, error } = await supabase.functions.invoke('instagram-analytics', {
        body: { url: instagramUrl }
      });

      if (error) throw error;
      
      setInstagramData(data);
      console.log('Instagram analytics:', data);
    } catch (error: any) {
      setErrors(prev => ({ ...prev, instagram: error.message }));
      console.error('Instagram error:', error);
    } finally {
      setLoading(prev => ({ ...prev, instagram: false }));
    }
  };

  const testTikTok = async () => {
    setLoading(prev => ({ ...prev, tiktok: true }));
    setErrors(prev => ({ ...prev, tiktok: '' }));
    
    try {
      const { data, error } = await supabase.functions.invoke('tiktok-analytics', {
        body: { url: tiktokUrl }
      });

      if (error) throw error;
      
      setTiktokData(data);
      console.log('TikTok analytics:', data);
    } catch (error: any) {
      setErrors(prev => ({ ...prev, tiktok: error.message }));
      console.error('TikTok error:', error);
    } finally {
      setLoading(prev => ({ ...prev, tiktok: false }));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Apify Integration Test</h2>
      
      {/* Instagram Test */}
      <Card>
        <CardHeader>
          <CardTitle>Instagram Analytics Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://www.instagram.com/p/..."
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
            />
            <Button 
              onClick={testInstagram} 
              disabled={loading.instagram || !instagramUrl}
            >
              {loading.instagram && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Instagram
            </Button>
          </div>
          
          {errors.instagram && (
            <div className="text-red-500 text-sm">{errors.instagram}</div>
          )}
          
          {instagramData && (
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(instagramData, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* TikTok Test */}
      <Card>
        <CardHeader>
          <CardTitle>TikTok Analytics Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://www.tiktok.com/@username/video/..."
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
            />
            <Button 
              onClick={testTikTok} 
              disabled={loading.tiktok || !tiktokUrl}
            >
              {loading.tiktok && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test TikTok
            </Button>
          </div>
          
          {errors.tiktok && (
            <div className="text-red-500 text-sm">{errors.tiktok}</div>
          )}
          
          {tiktokData && (
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(tiktokData, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
