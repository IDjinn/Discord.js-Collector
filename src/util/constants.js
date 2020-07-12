module.exports = class Constants {
    static DEFAULT_YES_NO_REACTIONS = ['✅', '❌'];
    static DEFAULT_COLLECTOR_TIME = 30_000;
    static DEFAULT_COLLECTOR_MAX_REACT = 1;
    static DEFAULT_PAGINATOR_MAX_REACT = Infinity;
    static DEFAULT_PAGINATOR_REACTIONS = ['⏪', '⏩'];
    static DEFAULT_RETURN_FUNCTION = () => { return true; };
}