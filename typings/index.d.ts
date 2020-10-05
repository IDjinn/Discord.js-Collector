import {
    CollectorOptions,
    MessageCollector as DjsMessageCollector,
    ReactionCollector as DjsReactionCollector,
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
    GuildMember, GuildManager, GuildResolvable
} from "discord.js";

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
        get requierements(): IRequierements;
        static fromJSON(json: JSON): ReactionRole;
    }

    export interface IRequierements {
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
        public deleteReactionRole(role: ReactionRole): void;
        private __store(): void;
        private __parseStorage(): Collection<string, any>;
        private __onReactionAdd(msgReaction: MessageReaction, user: User): Promise<void>;
        private __onReactionRemove(msgReaction: MessageReaction, user: User): Promise<void>;
        private __onRemoveAllReaction(message: Message): Promise<void>;
        private __resfreshOnBoot(): Promise<void>;
        private __debug(type: string, message: string, ...args: any): void;
        private __timeoutToggledRoles(member: GuildMember, message: Message): void;
        private __handleDeleted(reactionRole: ReactionRole, guildResolvable: GuildResolvable)

        public on(event: string, listener: (...args: any[]) => void): this;
        public on(event: 'reactionRoleAdd', listener: (member: GuildMember, role: Role) => void): this;
        public on(event: 'reactionRoleRemove', listener: (member: GuildMember, role: Role) => void): this;
        public on(event: 'allReactionsRemove', listener: (message: Message, rolesAffected: Role[], membersAffected: GuildMember[], reactionsTaken: number) => void): this;
        public on(event: 'missingRequirements', listener: (type: IRequierementType, member: GuildMember, reactionRole: ReactionRole) => void): this;
    }

    export enum IRequierementType {
        BOOST = 'BOOST',
        VERIFIED_DEVELOPER = 'VERIFIED_DEVELOPER'
    }

    export interface IAddRoleOptions {
        message: Message;
        role: Role;
        emoji: EmojiIdentifierResolvable;
        max?: number;
        toggle?: boolean;
        requierements?: IRequierements;
    }

    export interface IReactionRoleManagerOptions {
        storage: boolean | true;
        debug: boolean | false;
        path: string;
        mongoDbLink?: string;
        storageJsonPath?: string;
    }

    export class MessageCollector {
        public static question(options: IMessageQuestionOptions): DjsMessageCollector;
        public static asyncQuestion(options: IMessageQuestionOptions): Promise<Message>;
        private __createMessageCollector(_options): DjsMessageCollector;
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
        constructor(botMessage: Message, collector: DjsReactionCollector, pages: IMenuPage);
        public stop(): void;
        public back(): void;
        public restTimer(options?: ITimerOptions): void;
        public goTo(pageId: string | number): void;
        public get canBack(): boolean;
        public update(bool: boolean): Promise<void>;
        get botMessage(): Message;
        get lastPage(): IMenuPage;
        set messagesCollector(value);
        get messagesCollector(): DjsMessageCollector;
        get collector(): DjsReactionCollector;
        get currentPage(): IMenuPage;
        set currentPage(value);
        set lastPage(value);
        get pages(): IMenuPage;
    }

    export class ReactionCollector {
        public static menu(options: IReactMenuOptions): Controller;
        public static paginator(options: IPaginatorOptions): DjsReactionCollector;
        public static question(options: IReactQuestionOptions, ...args: any): DjsReactionCollector;
        public static yesNoQuestion(options: IReactQuestionOptions): Promise<boolean>;
        private static __createReactionCollector(_options, ...args: any): DjsReactionCollector;
        private static __createYesNoReactionCollector(_options): Promise<boolean>;
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