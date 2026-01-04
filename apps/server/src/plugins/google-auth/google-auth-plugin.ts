import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { GoogleAuthStrategy } from './google-auth-strategy';
import { GoogleAuthResolver } from './google-auth.resolver';
import gql from 'graphql-tag';

export interface GoogleAuthPluginOptions {
  googleClientId: string;
}

const schemaExtension = gql`
  input GoogleAuthInput {
    token: String!
  }
  
  extend input AuthenticationInput {
    google: GoogleAuthInput
  }

  extend type Mutation {
    """
    Set password for a Google-authenticated user who is currently logged in.
    This allows Google users to add a password for native authentication.
    """
    setPasswordForGoogleUser(password: String!): Boolean!
  }

  extend type CurrentUser {
    hasPassword: Boolean!
  }
`;

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [GoogleAuthResolver],
  shopApiExtensions: {
    schema: schemaExtension,
    resolvers: [GoogleAuthResolver],
  },
  configuration: (config) => {
    const options = GoogleAuthPlugin.options;

    if (options?.googleClientId) {
      const strategy = new GoogleAuthStrategy({ googleClientId: options.googleClientId });
      config.authOptions.shopAuthenticationStrategy.push(strategy);
      config.authOptions.adminAuthenticationStrategy.push(strategy);
    }
    return config;
  },
})
export class GoogleAuthPlugin {
  static options: GoogleAuthPluginOptions;

  static init(options: GoogleAuthPluginOptions) {
    this.options = options;
    return GoogleAuthPlugin;
  }
}