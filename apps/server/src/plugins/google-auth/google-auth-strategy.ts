import { AuthenticationStrategy, ExternalAuthenticationService, Injector, Logger, RequestContext, User } from '@vendure/core';
import { OAuth2Client } from 'google-auth-library';
import { DocumentNode } from 'graphql';
import { gql } from 'graphql-tag';

// Define a custom GraphQL error type
const PASSWORD_NOT_SET_ERROR = 'PasswordNotSetError';

export type GoogleAuthData = {
  token: string;
};

export interface GoogleAuthOptions {
  googleClientId: string;
  onUserCreated?: (ctx: RequestContext, injector: Injector, user: User) => void;
  onUserFound?: (ctx: RequestContext, injector: Injector, user: User) => void;
}

export class GoogleAuthStrategy implements AuthenticationStrategy<GoogleAuthData> {
  readonly name = 'google';
  private client: OAuth2Client;
  private externalAuthenticationService: ExternalAuthenticationService;
  private logger: Logger;
  private injector: Injector;

  constructor(private options: GoogleAuthOptions) {
    // Initialize Google OAuth2Client for token verification
    this.client = new OAuth2Client({ clientId: options.googleClientId });
    this.logger = new Logger();
  }

  init(injector: Injector) {
    // Get services we'll use for customer management
    this.externalAuthenticationService = injector.get(ExternalAuthenticationService);
    this.injector = injector;
  }

  defineInputType(): DocumentNode {
    // Define the GraphQL input type for the authenticate mutation
    return gql`
      input GoogleAuthInput {
        token: String!
      }
    `;
  }

  async authenticate(ctx: RequestContext, data: GoogleAuthData): Promise<User | false> {
    try {
      // Step 1: Verify the Google ID token
      const ticket = await this.client.verifyIdToken({
        idToken: data.token,
        audience: this.options.googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        this.logger.error('Invalid Google token or missing email', 'GoogleAuthStrategy');
        return false;
      }

      // Step 2: Check if this Google user already has a Vendure account
      const existingUser = await this.externalAuthenticationService.findCustomerUser(
        ctx,
        this.name,
        payload.sub, // Google's unique user ID
      );

      if (existingUser) {
        // User exists, check if they have set a password
        const hasPassword = existingUser.authenticationMethods.some(
          method => method.constructor.name === 'NativeAuthenticationMethod'
        );

        // Always return the user object, regardless of password status
        // The frontend will check if password is set and guide the user accordingly
        this.logger.verbose(`User found: ${existingUser.identifier}, hasPassword: ${hasPassword}`, 'GoogleAuthStrategy');
        this.options.onUserFound?.(ctx, this.injector, existingUser);
        return existingUser;
      }

      // Step 3: Create a new customer account for first-time Google users
      const createdUser = await this.externalAuthenticationService.createCustomerAndUser(ctx, {
        strategy: this.name,
        externalIdentifier: payload.sub, // Store Google user ID
        verified: payload.email_verified || true, // Google users are automatically verified
        emailAddress: payload.email,
        firstName: payload.given_name || 'Google',
        lastName: payload.family_name || 'User',
      });

      this.logger.verbose(`New Google user created: ${createdUser.identifier}`, 'GoogleAuthStrategy');
      this.options.onUserCreated?.(ctx, this.injector, createdUser);

      // Return the created user so they can be logged in
      return createdUser;
    } catch (error: any) {
      this.logger.error(`Google authentication failed: ${error.message}`, 'GoogleAuthStrategy');
      return false;
    }
  }
}
