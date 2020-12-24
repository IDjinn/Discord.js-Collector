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
  Emoji,
  PermissionResolvable,
  RoleResolvable,
} from 'discord.js';

import { EventEmitter } from "events";

declare module "discord.js-collector" {
  export enum ActionType {
    UNKNOWN = 0,
    GIVE = 1,
    TAKE = 2,
  }

  export enum ReactionRoleType {
    UNKNOWN = 0,
    NORMAL = 1,
    TOGGLE = 2,
    JUST_WIN = 3,
    JUST_LOSE = 4,
    REVERSED = 5,
  }

  export class ReactionRole {
    constructor(options: IReactionRoleOptions);
    get id(): string;
    public toJSON(): object;
    get message(): string;
    get channel(): string;
    get guild(): string;
    /**
     * @deprecated since 1.8.0, please use `roles` property instead.
     */
    get role(): string;
    get emoji(): string;
    get winners(): string[];
    get max(): number;
    /**
     * @deprecated since 1.7.9
     */
    get toggle(): boolean;
    get requirements(): IRequirementType;
    get type(): ReactionRoleType;
    get isToggle(): boolean;
    get isNormal(): boolean;
    get isJustWin(): boolean;
    get isJustLose(): boolean;
    get isReversed(): boolean;
    get roles(): string[];
    /**
     * @deprecated since 1.8.0, please use `new ReactionRole(json)` instead.
     */
    static fromJSON(json: JSON): ReactionRole;
    public checkDeveloperRequirement(member: GuildMember): Promise<boolean>;
    public checkBoostRequirement(member: GuildMember): boolean;
    private __handleDeprecation(): void;
    /**
     * @deprecated since 1.8.0, please use `new ReactionRole(json)` method instead.
     */
    public toJSON(): JSON;
  }

  export interface IRequirementType {
    boost: boolean;
    verifiedDeveloper: boolean;
    roles: IRequirementRolesType;
    users: IRequirementUsersType;
    permissionsNeed: PermissionResolvable[];
  }

  export interface IRequirementRolesType {
    allowList: RoleResolvable[];
    denyList: RoleResolvable[];
  }
  export interface IRequirementUsersType {
    allowList: UserResolvable[];
    denyList: UserResolvable[];
  }

  export interface IReactionRoleOptions {
    message: Message | Snowflake;
    channel: TextChannel | Snowflake;
    guild: Guild | Snowflake;
    role: Role | Snowflake;
    emoji: GuildEmoji | EmojiResolvable;
    winners?: string[];
    max?: number;
    toggle?: boolean;
    type?: ReactionRoleType;
  }

  export class ReactionRoleManager extends EventEmitter {
    constructor(client: Client, options?: IReactionRoleManagerOptions);
    private __withoutPermissionsWarned: Set<string>;
    public reactionRoles: Collection<string, ReactionRole>;
    public timeouts: Collection<string, Function>;
    private mongoose: any;
    public get isReady(): boolean;
    public get readyAt(): Date;
    public get client(): Client;
    public get storage(): boolean;
    public get debug(): boolean;
    public get mongoDbLink(): string?;
    public get storageJsonPath(): string?;
    public get disabledProperty(): boolean;
    public get hooks(): IHooks;
    public get keepReactions(): boolean;
    private __withoutPermissionsWarned: Set<string>;
    public createReactionRole(
      options: ICreateRoleOptions
    ): Promise<ReactionRole>;
    public deleteReactionRole(
      options: IDeleteRoleOptions,
      deleted = false
    ): Promise<ReactionRole | void>;
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
    private __timeoutToggledRoles(member: GuildMember, message: Message): void;
    private __handleDeleted(
      reactionRole: ReactionRole,
      guildResolvable: GuildResolvable
    );
    private __checkRequirements(
      reactionRole: ReactionRole,
      reaction: MessageReaction,
      member: GuildMember
    );
    private __checkRolesPermissions(
      action: ActionType,
      reactionRole: ReactionRole,
      member: GuildMember
    ): Role[];
    private __resolveReactionEmoji(emoji: any): Emoji | undefined;
    private async __handleReactionRoleAction(
      action: ActionType,
      member: GuildMember,
      reactionRole: ReactionRole,
      msgReaction: MessageReaction
    );
    private __readyTimeout();

    public on(event: string, listener: (...args: any[]) => void): this;
    public on(
      event: "reactionRoleAdd",
      listener: (member: GuildMember, role: Role) => void
    ): this;
    public on(
      event: "reactionRoleRemove",
      listener: (member: GuildMember, role: Role) => void
    ): this;
    public on(
      event: "allReactionsRemove",
      listener: (
        message: Message,
        rolesAffected: Collection<string, Role>,
        membersAffected: GuildMember[],
        reactionsTaken: number
      ) => void
    ): this;
    public on(
      event: "missingRequirements",
      listener: (
        type: IRequirementType,
        member: GuildMember,
        reactionRole: ReactionRole,
        missing?: any
      ) => void
    ): this;
    public on(
      event: "missingPermissions",
      listener: (
        action: ActionType,
        member: GuildMember,
        reactionRole: ReactionRole,
        msgReaction: MessageReaction
      ) => void
    ): this;

    private __readyTimeout();

    public on(event: string, listener: (...args: any[]) => void): this;
    public on(
      event: "reactionRoleAdd",
      listener: (member: GuildMember, role: Role) => void
    ): this;
    public on(
      event: "reactionRoleRemove",
      listener: (member: GuildMember, role: Role) => void
    ): this;
    public on(
      event: "allReactionsRemove",
      listener: (
        message: Message,
        rolesAffected: Collection<string, Role>,
        membersAffected: GuildMember[],
        reactionsTaken: number
      ) => void
    ): this;
    public on(
      event: "missingRequirements",
      listener: (
        type: RequirementType,
        member: GuildMember,
        reactionRole: ReactionRole
      ) => void
    ): this;
    public on(
      event: "missingPermissions",
      listener: (
        action: ActionType,
        member: GuildMember,
        roles: Role[],
        reactionRole: ReactionRole
      ) => void
    ): this;
    public on(event: "ready", listener: () => void): this;
    public on(event: "debug", listener: (message: string) => void): this;
  }

  export enum RequirementType {
    UNKNOWN,
    BOOST,
    VERIFIED_DEVELOPER,
    PERMISSION,
    ROLES,
    USERS,
  }

  export interface ICreateRoleOptions {
    message: Message;
    roles: Role[];
    emoji: EmojiIdentifierResolvable;
    max?: number;
    type?: ReactionRoleType;
    requirements?: IRequirementType;
  }

  export interface IDeleteRoleOptions {
    reactionRole?: ReactionRole;
    message?: Message;
    emoji?: Emoji;
  }

  export interface IReactionRoleManagerOptions {
    storage: boolean | true;
    path: string;
    mongoDbLink?: string;
    storageJsonPath?: string;
    disabledProperty?: boolean | true;
    hooks?: IHooks | null;
    keepReactions?: boolean | false;
  }

  export interface IHooks {
    preRoleAddHook: (
      member: GuildMember,
      role?: Role,
      reactionRole: ReactionRole
    ) => Promise<Boolean>;
    preRoleRemoveHook: (
      member: GuildMember,
      role?: Role,
      reactionRole: ReactionRole
    ) => Promise<Boolean>;
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
