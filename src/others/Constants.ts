export namespace Constants{
    export class Errors{
        public static readonly GENERIC_MISSING_OPTIONS = `You hadn't provided a valid options to create this collector. Make sure if you provided valid non-null options.`;
        public static readonly INVALID_MAX_OPTION = (value: any) => `Option 'max' with value '${value}' is not a valid value. Must be between 0 and Number.POSITIVE_INFINITY` 
        public static readonly CLIENT_NOT_FOUND = 'You hadn\' provided a valid users or \'channel\'.' 
        public static readonly INVALID_CHANNEL_OPTION = (value: any) =>  `Option 'channel' with value '${value}' is not a valid value. Must be some ChannelResolvable.` 
        public static readonly INVALID_USERS_OPTION = (value: any) =>  `Option 'users' with value '${value}' is not a valid users. Must be some UserResolvable[].` 
        public static readonly INVALID_ONMESSAGE_HOOK = (value: any) =>  '' 
    }
}