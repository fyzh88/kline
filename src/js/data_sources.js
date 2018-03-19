import {NamedObject} from './named_object'
import {CToolManager} from './ctool_manager'
import Kline from './kline'

export class DataSource extends NamedObject {

    static UpdateMode = {
        DoNothing: 0,
        Refresh: 1,
        Update: 2,
        Append: 3
    };

    constructor(name) {
        super(name);
    }

    getUpdateMode() {
        return this._updateMode;
    }

    setUpdateMode(mode) {
        this._updateMode = mode;
    }

    getCacheSize() {
        return 0;
    }

    getDataCount() {
        return 0;
    }

    getDataAt(index) {
        return this._dataItems[index];
    }

}


export class MainDataSource extends DataSource {

    constructor(name) {
        super(name);
        this._erasedCount = 0;
        this._dataItems = [];//缓存数据
        this._decimalDigits = 0;
        this.toolManager = new CToolManager(name);
    }

    getCacheSize() {
        return this._dataItems.length;
    }

    getDataCount() {
        return this._dataItems.length;
    }

    getUpdatedCount() {
        return this._updatedCount;
    }

    getAppendedCount() {
        return this._appendedCount;
    }

    getErasedCount() {
        return this._erasedCount;
    }

    getDecimalDigits() {
        return this._decimalDigits;
    }

    calcDecimalDigits(v) {
        let str = "" + v;
        let i = str.indexOf('.');
        if (i < 0) {
            return 0;
        }
        return (str.length - 1) - i;
    }

    getLastDate() {
        let count = this.getDataCount();
        if (count < 1) {
            return -1;
        }
        return this.getDataAt(count - 1).date;
    }

    getDataAt(index) {
        return this._dataItems[index];
    }
    
    update(data) {
        this._updatedCount = 0;
        this._appendedCount = 0;
        this._erasedCount = 0;
        let len = this._dataItems.length;//缓存数据集合
        console.log("------> len ="+len)
        if (len > 0) {            
            let cnt = data.length;
            //从缓存数据中的最后向前寻找 传递进来的data中的最小时间戳（这里假定data中的数据已经排序完成）
            let find = false
            for( i = len-1; i > 0; i--){
                //console.log(" "+this._dataItems[i].date + "  "+data[0][0])
                if(this._dataItems[i].date === data[0][0]){
                    //在缓存中找到了我们想要的那个最小时间戳数据
                    find = true
                    break
                }
            }
            console.log("------>find="+find+",i="+i)
            // 现在的i就是最小时间戳数据的索引
            if(find){
                //将传递进来的数据复制到缓存中
                for(let index=0;index<cnt;index++){
                    this._dataItems[i]={
                        date: data[index][0],
                        open: data[index][1],
                        high: data[index][2],
                        low: data[index][3],
                        close: data[index][4],
                        volume: data[index][5]
                    }
                    i++
                }
            }else{
                //如果没有找到直接替换
                this._dataItems = [];//先清空原来的数据
                for (let index = 0; index < cnt; index++) {
                    this._dataItems[index] = {
                        date: data[index][0],
                        open: data[index][1],
                        high: data[index][2],
                        low: data[index][3],
                        close: data[index][4],
                        volume: data[index][5]
                    }
                }                
            }
            this.setUpdateMode(DataSource.UpdateMode.Refresh);
            return true
            /*
            for (i = 0; i < cnt; i++) {//遍历传递进来的数据，与缓存数据集合中的最后一条数据比对时间戳
                e = data[i];
                if (e[0] === lastItem.date) {//时间戳比对成功
                    if (lastItem.open === e[1] &&
                        lastItem.high === e[2] &&
                        lastItem.low === e[3] &&
                        lastItem.close === e[4] &&
                        lastItem.volume === e[5]) {//数值全匹配，界面不更新
                        this.setUpdateMode(DataSource.UpdateMode.DoNothing);
                    } else {
                        this.setUpdateMode(DataSource.UpdateMode.Update);
                        this._dataItems[lastIndex] = {
                            date: e[0],
                            open: e[1],
                            high: e[2],
                            low: e[3],
                            close: e[4],
                            volume: e[5]
                        };
                        this._updatedCount++;
                    }
                    i++;//传进来的数据中 匹配了 缓存最后一条数据后 的索引
                    console.log("------> xxindex="+i)
                    if (i < cnt) {//证明传进来的数据比缓存中的数据多，需要给我们的缓存增加多出来的数据
                        this.setUpdateMode(DataSource.UpdateMode.Append);
                        for (; i < cnt; i++, this._appendedCount++) {
                            e = data[i];
                            this._dataItems.push({
                                date: e[0],
                                open: e[1],
                                high: e[2],
                                low: e[3],
                                close: e[4],
                                volume: e[5]
                            });
                        }
                    }
                    return true;
                }
            }
            
            if (cnt < Kline.instance.limit) {
                this.setUpdateMode(DataSource.UpdateMode.DoNothing);
                return false;
            }*/
        }
        //初始化，相当与是最初没有数据的状态时执行下面的操作
        this.setUpdateMode(DataSource.UpdateMode.Refresh);
        this._dataItems = [];
        let d, n, e, i, cnt = data.length;
        for (i = 0; i < cnt; i++) {
            e = data[i];
            for (n = 1; n <= 4; n++) {
                d = this.calcDecimalDigits(e[n]);
                if (this._decimalDigits < d)
                    this._decimalDigits = d;
            }
            this._dataItems.push({
                date: e[0],
                open: e[1],
                high: e[2],
                low: e[3],
                close: e[4],
                volume: e[5]
            });
            //console.log(i+"------> _dataitems =data "+e[0]+","+e[1]+","+e[2]+","+e[3]+","+e[4]+","+e[5])
        }
       
        return true;
    }

    select(id) {
        this.toolManager.selecedObject = id;
    }

    unselect() {
        this.toolManager.selecedObject = -1;
    }

    addToolObject(toolObject) {
        this.toolManager.addToolObject(toolObject);
    }

    delToolObject() {
        this.toolManager.delCurrentObject();
    }

    getToolObject(index) {
        return this.toolManager.getToolObject(index);
    }

    getToolObjectCount() {
        return this.toolManager.toolObjects.length;
    }

    getCurrentToolObject() {
        return this.toolManager.getCurrentObject();
    }

    getSelectToolObjcet() {
        return this.toolManager.getSelectedObject();
    }

    delSelectToolObject() {
        this.toolManager.delSelectedObject();
    }

}

