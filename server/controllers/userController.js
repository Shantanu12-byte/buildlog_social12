const { createClient } = require('@supabase/supabase-js');
const { invalidateProfileCache } = require('./profileViewController');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * setCampus (req, res)
 * Permanently assigns a campus to a user.
 * Zero-Cost, high-performance logic with DB-level enforcement.
 */
async function setCampus(req, res) {
  try {
    const { userId, campusId, campusName } = req.body;

    if (!userId || !campusId || !campusName) {
      return res.status(400).json({ error: 'userId, campusId, and campusName are required.' });
    }

    // 1. Permanent Check: Fetch current profile
    const { data: profile, error: fetchErr } = await supabase
      .from('profiles')
      .select('campus_id, username')
      .eq('id', userId)
      .single();

    if (fetchErr || !profile) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // 2. Enforcement: Reject if campus is already set
    if (profile.campus_id) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Campus assignment is permanent and cannot be changed.' 
      });
    }

    // 3. Update Profile
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        campus_id: campusId,
        campus_name: campusName,
        is_joined_to_campus: true
      })
      .eq('id', userId);

    if (updateErr) {
      console.error('Update campus error:', updateErr);
      return res.status(500).json({ error: 'Failed to update campus.' });
    }

    // 4. Invalidate Cache for consistency
    invalidateProfileCache({ body: { username: profile.username } }, { json: () => {} });

    return res.json({ 
      success: true, 
      message: `Successfully joined ${campusName}.` 
    });

  } catch (err) {
    console.error('setCampus error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  setCampus
};
