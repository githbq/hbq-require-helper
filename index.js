//自动加载对应目录的文件内容
const requireDir = require('require-dir'); //require-dir 会过滤掉自身 所以不用担心会引发递归调用问题 比如 requireDir('./')
const pathTool = require('path');
const ioHelper = require('io-helper');
module.exports = {
    //普通require 支持数组的参数
    require(paths) {
        paths = [].concat(paths);
        let pathValue = pathTool.join.apply(null, paths);
        return require(pathValue);
    },
    /**
     * 从根节点引用模板
     * @param {*路径　相对于程序运行的根节点} paths 
     */
    requireRoot(paths) {
        return this.require.apply(null, [process.cwd()].concat(paths));
    },
    //按规则过滤路径require
    requireRuled(paths, cb, filterCb) {
        paths = [].concat(paths);
        let pathValue = pathTool.join.apply(null, paths);
        let dirData = requireDir(pathValue);
        //路径过滤
        _.each(dirData, (result, name) => {
            if ((filterCb && filterCb(name)) || (!filterCb && this.nameRule(name))) { //非入口JS 并且文件名非下划线开头
                cb && cb(result, name);
            }
        });
    },
    /**
     * 
     * @param {路径,一个字符串,或者一个字符串数组,会自动join拼接} paths 
     * @param {如果定义并且返回false,会跳过本次结果,如果定义并返回新结果,则用新结果} cb 
     * 返回路径文件结果的数组   [{result,name}]
     */
    requireDir(paths, cb, filterCb) {
        let resultData = [];
        //路径过滤
        this.requireRuled(paths, (result, name) => {
            const newResult = cb && cb(result, name);
            if (cb && newResult) {
                resultData.push({ result: newResult, name });
            } else if (cb && newResult === false) {
                //定义了回调,但返回了false 则跳过本轮
            } else {
                resultData.push({ result, name });
            }
        }, filterCb || this.nameRule);
        return resultData;
    },
    //返回路径文件结果的对象   {[name]:result}]
    requireDirKV(paths, cb) {
        let resultData = {};
        //路径过滤
        this.requireRuled(paths, (result, name) => {
            resultData[name] = result;
            cb && cb(result, name);
        });
        return resultData;
    },
    nameRule(name) {
        return !(/^(index|_)/.test(name));
    },
    //递归查找文件
    requireRecurse(path, filter, cb, filterCb) {
        let dirInfos = ioHelper.findRecurseSync(path, filter);
        let dirData = { arr: [], kv: {} };
        dirInfos.forEach((n) => {
            // if (n.isFile) {  //注释后 文件夹也要了
            //取得文件的相对路径名称且含文件名    xxx\\yyy.js=> xxx
            let dirname = pathTool.dirname(n.relative);
            let extName = pathTool.extname(n.relative);
            //取得 yyy
            let name = pathTool.basename(n.relative, extName);
            let fullname = ioHelper.replaceSep(pathTool.join(dirname, name)); //  相对路径  aaa/xxx/yyy.js=>  aaa/xxx/yyy 
            if ((filterCb && filterCb(name, dirname, n)) || (!filterCb && this.nameRule(name))) {
                let result = require(n.filePath);
                cb && cb(fullname, result, n);
                dirData.arr.push({ result, filePath: n.filePath, fullname, name, dirInfo: n });
                dirData.kv[fullname] = result;
            }
            // }
        });
        return dirData;
    }
};