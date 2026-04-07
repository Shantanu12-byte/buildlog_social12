import { Platform } from 'react-native';

const GITHUB_CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID || 'your_github_client_id';

export const AuthConfiguration = {
  issuer: 'https://github.com',
  clientId: GITHUB_CLIENT_ID,
  redirectUrl: Platform.select({
    web: typeof window !== 'undefined' ? `${window.location.origin}/connect-github` : 'http://localhost:19006/connect-github',
    default: 'com.codenid://oauth',
  }),
  // Explicitly include repo and read:org for private repository access and organization data
  // This prevents authorization-based 404 errors when retrieving Proof of Work.
  scopes: ['user', 'repo', 'read:org'],
  serviceConfiguration: {
    authorizationEndpoint: 'https://github.com/login/oauth/authorize',
    tokenEndpoint: 'https://github.com/login/oauth/access_token',
  },
};
