import './src/CollectorManager';
import init from './src/CollectorManager';
import MessageCollector from './src/collectors/message/MessageCollector';
import MessageQuestionCollector from './src/collectors/message/question/MessageQuestionCollector';
import { Constants } from './src/others/Constants';
import { BaseCollector } from './src/structures/BaseCollector';


const CollectorManager=init;
export default CollectorManager;
export{
    MessageCollector,
    MessageQuestionCollector,

    BaseCollector,
    Constants,

    CollectorManager,
}