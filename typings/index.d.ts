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
    EmojiResolvable
} from "discord.js";

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

    export class ReactionRoleManager {
        constructor(client: Client, options?: IReactionRoleManagerOptions);
        private __resfreshOnBoot(): Promise<void>;
        private __debug(type: string, message: string, ...args: any)
        public addRole(options: IAddRoleOptions): Promise<void>;
        public removeRole(role: ReactionRole): void;
        private __store(): void;
        private __parseStore(): Collection<string, any>;
        private __onReactionAdd(msgReaction: MessageReaction, user: User): Promise<void>;
        private __onReactionRemove(msgReaction: MessageReaction, user: User): Promise<void>;
        private __onRemoveAllReaction(message: Message): Promise<void>;
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

    export class ReactionCollector {
        public static menu(options: IReactMenuOptions): void;
        public static paginator(options: IPaginatorOptions): void;
        public static question(options: IReactQuestionOptions): DjsReactionCollector;
        public static asyncQuestion(options: IReactQuestionOptions): Promise<boolean>;
        private static __createReactionCollector(_options): DjsReactionCollector;
        private static __createAsyncReactionCollector(_options): Promise<boolean>;
    }

    export interface IReactQuestionOptions {
        botMessage: Message;
        user: UserResolvable;
        onReact: [(botMessage: Message, reaction: MessageReaction) => {}];
        reactions?: EmojiIdentifierResolvable[];
        collectorOptions?: CollectorOptions;
        deleteReaction?: boolean;
        deleteAllReactionsWhenCollectorEnd?: boolean;
    }

    export interface IPaginatorOptions {
        pages: MessageEmbed;
        botMessage: Message;
        user: UserResolvable;
        reactions?: EmojiIdentifierResolvable[];
        collectorOptions?: CollectorOptions;
        deleteReaction?: boolean;
        deleteAllReactionsWhenCollectorEnd?: boolean;
    }

    export interface IReactMenuOptions {
        pages: IMenuPage;
        botMessage: Message;
        user: UserResolvable;
        collectorOptions?: CollectorOptions;
    }

    export interface IMenuPage {
        [key: string]: {
            embed?: MessageEmbed | object;
            content?: string;
            reactions?: string[];
            pages?: IMenuPage;
            onMessage?: (message: Message, botMessage: Message) => {};
            onReact?: (botMessage: Message, reaction: MessageReaction) => {};
        };
    }
}