import { LinkedinAccount } from "@shared/schema";

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  emailAddress?: string;
}

export interface LinkedInPost {
  id: string;
  content: string;
  publishedAt: string;
  metrics?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export class LinkedInService {
  private baseURL = 'https://api.linkedin.com/v2';

  private async makeRequest(endpoint: string, accessToken: string, method = 'GET', data?: any) {
    const url = `${this.baseURL}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LinkedIn API error: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async getProfile(accessToken: string): Promise<LinkedInProfile> {
    const profile = await this.makeRequest(
      '/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))',
      accessToken
    );

    return {
      id: profile.id,
      firstName: profile.firstName.localized.en_US,
      lastName: profile.lastName.localized.en_US,
      profilePicture: profile.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier,
    };
  }

  async getEmailAddress(accessToken: string): Promise<string> {
    const result = await this.makeRequest(
      '/emailAddress?q=members&projection=(elements*(handle~))',
      accessToken
    );
    
    return result.elements[0]?.['handle~']?.emailAddress || '';
  }

  async publishPost(accessToken: string, content: string, personUrn: string): Promise<string> {
    const postData = {
      author: personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const response = await this.makeRequest('/ugcPosts', accessToken, 'POST', postData);
    return response.id;
  }

  async getPostMetrics(accessToken: string, postId: string): Promise<any> {
    try {
      // LinkedIn's analytics API is complex and requires special permissions
      // For now, return mock metrics - in production, implement proper analytics
      return {
        likes: Math.floor(Math.random() * 100),
        comments: Math.floor(Math.random() * 20),
        shares: Math.floor(Math.random() * 10),
      };
    } catch (error) {
      console.error('Error fetching post metrics:', error);
      return { likes: 0, comments: 0, shares: 0 };
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID || '',
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh LinkedIn access token');
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  }

  static getAuthURL(state: string): string {
    const clientId = process.env.LINKEDIN_CLIENT_ID || '';
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || '';
    const scope = 'r_liteprofile,r_emailaddress,w_member_social';
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      scope,
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  static async exchangeCodeForToken(code: string): Promise<{ accessToken: string; expiresIn: number }> {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI || '',
        client_id: process.env.LINKEDIN_CLIENT_ID || '',
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to exchange code for token: ${errorText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  }
}

export const linkedInService = new LinkedInService();
