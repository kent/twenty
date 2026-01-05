import { useEffect, useRef } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import { tokenPairState } from '@/auth/states/tokenPairState';
import { REACT_APP_SERVER_BASE_URL } from '~/config';
import { type AuthTokenPair } from '~/generated/graphql';

const BYPASS_AUTH_QUERY = `
  query GetBypassAuthTokens {
    getBypassAuthTokens {
      tokens {
        accessOrWorkspaceAgnosticToken {
          token
          expiresAt
        }
        refreshToken {
          token
          expiresAt
        }
      }
    }
  }
`;

// Auth bypass is always enabled in this fork - auto-login as Tim
export const BypassAuthEffect = () => {
  const setTokenPair = useSetRecoilState(tokenPairState);
  const tokenPair = useRecoilValue(tokenPairState);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (tokenPair || hasFetched.current) {
      return;
    }

    hasFetched.current = true;

    const fetchBypassToken = async () => {
      try {
        const response = await fetch(`${REACT_APP_SERVER_BASE_URL}/graphql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: BYPASS_AUTH_QUERY,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch bypass auth tokens');
        }

        const result = await response.json();

        if (result.errors) {
          throw new Error(result.errors[0]?.message || 'GraphQL error');
        }

        const tokens = result.data?.getBypassAuthTokens?.tokens as AuthTokenPair;

        if (tokens) {
          setTokenPair(tokens);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch bypass auth tokens:', error);
      }
    };

    fetchBypassToken();
  }, [setTokenPair, tokenPair]);

  return null;
};

