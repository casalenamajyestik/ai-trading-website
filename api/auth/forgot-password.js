import { withRateLimit } from '../../api/rate-limit.js';

/**
 * Forgot Password API endpoint with server-side rate limiting
 * POST /api/auth/forgot-password
 * Body: { email }
 */
async function forgotPasswordHandler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return response.status(400).json({ 
        error: 'Bad Request', 
        message: 'Email wajib diisi' 
      });
    }

    // Integrate with Supabase
    // const { error } = await supabase.auth.resetPasswordForEmail(email, {
    //   redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password.html`
    // });
    // if (error) return response.status(400).json({ error: 'Failed', message: error.message });

    return response.status(200).json({ 
      message: 'Forgot password endpoint ready - integrate with Supabase',
      email 
    });

  } catch (err) {
    console.error('Forgot password error:', err);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}

export default withRateLimit('FORGOT_PASSWORD', forgotPasswordHandler);