import { withRateLimit } from '../../api/rate-limit.js';

/**
 * Register API endpoint with server-side rate limiting
 * POST /api/auth/register
 * Body: { email, password, name }
 */
async function registerHandler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return response.status(400).json({ 
        error: 'Bad Request', 
        message: 'Email dan kata sandi wajib diisi' 
      });
    }

    // Validate password strength server-side
    // (you could import password-validator.js here)

    // Integrate with Supabase
    // const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    // if (error) return response.status(400).json({ error: 'Registration Failed', message: error.message });
    // return response.status(201).json({ user: data.user, session: data.session });

    return response.status(200).json({ 
      message: 'Register endpoint ready - integrate with Supabase',
      email 
    });

  } catch (err) {
    console.error('Register error:', err);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}

export default withRateLimit('REGISTER', registerHandler);