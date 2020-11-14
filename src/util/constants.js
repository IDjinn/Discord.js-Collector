
/**
 * Constants values
 */
class Constants {
    /**
     * @constant {string[]}
     * @default ['✅', '❌']
     */
    static DEFAULT_YES_NO_REACTIONS = ['✅', '❌'];
    /**
     * @constant {number}
     * @default 30000
     */
    static DEFAULT_COLLECTOR_TIME = 30000;
    /**
     * @constant {number}
     * @default 1
     */
    static DEFAULT_COLLECTOR_MAX_REACT = 1;
    /**
     * @constant {number}
     * @default Infinity
     */
    static DEFAULT_PAGINATOR_MAX_REACT = Infinity;
    /**
     * @constant {object}
     */
    static DEFAULT_PAGINATOR_REACTIONS_MAP = {
        '⏮️': async (_reaction, _collector, botMessage, pages) => {
            pages.index = 0;
            await botMessage.edit({ embed: pages[pages.index] });
        },
        '⏪': async (_reaction, _collector, botMessage, pages) => {
            pages.index--;
            if (pages.index <= 0) pages.index = 0;
            await botMessage.edit({ embed: pages[pages.index] });
        },
        '⏹️': async (_reaction, collector, _botMessage, _pages) => {
            collector.stop();
        },
        '⏩': async (_reaction, _collector, botMessage, pages) => {
            pages.index++;
            if (pages.index >= pages.length) pages.index = pages.length - 1;
            await botMessage.edit({ embed: pages[pages.index] });
        },
        '⏭️': async (_reaction, _collector, botMessage, pages) => {
            pages.index = pages.length - 1;
            await botMessage.edit({ embed: pages[pages.index] });
        },
    };
    /**
     * @constant {Funcion}
     * @default true
     */
    static DEFAULT_RETURN_FUNCTION = () => {
        return true;
    };
    /**
     * @constant {object}
     */
    static DEFAULT_YES_NO_MAP = {
        '✅': () => {
            return true;
        },
        '❌': () => {
            return true;
        },
    };
    /**
     * @constant {number}
     * @default 1500
     */
    static DEFAULT_TIMEOUT_TOGGLED_ROLES = 1500;
}

module.exports = Constants;
