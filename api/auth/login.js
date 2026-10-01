import { withRateLimit } from '../api/rate-limit.js';

/**
 * Login API endpoint with server-side rate limiting
 * POST /api/auth/login
 * Body: { email, password }
 */
async function loginHandler(request, response) {
  // Only allow POST
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return response.status(400).json({ 
        error: 'Bad Request', 
        message: 'Email dan kata sandi wajib diisi' 
      });
    }

    // Here you would integrate with Supabase Auth
    // For now, this is a template showing the rate limiting integration
    
    // Example Supabase integration:
    // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    // if (error) return response.status(401).json({ error: 'Unauthorized', message: error.message });
    // return response.status(200).json({ user: data.user, session: data.session });

    // Mock success response for template
    return response.status(200).json({ 
      message: 'Login endpoint ready - integrate with Supabase',
      email 
    });

  } catch (err) {
    console.error('Login error:', err);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}

// Export with rate limiting middleware
export default withRateLimit('LOGIN', loginHandler);