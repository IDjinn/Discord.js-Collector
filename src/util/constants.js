const editPaginator = async (botMessage, isBack, i, pages) => {
    isBack ? (i > 0 ? --i : pages.length - 1) : (i + 1 < pages.length ? ++i : 0);
    await botMessage.edit({ embed: pages[i] });
}

module.exports = class Constants {
    static DEFAULT_YES_NO_REACTIONS = ['✅', '❌'];
    static DEFAULT_COLLECTOR_TIME = 30000;
    static DEFAULT_COLLECTOR_MAX_REACT = 1;
    static DEFAULT_PAGINATOR_MAX_REACT = Infinity;
    static DEFAULT_PAGINATOR_REACTIONS_MAP = {
        '⏪': async (reaction, botMessage, i, pages) => await editPaginator(botMessage, true, i, pages), 
        '⏩': async (reaction, botMessage, i, pages) => await editPaginator(botMessage, false, i, pages),
    };
    static DEFAULT_RETURN_FUNCTION = () => { return true; };
    static DEFAULT_YES_NO_MAP = {
        '✅': () => { return true; },
        '❌': () => { return true; }
    }
}
