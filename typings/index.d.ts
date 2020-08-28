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
    GuildMember
} from "discord.js";

import {EventEmitter} from 'events';

declare module 'discord.js-collector' {

    class ReactionRole {
        constructor(options: IReactionRoleOptions);
        get id(): string;
        public toJSON(): object;
        static fromJSON(json: JSON): ReactionRole;
    }

    interface IReactionRoleOptions {
        message: Message | Snowflake;
        channel: TextChannel | Snowflake;
        guild: Guild | Snowflake;
        role: Role | Snowflake;
        emoji: GuildEmoji | EmojiResolvable;
        winners: string[];
        max: number;
    }

    export class ReactionRoleManager extends EventEmitter {
        constructor(client: Client, options?: IReactionRoleManagerOptions);
        public roles: Collection<string, ReactionRole>;
        private __resfreshOnBoot(): Promise<void>;
        private __debug(type: string, message: string, ...args: any)
        public addRole(options: IAddRoleOptions): Promise<void>;
        public removeRole(role: ReactionRole): void;
        private __store(): void;
        private __parseStore(): Collection<string, any>;
        private __onReactionAdd(msgReaction: MessageReaction, user: User): Promise<void>;
        private __onReactionRemove(msgReaction: MessageReaction, user: User): Promise<void>;
        private __onRemoveAllReaction(message: Message): Promise<void>;
        
        public on(event: 'reactionRoleAdd', listener:(member: GuildMember, role: Role) =>{}): void;
        public on(event: 'reactionRoleRemove', listener:(member: GuildMember, role: Role) =>{}): void;
        public on(event: 'allReactionsRemove', listener:(message: Message) =>{}): void;
    }

    export interface IAddRoleOptions {
        message: Message;
        role: Role;
        emoji: EmojiIdentifierResolvable;
        max: number;
    }

    export interface IReactionRoleManagerOptions {
        store: true;
        debug: false;
        path: string;
        refreshOnBoot: true;
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

    export class Controller {
        constructor(botMessage: Message, collector: DjsReactionCollector, pages: IMenuPage);
        public stop(): void;
        public back(): void;
        public restTimer(options: { time: number, idle: number } = {}): void;
        public goTo(pageId: string | number): void;
        public get canBack(): boolean;
        async update(bool: boolean): Promise<void>;
        get botMessage(): Message;
        get lastPage(): IMenuPage;
        set messagesCollector(value: IMenuPage): void;
        get messagesCollector(): DjsMessageCollector;
        get collector(): DjsReactionCollector;
        get currentPage(): IMenuPage;
        set currentPage(value: IMenuPage): void;
        set lastPage(value: IMenuPage): void
        get pages(): IMenuPage;
    }

    export class ReactionCollector {
        public async static menu(options: IReactMenuOptions): Controller;
        public async static paginator(options: IPaginatorOptions): DjsReactionCollector;
        public async static question(options: IReactQuestionOptions, ...args: any): DjsReactionCollector;
        public async static yesNoQuestion(options: IReactQuestionOptions): Promise<boolean>;
        private async static __createReactionCollector(_options, ...args: any): DjsReactionCollector;
        private async static __createYesNoReactionCollector(_options): Promise<boolean>;
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

    export interface IReactionMapAction{
        [key: EmojiIdentifierResolvable]: (reaction: MessageReaction, ...args: any) => {};
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