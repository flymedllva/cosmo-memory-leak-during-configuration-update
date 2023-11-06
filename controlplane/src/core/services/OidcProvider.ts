import { CreateOIDCProviderRequest } from '@wundergraph/cosmo-connect/dist/platform/v1/platform_pb';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../db/schema.js';
import { OidcRepository } from '../repositories/OidcRepository.js';
import Keycloak from './Keycloak.js';

export default class OidcProvider {
  constructor() {}

  // creates the provider in keycloak, adds an entry into the db and then add the mappers in keycloak
  public async createOidcProvider({
    kcClient,
    kcRealm,
    organizationId,
    organizationSlug,
    db,
    input,
  }: {
    kcClient: Keycloak;
    kcRealm: string;
    organizationId: string;
    organizationSlug: string;
    db: PostgresJsDatabase<typeof schema>;
    input: CreateOIDCProviderRequest;
  }) {
    const oidcRepo = new OidcRepository(db);

    await kcClient.createOIDCProvider({
      clientId: input.clientID,
      clientSecret: input.clientSecrect,
      discoveryEndpoint: input.discoveryEndpoint,
      name: input.name,
      realm: kcRealm,
      orgSlug: organizationSlug,
    });

    const endpoint = input.discoveryEndpoint.split('/')[2];

    await oidcRepo.addOidcProvider({ name: input.name, organizationId, endpoint });

    for (const mapper of input.mappers) {
      const claims = `[{ "key": "ssoGroups", "value": "${mapper.ssoGroup}" }]`;
      let keycloakGroupName;

      switch (mapper.role) {
        case 'Admin': {
          keycloakGroupName = `/${organizationSlug}/admin`;
          break;
        }
        case 'Member': {
          keycloakGroupName = `/${organizationSlug}`;
          break;
        }
        case 'Viewer': {
          keycloakGroupName = `/${organizationSlug}/viewer`;
          break;
        }
        default: {
          throw new Error(`The role ${mapper.role} doesn't exist `);
        }
      }

      await kcClient.createIDPMapper({
        realm: kcRealm,
        orgSlug: organizationSlug,
        claims,
        keycloakGroupName,
      });
    }
  }

  // deletes the roles of all the user of that org that use the sso to login and
  // log them out and then delete the entry in the db
  public async deleteOidcProvider({
    kcClient,
    kcRealm,
    organizationId,
    organizationSlug,
    orgCreatorUserId,
    db,
  }: {
    kcClient: Keycloak;
    kcRealm: string;
    organizationId: string;
    organizationSlug: string;
    orgCreatorUserId: string;
    db: PostgresJsDatabase<typeof schema>;
  }) {
    const oidcRepo = new OidcRepository(db);

    const keycloakUsers = await kcClient.getKeycloakSsoLoggedInUsers({
      realm: kcRealm,
      orgSlug: organizationSlug,
    });

    for (const user of keycloakUsers) {
      if (user.id === orgCreatorUserId) {
        continue;
      }
      const keycloakUserGroups = await kcClient.getKeycloakUserGroups({
        realm: kcRealm,
        userID: user.id || '',
      });

      for (const group of keycloakUserGroups) {
        if (!group.path?.includes(organizationSlug) || group.path?.includes('viewer')) {
          continue;
        }
        await kcClient.client.users.delFromGroup({
          id: user.id || '',
          groupId: group.id || '',
          realm: kcRealm,
        });
      }

      await kcClient.client.users.logout({
        id: user.id || '',
        realm: kcRealm,
      });
    }

    await kcClient.deleteOIDCProvider({
      realm: kcRealm,
      orgSlug: organizationSlug,
    });

    await oidcRepo.deleteOidcProvider({ organizationId });
  }
}
