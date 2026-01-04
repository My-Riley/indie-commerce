import { Args, Mutation, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import {
    Allow,
    Ctx,
    CustomerService,
    PasswordCipher,
    RequestContext,
    Transaction,
    UserService,
    TransactionalConnection,
    HistoryService,
    User,
} from '@vendure/core';
import { Permission } from '@vendure/common/lib/generated-types';
import { NativeAuthenticationMethod } from '@vendure/core/dist/entity/authentication-method/native-authentication-method.entity';

@Resolver()
export class GoogleAuthResolver {
    constructor(
        private customerService: CustomerService,
        private userService: UserService,
        private passwordCipher: PasswordCipher,
        private connection: TransactionalConnection,
        private historyService: HistoryService,
    ) { }

    @Transaction()
    @Mutation()
    @Allow(Permission.Owner)
    async setPasswordForGoogleUser(
        @Ctx() ctx: RequestContext,
        @Args('password') password: string,
    ): Promise<boolean> {
        // Get the current user
        const userId = ctx.activeUserId;
        if (!userId) {
            return false;
        }

        const user = await this.userService.getUserById(ctx, userId);
        if (!user) {
            return false;
        }

        // Check if user already has a NativeAuthenticationMethod
        const nativeAuthMethod = user.authenticationMethods.find(
            m => m instanceof NativeAuthenticationMethod
        );

        if (nativeAuthMethod) {
            // User already has a password
            return false;
        }

        // Hash the password
        const passwordHash = await this.passwordCipher.hash(password);

        // Create a new NativeAuthenticationMethod
        const newAuthMethod = new NativeAuthenticationMethod();
        newAuthMethod.identifier = user.identifier;
        newAuthMethod.passwordHash = passwordHash;
        newAuthMethod.user = user;

        // Save the new authentication method
        await this.connection.getRepository(ctx, NativeAuthenticationMethod).save(newAuthMethod);

        // Add history entry
        const customer = await this.customerService.findOneByUserId(ctx, user.id);
        if (customer) {
            await this.historyService.createHistoryEntryForCustomer({
                ctx,
                customerId: customer.id,
                type: 'CUSTOMER_PASSWORD_UPDATED' as any,
                data: {},
            });
        }

        return true;
    }

    @ResolveField('hasPassword')
    @Resolver('CurrentUser')
    async hasPassword(@Ctx() ctx: RequestContext, @Parent() user: User): Promise<boolean> {
        if (user.authenticationMethods) {
            return user.authenticationMethods.some(
                m => m instanceof NativeAuthenticationMethod
            );
        }

        const userWithMethods = await this.connection.getRepository(ctx, User).findOne({
            where: { id: user.id },
            relations: ['authenticationMethods'],
        });

        return userWithMethods?.authenticationMethods.some(
            m => m instanceof NativeAuthenticationMethod
        ) ?? false;
    }
}
