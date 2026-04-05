import { supabase } from '../lib/supabase';

/**
 * Tracks a page view for the current user.
 * @param userId - The ID of the current user.
 * @param pageName - The name of the page being viewed.
 */
export const trackPageView = async (userId: string | undefined, pageName: string) => {
  if (!userId) return;
  
  try {
    await supabase.from('page_views').insert({
      user_id: userId,
      page: pageName,
      viewed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
};

/**
 * Submits a report for a post or user.
 * @param reporterId - The ID of the user submitting the report.
 * @param targetId - The ID of the post or user being reported.
 * @param type - Whether the target is a 'post' or 'user'.
 * @param reason - The reason for the report.
 */
export const submitReport = async (
  reporterId: string, 
  targetId: string, 
  type: 'post' | 'user', 
  reason: string
) => {
  try {
    const reportData: any = {
      reporter_id: reporterId,
      reason,
      status: 'pending'
    };

    if (type === 'post') {
      reportData.reported_post_id = targetId;
    } else {
      reportData.reported_user_id = targetId;
    }

    const { error } = await supabase.from('reports').insert(reportData);
    return { success: !error, error };
  } catch (error) {
    return { success: false, error };
  }
};
