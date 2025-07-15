import { useState, useMemo, useCallback } from 'react';

interface Creator {
  id: string;
  creator_name: string;
  channel_links: any;
  social_media_handles: any;
}

export const useCreatorFilter = (creators: Creator[]) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedCreatorIds, setSelectedCreatorIds] = useState<string[]>([]);

  // Helper functions
  const getJsonObject = useCallback((jsonObj: any): Record<string, any> => {
    if (jsonObj && typeof jsonObj === 'object' && !Array.isArray(jsonObj)) {
      return jsonObj;
    }
    return {};
  }, []);

  const hasValue = useCallback((jsonObj: any, key: string): boolean => {
    if (jsonObj && typeof jsonObj === 'object' && !Array.isArray(jsonObj)) {
      return Boolean(jsonObj[key]);
    }
    return false;
  }, []);

  // Filter creators by platform
  const filteredCreators = useMemo(() => {
    if (selectedPlatform === "all") return creators;
    
    return creators.filter(creator => {
      const channelLinks = getJsonObject(creator.channel_links);
      const socialHandles = getJsonObject(creator.social_media_handles);
      
      switch (selectedPlatform) {
        case "youtube":
          return hasValue(channelLinks, 'youtube');
        case "instagram":
          return hasValue(socialHandles, 'instagram');
        case "tiktok":
          return hasValue(socialHandles, 'tiktok');
        default:
          return true;
      }
    });
  }, [creators, selectedPlatform, getJsonObject, hasValue]);

  // Get active creators (intersection of filtered and selected)
  const activeCreators = useMemo(() => {
    return filteredCreators.filter(creator => selectedCreatorIds.includes(creator.id));
  }, [filteredCreators, selectedCreatorIds]);

  // Auto-select all creators when they change
  const initializeSelection = useCallback(() => {
    if (creators.length > 0 && selectedCreatorIds.length === 0) {
      setSelectedCreatorIds(creators.map(c => c.id));
    }
  }, [creators, selectedCreatorIds.length]);

  const handleCreatorToggle = useCallback((creatorId: string, checked: boolean) => {
    setSelectedCreatorIds(prev => {
      if (checked) {
        return [...prev, creatorId];
      } else {
        return prev.filter(id => id !== creatorId);
      }
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedCreatorIds(filteredCreators.map(c => c.id));
  }, [filteredCreators]);

  const handleSelectNone = useCallback(() => {
    setSelectedCreatorIds([]);
  }, []);

  // Platform counts
  const platformCounts = useMemo(() => {
    const total = activeCreators.length;
    const youtube = activeCreators.filter(c => hasValue(getJsonObject(c.channel_links), 'youtube')).length;
    const instagram = activeCreators.filter(c => hasValue(getJsonObject(c.social_media_handles), 'instagram')).length;
    const tiktok = activeCreators.filter(c => hasValue(getJsonObject(c.social_media_handles), 'tiktok')).length;
    
    return { total, youtube, instagram, tiktok };
  }, [activeCreators, hasValue, getJsonObject]);

  return {
    selectedPlatform,
    setSelectedPlatform,
    selectedCreatorIds,
    filteredCreators,
    activeCreators,
    platformCounts,
    initializeSelection,
    handleCreatorToggle,
    handleSelectAll,
    handleSelectNone,
  };
};