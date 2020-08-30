module.exports = class Constants {
    static DEFAULT_YES_NO_REACTIONS = ['✅', '❌'];
    static DEFAULT_COLLECTOR_TIME = 30000;
    static DEFAULT_COLLECTOR_MAX_REACT = 1;
    static DEFAULT_PAGINATOR_MAX_REACT = Infinity;
    static DEFAULT_PAGINATOR_REACTIONS_MAP = {
        '⏪': async (_reaction, botMessage, i, pages) => {
            i = i > 0 ? i-- : 0;
            await botMessage.edit({ embed: pages[i] });
        }, 
        '⏩':  async (_reaction, botMessage, i, pages) => {
            i = i + 1 < pages.length ? i++ : pages.length;
            await botMessage.edit({ embed: pages[i] });
        }, 
    };
    static DEFAULT_RETURN_FUNCTION = () => { return true; };
    static DEFAULT_YES_NO_MAP = {
        '✅': () => { return true; },
        '❌': () => { return true; }
    }
}
