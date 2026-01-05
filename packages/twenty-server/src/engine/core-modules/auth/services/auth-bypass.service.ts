import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { type AuthTokenPair } from 'src/engine/core-modules/auth/dto/auth-token-pair.dto';
import { AccessTokenService } from 'src/engine/core-modules/auth/token/services/access-token.service';
import { RefreshTokenService } from 'src/engine/core-modules/auth/token/services/refresh-token.service';
import {
  type AuthContext,
  JwtTokenTypeEnum,
} from 'src/engine/core-modules/auth/types/auth-context.type';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { AuthProviderEnum } from 'src/engine/core-modules/workspace/types/workspace.type';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

// Hardcoded seed IDs for Tim from the Apple workspace
const BYPASS_USER_ID = '20202020-9e3b-46d4-a556-88b9ddc2b034';
const BYPASS_USER_WORKSPACE_ID = '20202020-9e3b-46d4-a556-88b9ddc2b035';
const BYPASS_WORKSPACE_MEMBER_ID = '20202020-0687-4c41-b707-ed1bfca972a7';
const BYPASS_WORKSPACE_ID = '20202020-1c25-4d02-bf25-6aeccf7ea419';

@Injectable()
export class AuthBypassService {
  private readonly logger = new Logger(AuthBypassService.name);
  private cachedAuthContext: AuthContext | null = null;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async getBypassAuthContext(): Promise<AuthContext> {
    if (this.cachedAuthContext) {
      return this.cachedAuthContext;
    }

    this.logger.log('Loading bypass auth context for Tim (Apple workspace)');

    const user = await this.userRepository.findOne({
      where: { id: BYPASS_USER_ID },
    });

    if (!user) {
      throw new Error(
        `Bypass user not found. Make sure to run workspace:seed:dev first.`,
      );
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: BYPASS_WORKSPACE_ID },
    });

    if (!workspace) {
      throw new Error(
        `Bypass workspace not found. Make sure to run workspace:seed:dev first.`,
      );
    }

    const userWorkspace = await this.userWorkspaceRepository.findOne({
      where: { id: BYPASS_USER_WORKSPACE_ID },
      relations: ['user'],
    });

    if (!userWorkspace) {
      throw new Error(
        `Bypass userWorkspace not found. Make sure to run workspace:seed:dev first.`,
      );
    }

    // Load workspace member from workspace schema
    const workspaceMember =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        buildSystemAuthContext(BYPASS_WORKSPACE_ID),
        async () => {
          const workspaceMemberRepository =
            await this.globalWorkspaceOrmManager.getRepository<WorkspaceMemberWorkspaceEntity>(
              BYPASS_WORKSPACE_ID,
              'workspaceMember',
              { shouldBypassPermissionChecks: true },
            );

          return workspaceMemberRepository.findOne({
            where: { id: BYPASS_WORKSPACE_MEMBER_ID },
          });
        },
      );

    if (!workspaceMember) {
      throw new Error(
        `Bypass workspaceMember not found. Make sure to run workspace:seed:dev first.`,
      );
    }

    this.cachedAuthContext = {
      user,
      workspace,
      userWorkspace,
      userWorkspaceId: BYPASS_USER_WORKSPACE_ID,
      workspaceMemberId: BYPASS_WORKSPACE_MEMBER_ID,
      workspaceMember,
      authProvider: AuthProviderEnum.Password,
    };

    this.logger.log('Bypass auth context loaded successfully');

    return this.cachedAuthContext;
  }

  getBypassUserId(): string {
    return BYPASS_USER_ID;
  }

  getBypassWorkspaceId(): string {
    return BYPASS_WORKSPACE_ID;
  }

  getBypassUserWorkspaceId(): string {
    return BYPASS_USER_WORKSPACE_ID;
  }

  getBypassWorkspaceMemberId(): string {
    return BYPASS_WORKSPACE_MEMBER_ID;
  }

  async generateBypassAuthTokens(): Promise<AuthTokenPair> {
    this.logger.log('Generating bypass auth tokens for Tim');

    const accessToken = await this.accessTokenService.generateAccessToken({
      userId: BYPASS_USER_ID,
      workspaceId: BYPASS_WORKSPACE_ID,
      authProvider: AuthProviderEnum.Password,
    });

    const refreshToken = await this.refreshTokenService.generateRefreshToken({
      userId: BYPASS_USER_ID,
      workspaceId: BYPASS_WORKSPACE_ID,
      authProvider: AuthProviderEnum.Password,
      targetedTokenType: JwtTokenTypeEnum.ACCESS,
    });

    return {
      accessOrWorkspaceAgnosticToken: accessToken,
      refreshToken,
    };
  }
}

