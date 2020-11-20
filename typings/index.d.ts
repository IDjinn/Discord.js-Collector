import Discord, {
    CollectorOptions,
    EmojiIdentifierResolvable,
    Message,
    MessageEmbed,
    UserResolvable,
    Client,
    Role,
    Collection,
    MessageReaction,
    User,
    Snowflake,
    TextChannel,
    Guild,
    GuildEmoji,
    EmojiResolvable,
    GuildMember,
    GuildManager,
    GuildResolvable,
} from 'discord.js';

import { EventEmitter } from 'events';

declare module 'discord.js-collector' {
    export class ReactionRole {
        constructor(options: IReactionRoleOptions);
        get id(): string;
        public toJSON(): object;
        get message(): string;
        get channel(): string;
        get guild(): string;
        get role(): string;
        get emoji(): string;
        get winners(): string[];
        get max(): number;
        get toggle(): boolean;
        get requirements(): IRequirements;
        static fromJSON(json: JSON): ReactionRole;
        public checkDeveloperRequirement(member: GuildMember): Promise<boolean>;
        public checkBoostRequirement(member: GuildMember): boolean;
    }

    export interface IRequirements {
        boost: boolean;
        verifiedDeveloper: boolean;
    }

    export interface IReactionRoleOptions {
        message: Message | Snowflake;
        channel: TextChannel | Snowflake;
        guild: Guild | Snowflake;
        role: Role | Snowflake;
        emoji: GuildEmoji | EmojiResolvable;
        winners: string[];
        max: number;
        toggle: boolean;
    }

    export class ReactionRoleManager extends EventEmitter {
        constructor(client: Client, options?: IReactionRoleManagerOptions);
        public reactionRoles: Collection<string, ReactionRole>;
        public timeouts: Collection<string, Function>;
        public createReactionRole(options: IAddRoleOptions): Promise<void>;
        public deleteReactionRole(role: ReactionRole): Promise<void>;
        public store(...roles: ReactionRole): Promise<void>;
        private __parseStorage(): Collection<string, any>;
        private __onReactionAdd(
            msgReaction: MessageReaction,
            user: User
        ): Promise<void>;
        private __onReactionRemove(
            msgReaction: MessageReaction,
            user: User
        ): Promise<void>;
        private __onRemoveAllReaction(message: Message): Promise<void>;
        private __resfreshOnBoot(): Promise<void>;
        private __debug(type: string, message: string, ...args: any): void;
        private __timeoutToggledRoles(
            member: GuildMember,
            message: Message
        ): void;
        private __handleDeleted(
            reactionRole: ReactionRole,
            guildResolvable: GuildResolvable
        );
        private __checkRequirements(
            reactionRole: ReactionRole,
            reaction: MessageReaction,
            member: GuildMember
        );

        public on(event: string, listener: (...args: any[]) => void): this;
        public on(
            event: 'reactionRoleAdd',
            listener: (member: GuildMember, role: Role) => void
        ): this;
        public on(
            event: 'reactionRoleRemove',
            listener: (member: GuildMember, role: Role) => void
        ): this;
        public on(
            event: 'allReactionsRemove',
            listener: (
                message: Message,
                rolesAffected: Role[],
                membersAffected: GuildMember[],
                reactionsTaken: number
            ) => void
        ): this;
        public on(
            event: 'missingRequirements',
            listener: (
                type: IRequirementType,
                member: GuildMember,
                reactionRole: ReactionRole
            ) => void
        ): this;
    }

    export enum IRequirementType {
        BOOST = 'BOOST',
        VERIFIED_DEVELOPER = 'VERIFIED_DEVELOPER',
    }

    export interface IAddRoleOptions {
        message: Message;
        role: Role;
        emoji: EmojiIdentifierResolvable;
        max?: number;
        toggle?: boolean;
        requirements?: IRequirements;
    }

    export interface IReactionRoleManagerOptions {
        storage: boolean | true;
        debug: boolean | false;
        path: string;
        mongoDbLink?: string;
        storageJsonPath?: string;
        disabledProperty: boolean | true;
    }

    export class MessageCollector {
        public static question(
            options: IMessageQuestionOptions
        ): Discord.MessageCollector;
        public static asyncQuestion(
            options: IMessageQuestionOptions
        ): Promise<Message>;
        private __createMessageCollector(_options): Discord.MessageCollector;
        private __createAsyncMessageCollector(_options): Promise<Message>;
    }

    export interface IMessageQuestionOptions {
        botMessage: Message;
        user: UserResolvable;
        onReact: (botMessage: Message) => {};
        reactions?: EmojiIdentifierResolvable[];
        collectorOptions?: CollectorOptions;
        deleteMessage?: boolean;
    }

    export interface ITimerOptions {
        time?: number;
        idle?: number;
    }

    export class Controller {
        constructor(
            botMessage: Message,
            collector: Discord.ReactionCollector,
            pages: IMenuPage
        );
        public stop(): void;
        public restTimer(options?: ITimerOptions): void;
        public async back(): Promise<void>;
        public async goTo(pageId: string | number): Promise<void>;
        public async update(bool: boolean): Promise<void>;
        public get canBack(): boolean;
        get botMessage(): Message;
        get lastPage(): IMenuPage;
        set messagesCollector(value);
        get messagesCollector(): Discord.MessageCollector;
        get collector(): Discord.ReactionCollector;
        get currentPage(): IMenuPage;
        set currentPage(value);
        set lastPage(value);
        get pages(): IMenuPage;
    }

    export class ReactionCollector {
        public static menu(options: IReactMenuOptions): Controller;
        public static paginator(
            options: IPaginatorOptions
        ): Discord.ReactionCollector;
        public static question(
            options: IReactQuestionOptions,
            ...args: any
        ): Discord.ReactionCollector;
        public static yesNoQuestion(
            options: IReactQuestionOptions
        ): Promise<boolean>;
        private static __createReactionCollector(
            _options,
            ...args: any
        ): Discord.ReactionCollector;
        private static __createYesNoReactionCollector(
            _options
        ): Promise<boolean>;
    }

    export interface IReactQuestionOptions {
        botMessage: Message;
        user: UserResolvable;
        reactions?: IReactionMapAction;
        collectorOptions?: CollectorOptions;
        deleteReaction?: boolean;
        deleteAllOnEnd?: boolean;
    }

    export interface IPaginatorOptions {
        pages: MessageEmbed;
        botMessage: Message;
        user: UserResolvable;
        reactions?: IReactionMapAction;
        collectorOptions?: CollectorOptions;
        deleteReaction?: boolean;
        deleteAllOnEnd?: boolean;
    }

    export interface IReactMenuOptions {
        pages: IMenuPage;
        botMessage: Message;
        user: UserResolvable;
        collectorOptions?: CollectorOptions;
    }

    export interface IReactionMapAction {
        [key: string]: (reaction: MessageReaction, ...args: any) => {};
    }

    export interface IMenuPage {
        [key: string]: {
            id?: string | number;
            embed?: MessageEmbed | object;
            content?: string;
            reactions?: EmojiIdentifierResolvable[];
            backEmoji?: EmojiIdentifierResolvable;
            clearReactions?: boolean;
            pages?: IMenuPage;
            onMessage?: (controller: Controller, message: Message) => {};
            onReact?: (controller: Controller, reaction: MessageReaction) => {};
        };
    }
}
